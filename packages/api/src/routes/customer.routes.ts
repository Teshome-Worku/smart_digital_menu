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
// A browser session is intentionally opaque and short-lived. It is renewed only
// when the same valid table QR code is scanned, never from client supplied IDs.
const SESSION_DURATION_HOURS = 24;

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

    const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

    // Reuse only the currently valid session for this exact QR table. This lets
    // a returning browser see its own orders without exposing another table's.
    const existingToken = req.cookies[SESSION_COOKIE_NAME];
    const existing = existingToken
      ? await prisma.customerSession.findUnique({ where: { sessionToken: existingToken } })
      : null;
    const session = existing && existing.restaurantId === table.restaurantId &&
      existing.tableId === table.id && existing.expiresAt > new Date()
      ? await prisma.customerSession.update({ where: { id: existing.id }, data: { expiresAt } })
      : await prisma.customerSession.create({
        data: {
          sessionToken: crypto.randomBytes(32).toString('hex'),
          restaurantId: table.restaurantId,
          tableId: table.id,
          expiresAt,
        },
      });

    // Set the HttpOnly cookie
    res.cookie(SESSION_COOKIE_NAME, session.sessionToken, {
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
      restaurantId: session.restaurantId,
      restaurantSlug: session.restaurant.slug,
      tableId: session.tableId,
      tableName: session.table.name,
      tableNumber: session.table.number,
      expiresAt: session.expiresAt.toISOString(),
      currency: session.restaurant.currency,
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

// ─── POST /orders ──────────────────────────────────────────
const orderHistoryQuerySchema = z.object({
  orderNumber: z.coerce.number().int().positive().optional(),
});

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1).max(50),
    notes: z.string().max(500).optional(),
    modifiers: z.array(z.object({
      modifierId: z.string()
    })).max(20).default([])
  })).min(1).max(50),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.enum(['CASH', 'CHAPA']).default('CASH'),
});

