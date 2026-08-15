import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireTenant, TenantRequest } from '../middleware/tenantContext';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/apiResponse';

const router = Router({ mergeParams: true });

// All table routes require auth and tenant context
router.use(authenticate);
const allowWrite = requireTenant('OWNER', 'MANAGER');
const allowRead = requireTenant('OWNER', 'MANAGER', 'STAFF');

// ─── Validation Schemas ──────────────────────────────────
const createTableSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  number: z.number().int().min(1),
});

const updateTableSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  number: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

// ─── Routes ──────────────────────────────────────────────

/**
 * GET /restaurants/:restaurantId/tables
 * List all tables for a restaurant
 */
router.get('/', allowRead, async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;

    const tables = await prisma.restaurantTable.findMany({
      where: { restaurantId },
      orderBy: { number: 'asc' },
    });

    sendSuccess(res, tables);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /restaurants/:restaurantId/tables
 * Create a new table
 */
router.post('/', allowWrite, validate(createTableSchema), async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;
    const { name, number } = req.body;

    // Check if table number already exists
    const existing = await prisma.restaurantTable.findUnique({
      where: { restaurantId_number: { restaurantId, number } },
    });

    if (existing) {
      throw AppError.badRequest(`Table number ${number} already exists.`);
    }

    // Generate secure unpredictable QR token
    const qrToken = crypto.randomBytes(32).toString('hex');

    const table = await prisma.restaurantTable.create({
      data: {
        restaurantId,
        name,
        number,
        qrToken,
      },
    });

    sendSuccess(res, table, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /restaurants/:restaurantId/tables/:id
 * Update a table
 */
router.patch('/:id', allowWrite, validate(updateTableSchema), async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;
    const tableId = req.params.id as string;

    // Validate table existence
    const existing = await prisma.restaurantTable.findFirst({
      where: { id: tableId, restaurantId },
    });

    if (!existing) {
      throw AppError.notFound('Table not found');
    }

    // Ensure no number collision
    if (req.body.number && req.body.number !== existing.number) {
      const collision = await prisma.restaurantTable.findUnique({
        where: { restaurantId_number: { restaurantId, number: req.body.number } },
      });
      if (collision) {
        throw AppError.badRequest(`Table number ${req.body.number} already exists.`);
      }
    }

    const updated = await prisma.restaurantTable.update({
      where: { id: tableId },
      data: req.body,
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /restaurants/:restaurantId/tables/:id
 * Delete a table
 */
router.delete('/:id', allowWrite, async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;
    const tableId = req.params.id as string;

    const existing = await prisma.restaurantTable.findFirst({
      where: { id: tableId, restaurantId },
    });

    if (!existing) {
      throw AppError.notFound('Table not found');
    }

    await prisma.restaurantTable.delete({
      where: { id: tableId },
    });

    sendSuccess(res, { message: 'Table deleted successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /restaurants/:restaurantId/tables/:id/rotate-token
 * Regenerates the QR token for a table (invalidating old QR codes)
 */
router.post('/:id/rotate-token', allowWrite, async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;
    const tableId = req.params.id as string;

    const existing = await prisma.restaurantTable.findFirst({
      where: { id: tableId, restaurantId },
    });

    if (!existing) {
      throw AppError.notFound('Table not found');
    }

    const newQrToken = crypto.randomBytes(32).toString('hex');

    const updated = await prisma.restaurantTable.update({
      where: { id: tableId },
      data: { qrToken: newQrToken },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
});

export default router;
