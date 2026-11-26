import React, { useMemo, useState } from "react";
import { CheckCircle2, Eye, PackageCheck, ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { InspectionDrawer } from "@/components/common/InspectionDrawer";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/hooks/useToast";
import { useOperationsStore } from "@/services/operationsStore";
import { useAuthStore } from "@/stores/authStore";
import type { InspectionResult, ReturnRequestItemRecordDto } from "@/types/operations";
import { formatDate } from "@/utils/formatters";

export const WarehouseReturnsPage: React.FC = () => {
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);

  const returns = useOperationsStore((s) => s.returns);
  const locations = useOperationsStore((s) => s.locations);
  const receiveReturnAtWarehouse = useOperationsStore((s) => s.receiveReturnAtWarehouse);
  const inspectReturnItem = useOperationsStore((s) => s.inspectReturnItem);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [inspectingItemId, setInspectingItemId] = useState<number | null>(null);
  const [resultChoice, setResultChoice] = useState<Exclude<InspectionResult, "Pending">>("Good");
  const [restockLocationId, setRestockLocationId] = useState<string>("1");
  const [inspectionNote, setInspectionNote] = useState("");

  // Kho chỉ xử lý các yêu cầu từ Approved trở đi
  const warehouseReturns = useMemo(
    () =>
      returns.filter((r) =>
        ["Approved", "ItemsReceived", "Inspected", "Completed"].includes(r.status)
      ),
    [returns]
  );

  const selected =
    warehouseReturns.find((r) => r.returnRequestId === selectedId) ?? null;

  const sellableLocations = useMemo(
    () => locations.filter((l) => l.isSellable && l.isActive),
    [locations]
  );
  const damagedLocations = useMemo(
    () => locations.filter((l) => l.storageType === "Damaged" && l.isActive),
    [locations]
  );

  const startInspectingItem = (item: ReturnRequestItemRecordDto) => {
    setInspectingItemId(item.returnItemId);
    setResultChoice("Good");
    setRestockLocationId(String(sellableLocations[0]?.locationId ?? 1));
    setInspectionNote("");
  };

  const handleResultChoiceChange = (nextResult: Exclude<InspectionResult, "Pending">) => {
    setResultChoice(nextResult);
    if (nextResult === "Damaged") {
      setRestockLocationId(String(damagedLocations[0]?.locationId ?? 9));
    } else {
      setRestockLocationId(String(sellableLocations[0]?.locationId ?? 1));
    }
  };

  const handleReceive = (returnRequestId: number) => {
    const res = receiveReturnAtWarehouse(
      returnRequestId,
      currentUser?.fullName ?? "Quản lý kho"
    );
    if (res.ok) toast.success(res.message);
    else toast.error(res.message);
  };

  const handleInspectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !inspectingItemId) return;

    const res = inspectReturnItem({
      returnRequestId: selected.returnRequestId,
      returnItemId: inspectingItemId,
      result: resultChoice,
      restockLocationId: Number(restockLocationId),
      note: inspectionNote,
      actorId: currentUser?.userId ?? 2,
      actorName: currentUser?.fullName ?? "Quản lý kho",
    });

    if (res.ok) {
      toast.success(res.message);
      setInspectingItemId(null);
    } else {
      toast.error(res.message);
    }
  };

  const targetLocations =
    resultChoice === "Damaged" ? damagedLocations : sellableLocations;

  return (
    <section>
      <PageHeader
        title="Xử lý hàng trả về (W9)"
        subtitle="Tiếp nhận kiện hàng hoàn đã duyệt (Approved → ItemsReceived) và kiểm định từng dòng (Good / MinorDefect / Damaged) trước khi nhập lại kệ."
      />

      <MockDataNotice endpointHint="GET /api/v1/returns · POST /api/v1/returns/{id}/receive · POST /api/v1/returns/{id}/items/{itemId}/inspect" />

      <div className="ew-notice ew-notice--info" style={{ marginBottom: "16px" }}>
        <div className="ew-notice__head">
          <ShieldAlert size={15} aria-hidden="true" />
          <span>Nguyên tắc an toàn tồn kho hàng hoàn</span>
        </div>
        Hàng trả về <strong>không tự cộng vào tồn bán được</strong> khi nhận tại khu <code>RETURNS-01</code>. Chỉ sau khi Quản lý kho kiểm tra từng dòng hàng và chọn vị trí đích (<code>Good</code> → kệ bán, <code>Damaged</code> → khu <code>DAMAGED-01</code>), hệ thống mới ghi tồn và sổ cái <code>ReturnIn</code>.
      </div>

      {warehouseReturns.length === 0 ? (
        <div className="ew-card">
          <EmptyState
            icon={<PackageCheck size={28} />}
            title="Không có kiện hàng trả về chờ kiểm"
            description="Khi Seller hoặc Admin duyệt yêu cầu trả hàng (Approved), phiếu sẽ xuất hiện tại đây."
          />
        </div>
      ) : (
        <div className="ew-card">
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Mã yêu cầu / Đơn con</th>
                  <th>Khách hàng &amp; Gian hàng</th>
                  <th>Số dòng cần kiểm</th>
                  <th>Lý do trả hàng</th>
                  <th>Trạng thái</th>
                  <th className="ew-table__cell--right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {warehouseReturns.map((rma) => {
                  const inspectedCount = rma.items.filter(
                    (it) => it.inspectionResult !== "Pending"
                  ).length;
                  return (
                    <tr key={rma.returnRequestId}>
                      <td>
                        <div className="ks-tabular" style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                          {rma.requestCode}
                        </div>
                        <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                          {rma.sellerOrderCode}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rma.customerName}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                          {rma.shopName}
                        </div>
                      </td>
                      <td className="ks-tabular">
                        <strong>{inspectedCount}</strong> / {rma.items.length} dòng đã kiểm
                      </td>
                      <td style={{ maxWidth: "280px" }}>{rma.reason}</td>
                      <td>
                        <StatusBadge status={rma.status} domain="return" />
                      </td>
                      <td className="ew-table__cell--right">
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {rma.status === "Approved" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleReceive(rma.returnRequestId)}
                            >
                              Đã nhận hàng
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Eye size={14} />}
                            onClick={() => {
                              setSelectedId(rma.returnRequestId);
                              setInspectingItemId(null);
                            }}
                          >
                            Kiểm hàng
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

      {/* Inspection Drawer */}
      <InspectionDrawer
        isOpen={Boolean(selected)}
        title={selected ? `Kiểm hàng hoàn ${selected.requestCode}` : ""}
        subtitle={
          selected
            ? `Đơn con ${selected.sellerOrderCode} · Duyệt lúc ${formatDate(selected.reviewedAt)}`
            : undefined
        }
        headerBadge={
          selected ? <StatusBadge status={selected.status} domain="return" size="md" /> : undefined
        }
        onClose={() => {
          setSelectedId(null);
          setInspectingItemId(null);
        }}
        footer={
          selected && selected.status === "Approved" ? (
            <Button
              variant="primary"
              fullWidth
              leftIcon={<CheckCircle2 size={16} />}
              onClick={() => handleReceive(selected.returnRequestId)}
            >
              Xác nhận Đã nhận kiện hàng tại khu RETURNS-01 (receive)
            </Button>
          ) : undefined
        }
      >
        {selected && (
          <>
            <div className="ew-drawer__section">
              <span className="ew-drawer__section-title">Thông tin phiếu trả</span>
              <div className="ew-info-list">
                <div className="ew-info-row">
                  <span className="ew-info-key">Khách hàng</span>
                  <span className="ew-info-val">{selected.customerName}</span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Gian hàng</span>
                  <span className="ew-info-val">{selected.shopName}</span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Lý do khách trả</span>
                  <span className="ew-info-val">{selected.reason}</span>
                </div>
              </div>
            </div>

            <div className="ew-drawer__section">
              <span className="ew-drawer__section-title">
                Danh sách dòng hàng cần kiểm ({selected.items.length})
              </span>
              {selected.items.map((item) => {
                const isEditing = inspectingItemId === item.returnItemId;
                return (
                  <div
                    key={item.returnItemId}
                    className="ew-card"
                    style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                          {item.productName}
                        </div>
                        <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                          SKU: {item.sku} · SL: x{item.quantity}
                        </div>
                      </div>
                      <StatusBadge status={item.inspectionResult} domain="inspection" />
                    </div>

                    {item.inspectionResult !== "Pending" ? (
                      <div className="ew-notice ew-notice--success" style={{ fontSize: "0.8rem" }}>
                        Đã nhập vào kệ <strong>{item.restockLocationCode}</strong> bởi{" "}
                        {item.inspectedByName}
                        {item.inspectionNote ? ` — "${item.inspectionNote}"` : ""}
                      </div>
                    ) : selected.status === "ItemsReceived" ? (
                      isEditing ? (
                        <form
                          onSubmit={handleInspectSubmit}
                          style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "6px", borderTop: "1px solid var(--color-border)" }}
                        >
                          <FormField label="Kết quả kiểm tra (InspectionResult)" required>
                            <Select
                              value={resultChoice}
                              options={[
                                { value: "Good", label: "Hàng tốt (Good) → Nhập kệ bán" },
                                { value: "MinorDefect", label: "Lỗi nhẹ (MinorDefect)" },
                                { value: "Damaged", label: "Hỏng (Damaged) → Bắt buộc khu DAMAGED" },
                              ]}
                              onChange={(e) =>
                                handleResultChoiceChange(
                                  e.target.value as Exclude<InspectionResult, "Pending">
                                )
                              }
                            />
                          </FormField>

                          <FormField label="Vị trí đích (RestockLocationId)" required>
                            <Select
                              value={restockLocationId}
                              options={targetLocations.map((loc) => ({
                                value: String(loc.locationId),
                                label: `${loc.locationCode} (${loc.storageType}${
                                  loc.isSellable ? " · Bán được" : " · Không bán được"
                                })`,
                              }))}
                              onChange={(e) => setRestockLocationId(e.target.value)}
                            />
                          </FormField>

                          <FormField label="Ghi chú kiểm định (InspectionNote)">
                            <Textarea
                              rows={2}
                              placeholder="Tình trạng tem niêm phong, phụ kiện, ngoại quan..."
                              value={inspectionNote}
                              onChange={(e) => setInspectionNote(e.target.value)}
                            />
                          </FormField>

                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setInspectingItemId(null)}
                            >
                              Hủy
                            </Button>
                            <Button type="submit" variant="primary" size="sm">
                              Lưu kết quả &amp; Nhập kệ
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => startInspectingItem(item)}
                        >
                          Kiểm tra dòng hàng này
                        </Button>
                      )
                    ) : (
                      <span style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                        Cần xác nhận Đã nhận hàng trước khi kiểm định.
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </InspectionDrawer>
    </section>
  );
};
