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
  requireTenant('OWNER', 'MANAGER'),
  validate(updateRestaurantSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantReq = req as TenantRequest;

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

// ─── Sub-routers ─────────────────────────────────────────

router.use('/:restaurantId/categories', categoriesRouter);
router.use('/:restaurantId/products', productsRouter);
router.use('/:restaurantId/orders', ordersRouter);

export default router;
