export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/Auth/login",
    REGISTER: "/api/v1/Auth/register",
    REFRESH: "/api/v1/Auth/refresh",
  },
  SELLERS: {
    BASE: "/api/v1/sellers",
    ME: "/api/v1/sellers/me",
  },
  ADMIN_SELLERS: {
    BASE: "/api/v1/admin/sellers",
    APPROVE: (sellerId: number) => `/api/v1/admin/sellers/${sellerId}/approve`,
    REJECT: (sellerId: number) => `/api/v1/admin/sellers/${sellerId}/reject`,
    SUSPEND: (sellerId: number) => `/api/v1/admin/sellers/${sellerId}/suspend`,
  },
  CATEGORIES: {
    BASE: "/api/v1/categories",
  },
  SELLER_SHOPS: {
    BASE: "/api/v1/seller/shops",
    BY_ID: (shopId: number) => `/api/v1/seller/shops/${shopId}`,
  },
  SELLER_UPLOADS: {
    IMAGES: "/api/v1/seller/uploads/images",
  },
  SELLER_PRODUCTS: {
    BASE: "/api/v1/seller/products",
    BY_ID: (productId: number) => `/api/v1/seller/products/${productId}`,
    SUBMIT: (productId: number) => `/api/v1/seller/products/${productId}/submit`,
    VARIANTS: (productId: number) => `/api/v1/seller/products/${productId}/variants`,
  },
  SELLER_VARIANTS: {
    BY_ID: (variantId: number) => `/api/v1/seller/variants/${variantId}`,
  },
  ADMIN_PRODUCTS: {
    BASE: "/api/v1/admin/products",
    BY_ID: (productId: number) => `/api/v1/admin/products/${productId}`,
    APPROVE: (productId: number) => `/api/v1/admin/products/${productId}/approve`,
    REJECT: (productId: number) => `/api/v1/admin/products/${productId}/reject`,
  },
} as const;

