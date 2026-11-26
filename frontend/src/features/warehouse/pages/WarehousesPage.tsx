import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid2x2, MapPin, Plus, Warehouse } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/hooks/useToast";
import { useOperationsStore } from "@/services/operationsStore";
import { STORAGE_TYPE_META } from "@/types/operations";
import { formatDate } from "@/utils/formatters";

export const WarehousesPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const warehouses = useOperationsStore((s) => s.warehouses);
  const locations = useOperationsStore((s) => s.locations);
  const inventory = useOperationsStore((s) => s.inventory);
  const addWarehouse = useOperationsStore((s) => s.addWarehouse);

  const [openCreate, setOpenCreate] = useState(false);
  const [warehouseName, setWarehouseName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addWarehouse({ warehouseName, address });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    toast.success(res.message);
    setWarehouseName("");
    setAddress("");
    setError(null);
    setOpenCreate(false);
  };

  return (
    <section>
      <PageHeader
        title="Kho và vị trí"
        subtitle="Quản lý danh sách kho sàn (Platform) trên hệ thống và truy cập sơ đồ vị trí kệ 7 phân khu của từng kho."
        actions={
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setOpenCreate(true)}>
            Tạo kho sàn mới
          </Button>
        }
      />

      <MockDataNotice endpointHint="GET /api/v1/warehouses · POST /api/v1/warehouses" />

      {warehouses.length === 0 ? (
        <div className="ew-card">
          <EmptyState
            icon={<Warehouse size={28} />}
            title="Chưa có kho hàng nào"
            description="Tạo kho sàn đầu tiên để khai báo các vị trí kệ lưu trữ."
            action={
              <Button variant="primary" onClick={() => setOpenCreate(true)}>
                Tạo kho sàn mới
              </Button>
            }
          />
        </div>
      ) : (
        <div className="ew-hub-grid">
          {warehouses.map((wh) => {
            const whLocs = locations.filter((l) => l.warehouseId === wh.warehouseId);
            const sellableLocs = whLocs.filter((l) => l.isSellable).length;
            const whUnits = inventory
              .filter((inv) => inv.warehouseId === wh.warehouseId)
              .reduce((sum, inv) => sum + inv.quantityOnHand, 0);
            const distinctZones = Array.from(new Set(whLocs.map((l) => l.storageType)));

            return (
              <article
                key={wh.warehouseId}
                className="ew-card"
                style={{ display: "flex", flexDirection: "column" }}
              >
                <div className="ew-card-head">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Warehouse size={18} color="var(--color-primary)" aria-hidden="true" />
                    <span className="ks-tabular" style={{ fontWeight: 800, color: "var(--color-dark)" }}>
                      Kho #{wh.warehouseId}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <StatusBadge status={wh.warehouseType} />
                    <StatusBadge status={wh.isActive ? "Active" : "Inactive"} />
                  </div>
                </div>

                <div
                  className="ew-card-body"
                  style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}
                >
                  <div>
                    <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-dark)" }}>
                      {wh.warehouseName}
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "6px",
                        marginTop: "6px",
                        fontSize: "0.84rem",
                        color: "var(--color-muted)",
                      }}
                    >
                      <MapPin size={14} style={{ flexShrink: 0, marginTop: "3px" }} aria-hidden="true" />
                      <span>{wh.address}</span>
                    </div>
                  </div>

                  <div className="ew-info-list ks-tabular">
                    <div className="ew-info-row">
                      <span className="ew-info-key">Tổng vị trí kệ</span>
                      <span className="ew-info-val">
                        {whLocs.length} vị trí ({sellableLocs} bán được)
                      </span>
                    </div>
                    <div className="ew-info-row">
                      <span className="ew-info-key">Tổng tồn thực (OnHand)</span>
                      <span className="ew-info-val">{whUnits} SP</span>
                    </div>
                    <div className="ew-info-row">
                      <span className="ew-info-key">Ngày khởi tạo</span>
                      <span className="ew-info-val">{formatDate(wh.createdAt, { includeTime: false })}</span>
                    </div>
                  </div>

                  {distinctZones.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {distinctZones.map((zone) => (
                        <span key={zone} className="ew-chip">
                          <span
                            className="ew-zone-swatch"
                            style={{ backgroundColor: STORAGE_TYPE_META[zone].colorVar }}
                            aria-hidden="true"
                          />
                          <span>{STORAGE_TYPE_META[zone].shortLabel}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: "10px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/warehouse/warehouses/${wh.warehouseId}/locations`)}
                    >
                      Danh sách vị trí
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Grid2x2 size={14} />}
                      onClick={() =>
                        navigate(`/warehouse/warehouses/${wh.warehouseId}/locations?view=map`)
                      }
                    >
                      Sơ đồ 2D
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Khai báo kho sàn mới (Warehouses)"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenCreate(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Lưu kho mới
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="ew-notice ew-notice--info">
            Phạm vi MVP chỉ khởi tạo <strong>Kho sàn (Platform)</strong> — lưu trữ chung hàng hóa của nhiều người bán (<code>OwnerSellerId = NULL</code>).
          </div>

          <FormField label="Tên kho hàng (WarehouseName)" required>
            <Input
              placeholder="VD: Kho sàn Đà Nẵng"
              value={warehouseName}
              onChange={(e) => setWarehouseName(e.target.value)}
            />
          </FormField>

          <FormField label="Địa chỉ vận hành (Address)" required>
            <Input
              placeholder="Khu công nghiệp, Quận/Huyện, Tỉnh/Thành phố..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </FormField>

          {error && <p className="ew-field__error">{error}</p>}
        </form>
      </Modal>
    </section>
  );
};
