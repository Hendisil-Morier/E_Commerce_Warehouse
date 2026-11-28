import React, { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  MapPin,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/hooks/useToast";
import type { OrderDetailDto, OrderSellerOrderDto } from "@/types/order";
import { formatDate } from "@/utils/formatters";
import { OrderTrackingMap } from "./OrderTrackingMap";

interface OrderTrackingSectionProps {
  order: OrderDetailDto;
}

interface TimelineEntry {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  time: string;
  isLatest?: boolean;
}

const STEP_LABELS = [
  { key: "placed", label: "Đơn hàng đã đặt", icon: Package },
  { key: "confirmed", label: "Đã xác nhận", icon: CheckCircle2 },
  { key: "preparing", label: "Kho đang đóng gói", icon: Clock },
  { key: "shipping", label: "Đang giao hàng", icon: Truck },
  { key: "completed", label: "Hoàn thành", icon: Check },
] as const;

function resolveStepIndex(orderStatus: string, sellerOrder?: OrderSellerOrderDto): number {
  const soStatus = sellerOrder?.status ?? orderStatus;
  const shipStatus = sellerOrder?.shipment?.shippingStatus;

  if (shipStatus === "Delivered" || soStatus === "Delivered" || orderStatus === "Completed") {
    return 4;
  }
  if (
    shipStatus === "InTransit" ||
    shipStatus === "PickedUp" ||
    soStatus === "Shipped" ||
    orderStatus === "Shipped"
  ) {
    return 3;
  }
  if (
    soStatus === "Processing" ||
    soStatus === "ReadyToShip" ||
    orderStatus === "Processing" ||
    shipStatus === "Preparing"
  ) {
    return 2;
  }
  if (soStatus === "Confirmed" || orderStatus === "Confirmed") {
    return 1;
  }
  return 0;
}

const STATUS_VI_MAP: Record<string, string> = {
  PendingPayment: "Chờ thanh toán",
  Pending: "Đơn hàng đã được đặt",
  Confirmed: "Đơn hàng đã được xác nhận",
  Processing: "Kho đang soạn & đóng gói hàng",
  ReadyToShip: "Đơn hàng đã đóng gói, sẵn sàng bàn giao ĐVVC",
  Shipped: "Đã bàn giao cho đơn vị vận chuyển",
  Delivered: "Giao hàng thành công",
  Completed: "Đơn hàng đã hoàn thành",
  Cancelled: "Đơn hàng đã bị hủy",
  Expired: "Đơn hàng hết hạn thanh toán",
  DeliveryFailed: "Giao hàng không thành công",
};

export const OrderTrackingSection: React.FC<OrderTrackingSectionProps> = ({ order }) => {
  const toast = useToast();
  const [selectedSellerOrderId, setSelectedSellerOrderId] = useState<number>(
    order.sellerOrders[0]?.sellerOrderId ?? 0
  );
  const [showAllEvents, setShowAllEvents] = useState(false);

  const activeSellerOrder = useMemo(
    () =>
      order.sellerOrders.find((so) => so.sellerOrderId === selectedSellerOrderId) ??
      order.sellerOrders[0],
    [order.sellerOrders, selectedSellerOrderId]
  );

  const isTerminated =
    order.orderStatus === "Cancelled" ||
    order.orderStatus === "Expired" ||
    activeSellerOrder?.status === "Cancelled" ||
    activeSellerOrder?.status === "DeliveryFailed" ||
    activeSellerOrder?.shipment?.shippingStatus === "Failed";

  const currentStep = resolveStepIndex(order.orderStatus, activeSellerOrder);

  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [];
    const shipment = activeSellerOrder?.shipment;

    if (shipment?.trackingEvents?.length) {
      for (const ev of shipment.trackingEvents) {
        entries.push({
          id: `ev-${ev.eventId}`,
          title: ev.title,
          description: ev.description,
          location: ev.locationName,
          time: ev.eventTime,
        });
      }
    }

    const relevantHistories = order.statusHistories.filter(
      (h) => h.sellerOrderId === null || h.sellerOrderId === activeSellerOrder?.sellerOrderId
    );

    for (const h of relevantHistories) {
      entries.push({
        id: `hist-${h.historyId}`,
        title: STATUS_VI_MAP[h.toStatus] ?? `Chuyển trạng thái: ${h.toStatus}`,
        description: h.reason,
        time: h.createdAt,
      });
    }

    if (entries.length === 0) {
      entries.push({
        id: "created",
        title: "Đơn hàng đã được đặt thành công",
        time: order.createdAt,
      });
    }

    entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    if (entries[0]) entries[0].isLatest = true;
    return entries;
  }, [activeSellerOrder, order.createdAt, order.statusHistories]);

  const visibleTimeline = showAllEvents ? timelineEntries : timelineEntries.slice(0, 5);
  const destinationAddress = `${order.shippingStreetAddress}, ${order.shippingWard}, ${order.shippingDistrict}, ${order.shippingProvince}`;

  const handleCopyTracking = async (trackingNumber: string) => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      toast.success(`Đã sao chép mã vận đơn ${trackingNumber}`);
    } catch {
      toast.info(`Mã vận đơn: ${trackingNumber}`);
    }
  };

  return (
    <div className="ew-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
            Tiến trình theo dõi đơn hàng
          </h2>
          <div style={{ fontSize: "12px", color: "var(--color-muted)", marginTop: "2px" }}>
            Cập nhật hành trình từ kho xuất hàng đến địa chỉ nhận của bạn
          </div>
        </div>

        {order.sellerOrders.length > 1 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {order.sellerOrders.map((so, idx) => {
              const active = so.sellerOrderId === activeSellerOrder?.sellerOrderId;
              return (
                <button
                  key={so.sellerOrderId}
                  type="button"
                  onClick={() => setSelectedSellerOrderId(so.sellerOrderId)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
                    background: active ? "var(--color-primary)" : "#fff",
                    color: active ? "#fff" : "var(--color-text)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Kiện {idx + 1}: {so.sellerBusinessName}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Stepper 5 bước kiểu Shopee */}
      {isTerminated ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <XCircle size={18} />
          <span>
            {order.orderStatus === "Cancelled" || activeSellerOrder?.status === "Cancelled"
              ? `Đơn hàng đã hủy${order.cancelReason ? `: ${order.cancelReason}` : ""}`
              : order.orderStatus === "Expired"
                ? "Đơn hàng đã hết hạn thanh toán"
                : `Giao hàng thất bại${activeSellerOrder?.shipment?.failedReason ? `: ${activeSellerOrder.shipment.failedReason}` : ""}`}
          </span>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: "8px",
            position: "relative",
            padding: "8px 0",
          }}
        >
          {STEP_LABELS.map((step, index) => {
            const Icon = step.icon;
            const isDone = index <= currentStep;
            const isCurrent = index === currentStep;
            return (
              <div
                key={step.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  position: "relative",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "999px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isDone ? "var(--color-primary)" : "#f1f5f9",
                    color: isDone ? "#fff" : "#94a3b8",
                    border: isCurrent ? "3px solid #99f6e4" : "2px solid transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon size={18} />
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: isDone ? 600 : 500,
                    color: isDone ? "var(--color-text)" : "var(--color-muted)",
                    lineHeight: 1.3,
                  }}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Thông tin vận đơn */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          padding: "12px 14px",
          borderRadius: "10px",
          background: "#f8fafc",
          border: "1px solid var(--color-border)",
          fontSize: "13px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <Truck size={16} color="var(--color-primary)" />
          <span>
            <strong>Đơn vị vận chuyển:</strong>{" "}
            {activeSellerOrder?.shipment?.carrierName ?? "Chưa bàn giao ĐVVC"}
          </span>
          {activeSellerOrder?.shipment?.trackingNumber && (
            <>
              <span>•</span>
              <span className="ks-tabular">
                Mã vận đơn: <strong>{activeSellerOrder.shipment.trackingNumber}</strong>
              </span>
              <button
                type="button"
                onClick={() => void handleCopyTracking(activeSellerOrder.shipment!.trackingNumber!)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border)",
                  background: "#fff",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                <Copy size={12} /> Copy
              </button>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {activeSellerOrder?.warehouseName && (
            <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
              Kho xuất: <strong>{activeSellerOrder.warehouseName}</strong>
            </span>
          )}
          {activeSellerOrder?.shipment && (
            <StatusBadge status={activeSellerOrder.shipment.shippingStatus} domain="shipment" />
          )}
        </div>
      </div>

      {/* Bản đồ + Timeline dọc 2 cột */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPin size={15} color="var(--color-primary)" /> Bản đồ hành trình giao hàng
          </div>
          <OrderTrackingMap
            warehouseName={activeSellerOrder?.warehouseName}
            warehouseAddress={activeSellerOrder?.warehouseAddress}
            destinationAddress={destinationAddress}
            orderStatus={order.orderStatus}
            shipment={activeSellerOrder?.shipment}
          />
        </div>

        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "10px" }}>
            Chi tiết hành trình ({timelineEntries.length} mốc)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", borderLeft: "2px solid #e2e8f0", paddingLeft: "16px", marginLeft: "6px" }}>
            {visibleTimeline.map((entry) => (
              <div key={entry.id} style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "-23px",
                    top: "4px",
                    width: "12px",
                    height: "12px",
                    borderRadius: "999px",
                    background: entry.isLatest ? "var(--color-primary)" : "#cbd5e1",
                    border: entry.isLatest ? "2px solid #99f6e4" : "2px solid #fff",
                  }}
                />
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: entry.isLatest ? 700 : 600,
                    color: entry.isLatest ? "var(--color-primary)" : "var(--color-text)",
                  }}
                >
                  {entry.title}
                </div>
                {entry.description && (
                  <div style={{ fontSize: "12px", color: "var(--color-muted)", marginTop: "2px" }}>
                    {entry.description}
                  </div>
                )}
                <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "3px" }}>
                  {formatDate(entry.time)}
                  {entry.location ? ` • ${entry.location}` : ""}
                </div>
              </div>
            ))}
          </div>

          {timelineEntries.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllEvents((prev) => !prev)}
              style={{
                marginTop: "10px",
                background: "transparent",
                border: "none",
                color: "var(--color-primary)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              {showAllEvents
                ? "Thu gọn hành trình"
                : `Xem thêm ${timelineEntries.length - 5} mốc trước đó`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
