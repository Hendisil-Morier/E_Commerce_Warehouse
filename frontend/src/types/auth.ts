export interface User {
  userId: number;
  fullName: string;
  username?: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role?: string;
  roles?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  username?: string;
  email: string;
  password: string;
  phoneNumber?: string;
  accountType?: "customer" | "seller";
  shopName?: string;
}

export interface AuthResponse {
  userId: number;
  fullName: string;
  username?: string;
  email: string;
  role: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
}
