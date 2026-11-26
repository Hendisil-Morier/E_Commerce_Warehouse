import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  History,
  MapPin,
  Package,
  Truck,
  Warehouse,
  XCircle,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { ReasonActionModal } from "@/components/common/ReasonActionModal";
import { StatusTimeline } from "@/components/common/StatusTimeline";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { useToast } from "@/hooks/useToast";
import { useOperationsStore } from "@/services/operationsStore";
import { useAuthStore } from "@/stores/authStore";
import { PAYMENT_METHOD_LABELS } from "@/types/operations";
import { formatCurrency, formatDate } from "@/utils/formatters";

export const SellerOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);

  const sellerOrders = useOperationsStore((s) => s.sellerOrders);
  const confirmSellerOrder = useOperationsStore((s) => s.confirmSellerOrder);
  const cancelSellerOrder = useOperationsStore((s) => s.cancelSellerOrder);

  const [modalMode, setModalMode] = useState<"CONFIRM" | "CANCEL" | null>(null);

  const orderId = Number(id);
  const order = sellerOrders.find((o) => o.sellerOrderId === orderId);

  if (!order) {
    return (
      <div className="ew-card">
        <EmptyState
          icon={<Package size={28} />}
          title="Không tìm thấy đơn con"
          description={`Đơn con mã #${id ?? ""} không tồn tại hoặc không thuộc shop của bạn.`}
          action={
            <Button variant="primary" onClick={() => navigate(ROUTES.SELLER_ORDERS)}>
              Quay lại danh sách đơn hàng
            </Button>
          }
        />
      </div>
    );
  }

  const canConfirm = order.status === "Pending";
  const canCancel = !["Shipped", "Delivered", "Cancelled", "Returned"].includes(order.status);

  const handleAction = async (reason: string) => {
    const actor = currentUser?.fullName || "Người bán";
    const result =
      modalMode === "CONFIRM"
        ? confirmSellerOrder(order.sellerOrderId, actor)
        : cancelSellerOrder(order.sellerOrderId, reason, actor);

    if (result.ok) {
      toast.success(result.message);
      setModalMode(null);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <section>
      <Link to={ROUTES.SELLER_ORDERS} className="ew-back-link">
        <ArrowLeft size={15} aria-hidden="true" />
        <span>Quay lại Danh sách đơn hàng (S5)</span>
      </Link>

      <PageHeader
        title={`Đơn con #${order.sellerOrderCode}`}
        subtitle={`Đơn tổng: ${order.orderCode} · Đặt lúc ${formatDate(order.createdAt)} · Kho xuất: ${order.warehouseName}`}
        badge={<StatusBadge status={order.status} domain="sellerOrder" size="md" />}
        actions={
          <>
            {canCancel && (
              <Button
                variant="danger"
                leftIcon={<XCircle size={16} />}
                onClick={() => setModalMode("CANCEL")}
              >
                Hủy đơn con
              </Button>
            )}
            {canConfirm && (
              <Button
                variant="primary"
                leftIcon={<CheckCircle2 size={16} />}
                onClick={() => setModalMode("CONFIRM")}
              >
                Xác nhận đơn
              </Button>
            )}
          </>
        }
      />

      <MockDataNotice endpointHint="GET /api/v1/seller/orders/{id} · POST .../confirm | .../cancel" />

      {order.cancelReason && (
        <div className="ew-notice ew-notice--danger" style={{ marginBottom: "18px" }}>
          <div className="ew-notice__head">Lý do hủy đơn con</div>
          <div>{order.cancelReason}</div>
        </div>
      )}

      <div className="ew-split-detail">
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Dòng hàng (OrderItems snapshot) */}
          <div className="ew-card">
            <div className="ew-card-head">
              <h2 className="ew-card-title">
                <Package size={17} color="var(--color-primary)" aria-hidden="true" />
                <span>Dòng hàng (Bản chụp lúc đặt · {order.items.length})</span>
              </h2>
              <span className="ew-chip ew-chip--sellable">
                <Warehouse size={13} aria-hidden="true" />
                <span>{order.warehouseName}</span>
              </span>
            </div>
            <div className="ew-table-scroll">
              <table className="ew-table">
                <thead>
                  <tr>
                    <th>Sản phẩm / SKU bản chụp</th>
                    <th className="ew-table__cell--right">Đơn giá chụp</th>
                    <th className="ew-table__cell--center">Số lượng</th>
                    <th className="ew-table__cell--right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.orderItemId}>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                          {item.productNameSnapshot}
                        </div>
                        <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                          SKU: {item.skuSnapshot} · {item.variantName}
                        </div>
                      </td>
                      <td className="ew-table__cell--right ks-tabular">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="ew-table__cell--center ks-tabular" style={{ fontWeight: 700 }}>
                        x{item.quantity}
                      </td>
                      <td className="ew-table__cell--right ks-tabular" style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Thông tin khách hàng & Địa chỉ giao bản chụp */}
          <div className="ew-card">
            <div className="ew-card-head">
              <h2 className="ew-card-title">
                <MapPin size={17} color="var(--color-primary)" aria-hidden="true" />
                <span>Người nhận &amp; Địa chỉ giao hàng (Bản chụp)</span>
              </h2>
            </div>
            <div className="ew-card-body">
              <div className="ew-info-list">
                <div className="ew-info-row">
                  <span className="ew-info-key">Khách đặt hàng</span>
                  <span className="ew-info-val">{order.customerName}</span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Người nhận &amp; SĐT</span>
                  <span className="ew-info-val ks-tabular">
                    {order.recipientName} · {order.recipientPhone}
                  </span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Địa chỉ giao hàng</span>
                  <span className="ew-info-val">{order.shippingAddress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dòng thời gian trạng thái (OrderStatusHistory) */}
          <div className="ew-card">
            <div className="ew-card-head">
              <h2 className="ew-card-title">
                <History size={17} color="var(--color-primary)" aria-hidden="true" />
                <span>Dòng thời gian trạng thái (OrderStatusHistory)</span>
              </h2>
            </div>
            <div className="ew-card-body">
              <StatusTimeline items={order.statusHistory} domain="sellerOrder" />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Thanh toán */}
          <div className="ew-card">
            <div className="ew-card-head">
              <h2 className="ew-card-title">
                <CreditCard size={17} color="var(--color-primary)" aria-hidden="true" />
                <span>Thanh toán &amp; Giá trị đơn con</span>
              </h2>
            </div>
            <div className="ew-card-body">
              <div className="ew-info-list">
                <div className="ew-info-row">
                  <span className="ew-info-key">Phương thức</span>
                  <span className="ew-info-val">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Trạng thái thanh toán</span>
                  <StatusBadge status={order.paymentStatus} />
                </div>
                <div
                  className="ew-info-row ks-tabular"
                  style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px", marginTop: "4px" }}
                >
                  <strong style={{ color: "var(--color-dark)" }}>Tổng tiền hàng (Subtotal)</strong>
                  <strong style={{ color: "var(--color-primary)", fontSize: "1.2rem" }}>
                    {formatCurrency(order.subtotal)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Vận đơn (Shipments) */}
          <div className="ew-card">
            <div className="ew-card-head">
              <h2 className="ew-card-title">
                <Truck size={17} color="var(--color-primary)" aria-hidden="true" />
                <span>Thông tin vận đơn (Shipments)</span>
              </h2>
            </div>
            <div className="ew-card-body">
              {order.shipment ? (
                <div className="ew-info-list">
                  <div className="ew-info-row">
                    <span className="ew-info-key">Hãng vận chuyển</span>
                    <span className="ew-info-val">
                      {order.shipment.carrierName} ({order.shipment.carrierCode})
                    </span>
                  </div>
                  <div className="ew-info-row">
                    <span className="ew-info-key">Mã vận đơn</span>
                    <span className="ew-info-val ks-tabular">{order.shipment.trackingNumber}</span>
                  </div>
                  <div className="ew-info-row">
                    <span className="ew-info-key">Trạng thái giao</span>
                    <StatusBadge status={order.shipment.shippingStatus} domain="shipment" />
                  </div>
                  <div className="ew-info-row">
                    <span className="ew-info-key">Thu hộ COD</span>
                    <span className="ew-info-val ks-tabular">
                      {formatCurrency(order.shipment.codAmount)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="ew-notice ew-notice--info">
                  Các bước soạn hàng, đóng gói, xuất kho và tạo vận đơn sẽ do <strong>Kho sàn Hà Nội (WMS)</strong> thực hiện sau khi bạn xác nhận đơn.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReasonActionModal
        isOpen={Boolean(modalMode)}
        title={
          modalMode === "CONFIRM"
            ? "Xác nhận đơn con"
            : "Hủy đơn con của shop"
        }
        description={
          modalMode === "CONFIRM"
            ? `Xác nhận đơn con #${order.sellerOrderCode} (${formatCurrency(order.subtotal)}). Đơn sẽ chuyển sang Đã xác nhận (Confirmed) để Kho sàn soạn hàng.`
            : `Hủy đơn con #${order.sellerOrderCode}. Tồn kho đang giữ chỗ tại Kho sàn sẽ được nhả tự động.`
        }
        confirmLabel={modalMode === "CONFIRM" ? "Xác nhận đơn" : "Xác nhận hủy"}
        tone={modalMode === "CONFIRM" ? "primary" : "danger"}
        requireReason={modalMode === "CANCEL"}
        reasonLabel="Lý do hủy đơn con (CancelReason)"
        onConfirm={handleAction}
        onClose={() => setModalMode(null)}
      />
    </section>
  );
};
