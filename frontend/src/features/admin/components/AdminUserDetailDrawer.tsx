import React from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminUserDetail } from "@/features/admin/hooks/useAdminUsers";
import { formatDate } from "@/utils/formatters";

export interface AdminUserDetailDrawerProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRolesModal: () => void;
}

export const AdminUserDetailDrawer: React.FC<AdminUserDetailDrawerProps> = ({
  userId,
  isOpen,
  onClose,
  onOpenRolesModal,
}) => {
  const { data: user, isLoading, error } = useAdminUserDetail(userId);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          height: "100%",
          backgroundColor: "#FFFFFF",
          boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--color-dark)" }}>
              Chi tiết người dùng
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
              ID: #{userId}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "1.25rem",
              cursor: "pointer",
              color: "var(--color-muted)",
              padding: "0.25rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem", flex: 1 }}>
          {isLoading && (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)" }}>
              Đang tải thông tin...
            </div>
          )}

          {error && (
            <div style={{ color: "#DC2626", padding: "1rem", backgroundColor: "#FEF2F2", borderRadius: "6px" }}>
              {(error as Error).message || "Không thể tải thông tin người dùng."}
            </div>
          )}

          {user && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Profile Card */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-primary-light, #E6F4F1)",
                    color: "var(--color-primary, #0E7C66)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1.5rem",
                  }}
                >
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>{user.fullName}</h4>
                  <div style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>{user.email}</div>
                  <div style={{ marginTop: "0.35rem" }}>
                    <StatusBadge
                      status={user.isActive ? "Approved" : "Suspended"}
                      labelOverride={user.isActive ? "Đang hoạt động" : "Đã bị khóa"}
                    />
                  </div>
                </div>
              </div>

              {/* Roles Section */}
              <div style={{ padding: "1rem", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Vai trò (RBAC)</span>
                  <Button size="sm" variant="secondary" onClick={onOpenRolesModal}>
                    Chỉnh sửa
                  </Button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {user.roles.map((r) => (
                    <span
                      key={r}
                      style={{
                        padding: "0.25rem 0.65rem",
                        borderRadius: "9999px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        backgroundColor: "#E6F4F1",
                        color: "var(--color-primary, #0E7C66)",
                      }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* General Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-muted)" }}>Tên đăng nhập:</span>
                  <span style={{ fontWeight: 600 }}>{user.username || "Chưa đặt"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-muted)" }}>Số điện thoại:</span>
                  <span style={{ fontWeight: 600 }}>{user.phoneNumber || "Chưa cập nhật"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-muted)" }}>Sổ địa chỉ:</span>
                  <span style={{ fontWeight: 600 }}>{user.addressCount} địa chỉ giao hàng</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-muted)" }}>Ngày tham gia:</span>
                  <span>{formatDate(user.createdAt)}</span>
                </div>
                {user.updatedAt && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-muted)" }}>Cập nhật gần nhất:</span>
                    <span>{formatDate(user.updatedAt)}</span>
                  </div>
                )}
              </div>

              {/* Seller details if seller */}
              {user.isSeller && (
                <div style={{ padding: "1rem", backgroundColor: "#FAF5FF", borderRadius: "8px", border: "1px solid #E9D5FF" }}>
                  <h5 style={{ margin: "0 0 0.5rem 0", color: "#6B21A8", fontWeight: 700 }}>Hồ sơ Người bán (Seller)</h5>
                  <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <div>Tên doanh nghiệp / Shop: <strong>{user.businessName || "—"}</strong></div>
                    <div>Trạng thái duyệt: <strong>{user.sellerStatus || "—"}</strong></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
