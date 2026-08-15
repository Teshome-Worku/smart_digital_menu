import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireTenant, TenantRequest } from '../middleware/tenantContext';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/apiResponse';
import type { OrderStatus } from '@sdm/shared';

const router = Router({ mergeParams: true });

// All order dashboard routes require auth and tenant context
router.use(authenticate);
const allowWrite = requireTenant('OWNER', 'MANAGER', 'STAFF');
const allowRead = requireTenant('OWNER', 'MANAGER', 'STAFF');

/**
 * GET /restaurants/:restaurantId/orders
 * Get list of active/recent orders for dashboard
 */
const getOrdersQuerySchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

router.get('/', allowRead, validate(getOrdersQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;
    const { status, limit } = req.query;

    const where: any = { restaurantId };
    if (status) {
      where.status = status as OrderStatus;
    } else {
      // By default, only show active orders in the board
      where.status = { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      include: {
        table: true,
        items: {
          include: { modifiers: true }
        }
      }
    });

    // Map to DTO including tableName for the dashboard
    const mappedOrders = orders.map(o => ({
      id: o.id,
      restaurantId: o.restaurantId,
      tableId: o.tableId,
      tableName: o.table.name,
      customerSessionId: o.customerSessionId,
      orderNumber: o.orderNumber,
      status: o.status,
      subtotal: o.subtotal,
      total: o.total,
      notes: o.notes,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      items: o.items.map(i => ({
        id: i.id,
        productId: i.productId,
        productNameSnapshot: i.productNameSnapshot,
        unitPriceSnapshot: i.unitPriceSnapshot,
        quantity: i.quantity,
        notes: i.notes,
        modifiers: i.modifiers.map(m => ({
          id: m.id,
          modifierId: m.modifierId,
          modifierNameSnapshot: m.modifierNameSnapshot,
          priceDeltaSnapshot: m.priceDeltaSnapshot
        }))
      }))
    }));

    sendSuccess(res, mappedOrders);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /restaurants/:restaurantId/orders/:id/status
 * Update order status
 */
const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])
});

router.patch('/:id/status', allowWrite, validate(updateStatusSchema), async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;
    const orderId = req.params.id as string;
    const { status } = req.body as { status: OrderStatus };

    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId }
    });

    if (!order) {
      throw AppError.notFound('Order not found');
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        table: true,
        items: { include: { modifiers: true } }
      }
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
});

export default router;
