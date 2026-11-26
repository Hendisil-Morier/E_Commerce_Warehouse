import React, { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ForbiddenPage } from "@/components/common/ForbiddenPage";
import { NotFoundPage } from "@/components/common/NotFoundPage";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { MainLayout } from "@/layouts/MainLayout";
import { SellerLayout } from "@/layouts/SellerLayout";
import { WarehouseLayout } from "@/layouts/WarehouseLayout";
import { ROLES } from "@/utils/roleUtils";

// Storefront & Customer
const HomePage = lazy(() =>
  import("@/pages/HomePage").then((m) => ({ default: m.HomePage }))
);
const PublicProductsPage = lazy(() =>
  import("@/features/catalog/pages/PublicProductsPage").then((m) => ({
    default: m.PublicProductsPage,
  }))
);
const ProductDetailPage = lazy(() =>
  import("@/features/catalog/pages/ProductDetailPage").then((m) => ({
    default: m.ProductDetailPage,
  }))
);
const ShopDetailPage = lazy(() =>
  import("@/features/catalog/pages/ShopDetailPage").then((m) => ({
    default: m.ShopDetailPage,
  }))
);
const CartPage = lazy(() =>
  import("@/features/cart/pages/CartPage").then((m) => ({ default: m.CartPage }))
);
const CheckoutPage = lazy(() =>
  import("@/features/customer/pages/CheckoutPage").then((m) => ({
    default: m.CheckoutPage,
  }))
);
const CustomerPortalLayout = lazy(() =>
  import("@/features/customer/layouts/CustomerPortalLayout").then((m) => ({
    default: m.CustomerPortalLayout,
  }))
);
const CustomerOrdersPage = lazy(() =>
  import("@/features/customer/pages/CustomerOrdersPage").then((m) => ({
    default: m.CustomerOrdersPage,
  }))
);
const CustomerOrderDetailPage = lazy(() =>
  import("@/features/customer/pages/CustomerOrderDetailPage").then((m) => ({
    default: m.CustomerOrderDetailPage,
  }))
);
const CustomerAccountPage = lazy(() =>
  import("@/features/customer/pages/CustomerAccountPage").then((m) => ({
    default: m.CustomerAccountPage,
  }))
);

