import React, { useMemo, useState } from "react";
import { AlertTriangle, Boxes, RotateCcw, Warehouse } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSellerShopsQuery } from "@/features/seller/hooks/useSellerCatalog";
import { useOperationsStore } from "@/services/operationsStore";
import { STORAGE_TYPE_META } from "@/types/operations";
import { formatDate } from "@/utils/formatters";

export const SellerInventoryPage: React.FC = () => {
  const inventory = useOperationsStore((s) => s.inventory);
  const shopsQuery = useSellerShopsQuery();

  const [query, setQuery] = useState("");
  const [shopFilter, setShopFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "LOW" | "OUT">("ALL");

  const myInventory = useMemo(
    () => inventory.filter((row) => row.sellerId === 1),
    [inventory]
  );

  const shopOptions = useMemo(() => {
    const apiShops = (shopsQuery.data ?? []).map((s) => ({
      value: String(s.shopId),
      label: s.shopName,
    }));
    const fallbackNames = Array.from(new Set(myInventory.map((i) => i.shopName)));
    if (apiShops.length > 0) {
      return [{ value: "ALL", label: "Tất cả gian hàng" }, ...apiShops];
    }
    return [
      { value: "ALL", label: "Tất cả gian hàng" },
      ...fallbackNames.map((name, idx) => ({ value: String(idx + 1), label: name })),
    ];
  }, [shopsQuery.data, myInventory]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return myInventory.filter((row) => {
      if (shopFilter !== "ALL" && String(row.shopId) !== shopFilter) return false;
      if (stockFilter === "OUT" && row.availableQuantity > 0) return false;
      if (
        stockFilter === "LOW" &&
        !(row.availableQuantity > 0 && row.availableQuantity <= row.lowStockThreshold)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        row.sku.toLowerCase().includes(q) ||
        row.productName.toLowerCase().includes(q) ||
        row.locationCode.toLowerCase().includes(q)
      );
    });
  }, [myInventory, shopFilter, stockFilter, query]);

  const totals = useMemo(
    () => ({
      onHand: myInventory.reduce((sum, r) => sum + r.quantityOnHand, 0),
      reserved: myInventory.reduce((sum, r) => sum + r.quantityReserved, 0),
      available: myInventory.reduce((sum, r) => sum + r.availableQuantity, 0),
      lowOrOut: myInventory.filter((r) => r.availableQuantity <= r.lowStockThreshold).length,
    }),
    [myInventory]
  );

  const getStockStatus = (available: number, threshold: number) => {
    if (available <= 0) return "OutOfStock";
    if (available <= threshold) return "LowStock";
    return "InStock";
  };

  return (
    <section>
      <PageHeader
        title="Tồn kho của tôi"
        subtitle="Theo dõi số lượng tồn thực tế, đang giữ chỗ và tồn khả dụng của từng biến thể tại Kho sàn (chỉ xem)."
      />

      <MockDataNotice endpointHint="GET /api/v1/inventory?variantId= (lọc tự động theo Seller đang đăng nhập)" />

      {/* Summary KPIs */}
      <div className="ew-kpi-grid">
        <div className="ew-kpi-card">
          <span className="ew-kpi-label">Tổng tồn thực (OnHand)</span>
          <span className="ew-kpi-value ks-tabular">{totals.onHand} SP</span>
          <span className="ew-kpi-sub">{myInventory.length} vị trí lưu trữ tại Kho sàn</span>
        </div>
        <div className="ew-kpi-card">
          <span className="ew-kpi-label">Đang giữ chỗ (Reserved)</span>
          <span className="ew-kpi-value ew-kpi-value--warning ks-tabular">{totals.reserved} SP</span>
          <span className="ew-kpi-sub">Giữ cho các đơn chờ xuất kho</span>
        </div>
        <div className="ew-kpi-card">
          <span className="ew-kpi-label">Khả dụng bán (Available)</span>
          <span className="ew-kpi-value ew-kpi-value--primary ks-tabular">{totals.available} SP</span>
          <span className="ew-kpi-sub">Tính từ server (OnHand − Reserved)</span>
        </div>
        <div className="ew-kpi-card">
          <span className="ew-kpi-label">Biến thể cần chú ý</span>
          <span className="ew-kpi-value ew-kpi-value--danger ks-tabular">{totals.lowOrOut} SKU</span>
          <span className="ew-kpi-sub">Sắp hết hoặc đã hết hàng khả dụng</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="ew-card ew-toolbar" style={{ marginBottom: "16px" }}>
        <div className="ew-toolbar__search">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Tìm theo SKU, tên sản phẩm hoặc mã vị trí kệ (VD: A-01-01)..."
            ariaLabel="Tìm kiếm tồn kho của tôi"
          />
        </div>
        <div className="ew-toolbar__select">
          <Select
            aria-label="Lọc theo shop"
            value={shopFilter}
            options={shopOptions}
            onChange={(e) => setShopFilter(e.target.value)}
          />
        </div>
        <div className="ew-toolbar__select">
          <Select
            aria-label="Lọc tình trạng tồn"
            value={stockFilter}
            options={[
              { value: "ALL", label: "Tất cả mức tồn" },
              { value: "LOW", label: "Sắp hết hàng" },
              { value: "OUT", label: "Hết hàng (0 khả dụng)" },
            ]}
            onChange={(e) => setStockFilter(e.target.value as "ALL" | "LOW" | "OUT")}
          />
        </div>
        {(query || shopFilter !== "ALL" || stockFilter !== "ALL") && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} />}
            onClick={() => {
              setQuery("");
              setShopFilter("ALL");
              setStockFilter("ALL");
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
            description="Thử điều chỉnh bộ lọc gian hàng hoặc từ khóa tìm kiếm."
          />
        </div>
      ) : (
        <div className="ew-card">
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Biến thể (SKU / Sản phẩm)</th>
                  <th>Kho &amp; Vị trí kệ</th>
                  <th className="ew-table__cell--right">Tồn thực (OnHand)</th>
                  <th className="ew-table__cell--right">Giữ chỗ (Reserved)</th>
                  <th className="ew-table__cell--right">Khả dụng (Available)</th>
                  <th>Tình trạng</th>
                  <th>Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const status = getStockStatus(row.availableQuantity, row.lowStockThreshold);
                  const rowClass =
                    status === "OutOfStock"
                      ? "ew-row-highlight-danger"
                      : status === "LowStock"
                        ? "ew-row-highlight-warn"
                        : "";
                  return (
                    <tr key={row.inventoryId} className={rowClass}>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                          {row.productName}
                        </div>
                        <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                          SKU: <strong>{row.sku}</strong> · {row.variantName} · {row.shopName}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                          <Warehouse size={14} color="var(--color-primary)" aria-hidden="true" />
                          <span className="ks-tabular">{row.locationCode}</span>
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
                            status === "OutOfStock"
                              ? "var(--color-danger)"
                              : status === "LowStock"
                                ? "var(--color-warning)"
                                : "var(--color-primary)",
                        }}
                      >
                        {row.availableQuantity}
                        {status !== "InStock" && (
                          <AlertTriangle
                            size={13}
                            style={{ display: "inline", marginLeft: "4px", verticalAlign: "-2px" }}
                            aria-hidden="true"
                          />
                        )}
                      </td>
                      <td>
                        <StatusBadge status={status} domain="stock" />
                      </td>
                      <td className="ks-tabular" style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {formatDate(row.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
