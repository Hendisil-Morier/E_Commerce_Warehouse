import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Barcode,
  Box,
  CheckCircle2,
  PackageCheck,
  Printer,
  Scale,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { useToast } from "@/hooks/useToast";
import { useOperationsStore } from "@/services/operationsStore";
import { useAuthStore } from "@/stores/authStore";

const BOX_OPTIONS = [
  "Thùng Carton Chuẩn S (20x15x10cm)",
  "Thùng Carton Chuẩn M (30x20x15cm)",
  "Thùng Carton Chuẩn L (40x30x25cm)",
  "Thùng Chống Sốc 5 Lớp (Hàng dễ vỡ)",
  "Thùng xốp giữ nhiệt 5 lớp (Kho lạnh)",
];

export const WarehouseIssuePackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);

  const issues = useOperationsStore((s) => s.issues);
  const packIssue = useOperationsStore((s) => s.packIssue);

  const issue = issues.find((i) => i.issueId === Number(id));

  const [boxType, setBoxType] = useState(issue?.packageBoxType ?? BOX_OPTIONS[1]);
  const [weightGrams, setWeightGrams] = useState(String(issue?.packageWeightGrams ?? 1250));
  const [sealCode, setSealCode] = useState(issue?.packageSealCode ?? "SEAL-HN-261125");
  const [checkedItems, setCheckedItems] = useState(true);
  const [checkedInvoice, setCheckedInvoice] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!issue) {
    return (
      <div className="ew-card">
        <EmptyState
          icon={<Box size={28} />}
          title="Không tìm thấy phiếu xuất cần đóng gói"
          description="Quay lại danh sách phiếu xuất W6 để chọn phiếu."
          action={
            <Button variant="primary" onClick={() => navigate(ROUTES.WAREHOUSE_ISSUES)}>
              Về Phiếu xuất kho (W6)
            </Button>
          }
        />
      </div>
    );
  }

  const totalUnits = issue.details.reduce((s, d) => s + d.quantity, 0);
  const allPicked = issue.details.every((d) => d.pickedQuantity >= d.quantity);
  const isPackedOrDone = issue.status === "Packed" || issue.status === "Dispatched";

  const handlePackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(weightGrams);
    if (!checkedItems || !checkedInvoice) {
      setError("Vui lòng xác nhận đủ kiểm tra sản phẩm và phiếu đóng gói.");
      return;
    }
    if (!sealCode.trim() || !Number.isFinite(w) || w <= 0) {
      setError("Vui lòng nhập khối lượng cân hợp lệ (> 0g) và mã tem niêm phong.");
      return;
    }

    setError(null);
    const res = packIssue(
      issue.issueId,
      { boxType, weightGrams: w, sealCode: sealCode.trim().toUpperCase() },
      currentUser?.fullName ?? "Quản lý kho"
    );
    if (res.ok) {
      toast.success(res.message);
      navigate(`/warehouse/issues/${issue.issueId}`);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <section>
      <Link to={`/warehouse/issues/${issue.issueId}`} className="ew-back-link">
        <ArrowLeft size={15} aria-hidden="true" />
        <span>Quay lại Chi tiết phiếu xuất #{issue.issueCode}</span>
      </Link>

      <PageHeader
        title={`W7-Pack · Trạm đóng gói (${issue.issueCode})`}
        subtitle={`Đơn con: ${issue.sellerOrderCode ?? "Nội bộ"} · ${issue.warehouseName} · Xác nhận quy cách thùng, cân nặng và chuyển sang Packed.`}
        badge={<StatusBadge status={issue.status} domain="issue" size="md" />}
        actions={
          <Button
            variant="secondary"
            leftIcon={<Barcode size={16} />}
            onClick={() => navigate(`/warehouse/issues/${issue.issueId}/pick`)}
          >
            Quay về Trạm Soạn (W7-Pick)
          </Button>
        }
      />

      <MockDataNotice endpointHint={`POST /api/v1/issues/${issue.issueId}/pack`} />

      {!allPicked && !isPackedOrDone && (
        <div className="ew-notice ew-notice--danger" style={{ marginBottom: "18px" }}>
          <div className="ew-notice__head">Chưa lấy đủ hàng tại kệ</div>
          Phiếu xuất chỉ được phép đóng gói (<code>pack</code>) sau khi đã quét đủ 100% số lượng tại màn{" "}
          <Link to={`/warehouse/issues/${issue.issueId}/pick`} style={{ textDecoration: "underline", fontWeight: 700 }}>
            W7-Pick
          </Link>
          .
        </div>
      )}

      <div className="ew-split-detail">
        <div className="ew-card">
          <div className="ew-card-head">
            <h2 className="ew-card-title">
              <Box size={17} color="var(--color-primary)" aria-hidden="true" />
              <span>Quy cách đóng gói &amp; Cân đo kiện hàng</span>
            </h2>
          </div>

          <form
            className="ew-card-body"
            onSubmit={handlePackSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <FormField label="Loại thùng carton / vật liệu bảo vệ">
              <Select
                value={boxType}
                options={BOX_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                disabled={isPackedOrDone}
                onChange={(e) => setBoxType(e.target.value)}
              />
            </FormField>

            <div className="ew-form-grid-2-responsive">
              <FormField label="Khối lượng cân điện tử (gram)" required>
                <Input
                  type="number"
                  min={50}
                  leftAddon={<Scale size={15} aria-hidden="true" />}
                  value={weightGrams}
                  disabled={isPackedOrDone}
                  onChange={(e) => setWeightGrams(e.target.value)}
                />
              </FormField>
              <FormField label="Mã tem niêm phong Kho sàn" required>
                <Input
                  value={sealCode}
                  disabled={isPackedOrDone}
                  onChange={(e) => setSealCode(e.target.value)}
                />
              </FormField>
            </div>

            <label className="ew-checkbox-row">
              <input
                type="checkbox"
                checked={checkedItems}
                disabled={isPackedOrDone}
                onChange={(e) => setCheckedItems(e.target.checked)}
              />
              <span>Đã đối chiếu đủ {totalUnits} sản phẩm khớp phiếu soạn hàng.</span>
            </label>

            <label className="ew-checkbox-row">
              <input
                type="checkbox"
                checked={checkedInvoice}
                disabled={isPackedOrDone}
                onChange={(e) => setCheckedInvoice(e.target.checked)}
              />
              <span>Đã đặt phiếu đóng gói và chèn chống sốc theo phân khu lưu trữ.</span>
            </label>

            {error && <p className="ew-field__error">{error}</p>}

            {isPackedOrDone ? (
              <div className="ew-notice ew-notice--success">
                <div className="ew-notice__head">
                  <CheckCircle2 size={16} aria-hidden="true" />
                  <span>Phiếu đã đóng gói xong ({issue.status})</span>
                </div>
                Tiếp theo hãy thực hiện <strong>Xuất kho (Dispatch)</strong> tại chi tiết phiếu W6 và tạo vận đơn tại{" "}
                <Link to={ROUTES.WAREHOUSE_SHIPMENTS} style={{ textDecoration: "underline", fontWeight: 700 }}>
                  W8 Vận đơn
                </Link>
                .
              </div>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!allPicked}
                leftIcon={<PackageCheck size={18} />}
              >
                Xác nhận Hoàn tất Đóng gói (Chuyển Packed)
              </Button>
            )}
          </form>
        </div>

        <aside className="ew-card">
          <div className="ew-card-head">
            <h2 className="ew-card-title">
              <Printer size={17} color="var(--color-primary)" aria-hidden="true" />
              <span>Thông tin kiện hàng</span>
            </h2>
          </div>
          <div className="ew-card-body">
            <div className="ew-info-list">
              <div className="ew-info-row">
                <span className="ew-info-key">Phiếu xuất</span>
                <span className="ew-info-val ks-tabular">{issue.issueCode}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Đơn con</span>
                <span className="ew-info-val ks-tabular">{issue.sellerOrderCode ?? "—"}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Gian hàng</span>
                <span className="ew-info-val">{issue.shopName ?? "—"}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Người nhận</span>
                <span className="ew-info-val">{issue.customerName ?? "—"}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Tổng số lượng</span>
                <span className="ew-info-val ks-tabular">
                  {totalUnits} SP ({issue.details.length} dòng)
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