router.post('/orders', validate(createOrderSchema), async (req, res, next) => {
  try {
    const sessionToken = req.cookies[SESSION_COOKIE_NAME];
    if (!sessionToken) throw AppError.unauthorized('No active session. Please scan the QR code again.');

    const session = await prisma.customerSession.findUnique({
      where: { sessionToken },
      include: { table: true, restaurant: true }
    });

    if (!session || session.expiresAt < new Date() || !session.table.isActive || session.restaurant.status !== 'ACTIVE') {
      throw AppError.unauthorized('Session expired or invalid.');
    }

    const { items, notes, paymentMethod } = req.body;//the request comes from the frontend with the items, notes, and payment method selected by the user

    if (paymentMethod === 'CHAPA') {
      if (session.restaurant.currency !== 'ETB') {
        throw AppError.badRequest('Chapa online payment requires the restaurant currency to be ETB. Choose cash or update the restaurant currency.');
      }
      if (!process.env.CHAPA_TEST_SECRET_KEY || !(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL)) {
        throw AppError.badRequest('Chapa test mode is not configured for this restaurant. Choose cash or configure Chapa first.');
      }
    }

    // We must calculate the price entirely on the backend to prevent tampering.
    let subtotal = 0;

    // Prepare Prisma creation data array
    const orderItemsData: any[] = [];

    // Fetch all products involved in one query
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, restaurantId: session.restaurantId },
      include: { modifierGroups: { include: { modifiers: true } } },
    });

    for (const item of items) {
      const dbProduct = dbProducts.find(p => p.id === item.productId);
      if (!dbProduct || !dbProduct.isAvailable) {
        throw AppError.badRequest(`Product unavailable: ${item.productId}`);
      }

      const selectedModifierIds = item.modifiers.map((modifier: { modifierId: string }) => modifier.modifierId);
      if (new Set(selectedModifierIds).size !== selectedModifierIds.length) {
        throw AppError.badRequest(`Duplicate modifiers are not allowed for ${dbProduct.name}.`);
      }

      let itemTotal = dbProduct.price;
      const modifiersData: any[] = [];

      for (const mod of item.modifiers) {
        const dbGroup = dbProduct.modifierGroups.find(group =>
          group.modifiers.some(productModifier => productModifier.id === mod.modifierId),
        );
        const dbMod = dbGroup?.modifiers.find(productModifier => productModifier.id === mod.modifierId);
        if (!dbMod || !dbMod.isAvailable) {
          throw AppError.badRequest(`Modifier unavailable: ${mod.modifierId}`);
        }
        itemTotal += dbMod.priceDelta;
        modifiersData.push({
          modifierId: dbMod.id,
          modifierNameSnapshot: dbMod.name,
          priceDeltaSnapshot: dbMod.priceDelta
        });
      }

      for (const group of dbProduct.modifierGroups) {
        const selectedInGroup = item.modifiers.filter((modifier: { modifierId: string }) =>
          group.modifiers.some(productModifier => productModifier.id === modifier.modifierId),
        ).length;
        if (group.required && selectedInGroup < Math.max(1, group.minSelections)) {
          throw AppError.badRequest(`Select an option for ${group.name}.`);
        }
        if (selectedInGroup < group.minSelections) {
          throw AppError.badRequest(`Select at least ${group.minSelections} options for ${group.name}.`);
        }
        if (group.maxSelections !== null && selectedInGroup > group.maxSelections) {
          throw AppError.badRequest(`Select no more than ${group.maxSelections} options for ${group.name}.`);
        }
      }

      subtotal += itemTotal * item.quantity;

      orderItemsData.push({
        productId: dbProduct.id,
        productNameSnapshot: dbProduct.name,
        unitPriceSnapshot: dbProduct.price,
        quantity: item.quantity,
        notes: item.notes,
        modifiers: {
          create: modifiersData
        }
      });
    }

    // Wrap in transaction to get order number and create safely
    const order = await prisma.$transaction(async (tx) => {
      // Very naive order number generation (Subject to race conditions under extreme load, but fine for MVP)
      const count = await tx.order.count({ where: { restaurantId: session.restaurantId } });
      const orderNumber = count + 1;

      return await tx.order.create({
        data: {
          restaurantId: session.restaurantId,
          tableId: session.tableId,
          customerSessionId: session.id,
          orderNumber,
          status: 'PENDING',
          subtotal,
          total: subtotal, // Assuming no tax/fees for now
          notes,
          payments: {
            create: {
              provider: paymentMethod === 'CHAPA' ? 'CHAPA' : 'CASH', method: paymentMethod,
              status: 'PENDING', amount: subtotal, currency: session.restaurant.currency,
              merchantReference: `sdm-${paymentMethod.toLowerCase()}-${crypto.randomUUID()}`, isTest: true,
            }
          },
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: {
            include: { modifiers: true }
          }, payments: true
        }
      });
    });

    sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
});

// ─── GET /orders ─────────────────────────────────────────
router.get('/orders', async (req, res, next) => {
  try {
    const { orderNumber } = orderHistoryQuerySchema.parse(req.query);
    const sessionToken = req.cookies[SESSION_COOKIE_NAME];
    if (!sessionToken) throw AppError.unauthorized('No active session');

    const session = await prisma.customerSession.findUnique({
      where: { sessionToken },
    });

    if (!session || session.expiresAt < new Date()) {
      throw AppError.unauthorized('Session expired. Scan the table QR code again.');
    }

    const orders = await prisma.order.findMany({
      where: { customerSessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { items: { include: { modifiers: true } }, payments: true },
    });

    const filteredOrders = orderNumber
      ? orders.filter((order) => order.orderNumber === orderNumber)
      : orders;

    sendSuccess(res, filteredOrders);
  } catch (err) {
    next(err);
  }
});

// ─── GET /orders/:id ─────────────────────────────────────
router.get('/orders/:id', async (req, res, next) => {
  try {
    const sessionToken = req.cookies[SESSION_COOKIE_NAME];
    if (!sessionToken) throw AppError.unauthorized('No active session');

    const session = await prisma.customerSession.findUnique({
      where: { sessionToken }
    });

    if (!session || session.expiresAt < new Date()) {
      throw AppError.unauthorized('Session expired. Scan the table QR code again.');
    }

    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        customerSessionId: session.id
      },
      include: {
        items: {
          include: { modifiers: true }
        }, payments: true
      }
    });

    if (!order) throw AppError.notFound('Order not found');

    sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
});

export default router;
