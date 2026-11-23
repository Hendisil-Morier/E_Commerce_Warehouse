import axiosClient from "@/lib/axios";
import type {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "@/types/user";

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const response = await axiosClient.get<UserProfile>("/api/v1/users/me");
    return response.data;
  },

  async updateProfile(payload: UpdateProfileRequest): Promise<UserProfile> {
    const response = await axiosClient.put<UserProfile>("/api/v1/users/me", payload);
    return response.data;
  },

  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await axiosClient.put("/api/v1/users/me/password", payload);
  },
};
