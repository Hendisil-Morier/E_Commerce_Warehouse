import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpFromLine,
  Barcode,
  CheckCircle2,
  History,
  Lock,
  PackageCheck,
  Play,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusTimeline } from "@/components/common/StatusTimeline";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { useToast } from "@/hooks/useToast";
import { isSameWarehouseActor, useOperationsStore } from "@/services/operationsStore";
import { useAuthStore } from "@/stores/authStore";
import { ISSUE_TYPE_LABELS } from "@/types/operations";
import { formatDate } from "@/utils/formatters";

export const WarehouseIssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);

  const issues = useOperationsStore((s) => s.issues);
  const approveIssue = useOperationsStore((s) => s.approveIssue);
  const startPickingIssue = useOperationsStore((s) => s.startPickingIssue);
  const dispatchIssue = useOperationsStore((s) => s.dispatchIssue);

  const [confirmDispatch, setConfirmDispatch] = useState(false);

  const issue = issues.find((i) => i.issueId === Number(id));

  if (!issue) {
    return (
      <div className="ew-card">
        <EmptyState
          icon={<ArrowUpFromLine size={28} />}
          title="Không tìm thấy phiếu xuất kho"
          description={`Phiếu xuất #${id ?? ""} không tồn tại.`}
          action={
            <Button variant="primary" onClick={() => navigate(ROUTES.WAREHOUSE_ISSUES)}>
              Quay lại danh sách phiếu xuất
            </Button>
          }
        />
      </div>
    );
  }

  const allPicked = issue.details.every((d) => d.pickedQuantity >= d.quantity);
  const isSelfCreated =
    currentUser !== null &&
    isSameWarehouseActor(
      issue.createdBy,
      issue.createdByEmail,
      currentUser.userId,
      currentUser.email
    );

  const handleApprove = () => {
    const res = approveIssue(
      issue.issueId,
      currentUser?.userId ?? 3,
      currentUser?.fullName ?? "Quản lý kho",
      currentUser?.email ?? null
    );
    if (res.ok) toast.success(res.message);
    else toast.error(res.message);
  };

  const handleStartPicking = () => {
    const res = startPickingIssue(issue.issueId, currentUser?.fullName ?? "Quản lý kho");
    if (res.ok) {
      toast.success(res.message);
      navigate(`/warehouse/issues/${issue.issueId}/pick`);
    } else {
      toast.error(res.message);
    }
  };

  const handleDispatch = () => {
    const res = dispatchIssue(
      issue.issueId,
      currentUser?.userId ?? 2,
      currentUser?.fullName ?? "Quản lý kho"
    );
    if (res.ok) {
      toast.success(res.message);
      setConfirmDispatch(false);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <section>
      <Link to={ROUTES.WAREHOUSE_ISSUES} className="ew-back-link">
        <ArrowLeft size={15} aria-hidden="true" />
        <span>Quay lại Danh sách phiếu xuất (W6)</span>
      </Link>

      <PageHeader
        title={`Phiếu xuất kho #${issue.issueCode}`}
        subtitle={`${ISSUE_TYPE_LABELS[issue.issueType]} · ${issue.warehouseName}${
          issue.sellerOrderCode ? ` · Đơn con ${issue.sellerOrderCode}` : ""
        }`}
        badge={<StatusBadge status={issue.status} domain="issue" size="md" />}
        actions={
          <>
            {issue.status === "Draft" && (
              <Button
                variant="primary"
                leftIcon={isSelfCreated ? <Lock size={15} /> : <CheckCircle2 size={16} />}
                disabled={isSelfCreated}
                onClick={handleApprove}
              >
                Duyệt phiếu xuất
              </Button>
            )}

            {issue.status === "Approved" && (
              <Button variant="primary" leftIcon={<Play size={16} />} onClick={handleStartPicking}>
                Bắt đầu soạn hàng (W7-Pick)
              </Button>
            )}

            {issue.status === "Picking" && (
              <>
                <Button
                  variant="secondary"
                  leftIcon={<Barcode size={16} />}
                  onClick={() => navigate(`/warehouse/issues/${issue.issueId}/pick`)}
                >
                  Mở màn Quét mã (W7-Pick)
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<PackageCheck size={16} />}
                  disabled={!allPicked}
                  title={!allPicked ? "Chỉ đóng gói được khi tất cả các dòng đã lấy đủ số lượng" : undefined}
                  onClick={() => navigate(`/warehouse/issues/${issue.issueId}/pack`)}
                >
                  Đóng gói (W7-Pack)
                </Button>
              </>
            )}

            {issue.status === "Packed" && (
              <Button
                variant="primary"
                leftIcon={<Truck size={16} />}
                onClick={() => setConfirmDispatch(true)}
              >
                Xuất kho (Dispatch · Trừ tồn)
              </Button>
            )}
          </>
        }
      />

      <MockDataNotice endpointHint={`GET /api/v1/issues/${issue.issueId}`} />

      {issue.status === "Draft" && isSelfCreated && (
        <div className="ew-notice ew-notice--warning" style={{ marginBottom: "18px" }}>
          <div className="ew-notice__head">
            <ShieldAlert size={16} aria-hidden="true" />
            <span>Tách quyền duyệt phiếu xuất (SELF_APPROVAL_NOT_ALLOWED)</span>
          </div>
          Người tạo phiếu xuất ({issue.createdByName}) không được tự duyệt phiếu của mình (<code>CK_Issues_Separation</code>). Cần Quản lý kho khác duyệt.
        </div>
      )}

      <div className="ew-split-detail">
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="ew-card">
            <div className="ew-card-head">
              <h2 className="ew-card-title">Dòng hàng cần lấy (IssueDetails · {issue.details.length})</h2>
            </div>
            <div className="ew-table-scroll">
              <table className="ew-table">
                <thead>
                  <tr>
                    <th>Vị trí lấy hàng</th>
                    <th>SKU / Sản phẩm</th>
                    <th className="ew-table__cell--center">Cần lấy</th>
                    <th className="ew-table__cell--center">Đã quét lấy</th>
                    <th>Trạng thái dòng</th>
                  </tr>
                </thead>
                <tbody>
                  {issue.details.map((d) => {
                    const done = d.pickedQuantity >= d.quantity;
                    return (
                      <tr key={d.issueDetailId}>
                        <td className="ks-tabular" style={{ fontWeight: 800, color: "var(--color-primary)" }}>
                          {d.locationCode}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                            {d.productName}
                          </div>
                          <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                            SKU: {d.sku} · Barcode: {d.barcode}
                          </div>
                        </td>
                        <td className="ew-table__cell--center ks-tabular">{d.quantity}</td>
                        <td className="ew-table__cell--center ks-tabular" style={{ fontWeight: 800 }}>
                          {d.pickedQuantity}
                        </td>
                        <td>
                          <StatusBadge
                            status={done ? "Completed" : "Picking"}
                            labelOverride={done ? "Đã lấy đủ" : "Chưa đủ"}
                          />
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
                <History size={17} color="var(--color-primary)" aria-hidden="true" />
                <span>Lịch sử xử lý phiếu xuất</span>
              </h2>
            </div>
            <div className="ew-card-body">
              <StatusTimeline items={issue.statusHistory} domain="issue" />
            </div>
          </div>
        </div>

        <aside className="ew-card">
          <div className="ew-card-head">
            <h2 className="ew-card-title">Thông tin chứng từ xuất</h2>
          </div>
          <div className="ew-card-body">
            <div className="ew-info-list">
              <div className="ew-info-row">
                <span className="ew-info-key">Đơn con gốc</span>
                <span className="ew-info-val ks-tabular">{issue.sellerOrderCode ?? "—"}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Khách hàng</span>
                <span className="ew-info-val">{issue.customerName ?? "—"}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Người tạo</span>
                <span className="ew-info-val">{issue.createdByName}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Người duyệt</span>
                <span className="ew-info-val">{issue.approvedByName ?? "Chưa duyệt"}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Người xuất kho</span>
                <span className="ew-info-val">{issue.dispatchedByName ?? "Chưa xuất"}</span>
              </div>
              {issue.packageSealCode && (
                <>
                  <div className="ew-info-row">
                    <span className="ew-info-key">Quy cách đóng gói</span>
                    <span className="ew-info-val">{issue.packageBoxType}</span>
                  </div>
                  <div className="ew-info-row">
                    <span className="ew-info-key">Khối lượng / Niêm phong</span>
                    <span className="ew-info-val ks-tabular">
                      {issue.packageWeightGrams}g · {issue.packageSealCode}
                    </span>
                  </div>
                </>
              )}
              <div className="ew-info-row">
                <span className="ew-info-key">Ngày tạo</span>
                <span className="ew-info-val ks-tabular">{formatDate(issue.createdAt)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDispatch}
        onClose={() => setConfirmDispatch(false)}
        title="Xác nhận Xuất kho (Dispatched)"
        description={`Phiếu ${issue.issueCode} sẽ chuyển sang Dispatched. Lúc này hệ thống mới trừ tồn thực (OnHand), tiêu thụ giữ chỗ (Reserved) và ghi Thẻ kho (W4).`}
        confirmText="Xác nhận Xuất kho"
        variant="primary"
        onConfirm={handleDispatch}
      />
    </section>
  );
};
