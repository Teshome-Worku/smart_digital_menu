import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { validate } from '../middleware/validate';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

// ─── Validation Schemas ──────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─── POST /auth/register ─────────────────────────────────

router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw AppError.conflict('An account with this email already exists');
      }

      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: { name, email, passwordHash },
        select: { id: true, name: true, email: true, createdAt: true },
      });

      const accessToken = signAccessToken(user.id);
      const refreshToken = signRefreshToken(user.id);

      sendSuccess(
        res,
        {
          user: { ...user, createdAt: user.createdAt.toISOString() },
          tokens: { accessToken, refreshToken },
        },
        201,
      );
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /auth/login ────────────────────────────────────

router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, passwordHash: true, createdAt: true },
      });

      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        throw AppError.unauthorized('Invalid email or password');
      }

      const accessToken = signAccessToken(user.id);
      const refreshToken = signRefreshToken(user.id);

      sendSuccess(res, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
        },
        tokens: { accessToken, refreshToken },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /auth/refresh ──────────────────────────────────

router.post(
  '/refresh',
  validate(refreshSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const payload = verifyRefreshToken(refreshToken);

      if (payload.type !== 'refresh') {
        throw AppError.unauthorized('Invalid token type');
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true },
      });

      if (!user) {
        throw AppError.unauthorized('User not found');
      }

      const newAccessToken = signAccessToken(user.id);
      const newRefreshToken = signRefreshToken(user.id);

      sendSuccess(res, {
        tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken },
      });
    } catch (err) {
      next(err instanceof AppError ? err : AppError.unauthorized('Invalid refresh token'));
    }
  },
);

// ─── GET /auth/me ────────────────────────────────────────

router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;

      const user = await prisma.user.findUnique({
        where: { id: authReq.user.id },
        select: { id: true, name: true, email: true, createdAt: true },
      });

      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Fetch user's restaurant memberships
      const memberships = await prisma.restaurantMembership.findMany({
        where: { userId: user.id },
        include: {
          restaurant: { select: { id: true, name: true, slug: true, logoUrl: true } },
        },
      });

      sendSuccess(res, {
        user: { ...user, createdAt: user.createdAt.toISOString() },
        memberships: memberships.map((m) => ({
          id: m.id,
          restaurantId: m.restaurant.id,
          restaurantName: m.restaurant.name,
          restaurantSlug: m.restaurant.slug,
          restaurantLogoUrl: m.restaurant.logoUrl,
          role: m.role,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
