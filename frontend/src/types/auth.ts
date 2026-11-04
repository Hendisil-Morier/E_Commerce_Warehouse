export interface User {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  userId: number;
  fullName: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

