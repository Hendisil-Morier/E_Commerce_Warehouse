export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/Auth/login",
    REGISTER: "/api/v1/Auth/register",
    SEND_REGISTER_OTP: "/api/v1/auth/register/send-otp",
    REFRESH: "/api/v1/Auth/refresh",
    FORGOT_PASSWORD: "/api/v1/Auth/forgot-password",
    VERIFY_OTP: "/api/v1/Auth/verify-otp",
    RESET_PASSWORD: "/api/v1/Auth/reset-password",
    CHANGE_PASSWORD: "/api/v1/Auth/change-password",
    GOOGLE: "/api/v1/Auth/google",
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
  PRODUCTS: {
    BASE: "/api/v1/products",
    BY_ID: (productId: number) => `/api/v1/products/${productId}`,
  },
  SHOPS: {
    BY_ID: (shopId: number) => `/api/v1/shops/${shopId}`,
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
  PUBLIC_PRODUCTS: {
    BASE: "/api/v1/products",
    BY_ID: (productId: number) => `/api/v1/products/${productId}`,
  },
  PUBLIC_SHOPS: {
    BY_ID: (shopId: number) => `/api/v1/shops/${shopId}`,
  },
  ADMIN_USERS: {
    BASE: "/api/v1/admin/users",
    ROLES: "/api/v1/admin/users/roles",
    BY_ID: (userId: number) => `/api/v1/admin/users/${userId}`,
    STATUS: (userId: number) => `/api/v1/admin/users/${userId}/status`,
    ROLES_UPDATE: (userId: number) => `/api/v1/admin/users/${userId}/roles`,
  },
  CART: {
    BASE: "/api/v1/cart",
    ITEMS: "/api/v1/cart/items",
    ITEM_BY_ID: (itemId: number) => `/api/v1/cart/items/${itemId}`,
  },
  USER_ADDRESSES: {
    BASE: "/api/v1/users/me/addresses",
    BY_ID: (addressId: number) => `/api/v1/users/me/addresses/${addressId}`,
    SET_DEFAULT: (addressId: number) => `/api/v1/users/me/addresses/${addressId}/default`,
  },
  USER_PROFILE: {
    BASE: "/api/v1/users/me",
    PASSWORD: "/api/v1/users/me/password",
  },
  ORDERS: {
    BASE: "/api/v1/orders",
    BY_ID: (orderId: number) => `/api/v1/orders/${orderId}`,
    CANCEL: (orderId: number) => `/api/v1/orders/${orderId}/cancel`,
    PAYMENTS: (orderId: number) => `/api/v1/orders/${orderId}/payments`,
  },
} as const;

