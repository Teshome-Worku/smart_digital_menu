import dotenv from 'dotenv';
import path from 'path';

// Load .env from the monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.API_PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
} as const;

/** Validate that critical env vars are set */
export function validateEnv(): void {
  const missing: string[] = [];

  if (!env.DATABASE_URL) missing.push('DATABASE_URL');
  if (env.JWT_ACCESS_SECRET === 'dev-access-secret' && env.NODE_ENV === 'production') {
    missing.push('JWT_ACCESS_SECRET');
  }
  if (env.JWT_REFRESH_SECRET === 'dev-refresh-secret' && env.NODE_ENV === 'production') {
    missing.push('JWT_REFRESH_SECRET');
  }

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('Continuing in development mode with defaults...');
    }
  }
}
