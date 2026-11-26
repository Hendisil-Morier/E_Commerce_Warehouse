import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Barcode,
  CheckCircle2,
  CornerDownLeft,
  PackageCheck,
  ScanLine,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { useOperationsStore } from "@/services/operationsStore";
import { STORAGE_TYPE_META } from "@/types/operations";

function playBeep(type: "ok" | "err") {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type === "ok" ? "sine" : "sawtooth";
    osc.frequency.value = type === "ok" ? 880 : 240;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (type === "ok" ? 0.1 : 0.22));
  } catch {
    // Bỏ qua nếu trình duyệt chặn AudioContext
  }
}

export const WarehouseIssuePickPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const issues = useOperationsStore((s) => s.issues);
  const scanIssueBarcode = useOperationsStore((s) => s.scanIssueBarcode);

  const [scanValue, setScanValue] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const issue = issues.find((i) => i.issueId === Number(id));

  const refocusScanner = () => {
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  useEffect(() => {
    refocusScanner();
  }, [id]);

  if (!issue) {
    return (
      <div className="ew-card">
        <EmptyState
          icon={<Barcode size={28} />}
          title="Không tìm thấy phiếu xuất để soạn hàng"
          description="Vui lòng chọn phiếu xuất từ danh sách W6."
          action={
            <Button variant="primary" onClick={() => navigate(ROUTES.WAREHOUSE_ISSUES)}>
              Về danh sách phiếu xuất
            </Button>
          }
        />
      </div>
    );
  }

  const totalUnits = issue.details.reduce((s, d) => s + d.quantity, 0);
  const pickedUnits = issue.details.reduce((s, d) => s + d.pickedQuantity, 0);
  const pct = totalUnits > 0 ? Math.round((pickedUnits / totalUnits) * 100) : 0;
  const allDone = totalUnits > 0 && pickedUnits >= totalUnits;
  const isPicking = issue.status === "Picking";

  const triggerScan = (code: string) => {
    const res = scanIssueBarcode(issue.issueId, code);
    if (res.ok) {
      playBeep("ok");
      setFeedback({ tone: "ok", text: res.message });
    } else {
      playBeep("err");
      setFeedback({ tone: "err", text: res.message });
    }
    setScanValue("");
    refocusScanner();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPicking) {
      setFeedback({
        tone: "err",
        text: `Phiếu ${issue.issueCode} đang ở trạng thái ${issue.status} — chỉ quét soạn hàng khi ở trạng thái Đang soạn (Picking).`,
      });
      return;
    }
    if (!scanValue.trim()) {
      refocusScanner();
      return;
    }
    triggerScan(scanValue);
  };

  return (
    <section>
      <Link to={`/warehouse/issues/${issue.issueId}`} className="ew-back-link">
        <ArrowLeft size={15} aria-hidden="true" />
        <span>Quay lại Chi tiết phiếu xuất #{issue.issueCode}</span>
      </Link>

      <PageHeader
        title={`W7-Pick · Soạn hàng & Quét mã (${issue.issueCode})`}
        subtitle="Giao diện tối giản tại kệ cho máy quét USB bàn phím: ô quét tự động giữ focus và phát âm báo khi đúng/sai."
        badge={<StatusBadge status={issue.status} domain="issue" size="md" />}
        actions={
          <Button
            variant="primary"
            size="lg"
            leftIcon={<PackageCheck size={18} />}
            disabled={!allDone || (!isPicking && issue.status !== "Packed")}
            onClick={() => navigate(`/warehouse/issues/${issue.issueId}/pack`)}
          >
            Hoàn tất soạn → Đóng gói (W7-Pack)
          </Button>
        }
      />

      <MockDataNotice endpointHint={`POST /api/v1/issues/${issue.issueId}/lines/{lineId}/scan`} />

      {!isPicking && (
        <div className="ew-notice ew-notice--warning" style={{ marginBottom: "18px" }}>
          <div className="ew-notice__head">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>Phiếu hiện ở trạng thái {issue.status} — Chức năng quét soạn đã tạm khóa</span>
          </div>
          <div>
            Chỉ phiếu ở trạng thái <strong>Đang soạn (Picking)</strong> mới được quét mã vạch lấy hàng. Quay lại{" "}
            <Link to={`/warehouse/issues/${issue.issueId}`} style={{ textDecoration: "underline", fontWeight: 700 }}>
              Chi tiết phiếu xuất #{issue.issueCode}
            </Link>{" "}
            để duyệt hoặc bắt đầu soạn hàng theo đúng quy trình.
          </div>
        </div>
      )}

      {/* Progress Summary */}
      <div className="ew-progress-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ color: "var(--color-dark)", fontSize: "0.95rem" }}>
            Tiến độ soạn hàng tổng thể
          </strong>
          <span className="ks-tabular" style={{ fontWeight: 800, color: allDone ? "var(--color-primary)" : "var(--color-dark)" }}>
            {pickedUnits} / {totalUnits} sản phẩm ({pct}%)
          </span>
        </div>
        <div className="ew-progress-track">
          <div className="ew-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Rugged 56px Auto-Focus Barcode Scanner */}
      <form onSubmit={handleSubmit} aria-label="Ô quét mã vạch sản phẩm">
        <label
          htmlFor="w7-rugged-scanner"
          style={{ display: "block", fontWeight: 700, fontSize: "0.86rem", color: "var(--color-dark)", marginBottom: "8px" }}
        >
          Quét mã vạch (Barcode) hoặc mã SKU — Tự động giữ focus sau mỗi lần quét
        </label>
        <div className="ew-scanner-bar">
          <Barcode size={24} className="ew-scanner-prefix" aria-hidden="true" />
          <input
            ref={inputRef}
            id="w7-rugged-scanner"
            type="text"
            autoComplete="off"
            disabled={!isPicking}
            className="ew-scanner-input ks-tabular"
            placeholder={
              isPicking
                ? "Đưa máy quét vào hoặc gõ VD: 8938501204881 / KB-K2PRO-RED rồi nhấn Enter..."
                : "Ô quét bị khóa vì phiếu không ở trạng thái Picking..."
            }
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
          />
          <span className="ew-scanner-enter-hint">
            <CornerDownLeft size={14} aria-hidden="true" />
            <span>Enter</span>
          </span>
        </div>
      </form>

      {feedback && (
        <div
          role="status"
          className={`ew-notice ${feedback.tone === "ok" ? "ew-notice--success" : "ew-notice--danger"}`}
          style={{ marginBottom: "18px" }}
        >
          <div className="ew-notice__head">
            {feedback.tone === "ok" ? (
              <CheckCircle2 size={16} aria-hidden="true" />
            ) : (
              <AlertTriangle size={16} aria-hidden="true" />
            )}
            <span>{feedback.tone === "ok" ? "Quét thành công" : "Cảnh báo quét mã"}</span>
          </div>
          <div>{feedback.text}</div>
        </div>
      )}

      {/* Pick Lines List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {issue.details.map((line) => {
          const isLineDone = line.pickedQuantity >= line.quantity;
          const zoneMeta = STORAGE_TYPE_META[line.storageType];

          return (
            <article
              key={line.issueDetailId}
              className={`ew-pick-card ${isLineDone ? "ew-pick-card--done" : ""}`}
            >
              <div className="ew-pick-bin-box ks-tabular">
                <div className="ew-pick-bin-label">{zoneMeta.shortLabel}</div>
                <div className="ew-pick-bin-coord">{line.locationCode}</div>
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <strong style={{ color: "var(--color-dark)", fontSize: "1rem" }}>
                    {line.productName}
                  </strong>
                  <StatusBadge
                    status={isLineDone ? "Completed" : "Picking"}
                    labelOverride={isLineDone ? "Đủ số lượng" : "Đang lấy"}
                  />
                </div>
                <div className="ks-tabular" style={{ fontSize: "0.84rem", color: "var(--color-muted)" }}>
                  SKU: <strong>{line.sku}</strong> · Barcode: <strong>{line.barcode}</strong> · Đã lấy:{" "}
                  <strong style={{ color: isLineDone ? "var(--color-primary)" : "var(--color-dark)", fontSize: "0.95rem" }}>
                    {line.pickedQuantity} / {line.quantity}
                  </strong>
                </div>
              </div>

              <div>
                {isLineDone ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--color-primary)", fontWeight: 800 }}>
                    <CheckCircle2 size={20} aria-hidden="true" />
                    <span>Đã đủ</span>
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    size="lg"
                    disabled={!isPicking}
                    leftIcon={<ScanLine size={17} />}
                    onClick={() => triggerScan(line.barcode)}
                  >
                    Quét nhanh +1
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
