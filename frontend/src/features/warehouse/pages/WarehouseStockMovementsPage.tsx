import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileText, Lock, RotateCcw } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useOperationsStore } from "@/services/operationsStore";
import type { StockMovementRecordDto, StockMovementType } from "@/types/operations";
import { formatDate } from "@/utils/formatters";

const MOVEMENT_OPTIONS: Array<{ value: "ALL" | StockMovementType; label: string }> = [
  { value: "ALL", label: "Tất cả 9 loại biến động" },
  { value: "Receipt", label: "Nhập kho (Receipt)" },
  { value: "Issue", label: "Xuất kho (Issue)" },
  { value: "Reserve", label: "Giữ chỗ đơn (Reserve)" },
  { value: "ReleaseReserve", label: "Nhả giữ chỗ (ReleaseReserve)" },
  { value: "ReturnIn", label: "Nhập hàng hoàn (ReturnIn)" },
  { value: "Adjustment", label: "Điều chỉnh tồn (Adjustment)" },
  { value: "TransferIn", label: "Nhận điều chuyển (TransferIn)" },
  { value: "TransferOut", label: "Xuất điều chuyển (TransferOut)" },
  { value: "StockCount", label: "Kiểm kê kho (StockCount)" },
];

function formatDelta(val: number): string {
  if (val > 0) return `+${val}`;
  return String(val);
}

function getReferenceLink(m: StockMovementRecordDto): string | null {
  if (m.referenceType === "Receipt") return `/warehouse/receipts/${m.referenceId}`;
  if (m.referenceType === "Issue") return `/warehouse/issues/${m.referenceId}`;
  if (m.referenceType === "ReturnRequest") return `/warehouse/returns`;
  return null;
}

export const WarehouseStockMovementsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const movements = useOperationsStore((s) => s.stockMovements);

  const [query, setQuery] = useState(searchParams.get("sku") ?? "");
  const [movementType, setMovementType] = useState<"ALL" | StockMovementType>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movements.filter((m) => {
      if (movementType !== "ALL" && m.movementType !== movementType) return false;
      if (fromDate && m.createdAt.slice(0, 10) < fromDate) return false;
      if (toDate && m.createdAt.slice(0, 10) > toDate) return false;
      if (!q) return true;
      return (
        m.sku.toLowerCase().includes(q) ||
        m.productName.toLowerCase().includes(q) ||
        m.locationCode.toLowerCase().includes(q) ||
        m.referenceCode.toLowerCase().includes(q) ||
        m.createdByName.toLowerCase().includes(q)
      );
    });
  }, [movements, movementType, fromDate, toDate, query]);

  return (
    <section>
      <PageHeader
        title="Thẻ kho (Sổ cái StockMovements)"
        subtitle="Sổ cái biến động tồn kho chỉ-thêm (append-only): tách rõ biến động OnHand và Reserved cùng chứng từ gốc & người thực hiện."
        badge={
          <span className="ew-chip">
            <Lock size={12} aria-hidden="true" />
            <span>Bất biến · Không sửa/xóa</span>
          </span>
        }
      />

      <MockDataNotice endpointHint="GET /api/v1/stock-movements?variantId&from&to" />

      <div className="ew-card ew-toolbar" style={{ marginBottom: "16px", flexWrap: "wrap" }}>
        <div className="ew-toolbar__search">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Tìm theo SKU, vị trí kệ, chứng từ (PN/PX/RMA) hoặc người thực hiện..."
            ariaLabel="Tìm kiếm thẻ kho"
          />
        </div>

        <div className="ew-toolbar__select">
          <Select
            aria-label="Lọc loại biến động"
            value={movementType}
            options={MOVEMENT_OPTIONS}
            onChange={(e) => setMovementType(e.target.value as "ALL" | StockMovementType)}
          />
        </div>

        <div className="ew-date-range">
          <Input
            type="date"
            aria-label="Từ ngày"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ width: "155px" }}
          />
          <span style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>→</span>
          <Input
            type="date"
            aria-label="Đến ngày"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ width: "155px" }}
          />
        </div>

        {(query || movementType !== "ALL" || fromDate || toDate) && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} />}
            onClick={() => {
              setQuery("");
              setMovementType("ALL");
              setFromDate("");
              setToDate("");
            }}
          >
            Đặt lại
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="ew-card">
          <EmptyState
            icon={<FileText size={28} />}
            title="Chưa có bút toán thẻ kho phù hợp"
            description="Xác nhận phiếu nhập (W5), xuất kho (W6) hoặc kiểm hàng trả (W9) để hệ thống tự động ghi sổ cái."
          />
        </div>
      ) : (
        <div className="ew-card">
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>SKU / Vị trí kệ</th>
                  <th>Loại biến động</th>
                  <th className="ew-table__cell--right">Δ Tồn thực (OnHand)</th>
                  <th className="ew-table__cell--right">Δ Giữ chỗ (Reserved)</th>
                  <th className="ew-table__cell--right">Tồn sau (OnHand / Res)</th>
                  <th>Chứng từ gốc</th>
                  <th>Người thực hiện</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const refLink = getReferenceLink(m);
                  const onHandColor =
                    m.onHandChange > 0
                      ? "var(--color-primary)"
                      : m.onHandChange < 0
                        ? "var(--color-danger)"
                        : "var(--color-muted)";
                  const resColor =
                    m.reservedChange > 0
                      ? "var(--color-warning)"
                      : m.reservedChange < 0
                        ? "var(--color-info)"
                        : "var(--color-muted)";
                  return (
                    <tr key={m.stockMovementId}>
                      <td className="ks-tabular" style={{ whiteSpace: "nowrap", fontSize: "0.82rem" }}>
                        {formatDate(m.createdAt)}
                      </td>
                      <td>
                        <div className="ks-tabular" style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                          {m.sku} · {m.locationCode}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--color-muted)" }}>
                          {m.productName}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={m.movementType} />
                      </td>
                      <td
                        className="ew-table__cell--right ks-tabular"
                        style={{ fontWeight: 800, color: onHandColor }}
                      >
                        {formatDelta(m.onHandChange)}
                      </td>
                      <td
                        className="ew-table__cell--right ks-tabular"
                        style={{ fontWeight: 700, color: resColor }}
                      >
                        {formatDelta(m.reservedChange)}
                      </td>
                      <td className="ew-table__cell--right ks-tabular">
                        <strong>{m.onHandAfter}</strong>{" "}
                        <span style={{ color: "var(--color-muted)" }}>/ {m.reservedAfter}</span>
                      </td>
                      <td className="ks-tabular">
                        {refLink ? (
                          <Link
                            to={refLink}
                            style={{ fontWeight: 700, color: "var(--color-primary)", textDecoration: "underline" }}
                          >
                            {m.referenceCode}
                          </Link>
                        ) : (
                          <span style={{ fontWeight: 600 }}>{m.referenceCode}</span>
                        )}
                        <div style={{ fontSize: "0.74rem", color: "var(--color-muted)" }}>
                          {m.referenceType}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.84rem", fontWeight: 600 }}>{m.createdByName}</div>
                        {m.note && (
                          <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", maxWidth: "240px" }}>
                            {m.note}
                          </div>
                        )}
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
