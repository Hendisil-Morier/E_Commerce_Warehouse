import React from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, type TableColumn } from "@/components/ui/Table";
import type { AdminUserListItem } from "@/types/adminUser";
import type { PagedResult } from "@/types/api";
import { formatDate } from "@/utils/formatters";

export interface AdminUsersTableProps {
  data: PagedResult<AdminUserListItem> | undefined;
  isLoading: boolean;
  error: unknown;
  isMutating: boolean;
  currentUserId?: number | null;
  onRetry: () => void;
  onSelectUser: (user: AdminUserListItem) => void;
  onOpenRolesModal: (user: AdminUserListItem) => void;
  onToggleStatus: (user: AdminUserListItem) => void;
  onPageChange: (page: number) => void;
}

const ROLE_BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Admin: { bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0" },
  WarehouseManager: { bg: "#EFF6FF", color: "#1E40AF", border: "#BFDBFE" },
  Seller: { bg: "#FAF5FF", color: "#6B21A8", border: "#E9D5FF" },
  Customer: { bg: "#F3F4F6", color: "#374151", border: "#E5E7EB" },
};

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({
  data,
  isLoading,
  error,
  isMutating,
  currentUserId,
  onRetry,
  onSelectUser,
  onOpenRolesModal,
  onToggleStatus,
  onPageChange,
}) => {
  const columns: TableColumn<AdminUserListItem>[] = [
    {
      key: "user",
      header: "Người dùng",
      render: (item: AdminUserListItem) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "50%",
              backgroundColor: "var(--color-primary-light, #E6F4F1)",
              color: "var(--color-primary, #0E7C66)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "1rem",
              flexShrink: 0,
            }}
          >
            {item.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--color-dark, #1F2937)" }}>
              {item.fullName}
              {currentUserId === item.userId && (
                <span
                  style={{
                    marginLeft: "0.5rem",
                    fontSize: "0.75rem",
                    backgroundColor: "#FEF3C7",
                    color: "#92400E",
                    padding: "0.15rem 0.4rem",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                >
                  Bạn (Admin hiện tại)
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--color-muted, #6B7280)" }}>
              {item.email} {item.username ? `• @${item.username}` : ""}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Số điện thoại",
      render: (item: AdminUserListItem) => (
        <span style={{ fontSize: "0.875rem", color: item.phoneNumber ? "inherit" : "var(--color-muted)" }}>
          {item.phoneNumber || "Chưa cập nhật"}
        </span>
      ),
    },
    {
      key: "roles",
      header: "Vai trò (RBAC)",
      render: (item: AdminUserListItem) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          {item.roles.length > 0 ? (
            item.roles.map((role) => {
              const style = ROLE_BADGE_STYLES[role] || ROLE_BADGE_STYLES.Customer;
              return (
                <span
                  key={role}
                  style={{
                    display: "inline-block",
                    padding: "0.2rem 0.55rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    backgroundColor: style.bg,
                    color: style.color,
                    border: `1px solid ${style.border}`,
                  }}
                >
                  {role}
                </span>
              );
            })
          ) : (
            <span style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>Không có</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (item: AdminUserListItem) => (
        <StatusBadge
          status={item.isActive ? "Approved" : "Suspended"}
          labelOverride={item.isActive ? "Hoạt động" : "Đã khóa"}
        />
      ),
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      render: (item: AdminUserListItem) => (
        <span style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>
          {formatDate(item.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (item: AdminUserListItem) => {
        const isSelf = currentUserId === item.userId;

        return (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onSelectUser(item)}
              title="Xem thông tin chi tiết"
            >
              Chi tiết
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isMutating}
              onClick={() => onOpenRolesModal(item)}
              title="Phân quyền vai trò người dùng"
            >
              Phân quyền
            </Button>
            <Button
              variant={item.isActive ? "danger" : "secondary"}
              size="sm"
              disabled={isMutating || (isSelf && item.isActive)}
              onClick={() => onToggleStatus(item)}
              title={
                isSelf && item.isActive
                  ? "Không thể tự khóa tài khoản của chính mình"
                  : item.isActive
                  ? "Khóa tài khoản"
                  : "Mở khóa tài khoản"
              }
            >
              {item.isActive ? "Khóa" : "Mở khóa"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      data={data?.items ?? []}
      rowKey={(item) => item.userId}
      loading={isLoading}
      error={error}
      onRetry={onRetry}
      onRowClick={onSelectUser}
      emptyTitle="Không có người dùng phù hợp"
      emptyDescription="Thử đổi vai trò, trạng thái lọc hoặc xóa từ khóa tìm kiếm để xem các tài khoản khác."
      pagination={
        data
          ? {
              page: data.page,
              pageSize: data.pageSize,
              totalItems: data.totalItems,
              totalPages: data.totalPages,
              onPageChange,
            }
          : undefined
      }
    />
  );
};
