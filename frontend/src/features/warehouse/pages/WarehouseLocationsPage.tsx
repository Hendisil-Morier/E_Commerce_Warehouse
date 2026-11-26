import React, { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Grid2x2,
  List,
  Lock,
  Plus,
  Power,
  ShieldAlert,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { useToast } from "@/hooks/useToast";
import { useOperationsStore } from "@/services/operationsStore";
import {
  NON_SELLABLE_STORAGE_TYPES,
  STORAGE_TYPE_META,
  type StorageType,
} from "@/types/operations";

const ALL_STORAGE_TYPES: StorageType[] = [
  "Standard",
  "Cold",
  "Fragile",
  "Hazardous",
  "Inbound",
  "Returns",
  "Damaged",
];

export const WarehouseLocationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const warehouses = useOperationsStore((s) => s.warehouses);
  const locations = useOperationsStore((s) => s.locations);
  const inventory = useOperationsStore((s) => s.inventory);
  const addLocation = useOperationsStore((s) => s.addLocation);
  const toggleLocationActive = useOperationsStore((s) => s.toggleLocationActive);

  const warehouseId = Number(id) || warehouses[0]?.warehouseId || 1;
  const warehouse = warehouses.find((w) => w.warehouseId === warehouseId);

  const viewMode: "list" | "map" = searchParams.get("view") === "map" ? "map" : "list";
  const [zoneFilter, setZoneFilter] = useState<"ALL" | StorageType>("ALL");
  const [query, setQuery] = useState("");
  const [selectedLocId, setSelectedLocId] = useState<number | null>(null);

  // Create Location modal state
  const [openAdd, setOpenAdd] = useState(false);
  const [locCode, setLocCode] = useState("");
  const [storageType, setStorageType] = useState<StorageType>("Standard");
  const [isSellable, setIsSellable] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const whLocations = useMemo(
    () => locations.filter((l) => l.warehouseId === warehouseId),
    [locations, warehouseId]
  );

  const filteredLocations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return whLocations.filter((loc) => {
      if (zoneFilter !== "ALL" && loc.storageType !== zoneFilter) return false;
      if (!q) return true;
      const itemsInBin = inventory.filter((inv) => inv.locationId === loc.locationId);
      return (
        loc.locationCode.toLowerCase().includes(q) ||
        loc.storageType.toLowerCase().includes(q) ||
        itemsInBin.some((inv) => inv.sku.toLowerCase().includes(q))
      );
    });
  }, [whLocations, zoneFilter, query, inventory]);

  const activeBin =
    filteredLocations.find((l) => l.locationId === selectedLocId) ??
    filteredLocations[0] ??
    null;

  const isForcedNonSellable = NON_SELLABLE_STORAGE_TYPES.includes(storageType);

  const handleStorageTypeChange = (nextType: StorageType) => {
    setStorageType(nextType);
    if (NON_SELLABLE_STORAGE_TYPES.includes(nextType)) {
      setIsSellable(false);
    } else {
      setIsSellable(true);
    }
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addLocation({
      warehouseId,
      locationCode: locCode,
      storageType,
      isSellable: isForcedNonSellable ? false : isSellable,
    });
    if (!res.ok) {
      setFormError(res.message);
      return;
    }
    toast.success(res.message);
    setLocCode("");
    setStorageType("Standard");
    setIsSellable(true);
    setFormError(null);
    setOpenAdd(false);
  };

  const setView = (mode: "list" | "map") => {
    const next = new URLSearchParams(searchParams);
    next.set("view", mode);
    setSearchParams(next, { replace: true });
  };

  return (
    <section>
      <Link to={ROUTES.WAREHOUSE_LIST} className="ew-back-link">
        <ArrowLeft size={15} aria-hidden="true" />
        <span>Quay lại Danh sách kho (W2a)</span>
      </Link>

      <PageHeader
        title={`Vị trí kệ · ${warehouse?.warehouseName ?? `Kho #${warehouseId}`}`}
        subtitle="Quản lý tọa độ vị trí kệ (WarehouseLocations) theo 7 loại phân khu chuẩn CSDL và chuyển đổi trực tiếp giữa Danh sách & Sơ đồ 2D."
        actions={
          <>
            <div className="ew-segmented" role="group" aria-label="Chế độ hiển thị vị trí kệ">
              <button
                type="button"
                className={`ew-segmented__btn ${
                  viewMode === "list" ? "ew-segmented__btn--active" : ""
                }`}
                onClick={() => setView("list")}
              >
                <List size={15} aria-hidden="true" />
                <span>Danh sách bảng</span>
              </button>
              <button
                type="button"
                className={`ew-segmented__btn ${
                  viewMode === "map" ? "ew-segmented__btn--active" : ""
                }`}
                onClick={() => setView("map")}
              >
                <Grid2x2 size={15} aria-hidden="true" />
                <span>Sơ đồ 2D (7 màu)</span>
              </button>
            </div>

            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setOpenAdd(true)}>
              Thêm vị trí kệ
            </Button>
          </>
        }
      />

      <MockDataNotice endpointHint={`GET/POST /api/v1/warehouses/${warehouseId}/locations`} />

      {/* 7 Chromatic Zone Filter Legend */}
      <div className="ew-zone-legend" role="group" aria-label="Bộ lọc 7 phân khu StorageType">
        <button
          type="button"
          className={`ew-zone-filter-btn ${
            zoneFilter === "ALL" ? "ew-zone-filter-btn--active" : ""
          }`}
          onClick={() => setZoneFilter("ALL")}
        >
          <Grid2x2 size={14} aria-hidden="true" />
          <span>Tất cả ({whLocations.length})</span>
        </button>
        {ALL_STORAGE_TYPES.map((zone) => {
          const meta = STORAGE_TYPE_META[zone];
          const count = whLocations.filter((l) => l.storageType === zone).length;
          return (
            <button
              key={zone}
              type="button"
              className={`ew-zone-filter-btn ${
                zoneFilter === zone ? "ew-zone-filter-btn--active" : ""
              }`}
              onClick={() => setZoneFilter(zone)}
            >
              <span
                className="ew-zone-swatch"
                style={{ backgroundColor: meta.colorVar }}
                aria-hidden="true"
              />
              <span>
                {meta.shortLabel} ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="ew-card ew-toolbar" style={{ marginBottom: "16px" }}>
        <div className="ew-toolbar__search">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Tìm theo mã vị trí kệ (VD: A-01-01, INBOUND-01) hoặc SKU đang chứa..."
            ariaLabel="Tìm kiếm vị trí kệ"
          />
        </div>
      </div>

      {filteredLocations.length === 0 ? (
        <div className="ew-card">
          <EmptyState
            icon={<Grid2x2 size={28} />}
            title="Không tìm thấy vị trí kệ phù hợp"
            description="Thử chọn phân khu khác hoặc thêm mới vị trí kệ cho kho này."
          />
        </div>
      ) : viewMode === "list" ? (
        /* ---------- VIEW 1: Bảng danh sách WarehouseLocations ---------- */
        <div className="ew-card">
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Mã vị trí (LocationCode)</th>
                  <th>Loại khu (StorageType)</th>
                  <th>Bán được (IsSellable)</th>
                  <th>Hàng đang lưu trữ</th>
                  <th className="ew-table__cell--right">Tổng tồn thực</th>
                  <th>Trạng thái</th>
                  <th className="ew-table__cell--right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map((loc) => {
                  const meta = STORAGE_TYPE_META[loc.storageType];
                  const itemsInLoc = inventory.filter((inv) => inv.locationId === loc.locationId);
                  const totalUnits = itemsInLoc.reduce((s, i) => s + i.quantityOnHand, 0);
                  return (
                    <tr key={loc.locationId}>
                      <td className="ks-tabular" style={{ fontWeight: 800, color: "var(--color-dark)" }}>
                        {loc.locationCode}
                      </td>
                      <td>
                        <span className="ew-chip">
                          <span
                            className="ew-zone-swatch"
                            style={{ backgroundColor: meta.colorVar }}
                            aria-hidden="true"
                          />
                          <span>{meta.label}</span>
                        </span>
                      </td>
                      <td>
                        {loc.isSellable ? (
                          <span className="ew-chip ew-chip--sellable">Bán được</span>
                        ) : (
                          <span className="ew-chip ew-chip--nonsellable">
                            <Lock size={11} aria-hidden="true" />
                            <span>Không bán được</span>
                          </span>
                        )}
                      </td>
                      <td className="ks-tabular" style={{ fontSize: "0.84rem" }}>
                        {itemsInLoc.length === 0
                          ? "Ô trống"
                          : itemsInLoc.map((i) => i.sku).join(", ")}
                      </td>
                      <td className="ew-table__cell--right ks-tabular" style={{ fontWeight: 700 }}>
                        {totalUnits} SP
                      </td>
                      <td>
                        <StatusBadge status={loc.isActive ? "Active" : "Inactive"} />
                      </td>
                      <td className="ew-table__cell--right">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Power size={13} />}
                          onClick={() => {
                            const res = toggleLocationActive(loc.locationId);
                            if (res.ok) toast.info(res.message);
                          }}
                        >
                          {loc.isActive ? "Ngừng dùng" : "Kích hoạt"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ---------- VIEW 2: Sơ đồ Kho 2D 7 màu + Inspector ---------- */
        <div className="ew-binmap-layout">
          <div className="ew-bin-grid">
            {filteredLocations.map((loc) => {
              const meta = STORAGE_TYPE_META[loc.storageType];
              const itemsInLoc = inventory.filter((inv) => inv.locationId === loc.locationId);
              const totalUnits = itemsInLoc.reduce((s, i) => s + i.quantityOnHand, 0);
              const isSelected = activeBin?.locationId === loc.locationId;
              return (
                <button
                  key={loc.locationId}
                  type="button"
                  aria-pressed={isSelected}
                  className={`ew-bin-cell ${meta.cssClass} ${
                    itemsInLoc.length === 0 ? "ew-bin-cell--empty" : ""
                  } ${!loc.isActive ? "ew-bin-cell--inactive" : ""} ${
                    isSelected ? "ew-bin-cell--selected" : ""
                  }`}
                  onClick={() => setSelectedLocId(loc.locationId)}
                >
                  <div>
                    <div className="ew-bin-coord ks-tabular">
                      <span>{loc.locationCode}</span>
                      {!loc.isSellable && (
                        <Lock size={13} color="var(--color-danger)" aria-label="Không bán được" />
                      )}
                    </div>
                    <div className="ew-bin-sku ks-tabular">
                      {itemsInLoc.length === 0
                        ? "Ô kệ trống"
                        : itemsInLoc.map((i) => i.sku).join(", ")}
                    </div>
                  </div>

                  <div className="ew-bin-cap-row ks-tabular">
                    <div className="ew-bin-cap-text">
                      <span>{meta.shortLabel}</span>
                      <strong>{totalUnits} SP</strong>
                    </div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: loc.isSellable ? "var(--color-success-text)" : "var(--color-rejected-text)" }}>
                      {loc.isSellable ? "Tính vào tồn bán" : "Không bán được"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Inspector Card */}
          {activeBin && (
            <aside className="ew-card" aria-label="Chi tiết vị trí kệ đang chọn">
              <div className="ew-card-head">
                <h2 className="ew-card-title ks-tabular">Kệ {activeBin.locationCode}</h2>
                <StatusBadge status={activeBin.isActive ? "Active" : "Inactive"} />
              </div>
              <div className="ew-card-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="ew-info-list">
                  <div className="ew-info-row">
                    <span className="ew-info-key">Phân khu (StorageType)</span>
                    <span className="ew-info-val">
                      {STORAGE_TYPE_META[activeBin.storageType].label}
                    </span>
                  </div>
                  <div className="ew-info-row">
                    <span className="ew-info-key">Tính vào tồn bán (IsSellable)</span>
                    <span className="ew-info-val">
                      {activeBin.isSellable ? "Có (Bán được)" : "Không (Khóa bán)"}
                    </span>
                  </div>
                </div>

                {!activeBin.isSellable && (
                  <div className="ew-notice ew-notice--warning">
                    <div className="ew-notice__head">
                      <ShieldAlert size={14} aria-hidden="true" />
                      <span>Khu vực đặc biệt (CK_Locations_Sellable)</span>
                    </div>
                    Hàng hóa tại khu <strong>{activeBin.storageType}</strong> không bao giờ được tính vào tồn khả dụng bán trên Storefront.
                  </div>
                )}

                <div>
                  <span className="ew-drawer__section-title">Biến thể đang lưu tại kệ</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                    {inventory.filter((i) => i.locationId === activeBin.locationId).length === 0 ? (
                      <p style={{ fontSize: "0.84rem", color: "var(--color-muted)" }}>
                        Chưa có tồn kho tại vị trí này.
                      </p>
                    ) : (
                      inventory
                        .filter((i) => i.locationId === activeBin.locationId)
                        .map((inv) => (
                          <div key={inv.inventoryId} className="ew-line-item">
                            <div>
                              <div className="ew-line-item__title ks-tabular">{inv.sku}</div>
                              <div className="ew-line-item__meta">{inv.productName}</div>
                            </div>
                            <div className="ks-tabular" style={{ textAlign: "right", fontSize: "0.82rem" }}>
                              <div><strong>{inv.quantityOnHand}</strong> thực</div>
                              <div style={{ color: "var(--color-primary)" }}>
                                {inv.availableQuantity} khả dụng
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  fullWidth
                  leftIcon={<Power size={14} />}
                  onClick={() => {
                    const res = toggleLocationActive(activeBin.locationId);
                    if (res.ok) toast.info(res.message);
                  }}
                >
                  {activeBin.isActive ? "Tạm ngừng sử dụng kệ này" : "Kích hoạt lại kệ này"}
                </Button>
              </div>
            </aside>
          )}
        </div>
      )}

      {/* Modal: Thêm vị trí kệ mới */}
      <Modal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        title="Thêm vị trí kệ mới (WarehouseLocations)"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenAdd(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleAddLocation}>
              Lưu vị trí kệ
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddLocation} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <FormField label="Mã vị trí kệ (LocationCode)" required hint="VD: A-01-04, C-01-02, INBOUND-02">
            <Input
              placeholder="A-01-04"
              value={locCode}
              onChange={(e) => setLocCode(e.target.value)}
            />
          </FormField>

          <FormField label="Loại khu vực lưu trữ (StorageType)" required>
            <Select
              value={storageType}
              options={ALL_STORAGE_TYPES.map((t) => ({
                value: t,
                label: STORAGE_TYPE_META[t].label,
              }))}
              onChange={(e) => handleStorageTypeChange(e.target.value as StorageType)}
            />
          </FormField>

          <label className="ew-checkbox-row" style={{ opacity: isForcedNonSellable ? 0.72 : 1 }}>
            <input
              type="checkbox"
              checked={isForcedNonSellable ? false : isSellable}
              disabled={isForcedNonSellable}
              onChange={(e) => setIsSellable(e.target.checked)}
            />
            <span>
              <strong>Tính vào tồn kho bán được (IsSellable)</strong>
              <br />
              <span style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                {isForcedNonSellable
                  ? "Khu Inbound, Returns, Damaged bị khóa cứng Không bán được theo ràng buộc CSDL."
                  : "Bỏ chọn nếu đây là kệ dự trữ chưa mở bán."}
              </span>
            </span>
          </label>

          {formError && <p className="ew-field__error">{formError}</p>}
        </form>
      </Modal>
    </section>
  );
};
