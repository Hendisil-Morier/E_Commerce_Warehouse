import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Package, Search, ShoppingCart, X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { useMyOrders } from "@/features/customer/hooks/useOrders";
import { formatCurrency, formatDate } from "@/utils/formatters";

const ORDER_STATUS_TABS = [
  { value: "ALL", label: "Tất cả" },
  { value: "PendingPayment", label: "Chờ thanh toán" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "Processing", label: "Đang xử lý" },
  { value: "Shipped", label: "Đang giao" },
  { value: "Completed", label: "Hoàn thành" },
  { value: "Cancelled", label: "Đã hủy" },
] as const;

export const CustomerOrdersPage: React.FC = () => {
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const { data, isLoading, isError, refetch } = useMyOrders({
    status: activeStatus === "ALL" ? undefined : activeStatus,
    search: searchQuery.trim() || undefined,
    page,
    pageSize: 10,
  });

  const orders = data?.items ?? [];

  return (
    <div>
      <div className="ew-page-header" style={{ marginBottom: "18px" }}>
        <div>
          <h1 className="ew-page-header__title">Đơn hàng của tôi</h1>
          <p className="ew-page-header__subtitle">
            Theo dõi trạng thái đơn tổng, từng đơn con theo shop, thanh toán và hủy đơn.
          </p>
        </div>
      </div>

      <div className="ks-tabs-bar" role="tablist" aria-label="Lọc đơn hàng theo trạng thái">
        {ORDER_STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeStatus === tab.value}
            className={`ks-tab-btn ${
              activeStatus === tab.value ? "ks-tab-btn--active" : ""
            }`}
            onClick={() => {
              setActiveStatus(tab.value);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <div className="ew-control-wrap">
          <label
            htmlFor="customer-order-search"
            style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden" }}
          >
            Tìm kiếm đơn hàng
          </label>
          <span className="ew-control__addon-left">
            <Search size={17} aria-hidden="true" />
          </span>
          <input
            id="customer-order-search"
            type="text"
            className="ew-control ew-control--has-left ew-control--has-right"
            placeholder="Tìm theo mã đơn hàng..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
          {searchQuery && (
            <span className="ew-control__addon-right">
              <button
                type="button"
                className="ew-icon-btn"
                aria-label="Xóa từ khóa tìm kiếm"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
              >
                <X size={15} />
              </button>
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="ew-card" style={{ padding: "20px" }}>
          <Skeleton lines={5} height={24} gap={12} />
        </div>
      ) : isError ? (
        <ErrorState
          title="Không tải được danh sách đơn hàng"
          message="Vui lòng thử lại sau."
          onRetry={() => void refetch()}
        />
      ) : orders.length === 0 ? (
        <div className="ew-card">
          <EmptyState
            icon={<Package size={28} />}
            title="Chưa có đơn hàng nào phù hợp"
            description="Hãy khám phá sản phẩm hoặc kiểm tra giỏ hàng để tạo đơn hàng mới."
            action={
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <Link to={ROUTES.PRODUCTS} className="ew-btn ew-btn--primary ew-btn--md">
                  Khám phá sản phẩm
                </Link>
                <Link to={ROUTES.CART} className="ew-btn ew-btn--secondary ew-btn--md">
                  <ShoppingCart size={15} aria-hidden="true" />
                  <span>Xem giỏ hàng</span>
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {orders.map((order) => (
            <Link
              key={order.orderId}
              to={`/orders/${order.orderId}`}
              className="ew-card"
              style={{
                padding: "16px 20px",
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <strong style={{ fontSize: "15px" }}>{order.orderCode}</strong>
                  <StatusBadge status={order.orderStatus} />
                  <StatusBadge status={order.paymentStatus} />
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>
                  {formatDate(order.createdAt)} • {order.sellerOrderCount} shop •{" "}
                  {order.totalItemCount} sản phẩm • {order.paymentMethod}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>Tổng thanh toán</div>
                  <strong className="ks-tabular" style={{ fontSize: "16px", color: "var(--color-primary)" }}>
                    {formatCurrency(order.totalAmount)}
                  </strong>
                </div>
                <ChevronRight size={18} color="var(--color-muted)" />
              </div>
            </Link>
          ))}

          {data && data.totalPages > 1 && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              totalItems={data.totalCount}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
};
