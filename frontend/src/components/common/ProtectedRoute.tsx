import React from "react";
import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/constants/routes";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  // 1. Chưa đăng nhập -> Chuyển về /login
  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // 2. Kiểm tra quyền Role nếu có chỉ định allowedRoles
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role || "Customer";
    const userRoles = user.roles || [userRole];

    const hasPermission = allowedRoles.some((role) =>
      userRoles.includes(role) || userRole === role
    );

    if (!hasPermission) {
      return (
        <div style={{
          maxWidth: "600px",
          margin: "60px auto",
          padding: "40px 32px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          textAlign: "center",
          boxShadow: "0 10px 25px rgba(15, 23, 42, 0.05)",
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <ShieldAlert size={32} />
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
            403 — Không có quyền truy cập
          </h2>

          <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
            Tài khoản của bạn đang có vai trò <strong>{userRole}</strong>, không thuộc nhóm vai trò được phép truy cập khu vực này ({allowedRoles.join(", ")}).
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            <Link
              to={ROUTES.HOME}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                backgroundColor: "#4f46e5",
                color: "#ffffff",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              <ArrowLeft size={16} />
              <span>Quay về trang chủ</span>
            </Link>
          </div>
        </div>
      );
    }
  }

  return <Outlet />;
};

