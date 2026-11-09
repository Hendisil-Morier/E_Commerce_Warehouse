import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { MainLayout } from "@/layouts/MainLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { WarehousePage } from "@/pages/WarehousePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { SellerPage } from "@/pages/SellerPage";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: ROUTES.PRODUCTS,
        element: <ProductsPage />,
      },
      // Protected for logged in customers / all authenticated users
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: ROUTES.ORDERS,
            element: <OrdersPage />,
          },
        ],
      },
      // Protected for Warehouse Manager & Staff
      {
        element: <ProtectedRoute allowedRoles={["WarehouseManager", "WarehouseStaff", "Admin"]} />,
        children: [
          {
            path: ROUTES.WAREHOUSE,
            element: <WarehousePage />,
          },
        ],
      },
      // Protected for Sellers
      {
        element: <ProtectedRoute allowedRoles={["Seller", "Admin"]} />,
        children: [
          {
            path: ROUTES.SELLER,
            element: <SellerPage />,
          },
        ],
      },
      // Protected for System Admin
      {
        element: <ProtectedRoute allowedRoles={["Admin"]} />,
        children: [
          {
            path: ROUTES.ADMIN,
            element: <DashboardPage />,
          },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.LOGIN,
        element: <LoginPage />,
      },
      {
        path: ROUTES.REGISTER,
        element: <RegisterPage />,
      },
    ],
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
