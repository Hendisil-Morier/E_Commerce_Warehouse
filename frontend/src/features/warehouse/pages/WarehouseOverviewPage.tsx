import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Barcode,
  Boxes,
  FileText,
  Grid2x2,
  PackageCheck,
  Truck,
  Warehouse,
} from "lucide-react";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { useOperationsStore } from "@/services/operationsStore";
import { ISSUE_TYPE_LABELS } from "@/types/operations";
import { formatDate } from "@/utils/formatters";

export const WarehouseOverviewPage: React.FC = () => {
  const navigate = useNavigate();

  const warehouses = useOperationsStore((s) => s.warehouses);
  const locations = useOperationsStore((s) => s.locations);
  const inventory = useOperationsStore((s) => s.inventory);
  const receipts = useOperationsStore((s) => s.receipts);
  const issues = useOperationsStore((s) => s.issues);
  const returns = useOperationsStore((s) => s.returns);

  const draftIssuesCount = issues.filter((i) => i.status === "Draft").length;
  const pickIssuesCount = issues.filter((i) => i.status === "Approved" || i.status === "Picking").length;
  const packedIssuesCount = issues.filter((i) => i.status === "Packed").length;
  const draftReceiptsCount = receipts.filter((r) => r.status === "Draft").length;
  const lowStockCount = inventory.filter((i) => i.availableQuantity <= i.lowStockThreshold).length;
  const pendingReturnsCount = returns.filter(
    (r) => r.status === "Approved" || r.status === "ItemsReceived"
  ).length;

  const firstPickingIssue =
    issues.find((i) => i.status === "Picking") ?? issues.find((i) => i.status === "Approved") ?? issues[0];
  const primaryWarehouse = warehouses[0];

  return (
    <section>
      <PageHeader
        title="Tổng quan vận hành kho (WMS)"
        subtitle="Theo dõi nhanh phiếu xuất cần duyệt/soạn/xuất, phiếu nhập Draft chờ xác nhận tách quyền, tồn kho thấp và hàng trả chờ kiểm."
        actions={
          <>
            {primaryWarehouse && (
              <Button
                variant="secondary"
                leftIcon={<Grid2x2 size={16} />}
                onClick={() =>
                  navigate(`/warehouse/warehouses/${primaryWarehouse.warehouseId}/locations?view=map`)
                }
              >
                Sơ đồ Kho 2D
              </Button>
            )}
            {firstPickingIssue && (
              <Button
                variant="primary"
                leftIcon={<Barcode size={16} />}
                onClick={() => navigate(`/warehouse/issues/${firstPickingIssue.issueId}/pick`)}
              >
                Mở trạm soạn hàng (W7)
              </Button>
            )}
          </>
        }
      />

      <MockDataNotice endpointHint="GET /api/v1/issues · /receipts · /inventory · /returns" />

      {/* 5-KPI Strip matching W1 spec */}
      <div className="ew-kpi-grid ew-kpi-grid--5">
        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(`${ROUTES.WAREHOUSE_ISSUES}?status=Draft`)}
        >
          <span className="ew-kpi-label">Phiếu xuất cần duyệt</span>
          <span className="ew-kpi-value ew-kpi-value--warning ks-tabular">{draftIssuesCount}</span>
          <span className="ew-kpi-sub">Trạng thái Draft · cần duyệt</span>
        </button>

        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(`${ROUTES.WAREHOUSE_ISSUES}?status=Picking`)}
        >
          <span className="ew-kpi-label">Cần soạn / Đang soạn</span>
          <span className="ew-kpi-value ew-kpi-value--primary ks-tabular">{pickIssuesCount}</span>
          <span className="ew-kpi-sub">Approved &amp; Picking tại kệ</span>
        </button>

        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(`${ROUTES.WAREHOUSE_ISSUES}?status=Packed`)}
        >
          <span className="ew-kpi-label">Đã đóng gói chờ xuất</span>
          <span className="ew-kpi-value ks-tabular">{packedIssuesCount}</span>
          <span className="ew-kpi-sub">Packed · sẵn sàng Dispatched</span>
        </button>

        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(`${ROUTES.WAREHOUSE_RECEIPTS}?status=Draft`)}
        >
          <span className="ew-kpi-label">Phiếu nhập chờ xác nhận</span>
          <span className="ew-kpi-value ew-kpi-value--warning ks-tabular">{draftReceiptsCount}</span>
          <span className="ew-kpi-sub">Draft · áp dụng tách quyền WM</span>
        </button>

        <button
          type="button"
          className="ew-kpi-card ew-kpi-card--interactive"
          onClick={() => navigate(ROUTES.WAREHOUSE_RETURNS)}
        >
          <span className="ew-kpi-label">Hàng trả chờ nhận/kiểm</span>
          <span className="ew-kpi-value ew-kpi-value--danger ks-tabular">{pendingReturnsCount}</span>
          <span className="ew-kpi-sub">{lowStockCount} biến thể sắp hết tồn</span>
        </button>
      </div>

      {/* Quick Access Strip */}
      <div className="ew-quick-grid">
        <button
          type="button"
          className="ew-quick-card"
          onClick={() => navigate(ROUTES.WAREHOUSE_LIST)}
        >
          <span className="ew-quick-card__icon">
            <Warehouse size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="ew-quick-card__title">Kho &amp; Vị trí (W2)</div>
            <div className="ew-quick-card__sub">
              {warehouses.length} kho sàn · {locations.length} vị trí kệ 7 phân khu
            </div>
          </div>
        </button>

        <button
          type="button"
          className="ew-quick-card"
          onClick={() => navigate(ROUTES.WAREHOUSE_INVENTORY)}
        >
          <span className="ew-quick-card__icon">
            <Boxes size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="ew-quick-card__title">Tồn kho theo kệ (W3)</div>
            <div className="ew-quick-card__sub">
              OnHand · Reserved · Available · {lowStockCount} SKU sắp hết
            </div>
          </div>
        </button>

        <button
          type="button"
          className="ew-quick-card"
          onClick={() => navigate(ROUTES.WAREHOUSE_STOCK_MOVEMENTS)}
        >
          <span className="ew-quick-card__icon ew-quick-card__icon--info">
            <FileText size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="ew-quick-card__title">Thẻ kho sổ cái (W4)</div>
            <div className="ew-quick-card__sub">Nhật ký bất biến OnHand / Reserved</div>
          </div>
        </button>

        <button
          type="button"
          className="ew-quick-card"
          onClick={() => navigate(ROUTES.WAREHOUSE_SHIPMENTS)}
        >
          <span className="ew-quick-card__icon ew-quick-card__icon--warning">
            <Truck size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="ew-quick-card__title">Quản lý Vận đơn (W8)</div>
            <div className="ew-quick-card__sub">GHN, GHTK, VTP, J&amp;T, SPX Express</div>
          </div>
        </button>
      </div>

      {/* 2 Operational Queues */}
      <div className="ew-split-2">
        <div className="ew-card">
          <div className="ew-card-head">
            <h2 className="ew-card-title">
              <ArrowUpFromLine size={17} color="var(--color-primary)" aria-hidden="true" />
              <span>Hàng đợi Phiếu xuất kho (W6)</span>
            </h2>
            <Link to={ROUTES.WAREHOUSE_ISSUES} className="ew-back-link" style={{ marginBottom: 0 }}>
              <span>Xem tất cả</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Mã phiếu / Loại</th>
                  <th>Đơn con gốc</th>
                  <th className="ew-table__cell--center">Tiến độ soạn</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {issues.slice(0, 5).map((iss) => {
                  const totalQty = iss.details.reduce((s, d) => s + d.quantity, 0);
                  const pickedQty = iss.details.reduce((s, d) => s + d.pickedQuantity, 0);
                  return (
                    <tr
                      key={iss.issueId}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/warehouse/issues/${iss.issueId}`)}
                    >
                      <td>
                        <div className="ks-tabular" style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                          {iss.issueCode}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--color-muted)" }}>
                          {ISSUE_TYPE_LABELS[iss.issueType]}
                        </div>
                      </td>
                      <td className="ks-tabular">{iss.sellerOrderCode ?? "Xuất nội bộ"}</td>
                      <td className="ew-table__cell--center ks-tabular">
                        <strong>{pickedQty}</strong> / {totalQty}
                      </td>
                      <td>
                        <StatusBadge status={iss.status} domain="issue" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ew-card">
          <div className="ew-card-head">
            <h2 className="ew-card-title">
              <ArrowDownToLine size={17} color="var(--color-primary)" aria-hidden="true" />
              <span>Phiếu nhập kho gần nhất (W5)</span>
            </h2>
            <Link to={ROUTES.WAREHOUSE_RECEIPTS} className="ew-back-link" style={{ marginBottom: 0 }}>
              <span>Xem tất cả</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Mã phiếu nhập</th>
                  <th>Người tạo / Ngày</th>
                  <th className="ew-table__cell--center">SL dòng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {receipts.slice(0, 5).map((rec) => (
                  <tr
                    key={rec.receiptId}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/warehouse/receipts/${rec.receiptId}`)}
                  >
                    <td>
                      <div className="ks-tabular" style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                        {rec.receiptCode}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "var(--color-muted)" }}>
                        {rec.senderSellerName ?? rec.receiptType}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.84rem", fontWeight: 600 }}>{rec.createdByName}</div>
                      <div className="ks-tabular" style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                        {formatDate(rec.createdAt)}
                      </div>
                    </td>
                    <td className="ew-table__cell--center ks-tabular">{rec.details.length}</td>
                    <td>
                      <StatusBadge status={rec.status} domain="receipt" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "12px 18px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--color-muted)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <PackageCheck size={14} aria-hidden="true" />
              <span>Tách quyền: người tạo phiếu không được tự xác nhận.</span>
            </span>
            <Link to={ROUTES.WAREHOUSE_RECEIPT_NEW} className="ew-back-link" style={{ marginBottom: 0 }}>
              + Tạo phiếu nhập
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
