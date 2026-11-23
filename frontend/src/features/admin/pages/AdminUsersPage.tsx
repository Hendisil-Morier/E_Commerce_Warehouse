import React, { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { AdminUserDetailDrawer } from "@/features/admin/components/AdminUserDetailDrawer";
import { AdminUsersTable } from "@/features/admin/components/AdminUsersTable";
import { AssignRolesModal } from "@/features/admin/components/AssignRolesModal";
import {
  useAdminUsers,
  useRoles,
  useUpdateUserRolesMutation,
  useUpdateUserStatusMutation,
} from "@/features/admin/hooks/useAdminUsers";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useAuthStore } from "@/stores/authStore";
import type { AdminUserListItem } from "@/types/adminUser";
import type { SelectOption } from "@/types/common";

const STATUS_FILTER_OPTIONS: readonly SelectOption[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "true", label: "Đang hoạt động" },
  { value: "false", label: "Đã bị khóa" },
];

const DEFAULT_FILTERS = { role: "ALL", status: "ALL", search: "" };

export const AdminUsersPage: React.FC = () => {
  const currentAuthUser = useAuthStore((s) => s.user);

  const { filters, page, pageSize, setFilter, setPage, resetFilters } = useUrlFilters({
    defaults: DEFAULT_FILTERS,
    defaultPageSize: 20,
  });

  const queryParams = useMemo(() => {
    const isActive =
      filters.status === "true" ? true : filters.status === "false" ? false : undefined;
    const role = filters.role === "ALL" ? undefined : filters.role;
    const search = filters.search?.trim() || undefined;

    return {
      search,
      role,
      isActive,
      page,
      pageSize,
    };
  }, [filters, page, pageSize]);

  const { data, isLoading, error, refetch } = useAdminUsers(queryParams);
  const { data: roles = [] } = useRoles();

  const [detailUserId, setDetailUserId] = useState<number | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<AdminUserListItem | null>(null);
  const [statusConfirmUser, setStatusConfirmUser] = useState<AdminUserListItem | null>(null);

  const updateStatusMutation = useUpdateUserStatusMutation(() => {
    setStatusConfirmUser(null);
  });

  const updateRolesMutation = useUpdateUserRolesMutation(() => {
    setRoleModalUser(null);
  });

  const isMutating = updateStatusMutation.isPending || updateRolesMutation.isPending;

  const roleFilterOptions = useMemo<readonly SelectOption[]>(() => {
    const options: SelectOption[] = [{ value: "ALL", label: "Tất cả vai trò" }];
    for (const r of roles) {
      options.push({ value: r.roleName, label: r.roleName });
    }
    return options;
  }, [roles]);

  const handleToggleStatusConfirm = (reason?: string) => {
    if (!statusConfirmUser) return;
    updateStatusMutation.mutate({
      userId: statusConfirmUser.userId,
      data: {
        isActive: !statusConfirmUser.isActive,
        reason: reason?.trim() || undefined,
      },
    });
  };

  const handleRolesSubmit = (selectedRoles: string[]) => {
    if (!roleModalUser) return;
    updateRolesMutation.mutate({
      userId: roleModalUser.userId,
      data: { roles: selectedRoles },
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PageHeader
        title="Quản lý Người dùng & Phân quyền"
        subtitle="Xem danh sách người dùng toàn sàn, phân quyền vai trò (RBAC: Admin, WarehouseManager, Seller, Customer) và quản lý trạng thái khóa tài khoản."
      />

      {/* Filter Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          padding: "1rem 1.25rem",
          borderRadius: "8px",
          border: "1px solid #E5E7EB",
        }}
      >
        <div style={{ flex: 1, minWidth: "260px" }}>
          <SearchInput
            placeholder="Tìm theo tên, email, username, SĐT..."
            value={filters.search}
            onChange={(val) => setFilter("search", val)}
          />
        </div>

        <div style={{ width: "200px" }}>
          <Select
            value={filters.role}
            options={roleFilterOptions}
            onChange={(e) => setFilter("role", e.target.value)}
          />
        </div>

        <div style={{ width: "200px" }}>
          <Select
            value={filters.status}
            options={STATUS_FILTER_OPTIONS}
            onChange={(e) => setFilter("status", e.target.value)}
          />
        </div>

        {(filters.search || filters.role !== "ALL" || filters.status !== "ALL") && (
          <button
            onClick={() => resetFilters()}
            style={{
              padding: "0.5rem 0.85rem",
              fontSize: "0.85rem",
              color: "var(--color-primary, #0E7C66)",
              backgroundColor: "transparent",
              border: "1px dashed var(--color-primary, #0E7C66)",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Main Table */}
      <AdminUsersTable
        data={data}
        isLoading={isLoading}
        error={error}
        isMutating={isMutating}
        currentUserId={currentAuthUser?.userId}
        onRetry={() => refetch()}
        onSelectUser={(u: AdminUserListItem) => setDetailUserId(u.userId)}
        onOpenRolesModal={(u: AdminUserListItem) => setRoleModalUser(u)}
        onToggleStatus={(u: AdminUserListItem) => setStatusConfirmUser(u)}
        onPageChange={setPage}
      />

      {/* Role Assignment Modal */}
      <AssignRolesModal
        user={roleModalUser}
        roles={roles}
        isOpen={roleModalUser != null}
        isMutating={updateRolesMutation.isPending}
        currentUserId={currentAuthUser?.userId}
        onClose={() => setRoleModalUser(null)}
        onSubmit={handleRolesSubmit}
      />

      {/* Status Toggle Confirm Dialog */}
      <ConfirmDialog
        open={statusConfirmUser != null}
        onClose={() => setStatusConfirmUser(null)}
        onConfirm={handleToggleStatusConfirm}
        title={
          statusConfirmUser?.isActive
            ? `Khóa tài khoản: ${statusConfirmUser?.fullName}`
            : `Mở khóa tài khoản: ${statusConfirmUser?.fullName}`
        }
        description={
          statusConfirmUser?.isActive
            ? `Bạn có chắc muốn KHÓA tài khoản ${statusConfirmUser?.email}? Người dùng này sẽ không thể đăng nhập vào hệ thống.`
            : `Bạn có muốn MỞ KHÓA tài khoản ${statusConfirmUser?.email} để người dùng tiếp tục hoạt động?`
        }
        confirmText={statusConfirmUser?.isActive ? "Khóa tài khoản" : "Mở khóa"}
        variant={statusConfirmUser?.isActive ? "danger" : "primary"}
        showReason={statusConfirmUser?.isActive}
        reasonLabel="Lý do khóa tài khoản"
        reasonPlaceholder="Nhập lý do khóa (tùy chọn)..."
        loading={updateStatusMutation.isPending}
      />

      {/* User Detail Drawer */}
      <AdminUserDetailDrawer
        userId={detailUserId}
        isOpen={detailUserId != null}
        onClose={() => setDetailUserId(null)}
        onOpenRolesModal={() => {
          if (!detailUserId || !data) return;
          const user = data.items.find((u) => u.userId === detailUserId);
          if (user) {
            setRoleModalUser(user);
          }
        }}
      />
    </div>
  );
};
