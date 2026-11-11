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
} as const;

