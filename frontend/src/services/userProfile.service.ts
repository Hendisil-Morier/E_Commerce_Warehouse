import { API_ENDPOINTS } from "@/constants/endpoints";
import axiosClient from "@/lib/axios";
import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserProfileDto,
} from "@/types/userProfile";

export const userProfileService = {
  async getMyProfile(): Promise<UserProfileDto> {
    const response = await axiosClient.get<UserProfileDto>(
      API_ENDPOINTS.USER_PROFILE.BASE
    );
    return response.data;
  },

  async updateMyProfile(payload: UpdateProfileRequest): Promise<UserProfileDto> {
    const response = await axiosClient.put<UserProfileDto>(
      API_ENDPOINTS.USER_PROFILE.BASE,
      payload
    );
    return response.data;
  },

  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await axiosClient.put(API_ENDPOINTS.USER_PROFILE.PASSWORD, payload);
  },
};
