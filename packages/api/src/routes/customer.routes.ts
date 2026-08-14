import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/apiResponse';
import type { CustomerSessionDto, PublicRestaurantDto, PublicCategoryDto, PublicProductDto } from '@sdm/shared';

const router = Router();

// ─── Constants ───────────────────────────────────────────
const SESSION_COOKIE_NAME = 'sdm_session';
const SESSION_DURATION_HOURS = 4;

// ─── Helper to clear cookie ──────────────────────────────
const clearSessionCookie = (res: any) => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
};

// ─── POST /scan ──────────────────────────────────────────
const scanSchema = z.object({
  qrToken: z.string().min(1, 'Invalid QR code'),
});

router.post('/scan', validate(scanSchema), async (req, res, next) => {
  try {
    const { qrToken } = req.body;

    // Find the table by QR token
    const table = await prisma.restaurantTable.findUnique({
      where: { qrToken },
      include: { restaurant: true },
    });

    if (!table || !table.isActive) {
      throw AppError.badRequest('Invalid or inactive QR code.');
    }

    if (table.restaurant.status !== 'ACTIVE') {
      throw AppError.badRequest('This restaurant is currently unavailable.');
    }

    // Generate a secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

    // Create a new session in DB
    const session = await prisma.customerSession.create({
      data: {
        sessionToken,
        restaurantId: table.restaurantId,
        tableId: table.id,
        expiresAt,
      },
    });

    // Set the HttpOnly cookie
    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
    });

    sendSuccess(res, { restaurantSlug: table.restaurant.slug });
  } catch (err) {
    next(err);
  }
});

// ─── GET /session ────────────────────────────────────────
router.get('/session', async (req, res, next) => {
  try {
    const sessionToken = req.cookies[SESSION_COOKIE_NAME];

    if (!sessionToken) {
      return sendSuccess(res, null); // No session
    }

    const session = await prisma.customerSession.findUnique({
      where: { sessionToken },
      include: {
        table: true,
        restaurant: true,
      },
    });

    // Check if session exists and is not expired
    if (!session || session.expiresAt < new Date() || !session.table.isActive) {
      clearSessionCookie(res);
      return sendSuccess(res, null);
    }

    const sessionDto: CustomerSessionDto = {
      sessionToken: session.sessionToken, // Usually we wouldn't return the token if it's HttpOnly, but might be useful for frontend identity.
      restaurantId: session.restaurantId,
      restaurantSlug: session.restaurant.slug,
      tableId: session.tableId,
      tableName: session.table.name,
      tableNumber: session.table.number,
      expiresAt: session.expiresAt.toISOString(),
    };

    sendSuccess(res, sessionDto);
  } catch (err) {
    next(err);
  }
});

// ─── GET /:slug/home ─────────────────────────────────────
router.get('/:slug/home', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        products: {
          where: { isAvailable: true, isFeatured: true },
          include: {
            tagAssignments: { include: { tag: true } },
          },
        },
      },
    });

    if (!restaurant || restaurant.status !== 'ACTIVE') {
      throw AppError.notFound('Restaurant not found or unavailable');
    }

    const pubRestaurant: PublicRestaurantDto = {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      logoUrl: restaurant.logoUrl,
      coverImageUrl: restaurant.coverImageUrl,
      currency: restaurant.currency,
    };

    const categories: PublicCategoryDto[] = restaurant.categories.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
    }));

    const featuredProducts: PublicProductDto[] = restaurant.products.map(p => ({
      id: p.id,
      categoryId: p.categoryId,
      name: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      price: p.price,
      isAvailable: p.isAvailable,
      isFeatured: p.isFeatured,
      tags: p.tagAssignments.map(ta => ta.tag.name),
    }));

    sendSuccess(res, { restaurant: pubRestaurant, categories, featuredProducts });
  } catch (err) {
    next(err);
  }
});

// ─── GET /:slug/menu ─────────────────────────────────────
router.get('/:slug/menu', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        products: {
          where: { isAvailable: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            tagAssignments: { include: { tag: true } },
          },
        },
      },
    });

    if (!restaurant || restaurant.status !== 'ACTIVE') {
      throw AppError.notFound('Restaurant not found');
    }

    const categories: PublicCategoryDto[] = restaurant.categories.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
    }));

    const products: PublicProductDto[] = restaurant.products.map(p => ({
      id: p.id,
      categoryId: p.categoryId,
      name: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      price: p.price,
      isAvailable: p.isAvailable,
      isFeatured: p.isFeatured,
      tags: p.tagAssignments.map(ta => ta.tag.name),
    }));

    sendSuccess(res, { categories, products });
  } catch (err) {
    next(err);
  }
});

// ─── GET /:slug/products/:productId ──────────────────────
router.get('/:slug/products/:productId', async (req, res, next) => {
  try {
    const { slug, productId } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!restaurant || restaurant.status !== 'ACTIVE') {
      throw AppError.notFound('Restaurant not found');
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, restaurantId: restaurant.id },
      include: {
        tagAssignments: { include: { tag: true } },
        modifierGroups: {
          include: { modifiers: true },
        },
      },
    });

    if (!product || !product.isAvailable) {
      throw AppError.notFound('Product not found or unavailable');
    }

    const pubProduct: PublicProductDto = {
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      tags: product.tagAssignments.map(ta => ta.tag.name),
      modifierGroups: product.modifierGroups,
    };

    sendSuccess(res, pubProduct);
  } catch (err) {
    next(err);
  }
});

export default router;
