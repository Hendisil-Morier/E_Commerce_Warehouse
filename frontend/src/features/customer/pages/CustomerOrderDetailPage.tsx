import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard, MapPin, Store, XCircle } from "lucide-react";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";
import { ROUTES } from "@/constants/routes";
import {
  useCancelOrderMutation,
  useMyOrderDetail,
  usePayOrderMutation,
} from "@/features/customer/hooks/useOrders";
import { useToast } from "@/hooks/useToast";
import type { PaymentMethod } from "@/types/order";
import { getErrorMessage } from "@/utils/errorHandler";
import { formatCurrency, formatDate } from "@/utils/formatters";

export const CustomerOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const toast = useToast();

  const { data: order, isLoading, isError, refetch } = useMyOrderDetail(
    Number.isFinite(orderId) ? orderId : null
  );
  const cancelMutation = useCancelOrderMutation();
  const payMutation = usePayOrderMutation();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  if (isLoading) {
    return (
      <div className="ew-card" style={{ padding: "24px" }}>
        <Skeleton lines={6} height={24} gap={14} />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <ErrorState
        title="Không tìm thấy đơn hàng"
        message="Đơn hàng không tồn tại hoặc bạn không có quyền xem."
        onRetry={() => void refetch()}
      />
    );
  }

  const canPay = order.orderStatus === "PendingPayment";
  const canCancel =
    order.orderStatus !== "Cancelled" &&
    order.orderStatus !== "Expired" &&
    order.orderStatus !== "Completed" &&
    !order.sellerOrders.some((so) =>
      ["Shipped", "Delivered"].includes(so.status)
    );

  const handlePay = async () => {
    const method = (order.payments[0]?.paymentMethod as PaymentMethod | undefined) ?? "BankTransfer";
    try {
      await payMutation.mutateAsync({
        orderId: order.orderId,
        payload: { paymentMethod: method },
      });
      toast.success("Thanh toán đơn hàng thành công!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy đơn.");
      return;
    }
    try {
      await cancelMutation.mutateAsync({
        orderId: order.orderId,
        payload: { reason: cancelReason.trim() },
      });
      toast.success("Đã hủy đơn hàng và giải phóng tồn kho giữ chỗ.");
      setShowCancelModal(false);
      setCancelReason("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link to={ROUTES.ORDERS}>
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft size={15} />}>
              Quay lại
            </Button>
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ margin: 0, fontSize: "20px" }}>{order.orderCode}</h1>
              <StatusBadge status={order.orderStatus} />
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>
              Đặt lúc {formatDate(order.createdAt)}
              {order.expiresAt && order.orderStatus === "PendingPayment" && (
                <> • Hết hạn giữ chỗ lúc {formatDate(order.expiresAt)}</>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {canPay && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<CreditCard size={16} />}
              loading={payMutation.isPending}
              onClick={() => void handlePay()}
            >
              Thanh toán ngay
            </Button>
          )}
          {canCancel && (
            <Button
              variant="danger"
              size="md"
              leftIcon={<XCircle size={16} />}
              onClick={() => setShowCancelModal(true)}
            >
              Hủy đơn hàng
            </Button>
          )}
        </div>
      </div>

      {/* Địa chỉ & Tổng tiền */}
      <div className="ew-card" style={{ padding: "18px 20px", display: "grid", gridTemplateColumns: "1fr auto", gap: "20px" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <MapPin size={16} /> Thông tin giao hàng
          </div>
          <div style={{ fontSize: "14px", fontWeight: 500 }}>
            {order.recipientName} • {order.recipientPhone}
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-muted)", marginTop: "2px" }}>
            {order.shippingStreetAddress}, {order.shippingWard}, {order.shippingDistrict}, {order.shippingProvince}
          </div>
          {order.note && (
            <div style={{ fontSize: "13px", color: "var(--color-muted)", marginTop: "6px" }}>
              Ghi chú: {order.note}
            </div>
          )}
          {order.cancelReason && (
            <div style={{ fontSize: "13px", color: "#dc2626", marginTop: "6px" }}>
              Lý do hủy: {order.cancelReason}
            </div>
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>Tổng thanh toán</div>
          <div className="ks-tabular" style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-primary)" }}>
            {formatCurrency(order.totalAmount)}
          </div>
          {order.payments[0] && (
            <div style={{ marginTop: "6px", display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center", fontSize: "12px" }}>
              <span>{order.payments[0].paymentMethod}</span>
              <StatusBadge status={order.payments[0].paymentStatus} />
            </div>
          )}
        </div>
      </div>

      {/* Đơn con theo từng Shop */}
      {order.sellerOrders.map((so) => (
        <div key={so.sellerOrderId} className="ks-cart-shop-card">
          <div className="ks-cart-shop-head">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
              <Store size={16} /> {so.sellerBusinessName}
            </div>
            <StatusBadge status={so.status} />
          </div>
          <div style={{ padding: "8px 18px" }}>
            {so.items.map((item) => (
              <div
                key={item.orderItemId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>{item.productName}</div>
                  <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                    SKU: {item.sku} • SL: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </div>
                </div>
                <strong className="ks-tabular">{formatCurrency(item.lineTotal)}</strong>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0", fontSize: "14px" }}>
              <span>
                Tạm tính shop: <strong className="ks-tabular">{formatCurrency(so.subtotal)}</strong>
              </span>
            </div>
          </div>
        </div>
      ))}

      <Modal
        open={showCancelModal}
        title="Xác nhận hủy đơn hàng"
        onClose={() => setShowCancelModal(false)}
      >
        <form onSubmit={(e) => void handleCancel(e)} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <FormField label="Lý do hủy đơn" required>
            <Textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ví dụ: Đổi ý, muốn đổi địa chỉ giao hàng..."
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Button type="button" variant="secondary" onClick={() => setShowCancelModal(false)}>
              Đóng
            </Button>
            <Button type="submit" variant="danger" loading={cancelMutation.isPending}>
              Xác nhận hủy
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
