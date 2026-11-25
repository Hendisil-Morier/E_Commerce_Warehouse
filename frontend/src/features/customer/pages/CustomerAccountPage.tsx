import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Info, Mail, MapPin, ShieldCheck, Store, User } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";
import { getUserRoles, hasRole, ROLE_LABELS, ROLES } from "@/utils/roleUtils";

function getInitials(fullName: string | undefined): string {
  if (!fullName?.trim()) return "KH";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const CustomerAccountPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const isAddressesTab = location.pathname.startsWith(ROUTES.ACCOUNT_ADDRESSES);
  const roles = getUserRoles(user);
  const isSeller = hasRole(user, ROLES.SELLER);

  return (
    <div>
      <div className="ew-page-header" style={{ marginBottom: "18px" }}>
        <div>
          <h1 className="ew-page-header__title">Tài khoản &amp; Sổ địa chỉ</h1>
          <p className="ew-page-header__subtitle">
            Thông tin định danh tài khoản hiện tại và sổ địa chỉ nhận hàng trên hệ thống KHO SÀN+.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div
        className="ks-tabs-bar"
        role="tablist"
        aria-label="Phân mục tài khoản"
        style={{ width: "fit-content" }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={!isAddressesTab}
          className={`ks-tab-btn ${!isAddressesTab ? "ks-tab-btn--active" : ""}`}
          onClick={() => navigate(ROUTES.ACCOUNT)}
        >
          <User size={16} aria-hidden="true" />
          <span>Hồ sơ cá nhân</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isAddressesTab}
          className={`ks-tab-btn ${isAddressesTab ? "ks-tab-btn--active" : ""}`}
          onClick={() => navigate(ROUTES.ACCOUNT_ADDRESSES)}
        >
          <MapPin size={16} aria-hidden="true" />
          <span>Sổ địa chỉ nhận hàng</span>
        </button>
      </div>

      {!isAddressesTab ? (
        <div className="ks-profile-grid">
          {/* Left: Real User Info from Auth Session */}
          <section className="ew-card" style={{ padding: "24px" }}>
            <h2 className="ew-section-heading">Thông tin tài khoản đăng nhập</h2>

            <div className="ew-form-grid-2" style={{ marginBottom: "18px" }}>
              <div className="ew-field">
                <label htmlFor="profile-fullname" className="ew-field__label">
                  Họ và tên
                </label>
                <input
                  id="profile-fullname"
                  type="text"
                  className="ew-control"
                  value={user?.fullName ?? ""}
                  readOnly
                  disabled
                />
              </div>

              <div className="ew-field">
                <label htmlFor="profile-email" className="ew-field__label">
                  Địa chỉ Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="ew-control"
                  value={user?.email ?? ""}
                  readOnly
                  disabled
                />
              </div>

              <div className="ew-field">
                <label htmlFor="profile-userid" className="ew-field__label">
                  Mã tài khoản (User ID)
                </label>
                <input
                  id="profile-userid"
                  type="text"
                  className="ew-control ks-tabular"
                  value={user ? `#${user.userId}` : "—"}
                  readOnly
                  disabled
                />
              </div>

              <div className="ew-field">
                <label htmlFor="profile-phone" className="ew-field__label">
                  Số điện thoại
                </label>
                <input
                  id="profile-phone"
                  type="text"
                  className="ew-control ks-tabular"
                  value={user?.phoneNumber || "Chưa cập nhật"}
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="ks-alert-banner ks-alert-banner--info">
              <Info size={16} style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
              <span>
                Tính năng chỉnh sửa hồ sơ trực tuyến (<code>GET / PUT /api/v1/users/me</code>) sẽ
                được kích hoạt khi Backend bổ sung endpoint quản lý hồ sơ cá nhân.
              </span>
            </div>
          </section>

          {/* Right: Member Summary & Roles Card */}
          <aside className="ew-card" style={{ padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "10px",
                  backgroundColor: "var(--color-forest-900)",
                  color: "#ffffff",
                  fontSize: "18px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {getInitials(user?.fullName)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-dark)" }}>
                  {user?.fullName || "Tài khoản"}
                </div>
                <div className="ks-tabular" style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                  ID #{user?.userId ?? "—"}
                </div>
              </div>
            </div>

            <div className="ks-verify-list">
              <div className="ks-verify-row">
                <span className="ks-verify-label">
                  <Mail size={15} color="var(--color-primary)" aria-hidden="true" />
                  <span>Tài khoản Email</span>
                </span>
                <StatusBadge status="Active" labelOverride="Đã đăng nhập" size="sm" />
              </div>

              <div className="ks-verify-row">
                <span className="ks-verify-label">
                  <ShieldCheck size={15} color="var(--color-primary)" aria-hidden="true" />
                  <span>Trạng thái bảo mật</span>
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-primary)",
                  }}
                >
                  <CheckCircle2 size={14} aria-hidden="true" />
                  <span>JWT Active</span>
                </span>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--color-muted)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Vai trò được cấp
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {roles.map((role) => (
                  <StatusBadge
                    key={role}
                    status="Active"
                    labelOverride={ROLE_LABELS[role] ?? role}
                    size="sm"
                  />
                ))}
              </div>
            </div>

            <Link
              to={isSeller ? ROUTES.SELLER : ROUTES.BECOME_SELLER}
              className="ew-btn ew-btn--secondary ew-btn--md ew-btn--full"
            >
              <Store size={15} aria-hidden="true" />
              <span>{isSeller ? "Mở Kênh người bán" : "Đăng ký làm Người bán"}</span>
            </Link>
          </aside>
        </div>
      ) : (
        <div className="ew-card">
          <EmptyState
            icon={<MapPin size={28} />}
            title="Sổ địa chỉ nhận hàng đang chờ kết nối API"
            description="Cấu trúc bảng UserAddresses (Người nhận, SĐT, Tỉnh/Thành, Quận/Huyện, Phường/Xã, Địa chỉ chi tiết, Mặc định) đã sẵn sàng trong CSDL. Sổ địa chỉ sẽ tự đồng bộ khi Backend bổ sung endpoint /api/v1/users/me/addresses."
            action={
              <Link to={ROUTES.PRODUCTS} className="ew-btn ew-btn--primary ew-btn--md">
                Tiếp tục mua sắm
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
};
