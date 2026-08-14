import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  type: 'access' | 'refresh';
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId, type: 'access' } satisfies JwtPayload, env.JWT_ACCESS_SECRET, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' } satisfies JwtPayload, env.JWT_REFRESH_SECRET, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
