import React from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ChevronRight,
  MapPin,
  Package,
  ShieldCheck,
  Store,
  User,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";
import { ROLE_LABELS, getPrimaryRole, hasRole, ROLES } from "@/utils/roleUtils";

function getInitials(fullName: string | undefined): string {
  if (!fullName?.trim()) return "KH";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getSectionTitle(pathname: string): string {
  if (pathname.startsWith(ROUTES.ACCOUNT_ADDRESSES)) return "Sổ địa chỉ nhận hàng";
  if (pathname.startsWith(ROUTES.ACCOUNT)) return "Hồ sơ cá nhân";
  return "Đơn hàng của tôi";
}

export const CustomerPortalLayout: React.FC = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const roleLabel = ROLE_LABELS[getPrimaryRole(user)] ?? "Khách hàng";
  const isSeller = hasRole(user, ROLES.SELLER);

  return (
    <div>
      <div className="ks-breadcrumb-bar">
        <div className="ks-container">
          <nav className="ks-breadcrumb" aria-label="Đường dẫn trang">
            <Link to={ROUTES.HOME}>Trang chủ KHO SÀN+</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="ks-breadcrumb-current">
              {getSectionTitle(location.pathname)}
            </span>
          </nav>
        </div>
      </div>

      <div className="ks-container ks-portal-main">
        <div className="ks-portal-grid">
          <aside className="ks-customer-sidebar" aria-label="Menu tài khoản khách hàng">
            <div className="ks-sidebar-profile">
              <div className="ks-sidebar-avatar" aria-hidden="true">
                {getInitials(user?.fullName)}
              </div>
              <div className="ks-sidebar-user-meta">
                <div className="ks-sidebar-name">{user?.fullName || "Khách hàng"}</div>
                <div className="ks-sidebar-tier">{roleLabel}</div>
              </div>
            </div>

            <nav className="ks-sidebar-nav" aria-label="Danh mục quản lý cá nhân">
              <NavLink
                to={ROUTES.ORDERS}
                className={({ isActive }) =>
                  `ks-sidebar-link ${isActive ? "ks-sidebar-link--active" : ""}`
                }
              >
                <span className="ks-sidebar-link-left">
                  <Package size={18} aria-hidden="true" />
                  <span>Đơn hàng của tôi</span>
                </span>
              </NavLink>

              <NavLink
                to={ROUTES.ACCOUNT}
                end
                className={({ isActive }) =>
                  `ks-sidebar-link ${isActive ? "ks-sidebar-link--active" : ""}`
                }
              >
                <span className="ks-sidebar-link-left">
                  <User size={18} aria-hidden="true" />
                  <span>Hồ sơ cá nhân</span>
                </span>
              </NavLink>

              <NavLink
                to={ROUTES.ACCOUNT_ADDRESSES}
                className={({ isActive }) =>
                  `ks-sidebar-link ${isActive ? "ks-sidebar-link--active" : ""}`
                }
              >
                <span className="ks-sidebar-link-left">
                  <MapPin size={18} aria-hidden="true" />
                  <span>Sổ địa chỉ nhận hàng</span>
                </span>
              </NavLink>

              <NavLink
                to={isSeller ? ROUTES.SELLER : ROUTES.BECOME_SELLER}
                className="ks-sidebar-link"
              >
                <span className="ks-sidebar-link-left">
                  <Store size={18} aria-hidden="true" />
                  <span>{isSeller ? "Kênh người bán" : "Đăng ký bán hàng"}</span>
                </span>
              </NavLink>
            </nav>

            <div className="ks-sidebar-guarantee">
              <div className="ks-sidebar-guarantee-title">
                <ShieldCheck size={15} aria-hidden="true" />
                <span>Bảo vệ người mua KHO SÀN+</span>
              </div>
              <p>
                Đơn hàng được đối soát mã vạch khi đóng gói tại Kho sàn và hỗ trợ yêu cầu
                đổi trả trong 7 ngày nếu sản phẩm có lỗi kỹ thuật.
              </p>
            </div>
          </aside>

          <section style={{ minWidth: 0 }}>
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
};
