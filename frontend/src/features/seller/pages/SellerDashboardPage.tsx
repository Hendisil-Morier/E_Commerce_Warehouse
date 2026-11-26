import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  Package,
  Plus,
  RotateCcw,
  ShoppingBag,
  Store,
  UserCog,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import {
  useSellerProductsQuery,
  useSellerShopsQuery,
} from "@/features/seller/hooks/useSellerCatalog";
import { useMySeller } from "@/features/seller/hooks/useSellerRegistration";
import { useOperationsStore } from "@/services/operationsStore";
import { formatCurrency, formatDate } from "@/utils/formatters";

export const SellerDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // API thật từ Backend
  const sellerQuery = useMySeller();
  const shopsQuery = useSellerShopsQuery();
  const pendingProductsQuery = useSellerProductsQuery({
    status: "PendingReview",
    page: 1,
    pageSize: 5,
  });
  const rejectedProductsQuery = useSellerProductsQuery({
    status: "Rejected",
    page: 1,
    pageSize: 5,
  });

  // Dữ liệu mô phỏng chuẩn CSDL cho các module chờ BE (Orders, Inventory, Returns)
  const sellerOrders = useOperationsStore((s) => s.sellerOrders);
  const inventory = useOperationsStore((s) => s.inventory);
  const returns = useOperationsStore((s) => s.returns);

  const myOrders = sellerOrders.filter((o) => o.sellerId === 1);
  const pendingConfirmCount = myOrders.filter((o) => o.status === "Pending").length;
  const preparingCount = myOrders.filter(
    (o) => o.status === "Confirmed" || o.status === "Preparing" || o.status === "ReadyToShip"
  ).length;
  const lowStockCount = inventory.filter(
    (i) => i.sellerId === 1 && i.availableQuantity <= i.lowStockThreshold
  ).length;
  const requestedReturnsCount = returns.filter(
    (r) => r.sellerId === 1 && r.status === "Requested"
  ).length;

  const pendingProductsTotal = pendingProductsQuery.data?.totalItems ?? 0;
  const rejectedProductsTotal = rejectedProductsQuery.data?.totalItems ?? 0;
  const activeShopsCount = (shopsQuery.data ?? []).filter((s) => s.isActive).length;

  const sellerProfile = sellerQuery.data;

  const todoItems = [
    {
      id: "todo-orders",
      label: "Đơn con chờ xác nhận",
      count: pendingConfirmCount,
      hint: "Xác nhận kịp thời để Kho sàn tiến hành soạn hàng",
      to: `${ROUTES.SELLER_ORDERS}?status=Pending`,
      tone: pendingConfirmCount > 0 ? "warning" : "success",
    },
    {
      id: "todo-rejected",
      label: "Sản phẩm bị từ chối cần chỉnh sửa",
      count: rejectedProductsTotal,
      hint: "Xem lý do từ chối của Admin và gửi duyệt lại",
      to: `${ROUTES.SELLER_PRODUCTS}?status=Rejected`,
      tone: rejectedProductsTotal > 0 ? "danger" : "success",
    },
    {
      id: "todo-returns",
      label: "Yêu cầu trả hàng chờ phản hồi",
      count: requestedReturnsCount,
      hint: "Duyệt hoặc từ chối (kèm lý do) trước khi Kho nhận hàng hoàn",
      to: `${ROUTES.SELLER_RETURNS}?status=Requested`,
      tone: requestedReturnsCount > 0 ? "warning" : "success",
    },
    {
      id: "todo-lowstock",
      label: "Biến thể sắp hết hàng tại Kho sàn",
      count: lowStockCount,
      hint: "Theo dõi tồn khả dụng để chủ động bổ sung hàng vào Kho sàn",
      to: ROUTES.SELLER_INVENTORY,
      tone: lowStockCount > 0 ? "warning" : "success",
    },
  ];

  return (
    <section>
      <PageHeader
        title={`Tổng quan Kênh Người bán${
          sellerProfile?.businessName ? ` · ${sellerProfile.businessName}` : ""
        }`}
        subtitle="Theo dõi đơn con chờ xác nhận, tiến độ duyệt sản phẩm, tồn kho tại Kho sàn và yêu cầu trả hàng."
        badge={
          sellerProfile ? (
            <StatusBadge status={sellerProfile.status} domain="seller" size="md" />
          ) : undefined
        }
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<ShoppingBag size={16} />}
              onClick={() => navigate(ROUTES.SELLER_ORDERS)}
            >
              Đơn hàng ({pendingConfirmCount} chờ)
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => navigate(ROUTES.SELLER_PRODUCT_NEW)}
            >
              Thêm sản phẩm
            </Button>
          </>
        }
      />

      {/* 5-Column KPI Strip (chuẩn đặc tả S1) */}
      <div className="ew-kpi-grid ew-kpi-grid--5" aria-label="Chỉ số vận hành Kênh người bán">
        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(`${ROUTES.SELLER_ORDERS}?status=Pending`)}
        >
          <span className="ew-kpi-label">Đơn chờ xác nhận</span>
          <span className="ew-kpi-value ew-kpi-value--warning ks-tabular">
            {pendingConfirmCount}
          </span>
          <span className="ew-kpi-sub">Trạng thái Pending · cần xử lý</span>
        </button>

        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(`${ROUTES.SELLER_ORDERS}?status=Preparing`)}
        >
          <span className="ew-kpi-label">Đơn đang chuẩn bị</span>
          <span className="ew-kpi-value ew-kpi-value--primary ks-tabular">
            {preparingCount}
          </span>
          <span className="ew-kpi-sub">Confirmed / Preparing / ReadyToShip</span>
        </button>

        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(`${ROUTES.SELLER_PRODUCTS}?status=PendingReview`)}
        >
          <span className="ew-kpi-label">SP chờ Admin duyệt</span>
          <span className="ew-kpi-value ks-tabular">
            {pendingProductsQuery.isLoading ? "…" : pendingProductsTotal}
          </span>
          <span className="ew-kpi-sub">Dữ liệu trực tiếp từ API Catalog</span>
        </button>

        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(`${ROUTES.SELLER_PRODUCTS}?status=Rejected`)}
        >
          <span className="ew-kpi-label">SP bị từ chối</span>
          <span
            className={`ew-kpi-value ks-tabular ${
              rejectedProductsTotal > 0 ? "ew-kpi-value--danger" : ""
            }`}
          >
            {rejectedProductsQuery.isLoading ? "…" : rejectedProductsTotal}
          </span>
          <span className="ew-kpi-sub">Cần sửa và gửi duyệt lại</span>
        </button>

        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(ROUTES.SELLER_INVENTORY)}
        >
          <span className="ew-kpi-label">Biến thể sắp hết hàng</span>
          <span
            className={`ew-kpi-value ks-tabular ${
              lowStockCount > 0 ? "ew-kpi-value--warning" : ""
            }`}
          >
            {lowStockCount}
          </span>
          <span className="ew-kpi-sub">Tại Kho sàn Hà Nội</span>
        </button>
      </div>

      {/* Quick Access Strip */}
      <div className="ew-quick-grid" aria-label="Lối tắt nghiệp vụ Kênh người bán">
        <button
          type="button"
          className="ew-quick-card"
          onClick={() => navigate(ROUTES.SELLER_SHOPS)}
        >
          <span className="ew-quick-card__icon">
            <Store size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="ew-quick-card__title">Quản lý Gian hàng (S2)</div>
            <div className="ew-quick-card__sub">
              {shopsQuery.isLoading ? "Đang tải..." : `${activeShopsCount} gian hàng đang hoạt động`}
            </div>
          </div>
        </button>

        <button
          type="button"
          className="ew-quick-card"
          onClick={() => navigate(ROUTES.SELLER_ORDERS)}
        >
          <span className="ew-quick-card__icon">
            <ShoppingBag size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="ew-quick-card__title">Đơn hàng của Shop (S5)</div>
            <div className="ew-quick-card__sub">
              {myOrders.length} đơn con · xác nhận &amp; theo dõi vận đơn
            </div>
          </div>
        </button>

        <button
          type="button"
          className="ew-quick-card"
          onClick={() => navigate(ROUTES.SELLER_RETURNS)}
        >
          <span className="ew-quick-card__icon ew-quick-card__icon--warning">
            <RotateCcw size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="ew-quick-card__title">Yêu cầu trả hàng (S8)</div>
            <div className="ew-quick-card__sub">
              {requestedReturnsCount} yêu cầu đang chờ Shop duyệt
            </div>
          </div>
        </button>

        <button
          type="button"
          className="ew-quick-card"
          onClick={() => navigate(ROUTES.SELLER_PROFILE)}
        >
          <span className="ew-quick-card__icon ew-quick-card__icon--info">
            <UserCog size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="ew-quick-card__title">Hồ sơ Người bán (S9)</div>
            <div className="ew-quick-card__sub">
              Hoa hồng sàn {sellerProfile?.commissionRate ?? 5}% · thông tin doanh nghiệp
            </div>
          </div>
        </button>
      </div>

      {/* 2-Column Operational Summary */}
      <div className="ew-split-2">
        {/* Left: Danh sách việc cần làm */}
        <div className="ew-card">
          <div className="ew-card-head">
            <h2 className="ew-card-title">
              <Clock size={17} color="var(--color-primary)" aria-hidden="true" />
              <span>Việc cần làm ngay</span>
            </h2>
          </div>
          <div className="ew-card-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {todoItems.map((todo) => (
              <Link
                key={todo.id}
                to={todo.to}
                className="ew-line-item"
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>
                  {todo.count > 0 ? (
                    <AlertTriangle
                      size={17}
                      color={todo.tone === "danger" ? "var(--color-danger)" : "var(--color-warning)"}
                      style={{ flexShrink: 0, marginTop: "2px" }}
                      aria-hidden="true"
                    />
                  ) : (
                    <CheckCircle2
                      size={17}
                      color="var(--color-primary)"
                      style={{ flexShrink: 0, marginTop: "2px" }}
                      aria-hidden="true"
                    />
                  )}
                  <div>
                    <div className="ew-line-item__title">{todo.label}</div>
                    <div className="ew-line-item__meta">{todo.hint}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <strong className="ks-tabular" style={{ fontSize: "1.1rem", color: "var(--color-dark)" }}>
                    {todo.count}
                  </strong>
                  <ArrowRight size={15} color="var(--color-muted)" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Đơn con gần đây + Sản phẩm chờ duyệt (API thật) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="ew-card">
            <div className="ew-card-head">
              <h2 className="ew-card-title">
                <ShoppingBag size={17} color="var(--color-primary)" aria-hidden="true" />
                <span>Đơn hàng mới nhất</span>
              </h2>
              <Link to={ROUTES.SELLER_ORDERS} className="ew-back-link" style={{ marginBottom: 0 }}>
                <span>Xem tất cả</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <div className="ew-table-scroll">
              <table className="ew-table">
                <thead>
                  <tr>
                    <th>Mã đơn con</th>
                    <th>Khách hàng</th>
                    <th className="ew-table__cell--right">Tổng tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {myOrders.slice(0, 4).map((ord) => (
                    <tr
                      key={ord.sellerOrderId}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/seller/orders/${ord.sellerOrderId}`)}
                    >
                      <td className="ks-tabular" style={{ fontWeight: 700 }}>
                        {ord.sellerOrderCode}
                      </td>
                      <td>{ord.customerName}</td>
                      <td className="ew-table__cell--right ks-tabular" style={{ fontWeight: 700 }}>
                        {formatCurrency(ord.subtotal)}
                      </td>
                      <td>
                        <StatusBadge status={ord.status} domain="sellerOrder" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ew-card">
            <div className="ew-card-head">
              <h2 className="ew-card-title">
                <Package size={17} color="var(--color-primary)" aria-hidden="true" />
                <span>Sản phẩm chờ duyệt (API thật)</span>
              </h2>
              <Link to={ROUTES.SELLER_PRODUCTS} className="ew-back-link" style={{ marginBottom: 0 }}>
                <span>Quản lý sản phẩm</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <div className="ew-card-body">
              {pendingProductsQuery.isLoading ? (
                <Skeleton lines={3} height={18} />
              ) : (pendingProductsQuery.data?.items.length ?? 0) === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.86rem", color: "var(--color-muted)" }}>
                  <Boxes size={16} aria-hidden="true" />
                  <span>Không có sản phẩm nào đang chờ Admin kiểm duyệt.</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {pendingProductsQuery.data?.items.map((p) => (
                    <div key={p.productId} className="ew-line-item">
                      <div>
                        <div className="ew-line-item__title">{p.productName}</div>
                        <div className="ew-line-item__meta">
                          <span>{p.shopName}</span>
                          <span>·</span>
                          <span>Cập nhật {formatDate(p.updatedAt)}</span>
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
      </div>
    </section>
  );
};
