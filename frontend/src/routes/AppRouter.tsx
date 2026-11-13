import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ForbiddenPage } from "@/components/common/ForbiddenPage";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ROUTES } from "@/constants/routes";
import { AdminProductsPage } from "@/features/admin/pages/AdminProductsPage";
import { AdminSellersPage } from "@/features/admin/pages/AdminSellersPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { BecomeSellerPage } from "@/features/seller/pages/BecomeSellerPage";
import { SellerProductFormPage } from "@/features/seller/pages/SellerProductFormPage";
import { SellerProductsPage } from "@/features/seller/pages/SellerProductsPage";
import { SellerShopsPage } from "@/features/seller/pages/SellerShopsPage";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { MainLayout } from "@/layouts/MainLayout";
import { SellerLayout } from "@/layouts/SellerLayout";
import { WarehouseLayout } from "@/layouts/WarehouseLayout";
import { HomePage } from "@/pages/HomePage";
import { OrdersPage } from "@/pages/OrdersPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { ROLES } from "@/utils/roleUtils";

const router = createBrowserRouter([
  // 1. Khu vực Storefront (Khách mua hàng)
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
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: ROUTES.ORDERS,
            element: <OrdersPage />,
          },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={[ROLES.CUSTOMER, ROLES.SELLER]} />,
        children: [
          {
            path: ROUTES.BECOME_SELLER,
            element: <BecomeSellerPage />,
          },
        ],
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
          {
            index: true,
            element: (
              <PlaceholderPage
                screenCode="S1"
                title="Tổng quan Kênh người bán"
                description="Thẻ số liệu đơn chờ xác nhận, sản phẩm chờ duyệt, tồn kho thấp và danh sách việc cần làm."
              />
            ),
          },
          {
            path: "shops",
            element: <SellerShopsPage />,
          },
          {
            path: "products",
            element: <SellerProductsPage />,
          },
          {
            path: "products/new",
            element: <SellerProductFormPage />,
          },
          {
            path: "products/:id/edit",
            element: <SellerProductFormPage />,
          },
          {
            path: "orders",
            element: (
              <PlaceholderPage
                screenCode="S5"
                title="Đơn hàng của shop"
                description="Danh sách đơn con thuộc shop, lọc theo tab trạng thái xử lý và vận chuyển."
              />
            ),
          },
          {
            path: "orders/:id",
            element: (
              <PlaceholderPage
                screenCode="S6"
                title="Chi tiết đơn hàng"
                description="Thông tin khách hàng, dòng sản phẩm, lịch sử trạng thái và thao tác Xác nhận / Hủy đơn."
              />
            ),
          },
          {
            path: "inventory",
            element: (
              <PlaceholderPage
                screenCode="S7"
                title="Tồn kho của tôi"
                description="Theo dõi tồn thực tế, đang giữ chỗ và tồn khả dụng của từng biến thể tại kho sàn."
              />
            ),
          },
          {
            path: "returns",
            element: (
              <PlaceholderPage
                screenCode="S8"
                title="Quản lý trả hàng"
                description="Xem các yêu cầu hoàn trả từ khách hàng và thực hiện Duyệt / Từ chối."
              />
            ),
          },
          {
            path: "profile",
            element: (
              <PlaceholderPage
                screenCode="S9"
                title="Hồ sơ người bán"
                description="Xem và cập nhật thông tin pháp lý doanh nghiệp, mã số thuế và trạng thái kích hoạt Seller."
              />
            ),
          },
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
          {
            index: true,
            element: (
              <PlaceholderPage
                screenCode="W1"
                title="Tổng quan vận hành kho"
                description="Theo dõi nhanh phiếu xuất cần duyệt, cần soạn, phiếu nhập chờ xác nhận và hàng trả chờ kiểm."
              />
            ),
          },
          {
            path: "warehouses",
            element: (
              <PlaceholderPage
                screenCode="W2"
                title="Kho và vị trí"
                description="Quản lý danh sách kho hàng trên hệ thống và truy cập sơ đồ vị trí kệ của từng kho."
              />
            ),
          },
          {
            path: "warehouses/:id/locations",
            element: (
              <PlaceholderPage
                screenCode="W2"
                title="Danh sách vị trí kệ trong kho"
                description="Quản lý mã kệ, phân loại khu vực lưu trữ (bán được, nhập, trả hàng, hàng hỏng)."
              />
            ),
          },
          {
            path: "inventory",
            element: (
              <PlaceholderPage
                screenCode="W3"
                title="Tồn kho theo vị trí"
                description="Tra cứu số lượng OnHand, Reserved, Available theo từng vị trí kệ và biến thể sản phẩm."
              />
            ),
          },
          {
            path: "stock-movements",
            element: (
              <PlaceholderPage
                screenCode="W4"
                title="Thẻ kho (Sổ cái biến động)"
                description="Lịch sử biến động nhập/xuất/giữ chỗ tồn kho gắn với chứng từ gốc và người thực hiện."
              />
            ),
          },
          {
            path: "receipts",
            element: (
              <PlaceholderPage
                screenCode="W5"
                title="Danh sách phiếu nhập kho"
                description="Quản lý các phiếu nhập hàng từ người bán vào kho sàn theo trạng thái Draft, Confirmed, Cancelled."
              />
            ),
          },
          {
            path: "receipts/new",
            element: (
              <PlaceholderPage
                screenCode="W5"
                title="Tạo phiếu nhập kho"
                description="Chọn kho, nguồn hàng seller, quét mã/tìm SKU và chỉ định vị trí kệ nhận hàng."
              />
            ),
          },
          {
            path: "receipts/:id",
            element: (
              <PlaceholderPage
                screenCode="W5"
                title="Chi tiết phiếu nhập kho"
                description="Xem chi tiết các dòng hàng nhập, xác nhận nhập kho (tách quyền người tạo) hoặc hủy phiếu Draft."
              />
            ),
          },
          {
            path: "issues",
            element: (
              <PlaceholderPage
                screenCode="W6"
                title="Danh sách phiếu xuất kho"
                description="Quản lý phiếu xuất cho đơn hàng và xuất điều chỉnh theo quy trình Draft → Approved → Picking → Packed → Dispatched."
              />
            ),
          },
          {
            path: "issues/:id",
            element: (
              <PlaceholderPage
                screenCode="W6"
                title="Chi tiết phiếu xuất kho"
                description="Kiểm tra vị trí lấy hàng, tiến độ soạn và thực hiện Duyệt / Đóng gói / Xuất kho."
              />
            ),
          },
          {
            path: "issues/:id/pick",
            element: (
              <PlaceholderPage
                screenCode="W7"
                title="Soạn hàng & Quét mã vạch"
                description="Giao diện tối giản tại kệ với ô quét mã vạch tự động focus và thanh tiến độ lấy hàng."
              />
            ),
          },
          {
            path: "shipments",
            element: (
              <PlaceholderPage
                screenCode="W8"
                title="Quản lý vận đơn"
                description="Tạo mã vận đơn với các hãng vận chuyển và cập nhật trạng thái giao hàng."
              />
            ),
          },
          {
            path: "returns",
            element: (
              <PlaceholderPage
                screenCode="W9"
                title="Xử lý hàng trả về"
                description="Tiếp nhận kiện hàng hoàn trả và kiểm tra tình trạng từng sản phẩm trước khi nhập lại kệ."
              />
            ),
          },
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
          {
            index: true,
            element: (
              <PlaceholderPage
                screenCode="A1"
                title="Tổng quan Quản trị sàn"
                description="Theo dõi số lượng Seller chờ duyệt, sản phẩm chờ duyệt, yêu cầu hoàn tiền và đơn hàng trong ngày."
              />
            ),
          },
          {
            path: "sellers",
            element: <AdminSellersPage />,
          },
          {
            path: "products",
            element: <AdminProductsPage />,
          },
          {
            path: "orders",
            element: (
              <PlaceholderPage
                screenCode="A4"
                title="Quản lý đơn hàng toàn sàn"
                description="Tra cứu toàn bộ đơn tổng, các đơn con theo từng shop, thanh toán và vận đơn để giải quyết khiếu nại."
              />
            ),
          },
          {
            path: "returns",
            element: (
              <PlaceholderPage
                screenCode="A5"
                title="Quản lý trả hàng toàn sàn"
                description="Xem và can thiệp xử lý các yêu cầu trả hàng đang có tranh chấp hoặc của seller bị khóa."
              />
            ),
          },
          {
            path: "refunds",
            element: (
              <PlaceholderPage
                screenCode="A6"
                title="Quản lý hoàn tiền"
                description="Kiểm tra đối soát số tiền đã thanh toán và thực hiện Duyệt / Từ chối / Hoàn tất hoàn tiền."
              />
            ),
          },
          {
            path: "users",
            element: (
              <PlaceholderPage
                screenCode="A7"
                title="Quản lý người dùng"
                description="Danh sách tài khoản người dùng trên sàn, xem phân quyền và thao tác Khóa / Mở khóa tài khoản."
              />
            ),
          },
          {
            path: "categories",
            element: (
              <PlaceholderPage
                screenCode="A8"
                title="Quản lý danh mục sản phẩm"
                description="Quản lý cây danh mục ngành hàng hiển thị trên trang chủ và bộ lọc tìm kiếm."
              />
            ),
          },
        ],
      },
    ],
  },

  // 5. Khu vực Auth & Trang lỗi
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
  {
    path: ROUTES.FORBIDDEN,
    element: <ForbiddenPage />,
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
