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
  otp: string;
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
