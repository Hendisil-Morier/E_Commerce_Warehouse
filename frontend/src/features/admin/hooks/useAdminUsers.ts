import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { adminUserService } from "@/services/adminUserService";
import type {
  AdminUserDetail,
  AdminUserListItem,
  AdminUserQueryParams,
  RoleItem,
  UpdateUserRolesRequest,
  UpdateUserStatusRequest,
} from "@/types/adminUser";
import { getErrorMessage } from "@/utils/errorHandler";

export const adminUserKeys = {
  all: ["admin", "users"] as const,
  list: (params: AdminUserQueryParams) =>
    [...adminUserKeys.all, "list", params] as const,
  roles: () => [...adminUserKeys.all, "roles"] as const,
  detail: (userId: number) => [...adminUserKeys.all, "detail", userId] as const,
};

export function useAdminUsers(params: AdminUserQueryParams) {
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => adminUserService.getUsers(params),
  });
}

export function useRoles() {
  return useQuery<RoleItem[]>({
    queryKey: adminUserKeys.roles(),
    queryFn: () => adminUserService.getRoles(),
    staleTime: 1000 * 60 * 30, // 30 mins
  });
}

export function useAdminUserDetail(userId: number | null) {
  return useQuery<AdminUserDetail>({
    queryKey: adminUserKeys.detail(userId ?? 0),
    queryFn: () => adminUserService.getUserById(userId!),
    enabled: typeof userId === "number" && userId > 0,
  });
}

export function useUpdateUserStatusMutation(onSuccess?: (user: AdminUserListItem) => void) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: UpdateUserStatusRequest }) =>
      adminUserService.updateUserStatus(userId, data),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
      toast.success(
        updated.isActive
          ? `Đã mở khóa tài khoản ${updated.fullName}`
          : `Đã khóa tài khoản ${updated.fullName}`
      );
      onSuccess?.(updated);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateUserRolesMutation(onSuccess?: (user: AdminUserListItem) => void) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: UpdateUserRolesRequest }) =>
      adminUserService.updateUserRoles(userId, data),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
      toast.success(`Cập nhật phân quyền cho ${updated.fullName} thành công!`);
      onSuccess?.(updated);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
