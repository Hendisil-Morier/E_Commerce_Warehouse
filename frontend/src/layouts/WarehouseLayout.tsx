import React from "react";
import { WAREHOUSE_MENU } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const WarehouseLayout: React.FC = () => {
  return (
    <DashboardLayout
      areaLabel="Quản lý kho vận"
      areaBadge="Warehouse"
      menuItems={WAREHOUSE_MENU}
      basePath={ROUTES.WAREHOUSE}
    />
  );
};

