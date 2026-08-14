import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireTenant, TenantRequest } from '../middleware/tenantContext';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/apiResponse';
import { slugify, uniqueSlug } from '../utils/slug';

const router = Router({ mergeParams: true });

const createProductSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  price: z.number().min(0),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  tags: z.array(z.string()).optional(),
});

const updateProductSchema = createProductSchema.partial();

const patchAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

router.use(authenticate);
const allowWrite = requireTenant('OWNER', 'MANAGER');
const allowRead = requireTenant();

/**
 * GET /restaurants/:restaurantId/products
 * List all products for a restaurant, optionally filtered by category
 */
router.get('/', allowRead, async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;
    const { categoryId } = req.query;

    const products = await prisma.product.findMany({
      where: {
        restaurantId,
        ...(categoryId ? { categoryId: String(categoryId) } : {}),
      },
      include: {
        tagAssignments: {
          include: {
            tag: true,
          },
        },
        modifierGroups: {
          include: {
            modifiers: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Transform response to match DTO
    const transformedProducts = products.map((product) => ({
      ...product,
      tags: product.tagAssignments.map((ta) => ta.tag),
      tagAssignments: undefined,
    }));

    sendSuccess(res, transformedProducts);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /restaurants/:restaurantId/products/:id
 * Get single product details
 */
router.get('/:id', allowRead, async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;
    const id = req.params.id as string;

    const product = await prisma.product.findFirst({
      where: { id, restaurantId },
      include: {
        tagAssignments: {
          include: { tag: true },
        },
        modifierGroups: {
          include: { modifiers: true },
        },
      },
    });

    if (!product) {
      throw AppError.notFound('Product not found');
    }

    const transformedProduct = {
      ...product,
      tags: product.tagAssignments.map((ta) => ta.tag),
      tagAssignments: undefined,
    };

    sendSuccess(res, transformedProduct);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /restaurants/:restaurantId/products
 * Create a new product
 */
router.post(
  '/',
  allowWrite,
  validate(createProductSchema),
  async (req, res, next) => {
    try {
      const { restaurantId } = req as TenantRequest;
      const { tags, ...data } = req.body;

      // Verify category belongs to restaurant
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, restaurantId },
      });

      if (!category) {
        throw AppError.badRequest('Invalid category');
      }

      let slug = slugify(data.name);
      const existingSlug = await prisma.product.findUnique({
        where: { restaurantId_slug: { restaurantId, slug } },
      });
      if (existingSlug) {
        slug = uniqueSlug(data.name);
      }

      // Handle tags inside transaction
      const product = await prisma.$transaction(async (tx) => {
        const newProduct = await tx.product.create({
          data: {
            ...data,
            slug,
            restaurantId,
          },
        });

        if (tags && tags.length > 0) {
          for (const tagName of tags) {
            const tag = await tx.productTag.upsert({
              where: { restaurantId_name: { restaurantId, name: tagName } },
              update: {},
              create: { restaurantId, name: tagName },
            });
            await tx.productTagAssignment.create({
              data: {
                productId: newProduct.id,
                tagId: tag.id,
              },
            });
          }
        }

        return newProduct;
      });

      sendSuccess(res, product, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /restaurants/:restaurantId/products/:id
 * Update an existing product
 */
router.put(
  '/:id',
  allowWrite,
  validate(updateProductSchema),
  async (req, res, next) => {
    try {
      const { restaurantId } = req as TenantRequest;
      const id = req.params.id as string;
      const { tags, ...data } = req.body;

      const existing = await prisma.product.findFirst({
        where: { id, restaurantId },
      });

      if (!existing) {
        throw AppError.notFound('Product not found');
      }

      if (data.categoryId && data.categoryId !== existing.categoryId) {
        const category = await prisma.category.findFirst({
          where: { id: data.categoryId, restaurantId },
        });
        if (!category) throw AppError.badRequest('Invalid category');
      }

      const product = await prisma.$transaction(async (tx) => {
        const updated = await tx.product.update({
          where: { id },
          data,
        });

        if (tags !== undefined) {
          // Re-sync tags: delete existing, create new
          await tx.productTagAssignment.deleteMany({
            where: { productId: id },
          });

          for (const tagName of tags) {
            const tag = await tx.productTag.upsert({
              where: { restaurantId_name: { restaurantId, name: tagName } },
              update: {},
              create: { restaurantId, name: tagName },
            });
            await tx.productTagAssignment.create({
              data: {
                productId: id,
                tagId: tag.id,
              },
            });
          }
        }
        return updated;
      });

      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /restaurants/:restaurantId/products/:id/availability
 * Quick toggle for product availability
 */
router.patch(
  '/:id/availability',
  allowWrite,
  validate(patchAvailabilitySchema),
  async (req, res, next) => {
    try {
      const { restaurantId } = req as TenantRequest;
      const id = req.params.id as string;
      const { isAvailable } = req.body;

      const existing = await prisma.product.findFirst({
        where: { id, restaurantId },
      });

      if (!existing) {
        throw AppError.notFound('Product not found');
      }

      const product = await prisma.product.update({
        where: { id },
        data: { isAvailable },
      });

      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /restaurants/:restaurantId/products/:id
 * Delete a product
 */
router.delete('/:id', allowWrite, async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;
    const id = req.params.id as string;

    const existing = await prisma.product.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      throw AppError.notFound('Product not found');
    }

    await prisma.product.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
