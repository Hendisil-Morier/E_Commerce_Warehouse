import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Package, Search, ShoppingCart, X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ROUTES } from "@/constants/routes";

/**
 * Các tab trạng thái đơn tổng bám sát bảng `Orders.OrderStatus` trong CSDL:
 * PendingPayment -> Confirmed -> Processing -> PartiallyShipped/Shipped -> Completed / Cancelled
 */
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

  return (
    <div>
      <div className="ew-page-header" style={{ marginBottom: "18px" }}>
        <div>
          <h1 className="ew-page-header__title">Đơn hàng của tôi</h1>
          <p className="ew-page-header__subtitle">
            Theo dõi trạng thái đơn tổng, từng đơn con theo shop, hành trình vận đơn và yêu
            cầu trả hàng.
          </p>
        </div>
      </div>

      {/* Status Tabs matching DB Orders.OrderStatus */}
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
            onClick={() => setActiveStatus(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
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
            placeholder="Tìm theo mã đơn hàng, mã vận đơn, tên sản phẩm hoặc gian hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <span className="ew-control__addon-right">
              <button
                type="button"
                className="ew-icon-btn"
                aria-label="Xóa từ khóa tìm kiếm"
                onClick={() => setSearchQuery("")}
              >
                <X size={15} />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Clean Empty State — Honest about upcoming BE Orders API */}
      <div className="ew-card">
        <EmptyState
          icon={<Package size={28} />}
          title="Chưa có đơn hàng nào trong tài khoản"
          description="Khi Backend hoàn thiện module Đặt hàng & Đơn hàng (GET /api/v1/orders), toàn bộ đơn tổng, đơn con theo từng shop và hành trình vận đơn sẽ hiển thị tự động tại đây."
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
    </div>
  );
};
