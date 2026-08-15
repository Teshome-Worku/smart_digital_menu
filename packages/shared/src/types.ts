import type { Role, RestaurantStatus, OrderStatus } from './constants';

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

// ─── Customer View ───────────────────────────────────────
export interface PublicRestaurantDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  currency: string;
}

export interface CustomerSessionDto {
  sessionToken: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  tableNumber: number;
  restaurantSlug: string;
  expiresAt: string;
}

export interface PublicCategoryDto {
  id: string;
  name: string;
  description: string | null;
}

export interface PublicProductDto {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  isAvailable: boolean;
  isFeatured: boolean;
  tags: string[];
  modifierGroups?: ProductModifierGroupDto[];
}

// ─── Phase 4: Order Models & DTOs ────────────────────────

// Customer Checkout Payload
export interface CreateOrderItemModifierRequest {
  modifierId: string;
}

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  notes?: string;
  modifiers: CreateOrderItemModifierRequest[];
}

export interface CreateOrderRequest {
  items: CreateOrderItemRequest[];
  notes?: string;
}

// Order View DTOs
export interface OrderItemModifierDto {
  id: string;
  modifierId: string;
  modifierNameSnapshot: string;
  priceDeltaSnapshot: number;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  notes?: string;
  modifiers: OrderItemModifierDto[];
}

export interface OrderDto {
  id: string;
  restaurantId: string;
  tableId: string;
  customerSessionId: string;
  orderNumber: number;
  status: OrderStatus;
  subtotal: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
  tableName?: string; // Enhanced field for dashboard
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

// ─── Phase 5: Table Management ───────────────────────────

export interface TableDto {
  id: string;
  restaurantId: string;
  name: string;
  number: number;
  qrToken: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateTableRequest {
  name: string;
  number: number;
}

export interface UpdateTableRequest {
  name?: string;
  number?: number;
  isActive?: boolean;
}
