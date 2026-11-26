import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeDollarSign,
  FolderTree,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { useAdminProductsQuery } from "@/features/admin/hooks/useAdminProducts";
import { useAdminSellers } from "@/features/admin/hooks/useAdminSellers";
import { useOperationsStore } from "@/services/operationsStore";
import { formatDate } from "@/utils/formatters";

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // API thật từ Backend
  const pendingSellersQuery = useAdminSellers({ status: "Pending", page: 1, pageSize: 5 });
  const pendingProductsQuery = useAdminProductsQuery({
    status: "PendingReview",
    page: 1,
    pageSize: 5,
  });

  // Dữ liệu mô phỏng chuẩn CSDL cho phần chờ BE
  const masterOrders = useOperationsStore((s) => s.masterOrders);
  const returns = useOperationsStore((s) => s.returns);
  const refunds = useOperationsStore((s) => s.refunds);

  const pendingSellersTotal = pendingSellersQuery.data?.totalItems ?? 0;
  const pendingProductsTotal = pendingProductsQuery.data?.totalItems ?? 0;
  const pendingRefundsCount = refunds.filter((r) => r.refundStatus === "Pending").length;
  const openReturnsCount = returns.filter((r) =>
    ["Requested", "Approved", "ItemsReceived", "Inspected"].includes(r.status)
  ).length;
  const todayOrdersCount = masterOrders.filter((o) =>
    o.createdAt.startsWith("2026-11-25")
  ).length;

  return (
    <section>
      <PageHeader
        title="Tổng quan Quản trị sàn"
        subtitle="Theo dõi hồ sơ Seller chờ duyệt, sản phẩm chờ duyệt (API thật), yêu cầu hoàn tiền, trả hàng đang mở và đơn hàng toàn sàn."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<ShoppingBag size={16} />}
              onClick={() => navigate(ROUTES.ADMIN_ORDERS)}
            >
              Đơn toàn sàn ({masterOrders.length})
            </Button>
            <Button
              variant="primary"
              leftIcon={<BadgeDollarSign size={16} />}
              onClick={() => navigate(ROUTES.ADMIN_REFUNDS)}
            >
              Duyệt hoàn tiền ({pendingRefundsCount})
            </Button>
          </>
        }
      />

      {/* 5-KPI Strip chuẩn đặc tả A1 */}
      <div className="ew-kpi-grid ew-kpi-grid--5">
        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(ROUTES.ADMIN_SELLERS)}
        >
          <span className="ew-kpi-label">Seller chờ duyệt</span>
          <span className="ew-kpi-value ew-kpi-value--warning ks-tabular">
            {pendingSellersQuery.isLoading ? "…" : pendingSellersTotal}
          </span>
          <span className="ew-kpi-sub">Dữ liệu trực tiếp từ API A2</span>
        </button>

        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)}
        >
          <span className="ew-kpi-label">Sản phẩm chờ duyệt</span>
          <span className="ew-kpi-value ew-kpi-value--warning ks-tabular">
            {pendingProductsQuery.isLoading ? "…" : pendingProductsTotal}
          </span>
          <span className="ew-kpi-sub">Dữ liệu trực tiếp từ API A3</span>
        </button>

        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(ROUTES.ADMIN_REFUNDS)}
        >
          <span className="ew-kpi-label">Hoàn tiền chờ xử lý</span>
          <span className="ew-kpi-value ew-kpi-value--danger ks-tabular">
            {pendingRefundsCount}
          </span>
          <span className="ew-kpi-sub">Hàng đợi A6 · xác nhận kép ≥ 5tr₫</span>
        </button>

        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(ROUTES.ADMIN_RETURNS)}
        >
          <span className="ew-kpi-label">Trả hàng đang mở</span>
          <span className="ew-kpi-value ew-kpi-value--primary ks-tabular">
            {openReturnsCount}
          </span>
          <span className="ew-kpi-sub">Toàn sàn (A5)</span>
        </button>

        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(ROUTES.ADMIN_ORDERS)}
        >
          <span className="ew-kpi-label">Đơn trong ngày</span>
          <span className="ew-kpi-value ks-tabular">{todayOrdersCount}</span>
          <span className="ew-kpi-sub">Tổng {masterOrders.length} đơn toàn sàn</span>
        </button>
      </div>

      {/* Quick Access Strip A4–A8 */}
      <div className="ew-quick-grid">
        <button
          type="button"
          className="ew-quick-card"
          onClick={() => navigate(ROUTES.ADMIN_ORDERS)}
        >
          <span className="ew-quick-card__icon">
            <ShoppingBag size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="ew-quick-card__title">Đơn hàng toàn sàn (A4)</div>
            <div className="ew-quick-card__sub">Tra cứu đơn tổng → đơn con → vận đơn</div>
          </div>
        </button>

        <button
          type="button"
          className="ew-quick-card"
          onClick={() => navigate(ROUTES.ADMIN_RETURNS)}
        >
          <span className="ew-quick-card__icon ew-quick-card__icon--warning">
            <RotateCcw size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="ew-quick-card__title">Trả hàng toàn sàn (A5)</div>
            <div className="ew-quick-card__sub">Can thiệp duyệt / từ chối thay Seller</div>
          </div>
        </button>

        <button
          type="button"
          className="ew-quick-card"
          onClick={() => navigate(ROUTES.ADMIN_USERS)}
        >
          <span className="ew-quick-card__icon ew-quick-card__icon--info">
            <Users size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="ew-quick-card__title">Người dùng &amp; RBAC (A7)</div>
            <div className="ew-quick-card__sub">Admin, WarehouseManager, Seller, Customer</div>
          </div>
        </button>

        <button
          type="button"
          className="ew-quick-card"
          onClick={() => navigate(ROUTES.ADMIN_CATEGORIES)}
        >
          <span className="ew-quick-card__icon">
            <FolderTree size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="ew-quick-card__title">Cây danh mục (A8)</div>
            <div className="ew-quick-card__sub">Đọc trực tiếp từ API GET /categories</div>
          </div>
        </button>
      </div>

      {/* 2 Real-API Moderation Queues */}
      <div className="ew-split-2">
        <div className="ew-card">
          <div className="ew-card-head">
            <h2 className="ew-card-title">
              <Store size={17} color="var(--color-primary)" aria-hidden="true" />
              <span>Hồ sơ Seller chờ duyệt (A2 · API thật)</span>
            </h2>
            <Link to={ROUTES.ADMIN_SELLERS} className="ew-back-link" style={{ marginBottom: 0 }}>
              <span>Mở danh sách</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="ew-card-body">
            {pendingSellersQuery.isLoading ? (
              <Skeleton lines={3} height={20} />
            ) : (pendingSellersQuery.data?.items.length ?? 0) === 0 ? (
              <p style={{ fontSize: "0.86rem", color: "var(--color-muted)" }}>
                Hiện không có hồ sơ Seller nào đang chờ duyệt.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pendingSellersQuery.data?.items.map((seller) => (
                  <div key={seller.sellerId} className="ew-line-item">
                    <div>
                      <div className="ew-line-item__title">{seller.businessName}</div>
                      <div className="ew-line-item__meta ks-tabular">
                        <span>MST: {seller.taxCode || "—"}</span>
                        <span>·</span>
                        <span>Đăng ký {formatDate(seller.createdAt)}</span>
                      </div>
                    </div>
                    <StatusBadge status={seller.status} domain="seller" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ew-card">
          <div className="ew-card-head">
            <h2 className="ew-card-title">
              <PackageCheck size={17} color="var(--color-primary)" aria-hidden="true" />
              <span>Sản phẩm chờ duyệt (A3 · API thật)</span>
            </h2>
            <Link to={ROUTES.ADMIN_PRODUCTS} className="ew-back-link" style={{ marginBottom: 0 }}>
              <span>Mở hàng đợi</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="ew-card-body">
            {pendingProductsQuery.isLoading ? (
              <Skeleton lines={3} height={20} />
            ) : (pendingProductsQuery.data?.items.length ?? 0) === 0 ? (
              <p style={{ fontSize: "0.86rem", color: "var(--color-muted)" }}>
                Hiện không có sản phẩm nào đang chờ duyệt.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pendingProductsQuery.data?.items.map((p) => (
                  <div key={p.productId} className="ew-line-item">
                    <div>
                      <div className="ew-line-item__title">{p.productName}</div>
                      <div className="ew-line-item__meta">
                        <span>{p.shopName}</span>
                        <span>·</span>
                        <span>{p.categoryName}</span>
                      </div>
                    </div>
                    <StatusBadge status={p.productStatus} domain="product" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
