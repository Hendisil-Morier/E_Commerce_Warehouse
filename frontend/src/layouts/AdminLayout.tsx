import React from "react";
import { ADMIN_MENU } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const AdminLayout: React.FC = () => {
  return (
    <DashboardLayout
      areaLabel="Quản trị hệ thống"
      areaBadge="Admin"
      menuItems={ADMIN_MENU}
      basePath={ROUTES.ADMIN}
    />
  );
};

