import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardPlus, Plus, Trash2 } from "lucide-react";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { ScanInput } from "@/components/ui/ScanInput";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ROUTES } from "@/constants/routes";
import { useToast } from "@/hooks/useToast";
import {
  CATALOG_VARIANTS_REFERENCE,
  useOperationsStore,
} from "@/services/operationsStore";
import { useAuthStore } from "@/stores/authStore";
import type { ReceiptType } from "@/types/operations";

interface DraftLine {
  key: string;
  variantId: number;
  locationId: number;
  quantity: number;
  unitCost: string;
}

const SELLERS_REFERENCE = [
  { sellerId: 1, name: "Công ty TNHH Thiết Bị Số Modu+" },
  { sellerId: 2, name: "BioDerma Pure Official" },
];

export const WarehouseReceiptCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);

  const warehouses = useOperationsStore((s) => s.warehouses);
  const locations = useOperationsStore((s) => s.locations);
  const createReceiptDraft = useOperationsStore((s) => s.createReceiptDraft);

  const [warehouseId, setWarehouseId] = useState<number>(warehouses[0]?.warehouseId ?? 1);
  const [receiptType, setReceiptType] = useState<ReceiptType>("SellerInbound");
  const [senderSellerId, setSenderSellerId] = useState<number>(1);
  const [note, setNote] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);

  const whLocations = useMemo(
    () => locations.filter((l) => l.warehouseId === warehouseId && l.isActive),
    [locations, warehouseId]
  );

  const [lines, setLines] = useState<DraftLine[]>([
    {
      key: "line-1",
      variantId: CATALOG_VARIANTS_REFERENCE[0].variantId,
      locationId: whLocations[0]?.locationId ?? 0,
      quantity: 20,
      unitCost: "1850000",
    },
  ]);

  const handleWarehouseChange = (nextWhId: number) => {
    setWarehouseId(nextWhId);
    const nextLocs = locations.filter((l) => l.warehouseId === nextWhId && l.isActive);
    const fallbackLocId = nextLocs[0]?.locationId ?? 0;
    setLines((prev) =>
      prev.map((line) => ({
        ...line,
        locationId: nextLocs.some((l) => l.locationId === line.locationId)
          ? line.locationId
          : fallbackLocId,
      }))
    );
  };

  const handleScanSku = (code: string) => {
    const q = code.trim().toLowerCase();
    const matched = CATALOG_VARIANTS_REFERENCE.find(
      (v) => v.barcode.toLowerCase() === q || v.sku.toLowerCase() === q
    );
    if (!matched) {
      setScanError(`Không tìm thấy biến thể khớp mã "${code.trim()}".`);
      return;
    }

    setScanError(null);
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === matched.variantId);
      if (existing) {
        return prev.map((l) =>
          l.variantId === matched.variantId ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          key: `line-${Date.now()}`,
          variantId: matched.variantId,
          locationId: whLocations[0]?.locationId ?? 0,
          quantity: 1,
          unitCost: "",
        },
      ];
    });
    toast.success(`Đã thêm / cộng +1 cho SKU ${matched.sku}.`);
  };

  const handleAddEmptyLine = () => {
    setLines((prev) => [
      ...prev,
      {
        key: `line-${Date.now()}`,
        variantId: CATALOG_VARIANTS_REFERENCE[0].variantId,
        locationId: whLocations[0]?.locationId ?? 0,
        quantity: 10,
        unitCost: "",
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      toast.error("Phiếu nhập phải có ít nhất 1 dòng hàng.");
      return;
    }
    if (whLocations.length === 0) {
      toast.error("Kho đã chọn chưa có vị trí kệ đang hoạt động. Vui lòng tạo kệ tại W2 trước.");
      return;
    }

    for (const l of lines) {
      if (l.unitCost.trim()) {
        const parsedCost = Number(l.unitCost);
        if (!Number.isFinite(parsedCost) || parsedCost < 0) {
          toast.error("Đơn giá vốn không được là số âm.");
          return;
        }
      }
    }

    const mappedLines = lines.map((l) => {
      const ref =
        CATALOG_VARIANTS_REFERENCE.find((v) => v.variantId === l.variantId) ??
        CATALOG_VARIANTS_REFERENCE[0];
      const validLocId = whLocations.some((loc) => loc.locationId === l.locationId)
        ? l.locationId
        : whLocations[0].locationId;
      return {
        variantId: ref.variantId,
        sku: ref.sku,
        barcode: ref.barcode,
        productName: ref.productName,
        locationId: validLocId,
        quantity: Math.max(1, Number(l.quantity) || 1),
        unitCost: l.unitCost.trim() ? Number(l.unitCost) : null,
      };
    });

    const sellerName =
      SELLERS_REFERENCE.find((s) => s.sellerId === senderSellerId)?.name ?? null;

    const res = createReceiptDraft({
      warehouseId,
      receiptType,
      senderSellerId: receiptType === "SellerInbound" ? senderSellerId : null,
      senderSellerName: receiptType === "SellerInbound" ? sellerName : null,
      note,
      createdBy: currentUser?.userId ?? 2,
      createdByName: currentUser?.fullName ?? "Nguyễn Văn Kho 1 (manager1)",
      createdByEmail: currentUser?.email ?? null,
      lines: mappedLines,
    });

    if (res.ok) {
      toast.success(res.message);
      if (res.receiptId) {
        navigate(`/warehouse/receipts/${res.receiptId}`);
      } else {
        navigate(ROUTES.WAREHOUSE_RECEIPTS);
      }
    } else {
      toast.error(res.message);
    }
  };

  return (
    <section>
      <Link to={ROUTES.WAREHOUSE_RECEIPTS} className="ew-back-link">
        <ArrowLeft size={15} aria-hidden="true" />
        <span>Quay lại Danh sách phiếu nhập (W5a)</span>
      </Link>

      <PageHeader
        title="Tạo phiếu nhập kho mới (W5b · Draft)"
        subtitle="Chọn kho, nguồn hàng Seller, quét mã vạch/SKU và chỉ định vị trí kệ nhận. Sau khi lưu Draft, cần Quản lý kho khác xác nhận."
      />

      <MockDataNotice endpointHint="POST /api/v1/receipts" />

      {whLocations.length === 0 && (
        <div className="ew-notice ew-notice--warning" style={{ marginBottom: "18px" }}>
          <div className="ew-notice__head">Kho đã chọn chưa có vị trí kệ đang hoạt động</div>
          <div>
            Vui lòng{" "}
            <Link
              to={`/warehouse/warehouses/${warehouseId}/locations`}
              style={{ textDecoration: "underline", fontWeight: 700 }}
            >
              khai báo vị trí kệ tại W2
            </Link>{" "}
            trước khi lưu phiếu nhập kho cho kho này.
          </div>
        </div>
      )}

      {/* Ô quét mã đặt NGOÀI thẻ form để nhấn Enter không kích hoạt submit phiếu ngoài ý muốn */}
      <div className="ew-card" style={{ marginBottom: "18px" }}>
        <div className="ew-card-body">
          <ScanInput
            label="Quét mã vạch / SKU để thêm nhanh hoặc cộng +1 dòng hàng"
            placeholder="VD: 8938501204881 hoặc KB-K2PRO-RED rồi nhấn Enter..."
            error={scanError}
            onScan={handleScanSku}
            autoFocus={false}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Thông tin chung */}
        <div className="ew-card">
          <div className="ew-card-head">
            <h2 className="ew-card-title">
              <ClipboardPlus size={17} color="var(--color-primary)" aria-hidden="true" />
              <span>Thông tin chứng từ nhập (InventoryReceipts)</span>
            </h2>
          </div>
          <div className="ew-card-body ew-form-grid-3">
            <FormField label="Kho nhập hàng" required>
              <Select
                value={String(warehouseId)}
                options={warehouses.map((w) => ({
                  value: String(w.warehouseId),
                  label: w.warehouseName,
                }))}
                onChange={(e) => handleWarehouseChange(Number(e.target.value))}
              />
            </FormField>

            <FormField label="Loại phiếu nhập (ReceiptType)" required>
              <Select
                value={receiptType}
                options={[
                  { value: "SellerInbound", label: "Nhập từ Người bán (SellerInbound)" },
                  { value: "Adjustment", label: "Nhập điều chỉnh (Adjustment)" },
                ]}
                onChange={(e) => setReceiptType(e.target.value as ReceiptType)}
              />
            </FormField>

            {receiptType === "SellerInbound" && (
              <FormField label="Nguồn Seller gửi hàng" required>
                <Select
                  value={String(senderSellerId)}
                  options={SELLERS_REFERENCE.map((s) => ({
                    value: String(s.sellerId),
                    label: s.name,
                  }))}
                  onChange={(e) => setSenderSellerId(Number(e.target.value))}
                />
              </FormField>
            )}

            <div style={{ gridColumn: "1 / -1" }}>
              <FormField label="Ghi chú phiếu nhập (Note)">
                <Textarea
                  rows={2}
                  placeholder="Tình trạng niêm phong, số xe giao hàng, ghi nhận tại cổng INBOUND-01..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Bảng dòng hàng */}
        <div className="ew-card">
          <div className="ew-card-head">
            <h2 className="ew-card-title">Chi tiết dòng hàng nhập (ReceiptDetails · {lines.length})</h2>
            <Button type="button" variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={handleAddEmptyLine}>
              Thêm dòng hàng
            </Button>
          </div>
          <div className="ew-card-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="ew-table-scroll">
              <table className="ew-table">
                <thead>
                  <tr>
                    <th>Biến thể (SKU / Sản phẩm)</th>
                    <th style={{ width: "210px" }}>Vị trí kệ nhận</th>
                    <th style={{ width: "120px" }}>Số lượng</th>
                    <th style={{ width: "160px" }}>Đơn giá vốn (VND)</th>
                    <th style={{ width: "60px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.key}>
                      <td>
                        <Select
                          aria-label="Chọn biến thể"
                          value={String(line.variantId)}
                          options={CATALOG_VARIANTS_REFERENCE.map((v) => ({
                            value: String(v.variantId),
                            label: `${v.sku} — ${v.productName}`,
                          }))}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l) =>
                                l.key === line.key
                                  ? { ...l, variantId: Number(e.target.value) }
                                  : l
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <Select
                          aria-label="Chọn vị trí kệ nhận"
                          value={String(line.locationId)}
                          options={whLocations.map((loc) => ({
                            value: String(loc.locationId),
                            label: `${loc.locationCode} (${loc.storageType})`,
                          }))}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l) =>
                                l.key === line.key
                                  ? { ...l, locationId: Number(e.target.value) }
                                  : l
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          min={1}
                          value={String(line.quantity)}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l) =>
                                l.key === line.key
                                  ? { ...l, quantity: Math.max(1, Number(e.target.value) || 1) }
                                  : l
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Tùy chọn"
                          value={line.unitCost}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l) =>
                                l.key === line.key ? { ...l, unitCost: e.target.value } : l
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Xóa dòng"
                          disabled={lines.length <= 1}
                          onClick={() =>
                            setLines((prev) => prev.filter((l) => l.key !== line.key))
                          }
                        >
                          <Trash2 size={15} color="var(--color-danger)" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(ROUTES.WAREHOUSE_RECEIPTS)}
              >
                Hủy bỏ
              </Button>
              <Button type="submit" variant="primary">
                Lưu phiếu nhập Nháp (Draft)
              </Button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};
