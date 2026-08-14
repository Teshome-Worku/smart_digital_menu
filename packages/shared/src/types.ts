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

// ─── Menu: Category ──────────────────────────────────────
export interface CategoryDto {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

// ─── Menu: Product Modifiers ─────────────────────────────
export interface ProductModifierDto {
  id: string;
  groupId: string;
  name: string;
  priceDelta: number;
  isAvailable: boolean;
}

export interface ProductModifierGroupDto {
  id: string;
  productId: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number | null;
  modifiers: ProductModifierDto[];
}

// ─── Menu: Product ───────────────────────────────────────
export interface ProductTagDto {
  id: string;
  name: string;
}

export interface ProductDto {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  tags?: ProductTagDto[];
  modifierGroups?: ProductModifierGroupDto[];
}

export interface CreateProductRequest {
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  tags?: string[]; // Array of tag names
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

