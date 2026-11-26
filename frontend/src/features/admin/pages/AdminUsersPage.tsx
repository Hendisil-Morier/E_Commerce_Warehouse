import React, { useMemo, useState } from "react";
import { Eye, Lock, RotateCcw, Unlock, Users } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { InspectionDrawer } from "@/components/common/InspectionDrawer";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { ReasonActionModal } from "@/components/common/ReasonActionModal";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/hooks/useToast";
import { useOperationsStore } from "@/services/operationsStore";
import { useAuthStore } from "@/stores/authStore";
import type { AdminUserRecordDto } from "@/types/operations";
import { formatDate } from "@/utils/formatters";
import { ROLE_LABELS, ROLES, type UserRole } from "@/utils/roleUtils";

const ALL_SYSTEM_ROLES: UserRole[] = [
  ROLES.ADMIN,
  ROLES.WAREHOUSE_MANAGER,
  ROLES.SELLER,
  ROLES.CUSTOMER,
];

export const AdminUsersPage: React.FC = () => {
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);
  const users = useOperationsStore((s) => s.adminUsers);
  const toggleUserActive = useOperationsStore((s) => s.toggleUserActive);
  const updateUserRoles = useOperationsStore((s) => s.updateUserRoles);

  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [lockTarget, setLockTarget] = useState<AdminUserRecordDto | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "ALL" && !u.roles.includes(roleFilter)) return false;
      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
      );
    });
  }, [users, roleFilter, query]);

  const selected = users.find((u) => u.userId === selectedId) ?? null;

  const handleRoleToggle = (user: AdminUserRecordDto, role: UserRole) => {
    const exists = user.roles.includes(role);
    const nextRoles = exists
      ? user.roles.filter((r) => r !== role)
      : [...user.roles, role];

    const res = updateUserRoles(user.userId, nextRoles);
    if (res.ok) toast.success(res.message);
    else toast.error(res.message);
  };

  return (
    <section>
      <PageHeader
        title="Quản lý người dùng (A7)"
        subtitle="Danh sách tài khoản trên hệ thống theo 4 vai trò chính thức (Admin, WarehouseManager, Seller, Customer) và thao tác Khóa / Mở khóa."
      />

      <MockDataNotice endpointHint="GET /api/v1/admin/users · POST /api/v1/admin/users/{id}/lock | /unlock" />

      <div className="ew-card ew-toolbar" style={{ marginBottom: "16px" }}>
        <div className="ew-toolbar__search">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Tìm theo họ tên, email hoặc username..."
            ariaLabel="Tìm kiếm tài khoản người dùng"
          />
        </div>
        <div className="ew-toolbar__select">
          <Select
            aria-label="Lọc theo vai trò"
            value={roleFilter}
            options={[
              { value: "ALL", label: "Tất cả 4 vai trò" },
              ...ALL_SYSTEM_ROLES.map((r) => ({ value: r, label: `${ROLE_LABELS[r]} (${r})` })),
            ]}
            onChange={(e) => setRoleFilter(e.target.value as "ALL" | UserRole)}
          />
        </div>
        {(query || roleFilter !== "ALL") && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} />}
            onClick={() => {
              setQuery("");
              setRoleFilter("ALL");
            }}
          >
            Đặt lại
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="ew-card">
          <EmptyState
            icon={<Users size={28} />}
            title="Không tìm thấy tài khoản phù hợp"
            description="Thử đặt lại bộ lọc vai trò hoặc từ khóa tìm kiếm."
          />
        </div>
      ) : (
        <div className="ew-card">
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Họ tên / Username</th>
                  <th>Email &amp; Số điện thoại</th>
                  <th>Vai trò (UserRoles)</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th className="ew-table__cell--right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((usr) => (
                  <tr key={usr.userId}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                        {usr.fullName}
                      </div>
                      <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                        @{usr.username} · ID #{usr.userId}
                      </div>
                    </td>
                    <td>
                      <div>{usr.email}</div>
                      <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                        {usr.phoneNumber ?? "—"}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {usr.roles.map((r) => (
                          <span key={r} className="ew-chip">
                            {ROLE_LABELS[r] ?? r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="ks-tabular" style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                      {formatDate(usr.createdAt, { includeTime: false })}
                    </td>
                    <td>
                      <StatusBadge
                        status={usr.isActive ? "Active" : "Suspended"}
                        labelOverride={usr.isActive ? "Đang hoạt động" : "Đã khóa"}
                      />
                    </td>
                    <td className="ew-table__cell--right">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye size={14} />}
                        onClick={() => setSelectedId(usr.userId)}
                      >
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InspectionDrawer
        isOpen={Boolean(selected)}
        title={selected ? selected.fullName : ""}
        subtitle={selected ? `@${selected.username} · ${selected.email}` : undefined}
        headerBadge={
          selected ? (
            <StatusBadge
              status={selected.isActive ? "Active" : "Suspended"}
              labelOverride={selected.isActive ? "Đang hoạt động" : "Đã khóa"}
              size="md"
            />
          ) : undefined
        }
        onClose={() => setSelectedId(null)}
        footer={
          selected ? (() => {
            const isSelf =
              currentUser !== null &&
              (currentUser.email && selected.email
                ? currentUser.email.trim().toLowerCase() === selected.email.trim().toLowerCase()
                : currentUser.userId === selected.userId);
            return (
              <Button
                variant={selected.isActive ? "danger" : "primary"}
                fullWidth
                disabled={isSelf}
                title={
                  isSelf
                    ? "Không thể tự khóa tài khoản Quản trị viên đang đăng nhập"
                    : undefined
                }
                leftIcon={selected.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                onClick={() => setLockTarget(selected)}
              >
                {isSelf
                  ? "Tài khoản đang đăng nhập (Không thể tự khóa)"
                  : selected.isActive
                    ? "Khóa tài khoản (IsActive = false)"
                    : "Mở khóa tài khoản"}
              </Button>
            );
          })() : undefined
        }
      >
        {selected && (() => {
          const isSelf =
            currentUser !== null &&
            (currentUser.email && selected.email
              ? currentUser.email.trim().toLowerCase() === selected.email.trim().toLowerCase()
              : currentUser.userId === selected.userId);
          return (
            <>
              <div className="ew-drawer__section">
                <span className="ew-drawer__section-title">Thông tin bảng Users</span>
                <div className="ew-info-list">
                  <div className="ew-info-row">
                    <span className="ew-info-key">Email</span>
                    <span className="ew-info-val">{selected.email}</span>
                  </div>
                  <div className="ew-info-row">
                    <span className="ew-info-key">Số điện thoại</span>
                    <span className="ew-info-val ks-tabular">{selected.phoneNumber ?? "—"}</span>
                  </div>
                  <div className="ew-info-row">
                    <span className="ew-info-key">Ngày tạo tài khoản</span>
                    <span className="ew-info-val ks-tabular">{formatDate(selected.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="ew-drawer__section">
                <span className="ew-drawer__section-title">
                  Gán vai trò RBAC (1 tài khoản có thể giữ nhiều vai trò)
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {ALL_SYSTEM_ROLES.map((role) => {
                    const disableRole = isSelf && role === ROLES.ADMIN;
                    return (
                      <label
                        key={role}
                        className="ew-checkbox-row"
                        style={{ opacity: disableRole ? 0.65 : 1 }}
                      >
                        <input
                          type="checkbox"
                          checked={selected.roles.includes(role)}
                          disabled={disableRole}
                          onChange={() => handleRoleToggle(selected, role)}
                        />
                        <span>
                          <strong>{ROLE_LABELS[role]}</strong>{" "}
                          <span style={{ color: "var(--color-muted)", fontSize: "0.78rem" }}>
                            ({role})
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {isSelf && (
                <div className="ew-notice ew-notice--info">
                  Đây là tài khoản Quản trị viên đang đăng nhập. Hệ thống tự động khóa thao tác tự khóa hoặc tự gỡ quyền <code>Admin</code> để tránh mất quyền quản trị.
                </div>
              )}

              {selected.lockReason && (
                <div className="ew-notice ew-notice--danger">
                  <div className="ew-notice__head">Lý do khóa tài khoản</div>
                  <div>{selected.lockReason}</div>
                </div>
              )}
            </>
          );
        })()}
      </InspectionDrawer>

      <ReasonActionModal
        isOpen={Boolean(lockTarget)}
        title={lockTarget?.isActive ? "Khóa tài khoản người dùng" : "Mở khóa tài khoản"}
        description={lockTarget ? `Tài khoản ${lockTarget.fullName} (${lockTarget.email}).` : ""}
        confirmLabel={lockTarget?.isActive ? "Xác nhận khóa" : "Xác nhận mở khóa"}
        tone={lockTarget?.isActive ? "danger" : "primary"}
        requireReason={Boolean(lockTarget?.isActive)}
        reasonLabel="Lý do khóa tài khoản"
        onConfirm={(reason) => {
          if (!lockTarget) return;
          const res = toggleUserActive(lockTarget.userId, reason);
          if (res.ok) toast.success(res.message);
          setLockTarget(null);
        }}
        onClose={() => setLockTarget(null)}
      />
    </section>
  );
};
