import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Boxes, Eye, History, RotateCcw } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { InspectionDrawer } from "@/components/common/InspectionDrawer";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { useOperationsStore } from "@/services/operationsStore";
import { STORAGE_TYPE_META, type StorageType } from "@/types/operations";
import { formatDate } from "@/utils/formatters";

export const WarehouseInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const warehouses = useOperationsStore((s) => s.warehouses);
  const inventory = useOperationsStore((s) => s.inventory);

  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [zoneFilter, setZoneFilter] = useState<"ALL" | StorageType>("ALL");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inventory.filter((row) => {
      if (warehouseFilter !== "ALL" && String(row.warehouseId) !== warehouseFilter) return false;
      if (zoneFilter !== "ALL" && row.storageType !== zoneFilter) return false;
      if (!q) return true;
      return (
        row.sku.toLowerCase().includes(q) ||
        row.productName.toLowerCase().includes(q) ||
        row.locationCode.toLowerCase().includes(q) ||
        row.shopName.toLowerCase().includes(q)
      );
    });
  }, [inventory, warehouseFilter, zoneFilter, query]);

  const selected = inventory.find((r) => r.inventoryId === selectedId) ?? null;

  const getStockBadge = (available: number, threshold: number) => {
    if (available <= 0) return "OutOfStock";
    if (available <= threshold) return "LowStock";
    return "InStock";
  };

  return (
    <section>
      <PageHeader
        title="Tồn kho theo vị trí"
        subtitle="Tra cứu số lượng OnHand, Reserved và Available (từ server) theo từng cặp (Vị trí kệ × Biến thể). Bấm dòng để mở Thẻ kho biến thể."
        actions={
          <Button
            variant="secondary"
            leftIcon={<History size={16} />}
            onClick={() => navigate(ROUTES.WAREHOUSE_STOCK_MOVEMENTS)}
          >
            Mở Thẻ kho (W4)
          </Button>
        }
      />

      <MockDataNotice endpointHint="GET /api/v1/inventory?warehouseId&variantId" />

      <div className="ew-card ew-toolbar" style={{ marginBottom: "16px" }}>
        <div className="ew-toolbar__search">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Tìm theo SKU, tên sản phẩm, vị trí kệ (A-01-01) hoặc tên shop..."
            ariaLabel="Tìm kiếm tồn kho theo vị trí"
          />
        </div>
        <div className="ew-toolbar__select">
          <Select
            aria-label="Lọc kho"
            value={warehouseFilter}
            options={[
              { value: "ALL", label: "Tất cả kho" },
              ...warehouses.map((w) => ({ value: String(w.warehouseId), label: w.warehouseName })),
            ]}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          />
        </div>
        <div className="ew-toolbar__select">
          <Select
            aria-label="Lọc phân khu"
            value={zoneFilter}
            options={[
              { value: "ALL", label: "Tất cả phân khu" },
              { value: "Standard", label: "Kệ tiêu chuẩn" },
              { value: "Cold", label: "Kho lạnh" },
              { value: "Fragile", label: "Hàng dễ vỡ" },
              { value: "Hazardous", label: "Hàng đặc thù" },
              { value: "Damaged", label: "Khu hàng hỏng" },
            ]}
            onChange={(e) => setZoneFilter(e.target.value as "ALL" | StorageType)}
          />
        </div>
        {(query || warehouseFilter !== "ALL" || zoneFilter !== "ALL") && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} />}
            onClick={() => {
              setQuery("");
              setWarehouseFilter("ALL");
              setZoneFilter("ALL");
            }}
          >
            Đặt lại
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="ew-card">
          <EmptyState
            icon={<Boxes size={28} />}
            title="Không có bản ghi tồn kho phù hợp"
            description="Thử chọn kho/phân khu khác hoặc kiểm tra phiếu nhập kho W5."
          />
        </div>
      ) : (
        <div className="ew-card">
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Biến thể (SKU / Sản phẩm)</th>
                  <th>Shop / Seller</th>
                  <th>Kho &amp; Vị trí kệ</th>
                  <th className="ew-table__cell--right">OnHand</th>
                  <th className="ew-table__cell--right">Reserved</th>
                  <th className="ew-table__cell--right">Available</th>
                  <th>Tình trạng</th>
                  <th className="ew-table__cell--right">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const stockState = getStockBadge(row.availableQuantity, row.lowStockThreshold);
                  const rowClass =
                    stockState === "OutOfStock"
                      ? "ew-row-highlight-danger"
                      : stockState === "LowStock"
                        ? "ew-row-highlight-warn"
                        : "";
                  return (
                    <tr key={row.inventoryId} className={rowClass}>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                          {row.productName}
                        </div>
                        <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                          SKU: <strong>{row.sku}</strong> · {row.variantName}
                        </div>
                      </td>
                      <td style={{ fontSize: "0.86rem" }}>{row.shopName}</td>
                      <td>
                        <div className="ks-tabular" style={{ fontWeight: 800, color: "var(--color-dark)" }}>
                          {row.locationCode}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--color-muted)" }}>
                          {row.warehouseName} · {STORAGE_TYPE_META[row.storageType].shortLabel}
                        </div>
                      </td>
                      <td className="ew-table__cell--right ks-tabular">{row.quantityOnHand}</td>
                      <td className="ew-table__cell--right ks-tabular">{row.quantityReserved}</td>
                      <td
                        className="ew-table__cell--right ks-tabular"
                        style={{
                          fontWeight: 800,
                          color:
                            stockState === "OutOfStock"
                              ? "var(--color-danger)"
                              : stockState === "LowStock"
                                ? "var(--color-warning)"
                                : "var(--color-primary)",
                        }}
                      >
                        {row.availableQuantity}
                        {stockState !== "InStock" && (
                          <AlertTriangle
                            size={13}
                            style={{ display: "inline", marginLeft: "4px", verticalAlign: "-2px" }}
                            aria-hidden="true"
                          />
                        )}
                      </td>
                      <td>
                        <StatusBadge status={stockState} domain="stock" />
                      </td>
                      <td className="ew-table__cell--right">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Eye size={14} />}
                          onClick={() => setSelectedId(row.inventoryId)}
                        >
                          Xem
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InspectionDrawer
        isOpen={Boolean(selected)}
        title={selected ? `Tồn kho · ${selected.sku}` : ""}
        subtitle={selected ? `${selected.warehouseName} · Kệ ${selected.locationCode}` : undefined}
        headerBadge={
          selected ? (
            <StatusBadge
              status={getStockBadge(selected.availableQuantity, selected.lowStockThreshold)}
              domain="stock"
            />
          ) : undefined
        }
        onClose={() => setSelectedId(null)}
        footer={
          selected ? (
            <Button
              variant="primary"
              fullWidth
              leftIcon={<History size={15} />}
              onClick={() =>
                navigate(`${ROUTES.WAREHOUSE_STOCK_MOVEMENTS}?sku=${encodeURIComponent(selected.sku)}`)
              }
            >
              Xem Thẻ kho biến động cho SKU {selected.sku} (W4)
            </Button>
          ) : undefined
        }
      >
        {selected && (
          <>
            <div className="ew-drawer__section">
              <span className="ew-drawer__section-title">Số lượng chuẩn CSDL (Inventory)</span>
              <div className="ew-stat-pair ew-stat-pair--3 ks-tabular">
                <div className="ew-stat-tile">
                  <div className="ew-stat-tile__value">{selected.quantityOnHand}</div>
                  <div className="ew-stat-tile__label">Tồn thực (OnHand)</div>
                </div>
                <div className="ew-stat-tile">
                  <div className="ew-stat-tile__value" style={{ color: "var(--color-warning)" }}>
                    {selected.quantityReserved}
                  </div>
                  <div className="ew-stat-tile__label">Giữ chỗ (Reserved)</div>
                </div>
                <div className="ew-stat-tile">
                  <div className="ew-stat-tile__value" style={{ color: "var(--color-primary)" }}>
                    {selected.availableQuantity}
                  </div>
                  <div className="ew-stat-tile__label">Khả dụng (Available)</div>
                </div>
              </div>
            </div>

            <div className="ew-drawer__section">
              <span className="ew-drawer__section-title">Thông tin định danh vị trí</span>
              <div className="ew-info-list">
                <div className="ew-info-row">
                  <span className="ew-info-key">Sản phẩm</span>
                  <span className="ew-info-val">{selected.productName}</span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Biến thể</span>
                  <span className="ew-info-val">{selected.variantName}</span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Mã vạch (Barcode)</span>
                  <span className="ew-info-val ks-tabular">{selected.barcode || "—"}</span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Gian hàng sở hữu</span>
                  <span className="ew-info-val">{selected.shopName}</span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Phân khu lưu trữ</span>
                  <span className="ew-info-val">
                    {STORAGE_TYPE_META[selected.storageType].label}
                  </span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Cập nhật gần nhất</span>
                  <span className="ew-info-val ks-tabular">{formatDate(selected.updatedAt)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </InspectionDrawer>
    </section>
  );
};
