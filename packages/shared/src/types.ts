import type { Role, RestaurantStatus } from './constants';

// ─── API Response ────────────────────────────────────────
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Auth ────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

// ─── Restaurant ──────────────────────────────────────────
export interface RestaurantSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  currency: string;
  timezone: string;
  status: RestaurantStatus;
  createdAt: string;
}

export interface CreateRestaurantRequest {
  name: string;
  description?: string;
  currency?: string;
  timezone?: string;
}

export interface RestaurantMembershipInfo {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  role: Role;
}

// ─── Image Upload ────────────────────────────────────────
export interface ImageUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}
