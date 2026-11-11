import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";
import { hasRole } from "@/utils/roleUtils";
import { ForbiddenPage } from "@/components/common/ForbiddenPage";

interface ProtectedRouteProps {
  allowedRoles?: readonly string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  // 1. Chưa đăng nhập -> Chuyển về /login (lưu trang đang xem để quay về sau khi đăng nhập)
  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // 2. Kiểm tra role nếu có khai báo allowedRoles
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(user, allowedRoles)) {
    return <ForbiddenPage allowedRoles={allowedRoles} />;
  }

  return <Outlet />;
};
