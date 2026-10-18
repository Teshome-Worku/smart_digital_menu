import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { requireTenant, TenantRequest } from '../middleware/tenantContext';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/apiResponse';
import { slugify, uniqueSlug } from '../utils/slug';
import categoriesRouter from './categories.routes';
import productsRouter from './products.routes';
import ordersRouter from './orders.routes';
import tablesRouter from './tables.routes';
import uploadRouter from './upload.routes';

const router = Router();

// ─── Validation Schemas ──────────────────────────────────

const createRestaurantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('USD'),
  timezone: z.string().default('UTC'),
});

const updateRestaurantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only.').optional(),
  description: z.string().max(500).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
});

// ─── POST /restaurants ───────────────────────────────────

router.post(
  '/',
  authenticate,
  validate(createRestaurantSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { name, description, currency, timezone } = req.body;

      // Generate a unique slug
      let slug = slugify(name);
      const existingSlug = await prisma.restaurant.findUnique({ where: { slug } });
      if (existingSlug) {
        slug = uniqueSlug(name);
      }

      // Create restaurant and owner membership in a transaction
      const restaurant = await prisma.$transaction(async (tx) => {
        const rest = await tx.restaurant.create({
          data: {
            name,
            slug,
            description: description || null,
            currency,
            timezone,
            ownerId: authReq.user.id,
          },
        });

        await tx.restaurantMembership.create({
          data: {
            userId: authReq.user.id,
            restaurantId: rest.id,
            role: 'OWNER',
          },
        });

        return rest;
      });

      sendSuccess(res, { restaurant }, 201);
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /restaurants/:restaurantId ──────────────────────

router.get(
  '/:restaurantId',
  authenticate,
  requireTenant(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantReq = req as TenantRequest;

      const restaurant = await prisma.restaurant.findUnique({
        where: { id: tenantReq.restaurantId },
        include: {
          memberships: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      if (!restaurant) {
        throw AppError.notFound('Restaurant not found');
      }

      sendSuccess(res, { restaurant });
    } catch (err) {
      next(err);
    }
  },
);

// ─── PUT /restaurants/:restaurantId ──────────────────────

router.put(
  '/:restaurantId',
  authenticate,
  requireTenant('OWNER'),
  validate(updateRestaurantSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantReq = req as TenantRequest;
      if (req.body.slug) {
        const conflict = await prisma.restaurant.findFirst({
          where: { slug: req.body.slug, id: { not: tenantReq.restaurantId } },
          select: { id: true },
        });
        if (conflict) throw AppError.badRequest('That restaurant URL is already in use.');
      }

      const restaurant = await prisma.restaurant.update({
        where: { id: tenantReq.restaurantId },
        data: req.body,
      });

      sendSuccess(res, { restaurant });
    } catch (err) {
      next(err);
    }
  },
);

// Dashboard data is deliberately derived from persisted orders/products. Revenue
// represents completed, non-cancelled orders because this schema has no payment model.
router.get('/:restaurantId/dashboard-summary', authenticate, requireTenant(), async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;
    const [totalOrders, pendingOrders, preparingOrders, completedOrders, activeItems, revenue, recentOrders] = await Promise.all([
      prisma.order.count({ where: { restaurantId } }),
      prisma.order.count({ where: { restaurantId, status: { in: ['PENDING', 'ACCEPTED'] } } }),
      prisma.order.count({ where: { restaurantId, status: 'PREPARING' } }),
      prisma.order.count({ where: { restaurantId, status: 'COMPLETED' } }),
      prisma.product.count({ where: { restaurantId, isAvailable: true } }),
      prisma.order.aggregate({ where: { restaurantId, status: 'COMPLETED' }, _sum: { total: true } }),
      prisma.order.findMany({
        where: { restaurantId }, orderBy: { createdAt: 'desc' }, take: 6,
        include: { table: true, items: { include: { modifiers: true } } },
      }),
    ]);
    sendSuccess(res, {
      totalOrders, pendingOrders, preparingOrders, completedOrders, activeItems,
      revenue: revenue._sum.total ?? 0, menuViews: null,
      recentOrders: recentOrders.map((order) => ({ ...order, tableName: order.table.name })),
    });
  } catch (err) { next(err); }
});

router.get('/:restaurantId/analytics', authenticate, requireTenant(), async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 90);
    const since = new Date(); since.setDate(since.getDate() - days + 1); since.setHours(0, 0, 0, 0);
    const where = { restaurantId, createdAt: { gte: since } };
    const [orders, statusGroups, items] = await Promise.all([
      prisma.order.findMany({ where, select: { createdAt: true, total: true, status: true } }),
      prisma.order.groupBy({ by: ['status'], where, _count: { _all: true } }),
      prisma.orderItem.groupBy({ by: ['productNameSnapshot'], where: { order: where }, _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 8 }),
    ]);
    const completed = orders.filter((order) => order.status === 'COMPLETED');
    const byDay = new Map<string, { orders: number; revenue: number }>();
    orders.forEach((order) => { const key = order.createdAt.toISOString().slice(0, 10); const day = byDay.get(key) ?? { orders: 0, revenue: 0 }; day.orders++; if (order.status === 'COMPLETED') day.revenue += order.total; byDay.set(key, day); });
    sendSuccess(res, {
      days, averageOrderValue: completed.length ? completed.reduce((sum, order) => sum + order.total, 0) / completed.length : 0,
      totalRevenue: completed.reduce((sum, order) => sum + order.total, 0),
      byDay: Array.from(byDay, ([date, values]) => ({ date, ...values })),
      statusDistribution: statusGroups.map((group) => ({ status: group.status, count: group._count._all })),
      popularProducts: items.map((item) => ({ name: item.productNameSnapshot, quantity: item._sum.quantity ?? 0 })),
    });
  } catch (err) { next(err); }
});

// ─── Sub-routers ─────────────────────────────────────────

router.use('/:restaurantId/categories', categoriesRouter);
router.use('/:restaurantId/products', productsRouter);
router.use('/:restaurantId/orders', ordersRouter);
router.use('/:restaurantId/tables', tablesRouter);
router.use('/:restaurantId/upload', uploadRouter);

export default router;
