import { API_ENDPOINTS } from "@/constants/endpoints";
import axiosClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from "@/types/auth";

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>(
      "/api/v1/Auth/login",
      credentials
    );
    return response.data.data;
  },

  async sendRegisterOtp(email: string): Promise<void> {
    await axiosClient.post(API_ENDPOINTS.AUTH.SEND_REGISTER_OTP, { email });
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>(
      "/api/v1/Auth/register",
      payload
    );
    return response.data.data;
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>(
      "/api/v1/Auth/refresh",
      { refreshToken }
    );
    return response.data.data;
  },

  async logout(refreshToken?: string | null): Promise<void> {
    if (refreshToken) {
      try {
        await axiosClient.post("/api/v1/Auth/logout", { refreshToken });
      } catch {
        // Nuốt lỗi nếu token hết hạn hoặc server offline khi đăng xuất
      }
    }
  },

  async forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
    await axiosClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
  },

  async verifyOtp(payload: VerifyOtpRequest): Promise<void> {
    await axiosClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, payload);
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<void> {
    await axiosClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
  },

  async changePassword(payload: ChangePasswordRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      payload
    );
    return response.data.data;
  },

  async googleLogin(idToken: string): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.GOOGLE,
      { idToken }
    );
    return response.data.data;
  },
};
