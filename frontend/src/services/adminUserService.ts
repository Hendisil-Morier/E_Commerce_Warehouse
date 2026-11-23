import { API_ENDPOINTS } from "@/constants/endpoints";
import axiosClient from "@/lib/axios";
import type { PagedResult } from "@/types/api";
import type {
  AdminUserDetail,
  AdminUserListItem,
  AdminUserQueryParams,
  RoleItem,
  UpdateUserRolesRequest,
  UpdateUserStatusRequest,
} from "@/types/adminUser";

export const adminUserService = {
  async getUsers(params?: AdminUserQueryParams): Promise<PagedResult<AdminUserListItem>> {
    const response = await axiosClient.get<PagedResult<AdminUserListItem>>(
      API_ENDPOINTS.ADMIN_USERS.BASE,
      { params }
    );
    return response.data;
  },

  async getRoles(): Promise<RoleItem[]> {
    const response = await axiosClient.get<RoleItem[]>(
      API_ENDPOINTS.ADMIN_USERS.ROLES
    );
    return response.data;
  },

  async getUserById(userId: number): Promise<AdminUserDetail> {
    const response = await axiosClient.get<AdminUserDetail>(
      API_ENDPOINTS.ADMIN_USERS.BY_ID(userId)
    );
    return response.data;
  },

  async updateUserStatus(
    userId: number,
    data: UpdateUserStatusRequest
  ): Promise<AdminUserListItem> {
    const response = await axiosClient.put<AdminUserListItem>(
      API_ENDPOINTS.ADMIN_USERS.STATUS(userId),
      data
    );
    return response.data;
  },

  async updateUserRoles(
    userId: number,
    data: UpdateUserRolesRequest
  ): Promise<AdminUserListItem> {
    const response = await axiosClient.put<AdminUserListItem>(
      API_ENDPOINTS.ADMIN_USERS.ROLES_UPDATE(userId),
      data
    );
    return response.data;
  },
};
