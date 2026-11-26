import React, { useMemo, useState } from "react";
import { CheckCircle2, Eye, Plus, Truck, XCircle } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { InspectionDrawer } from "@/components/common/InspectionDrawer";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { ReasonActionModal } from "@/components/common/ReasonActionModal";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/hooks/useToast";
import { useOperationsStore } from "@/services/operationsStore";
import type { ShipmentRecordDto, ShippingStatus } from "@/types/operations";
import { formatCurrency, formatDate } from "@/utils/formatters";

const NEXT_STATUS_ACTION: Partial<
  Record<ShippingStatus, { next: ShippingStatus; label: string }>
> = {
  Preparing: { next: "PickedUp", label: "Đánh dấu Đã lấy hàng (PickedUp)" },
  PickedUp: { next: "InTransit", label: "Cập nhật Đang giao (InTransit)" },
  InTransit: { next: "Delivered", label: "Xác nhận Đã giao (Delivered)" },
};

export const WarehouseShipmentsPage: React.FC = () => {
  const toast = useToast();

  const carriers = useOperationsStore((s) => s.carriers);
  const shipments = useOperationsStore((s) => s.shipments);
  const sellerOrders = useOperationsStore((s) => s.sellerOrders);
  const createShipment = useOperationsStore((s) => s.createShipment);
  const updateShipmentStatus = useOperationsStore((s) => s.updateShipmentStatus);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [failTarget, setFailTarget] = useState<ShipmentRecordDto | null>(null);

  // Create Shipment Modal
  const [openCreate, setOpenCreate] = useState(false);
  const eligibleOrders = useMemo(
    () => sellerOrders.filter((o) => o.status === "ReadyToShip" && !o.shipment),
    [sellerOrders]
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [carrierId, setCarrierId] = useState<string>(String(carriers[0]?.carrierId ?? 1));
  const [trackingNumber, setTrackingNumber] = useState("");
  const [codAmount, setCodAmount] = useState("0");
  const [formError, setFormError] = useState<string | null>(null);

  const selected = shipments.find((s) => s.shipmentId === selectedId) ?? null;

  const openCreateModal = (preselectedOrderId?: number) => {
    const firstOrder =
      eligibleOrders.find((o) => o.sellerOrderId === preselectedOrderId) ?? eligibleOrders[0];
    setSelectedOrderId(firstOrder ? String(firstOrder.sellerOrderId) : "");
    setCarrierId(String(carriers[0]?.carrierId ?? 1));
    setTrackingNumber(`GHN${Math.floor(2611250000 + Math.random() * 899999)}`);
    setCodAmount(
      firstOrder && firstOrder.paymentMethod === "COD" ? String(firstOrder.subtotal) : "0"
    );
    setFormError(null);
    setOpenCreate(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setFormError("Không có đơn con nào ở trạng thái ReadyToShip chờ tạo vận đơn.");
      return;
    }
    const res = createShipment({
      sellerOrderId: Number(selectedOrderId),
      carrierId: Number(carrierId),
      trackingNumber,
      codAmount: Number(codAmount) || 0,
    });
    if (!res.ok) {
      setFormError(res.message);
      return;
    }
    toast.success(res.message);
    setOpenCreate(false);
  };

  const handleAdvanceStatus = (shipment: ShipmentRecordDto, next: ShippingStatus) => {
    const res = updateShipmentStatus(shipment.shipmentId, next);
    if (res.ok) toast.success(res.message);
    else toast.error(res.message);
  };

  return (
    <section>
      <PageHeader
        title="Quản lý vận đơn (W8)"
        subtitle="Tạo vận đơn cho các đơn con đã đóng gói (ReadyToShip) với 5 hãng vận chuyển GHN, GHTK, VTP, J&T, SPX và cập nhật trạng thái giao hàng."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            disabled={eligibleOrders.length === 0}
            onClick={() => openCreateModal()}
          >
            Tạo vận đơn mới ({eligibleOrders.length} đơn chờ)
          </Button>
        }
      />

      <MockDataNotice endpointHint="GET /api/v1/carriers · GET /api/v1/shipments · POST /api/v1/seller-orders/{id}/shipments · PATCH /api/v1/shipments/{id}/status" />

      {/* Đơn con đã đóng gói chờ tạo vận đơn */}
      {eligibleOrders.length > 0 && (
        <div className="ew-card" style={{ marginBottom: "18px" }}>
          <div className="ew-card-head">
            <h2 className="ew-card-title">
              <Truck size={17} color="var(--color-primary)" aria-hidden="true" />
              <span>Đơn con sẵn sàng tạo vận đơn (ReadyToShip · {eligibleOrders.length})</span>
            </h2>
          </div>
          <div className="ew-card-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {eligibleOrders.map((ord) => (
              <div key={ord.sellerOrderId} className="ew-line-item">
                <div>
                  <div className="ew-line-item__title ks-tabular">
                    {ord.sellerOrderCode} · {ord.shopName}
                  </div>
                  <div className="ew-line-item__meta">
                    <span>Người nhận: {ord.recipientName}</span>
                    <span>·</span>
                    <span>
                      COD: {ord.paymentMethod === "COD" ? formatCurrency(ord.subtotal) : "0₫ (Đã thanh toán)"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={() => openCreateModal(ord.sellerOrderId)}
                >
                  Gắn mã vận đơn
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bảng vận đơn đã tạo */}
      {shipments.length === 0 ? (
        <div className="ew-card">
          <EmptyState
            icon={<Truck size={28} />}
            title="Chưa có vận đơn nào được tạo"
            description="Hoàn tất đóng gói & xuất kho để tạo vận đơn cho đơn con."
          />
        </div>
      ) : (
        <div className="ew-card">
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Mã vận đơn / Đơn con</th>
                  <th>Hãng vận chuyển</th>
                  <th>Người nhận &amp; Khu vực</th>
                  <th className="ew-table__cell--right">Thu hộ (COD)</th>
                  <th>Trạng thái giao</th>
                  <th className="ew-table__cell--right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((sh) => {
                  const nextAction = NEXT_STATUS_ACTION[sh.shippingStatus];
                  return (
                    <tr key={sh.shipmentId}>
                      <td>
                        <div className="ks-tabular" style={{ fontWeight: 800, color: "var(--color-dark)" }}>
                          {sh.trackingNumber}
                        </div>
                        <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                          {sh.sellerOrderCode} · {sh.orderCode}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{sh.carrierName}</div>
                        <div className="ks-tabular" style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                          Mã hãng: {sh.carrierCode}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{sh.recipientName}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                          {sh.destinationProvince}
                        </div>
                      </td>
                      <td className="ew-table__cell--right ks-tabular" style={{ fontWeight: 700 }}>
                        {formatCurrency(sh.codAmount)}
                      </td>
                      <td>
                        <StatusBadge status={sh.shippingStatus} domain="shipment" />
                      </td>
                      <td className="ew-table__cell--right">
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {nextAction && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAdvanceStatus(sh, nextAction.next)}
                            >
                              {nextAction.next === "PickedUp"
                                ? "Đã lấy"
                                : nextAction.next === "InTransit"
                                  ? "Đang giao"
                                  : "Đã giao"}
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Eye size={14} />}
                            onClick={() => setSelectedId(sh.shipmentId)}
                          >
                            Chi tiết
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer chi tiết vận đơn */}
      <InspectionDrawer
        isOpen={Boolean(selected)}
        title={selected ? `Vận đơn ${selected.trackingNumber}` : ""}
        subtitle={selected ? `${selected.carrierName} (${selected.carrierCode})` : undefined}
        headerBadge={
          selected ? (
            <StatusBadge status={selected.shippingStatus} domain="shipment" size="md" />
          ) : undefined
        }
        onClose={() => setSelectedId(null)}
        footer={
          selected && NEXT_STATUS_ACTION[selected.shippingStatus] ? (
            <>
              <Button
                variant="primary"
                fullWidth
                leftIcon={<CheckCircle2 size={15} />}
                onClick={() =>
                  handleAdvanceStatus(selected, NEXT_STATUS_ACTION[selected.shippingStatus]!.next)
                }
              >
                {NEXT_STATUS_ACTION[selected.shippingStatus]!.label}
              </Button>
              {selected.shippingStatus === "InTransit" && (
                <Button
                  variant="danger"
                  fullWidth
                  leftIcon={<XCircle size={15} />}
                  onClick={() => setFailTarget(selected)}
                >
                  Báo giao thất bại (Failed)
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {selected && (
          <div className="ew-drawer__section">
            <span className="ew-drawer__section-title">Chi tiết bảng Shipments</span>
            <div className="ew-info-list">
              <div className="ew-info-row">
                <span className="ew-info-key">Đơn con (SellerOrder)</span>
                <span className="ew-info-val ks-tabular">{selected.sellerOrderCode}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Người nhận</span>
                <span className="ew-info-val">{selected.recipientName}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Tỉnh / Thành</span>
                <span className="ew-info-val">{selected.destinationProvince}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Thu hộ (CodAmount)</span>
                <span className="ew-info-val ks-tabular">{formatCurrency(selected.codAmount)}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Ngày tạo vận đơn</span>
                <span className="ew-info-val ks-tabular">{formatDate(selected.createdAt)}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Thời điểm bàn giao (ShippedAt)</span>
                <span className="ew-info-val ks-tabular">
                  {selected.shippedAt ? formatDate(selected.shippedAt) : "Chưa bàn giao"}
                </span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Thời điểm giao (DeliveredAt)</span>
                <span className="ew-info-val ks-tabular">
                  {selected.deliveredAt ? formatDate(selected.deliveredAt) : "Chưa giao"}
                </span>
              </div>
            </div>

            {selected.failedReason && (
              <div className="ew-notice ew-notice--danger" style={{ marginTop: "10px" }}>
                <div className="ew-notice__head">Lý do giao thất bại (FailedReason)</div>
                <div>{selected.failedReason}</div>
              </div>
            )}
          </div>
        )}
      </InspectionDrawer>

      {/* Modal tạo vận đơn */}
      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Tạo vận đơn mới (Shipments)"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenCreate(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Tạo vận đơn
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <FormField label="Đơn con sẵn sàng giao (ReadyToShip)" required>
            <Select
              value={selectedOrderId}
              options={eligibleOrders.map((o) => ({
                value: String(o.sellerOrderId),
                label: `${o.sellerOrderCode} — ${o.recipientName}`,
              }))}
              onChange={(e) => setSelectedOrderId(e.target.value)}
            />
          </FormField>

          <FormField label="Hãng vận chuyển (Carriers)" required>
            <Select
              value={carrierId}
              options={carriers.map((c) => ({
                value: String(c.carrierId),
                label: `${c.carrierCode} — ${c.carrierName}`,
              }))}
              onChange={(e) => setCarrierId(e.target.value)}
            />
          </FormField>

          <FormField label="Mã vận đơn (TrackingNumber)" required>
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="VD: GHN2611250088"
            />
          </FormField>

          <FormField label="Số tiền thu hộ COD (VND)">
            <Input
              type="number"
              min={0}
              value={codAmount}
              onChange={(e) => setCodAmount(e.target.value)}
            />
          </FormField>

          {formError && <p className="ew-field__error">{formError}</p>}
        </form>
      </Modal>

      <ReasonActionModal
        isOpen={Boolean(failTarget)}
        title="Cập nhật giao thất bại (Failed)"
        description={failTarget ? `Vận đơn ${failTarget.trackingNumber} (${failTarget.recipientName}).` : ""}
        confirmLabel="Xác nhận giao thất bại"
        tone="danger"
        requireReason
        reasonLabel="Lý do giao thất bại (FailedReason)"
        onConfirm={(reason) => {
          if (!failTarget) return;
          const res = updateShipmentStatus(failTarget.shipmentId, "Failed", reason);
          if (res.ok) toast.warning(res.message);
          setFailTarget(null);
        }}
        onClose={() => setFailTarget(null)}
      />
    </section>
  );
};
