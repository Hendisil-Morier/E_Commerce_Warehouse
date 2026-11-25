export type CartAvailabilityStatus =
  | "Available"
  | "InsufficientStock"
  | "OutOfStock"
  | "ProductUnavailable";

export interface AddCartItemRequest {
  variantId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartItem {
  cartItemId: number;
  variantId: number;
  productId: number;
  productName: string;
  variantName: string;
  sku: string;
  thumbnailUrl?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableQuantity: number;
  isAvailable: boolean;
  availabilityStatus: CartAvailabilityStatus;
  warningMessage?: string | null;
  addedAt: string;
}

export interface CartShopGroup {
  shopId: number;
  sellerId: number;
  shopName: string;
  shopLogoUrl?: string | null;
  sellerBusinessName: string;
  isShopActive: boolean;
  shopSubtotal: number;
  items: CartItem[];
}

export interface Cart {
  cartId?: number | null;
  totalItems: number;
  totalQuantity: number;
  unavailableItemCount: number;
  hasWarnings: boolean;
  subtotal: number;
  updatedAt?: string | null;
  shops: CartShopGroup[];
}
