import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireTenant, TenantRequest } from '../middleware/tenantContext';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/apiResponse';

const router = Router({ mergeParams: true });

// Schema definitions for request bodies
const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const updateCategorySchema = createCategorySchema.partial();

// All routes require authentication and tenant access
router.use(authenticate);
// We allow OWNER and MANAGER roles to edit, but STAFF can only view. Wait, for now let's just use requireTenant() which defaults to allowing any member of the restaurant. 
// We will allow anyone to view, but only OWNER and MANAGER to create/update/delete.
const allowWrite = requireTenant('OWNER', 'MANAGER');
const allowRead = requireTenant();

/**
 * GET /restaurants/:restaurantId/categories
 * List all categories for a restaurant
 */
router.get('/', allowRead, async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;
    const categories = await prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
    });

    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /restaurants/:restaurantId/categories
 * Create a new category
 */
router.post(
  '/',
  allowWrite,
  validate(createCategorySchema),
  async (req, res, next) => {
    try {
      const { restaurantId } = req as TenantRequest;
      const data = req.body;

      const category = await prisma.category.create({
        data: {
          ...data,
          restaurantId,
        },
      });

      sendSuccess(res, category, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /restaurants/:restaurantId/categories/:id
 * Update an existing category
 */
router.put(
  '/:id',
  allowWrite,
  validate(updateCategorySchema),
  async (req, res, next) => {
    try {
      const { restaurantId } = req as TenantRequest;
      const id = req.params.id as string;
      const data = req.body;

      // Ensure category exists and belongs to this restaurant
      const existing = await prisma.category.findFirst({
        where: { id, restaurantId },
      });

      if (!existing) {
        throw AppError.notFound('Category not found');
      }

      const category = await prisma.category.update({
        where: { id },
        data,
      });

      sendSuccess(res, category);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /restaurants/:restaurantId/categories/:id
 * Delete a category
 */
router.delete('/:id', allowWrite, async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;
    const id = req.params.id as string;

    const existing = await prisma.category.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      throw AppError.notFound('Category not found');
    }

    await prisma.category.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
