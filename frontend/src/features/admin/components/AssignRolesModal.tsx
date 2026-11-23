import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { AdminUserListItem, RoleItem } from "@/types/adminUser";

export interface AssignRolesModalProps {
  user: AdminUserListItem | null;
  roles: RoleItem[];
  isOpen: boolean;
  isMutating: boolean;
  currentUserId?: number | null;
  onClose: () => void;
  onSubmit: (selectedRoles: string[]) => void;
}

export const AssignRolesModal: React.FC<AssignRolesModalProps> = ({
  user,
  roles,
  isOpen,
  isMutating,
  currentUserId,
  onClose,
  onSubmit,
}) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const isSelf = user != null && currentUserId === user.userId;

  useEffect(() => {
    if (user) {
      setSelectedRoles(user.roles || []);
    } else {
      setSelectedRoles([]);
    }
  }, [user]);

  const handleToggleRole = (roleName: string) => {
    if (isSelf && roleName === "Admin") {
      // Cannot uncheck Admin on oneself
      return;
    }

    if (selectedRoles.includes(roleName)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== roleName));
    } else {
      setSelectedRoles([...selectedRoles, roleName]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoles.length === 0) return;
    onSubmit(selectedRoles);
  };

  if (!user) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Phân quyền tài khoản: ${user.fullName}`}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <div style={{ fontSize: "0.875rem", color: "var(--color-muted)", marginBottom: "0.5rem" }}>
            Email: <strong>{user.email}</strong> • ID: #{user.userId}
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--color-dark)" }}>
            Chọn các vai trò hệ thống muốn gán cho tài khoản này (mô hình RBAC):
          </p>
        </div>

        {isSelf && (
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "6px",
              backgroundColor: "#FEF3C7",
              border: "1px solid #FCD34D",
              color: "#92400E",
              fontSize: "0.85rem",
            }}
          >
            <strong>Lưu ý:</strong> Bạn đang phân quyền cho tài khoản của chính mình. Vai trò <strong>Admin</strong> không thể bị thu hồi để đảm bảo an toàn hệ thống.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {roles.map((role) => {
            const isChecked = selectedRoles.includes(role.roleName);
            const isDisabled = isSelf && role.roleName === "Admin";

            return (
              <label
                key={role.roleId}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: isChecked ? "1.5px solid var(--color-primary, #0E7C66)" : "1px solid #E5E7EB",
                  backgroundColor: isChecked ? "#F0FDF4" : "#FFFFFF",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  opacity: isDisabled ? 0.8 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => handleToggleRole(role.roleName)}
                  style={{ marginTop: "0.2rem", width: "1rem", height: "1rem", accentColor: "var(--color-primary, #0E7C66)" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "var(--color-dark, #1F2937)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {role.roleName}
                    {isDisabled && (
                      <span style={{ fontSize: "0.75rem", color: "#B45309", fontWeight: 500 }}>
                        (Bắt buộc đối với tài khoản Admin hiện tại)
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <div style={{ fontSize: "0.8rem", color: "var(--color-muted, #6B7280)", marginTop: "0.15rem" }}>
                      {role.description}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {selectedRoles.length === 0 && (
          <div style={{ color: "#DC2626", fontSize: "0.825rem" }}>
            Người dùng phải có ít nhất một vai trò.
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isMutating}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isMutating}
            disabled={selectedRoles.length === 0}
          >
            Lưu phân quyền
          </Button>
        </div>
      </form>
    </Modal>
  );
};
