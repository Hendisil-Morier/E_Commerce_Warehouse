import React from "react";
import { SELLER_MENU } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const SellerLayout: React.FC = () => {
  return (
    <DashboardLayout
      areaLabel="Kênh người bán"
      areaBadge="Seller"
      menuItems={SELLER_MENU}
      basePath={ROUTES.SELLER}
    />
  );
};

