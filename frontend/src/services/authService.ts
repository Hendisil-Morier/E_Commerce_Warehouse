import axiosClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>(
      "/api/v1/Auth/login",
      credentials
    );
    return response.data.data;
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>(
      "/api/v1/Auth/register",
      payload
    );
    return response.data.data;
  },
};

