export interface AdminUserListItem {
  userId: number;
  username?: string | null;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface AdminUserDetail extends AdminUserListItem {
  addressCount: number;
  isSeller: boolean;
  sellerStatus?: string | null;
  businessName?: string | null;
}

export interface RoleItem {
  roleId: number;
  roleName: string;
  description?: string | null;
}

export interface AdminUserQueryParams {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
  reason?: string;
}

export interface UpdateUserRolesRequest {
  roles: string[];
}
