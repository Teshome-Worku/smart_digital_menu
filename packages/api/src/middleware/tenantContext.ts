import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../utils/errors';
import type { AuthenticatedRequest } from './auth';
import type { Role } from '@sdm/shared';

/** Express request extended with tenant (restaurant) context */
export interface TenantRequest extends AuthenticatedRequest {
  restaurantId: string;
  memberRole: Role;
}

/**
 * Resolve tenant context from the :restaurantId route param.
 * Verifies the authenticated user has a membership in the restaurant.
 * Optionally restrict to specific roles.
 */
export function requireTenant(...allowedRoles: Role[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw AppError.unauthorized('Authentication required');
      }

      const restaurantId = req.params.restaurantId;
      if (!restaurantId) {
        throw AppError.badRequest('Restaurant ID is required');
      }

      const membership = await prisma.restaurantMembership.findUnique({
        where: {
          userId_restaurantId: {
            userId: authReq.user.id,
            restaurantId,
          },
        },
      });

      if (!membership) {
        throw AppError.forbidden('You do not have access to this restaurant');
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role as Role)) {
        throw AppError.forbidden(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        );
      }

      (req as TenantRequest).restaurantId = restaurantId;
      (req as TenantRequest).memberRole = membership.role as Role;
      next();
    } catch (err) {
      next(err);
    }
  };
}
