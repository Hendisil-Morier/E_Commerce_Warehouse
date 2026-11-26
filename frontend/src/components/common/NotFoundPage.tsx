import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Compass,
  Home,
  ShieldCheck,
  Store,
  Warehouse,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";
import { getAvailableWorkspaces, ROLES } from "@/utils/roleUtils";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const roleWorkspaces = getAvailableWorkspaces(user).filter(
    (ws) => ws.key !== "storefront"
  );

  const renderWorkspaceIcon = (role: string) => {
    if (role === ROLES.SELLER) return <Store size={15} aria-hidden="true" />;
    if (role === ROLES.WAREHOUSE_MANAGER) return <Warehouse size={15} aria-hidden="true" />;
    if (role === ROLES.ADMIN) return <ShieldCheck size={15} aria-hidden="true" />;
    return null;
  };

  return (
    <div className="ew-notfound-shell">
      <div className="ew-notfound-card">
        <div className="ew-notfound-icon" aria-hidden="true">
          <Compass size={34} />
        </div>

        <div className="ew-notfound-code ks-tabular">404 · SYS-4</div>

        <h1
          style={{
            fontSize: "1.55rem",
            fontWeight: 800,
            color: "var(--color-dark)",
            marginBottom: "10px",
          }}
        >
          Không tìm thấy trang bạn yêu cầu
        </h1>

        <p
          style={{
            color: "var(--color-muted)",
            fontSize: "0.95rem",
            lineHeight: 1.65,
            marginBottom: "24px",
          }}
        >
          Đường dẫn{" "}
          <code className="ew-notfound-path">{location.pathname || "/404"}</code> không tồn
          tại hoặc đã thay đổi trên hệ thống{" "}
          <strong style={{ color: "var(--color-dark)" }}>KHO SÀN+</strong>. Vui lòng chọn
          một trang hợp lệ bên dưới để tiếp tục.
        </p>

        <div className="ew-notfound-actions">
          <Link to={ROUTES.HOME} className="ew-btn ew-btn--primary ew-btn--md">
            <Home size={16} aria-hidden="true" />
            <span>Về Sàn Mua Sắm</span>
          </Link>

          {roleWorkspaces.map((ws) => (
            <Link
              key={ws.key}
              to={ws.path}
              className="ew-btn ew-btn--secondary ew-btn--md"
            >
              {renderWorkspaceIcon(ws.role)}
              <span>{ws.label}</span>
            </Link>
          ))}

          <button
            type="button"
            className="ew-btn ew-btn--ghost ew-btn--md"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Quay lại trang trước</span>
          </button>
        </div>
      </div>
    </div>
  );
};
