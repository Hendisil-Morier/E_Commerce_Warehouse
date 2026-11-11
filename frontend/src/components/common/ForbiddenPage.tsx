import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Home, ShieldAlert } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";
import {
  ROLE_LABELS,
  getDefaultRouteForUser,
  getUserRoles,
} from "@/utils/roleUtils";

interface ForbiddenPageProps {
  allowedRoles?: readonly string[];
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();
  const userRoles = getUserRoles(user);
  const roleDisplay =
    userRoles.length > 0
      ? userRoles.map((r) => ROLE_LABELS[r] || r).join(", ")
      : "Chưa đăng nhập";
  const defaultAreaRoute = isAuthenticated ? getDefaultRouteForUser(user) : ROUTES.HOME;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          padding: "40px 36px",
          backgroundColor: "var(--color-white)",
          borderRadius: "16px",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            backgroundColor: "#fef2f2",
            color: "var(--color-danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <ShieldAlert size={34} />
        </div>

        <div
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "999px",
            backgroundColor: "#fef2f2",
            color: "#b91c1c",
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            marginBottom: "12px",
          }}
        >
          MÃ LỖI 403
        </div>

        <h1
          style={{
            fontSize: "1.55rem",
            fontWeight: 800,
            color: "var(--color-dark)",
            marginBottom: "10px",
          }}
        >
          Không đủ quyền truy cập
        </h1>

        <p
          style={{
            color: "var(--color-muted)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          Tài khoản hiện tại đang có vai trò{" "}
          <strong style={{ color: "var(--color-dark)" }}>{roleDisplay}</strong>, không có quyền
          truy cập trang này
          {allowedRoles && allowedRoles.length > 0
            ? ` (yêu cầu: ${allowedRoles.map((r) => ROLE_LABELS[r] || r).join(" hoặc ")})`
            : ""}
          .
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {isAuthenticated && defaultAreaRoute !== ROUTES.HOME && (
            <Link
              to={defaultAreaRoute}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                minHeight: "44px",
                padding: "0 20px",
                backgroundColor: "var(--color-forest-600)",
                color: "var(--color-white)",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              <ArrowLeft size={17} />
              <span>Về khu vực của tôi</span>
            </Link>
          )}

          <Link
            to={ROUTES.HOME}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              minHeight: "44px",
              padding: "0 20px",
              backgroundColor:
                isAuthenticated && defaultAreaRoute !== ROUTES.HOME
                  ? "var(--color-slate-100)"
                  : "var(--color-forest-600)",
              color:
                isAuthenticated && defaultAreaRoute !== ROUTES.HOME
                  ? "var(--color-slate-700)"
                  : "var(--color-white)",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            <Home size={17} />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