// Auth
const LoginPage = lazy(() =>
  import("@/features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("@/features/auth/pages/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);

// Seller (S0–S9)
const BecomeSellerPage = lazy(() =>
  import("@/features/seller/pages/BecomeSellerPage").then((m) => ({
    default: m.BecomeSellerPage,
  }))
);
const SellerDashboardPage = lazy(() =>
  import("@/features/seller/pages/SellerDashboardPage").then((m) => ({
    default: m.SellerDashboardPage,
  }))
);
const SellerShopsPage = lazy(() =>
  import("@/features/seller/pages/SellerShopsPage").then((m) => ({
    default: m.SellerShopsPage,
  }))
);
const SellerProductsPage = lazy(() =>
  import("@/features/seller/pages/SellerProductsPage").then((m) => ({
    default: m.SellerProductsPage,
  }))
);
const SellerProductFormPage = lazy(() =>
  import("@/features/seller/pages/SellerProductFormPage").then((m) => ({
    default: m.SellerProductFormPage,
  }))
);
const SellerOrdersPage = lazy(() =>
  import("@/features/seller/pages/SellerOrdersPage").then((m) => ({
    default: m.SellerOrdersPage,
  }))
);
const SellerOrderDetailPage = lazy(() =>
  import("@/features/seller/pages/SellerOrderDetailPage").then((m) => ({
    default: m.SellerOrderDetailPage,
  }))
);
const SellerInventoryPage = lazy(() =>
  import("@/features/seller/pages/SellerInventoryPage").then((m) => ({
    default: m.SellerInventoryPage,
  }))
);
const SellerReturnsPage = lazy(() =>
  import("@/features/seller/pages/SellerReturnsPage").then((m) => ({
    default: m.SellerReturnsPage,
  }))
);
const SellerProfilePage = lazy(() =>
  import("@/features/seller/pages/SellerProfilePage").then((m) => ({
    default: m.SellerProfilePage,
  }))
);

// Warehouse WMS (W1–W9)
const WarehouseOverviewPage = lazy(() =>
  import("@/features/warehouse/pages/WarehouseOverviewPage").then((m) => ({
    default: m.WarehouseOverviewPage,
  }))
);
const WarehousesPage = lazy(() =>
  import("@/features/warehouse/pages/WarehousesPage").then((m) => ({
    default: m.WarehousesPage,
  }))
);
const WarehouseLocationsPage = lazy(() =>
  import("@/features/warehouse/pages/WarehouseLocationsPage").then((m) => ({
    default: m.WarehouseLocationsPage,
  }))
);
const WarehouseInventoryPage = lazy(() =>
  import("@/features/warehouse/pages/WarehouseInventoryPage").then((m) => ({
    default: m.WarehouseInventoryPage,
  }))
);
const WarehouseStockMovementsPage = lazy(() =>
  import("@/features/warehouse/pages/WarehouseStockMovementsPage").then((m) => ({
    default: m.WarehouseStockMovementsPage,
  }))
);
const WarehouseReceiptsPage = lazy(() =>
  import("@/features/warehouse/pages/WarehouseReceiptsPage").then((m) => ({
    default: m.WarehouseReceiptsPage,
  }))
);
const WarehouseReceiptCreatePage = lazy(() =>
  import("@/features/warehouse/pages/WarehouseReceiptCreatePage").then((m) => ({
    default: m.WarehouseReceiptCreatePage,
  }))
);
const WarehouseReceiptDetailPage = lazy(() =>
  import("@/features/warehouse/pages/WarehouseReceiptDetailPage").then((m) => ({
    default: m.WarehouseReceiptDetailPage,
  }))
);
const WarehouseIssuesPage = lazy(() =>
  import("@/features/warehouse/pages/WarehouseIssuesPage").then((m) => ({
    default: m.WarehouseIssuesPage,
  }))
);
const WarehouseIssueDetailPage = lazy(() =>
  import("@/features/warehouse/pages/WarehouseIssueDetailPage").then((m) => ({
    default: m.WarehouseIssueDetailPage,
  }))
);
const WarehouseIssuePickPage = lazy(() =>
  import("@/features/warehouse/pages/WarehouseIssuePickPage").then((m) => ({
    default: m.WarehouseIssuePickPage,
  }))
);
const WarehouseIssuePackPage = lazy(() =>
  import("@/features/warehouse/pages/WarehouseIssuePackPage").then((m) => ({
    default: m.WarehouseIssuePackPage,
  }))
);
const WarehouseShipmentsPage = lazy(() =>
  import("@/features/warehouse/pages/WarehouseShipmentsPage").then((m) => ({
    default: m.WarehouseShipmentsPage,
  }))
);
const WarehouseReturnsPage = lazy(() =>
  import("@/features/warehouse/pages/WarehouseReturnsPage").then((m) => ({
    default: m.WarehouseReturnsPage,
  }))
);

// Admin (A1–A8)
const AdminDashboardPage = lazy(() =>
  import("@/features/admin/pages/AdminDashboardPage").then((m) => ({
    default: m.AdminDashboardPage,
  }))
);
const AdminSellersPage = lazy(() =>
  import("@/features/admin/pages/AdminSellersPage").then((m) => ({
    default: m.AdminSellersPage,
  }))
);
const AdminProductsPage = lazy(() =>
  import("@/features/admin/pages/AdminProductsPage").then((m) => ({
    default: m.AdminProductsPage,
  }))
);
const AdminOrdersPage = lazy(() =>
  import("@/features/admin/pages/AdminOrdersPage").then((m) => ({
    default: m.AdminOrdersPage,
  }))
);
const AdminReturnsPage = lazy(() =>
  import("@/features/admin/pages/AdminReturnsPage").then((m) => ({
    default: m.AdminReturnsPage,
  }))
);
const AdminRefundsPage = lazy(() =>
  import("@/features/admin/pages/AdminRefundsPage").then((m) => ({
    default: m.AdminRefundsPage,
  }))
);
const AdminUsersPage = lazy(() =>
  import("@/features/admin/pages/AdminUsersPage").then((m) => ({
    default: m.AdminUsersPage,
  }))
);
const AdminCategoriesPage = lazy(() =>
  import("@/features/admin/pages/AdminCategoriesPage").then((m) => ({
    default: m.AdminCategoriesPage,
  }))
);

const RouteFallback: React.FC = () => (
  <div className="ks-container" style={{ padding: "36px 24px" }}>
    <div className="ew-card" style={{ padding: "24px" }}>
      <Skeleton lines={5} height={20} gap={14} />
    </div>
  </div>
);

function withSuspense(element: React.ReactNode): React.ReactNode {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  // 1. Khu vực Storefront & Cổng Khách hàng
  {
    path: ROUTES.HOME,
    element: <MainLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: ROUTES.PRODUCTS, element: withSuspense(<PublicProductsPage />) },
      { path: ROUTES.PRODUCT_DETAIL, element: withSuspense(<ProductDetailPage />) },
      { path: ROUTES.SHOP_DETAIL, element: withSuspense(<ShopDetailPage />) },
      {
        element: <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]} />,
        children: [
          {
            path: ROUTES.CART,
            element: withSuspense(<CartPage />),
          },
          {
            path: ROUTES.CHECKOUT,
            element: withSuspense(<CheckoutPage />),
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: withSuspense(<CustomerPortalLayout />),
            children: [
              {
                path: ROUTES.ORDERS,
                element: withSuspense(<CustomerOrdersPage />),
              },
              {
                path: ROUTES.ORDER_DETAIL,
                element: withSuspense(<CustomerOrderDetailPage />),
              },
              {
                path: ROUTES.ACCOUNT,
                element: withSuspense(<CustomerAccountPage />),
              },
              {
                path: ROUTES.ACCOUNT_ADDRESSES,
                element: withSuspense(<CustomerAccountPage />),
              },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={[ROLES.CUSTOMER, ROLES.SELLER]} />,
        children: [{ path: ROUTES.BECOME_SELLER, element: withSuspense(<BecomeSellerPage />) }],
      },
    ],
  },

  // 2. Khu vực Seller (/seller)
  {
    element: <ProtectedRoute allowedRoles={[ROLES.SELLER]} />,
    children: [
      {
        path: ROUTES.SELLER,
        element: <SellerLayout />,
        children: [
          { index: true, element: withSuspense(<SellerDashboardPage />) },
          { path: "shops", element: withSuspense(<SellerShopsPage />) },
          { path: "products", element: withSuspense(<SellerProductsPage />) },
          { path: "products/new", element: withSuspense(<SellerProductFormPage />) },
          { path: "products/:id/edit", element: withSuspense(<SellerProductFormPage />) },
          { path: "orders", element: withSuspense(<SellerOrdersPage />) },
          { path: "orders/:id", element: withSuspense(<SellerOrderDetailPage />) },
          { path: "inventory", element: withSuspense(<SellerInventoryPage />) },
          { path: "returns", element: withSuspense(<SellerReturnsPage />) },
          { path: "profile", element: withSuspense(<SellerProfilePage />) },
        ],
      },
    ],
  },

  // 3. Khu vực Warehouse (/warehouse)
  {
    element: <ProtectedRoute allowedRoles={[ROLES.WAREHOUSE_MANAGER]} />,
    children: [
      {
        path: ROUTES.WAREHOUSE,
        element: <WarehouseLayout />,
        children: [
          { index: true, element: withSuspense(<WarehouseOverviewPage />) },
          { path: "warehouses", element: withSuspense(<WarehousesPage />) },
          { path: "warehouses/:id/locations", element: withSuspense(<WarehouseLocationsPage />) },
          { path: "inventory", element: withSuspense(<WarehouseInventoryPage />) },
          { path: "stock-movements", element: withSuspense(<WarehouseStockMovementsPage />) },
          { path: "receipts", element: withSuspense(<WarehouseReceiptsPage />) },
          { path: "receipts/new", element: withSuspense(<WarehouseReceiptCreatePage />) },
          { path: "receipts/:id", element: withSuspense(<WarehouseReceiptDetailPage />) },
          { path: "issues", element: withSuspense(<WarehouseIssuesPage />) },
          { path: "issues/:id", element: withSuspense(<WarehouseIssueDetailPage />) },
          { path: "issues/:id/pick", element: withSuspense(<WarehouseIssuePickPage />) },
          { path: "issues/:id/pack", element: withSuspense(<WarehouseIssuePackPage />) },
          { path: "shipments", element: withSuspense(<WarehouseShipmentsPage />) },
          { path: "returns", element: withSuspense(<WarehouseReturnsPage />) },
        ],
      },
    ],
  },

  // 4. Khu vực Admin (/admin)
  {
    element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]} />,
    children: [
      {
        path: ROUTES.ADMIN,
        element: <AdminLayout />,
        children: [
          { index: true, element: withSuspense(<AdminDashboardPage />) },
          { path: "sellers", element: withSuspense(<AdminSellersPage />) },
          { path: "products", element: withSuspense(<AdminProductsPage />) },
          { path: "orders", element: withSuspense(<AdminOrdersPage />) },
          { path: "returns", element: withSuspense(<AdminReturnsPage />) },
          { path: "refunds", element: withSuspense(<AdminRefundsPage />) },
          { path: "users", element: withSuspense(<AdminUsersPage />) },
          { path: "categories", element: withSuspense(<AdminCategoriesPage />) },
        ],
      },
    ],
  },

  // 5. Khu vực Auth & Trang lỗi (SYS-4)
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.LOGIN, element: withSuspense(<LoginPage />) },
      { path: ROUTES.REGISTER, element: withSuspense(<RegisterPage />) },
    ],
  },
  { path: ROUTES.FORBIDDEN, element: <ForbiddenPage /> },
  { path: "*", element: <NotFoundPage /> },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
