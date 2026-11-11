import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  RefreshCw,
  Store,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { useSellerRoleSync } from "@/features/seller/hooks/useSellerRegistration";
import { useAuthStore } from "@/stores/authStore";
import type { SellerProfile } from "@/types/seller";
import { formatDate } from "@/utils/formatters";

export interface SellerApplicationStatusCardProps {
  seller: SellerProfile;
  isRefetching: boolean;
  onRefresh: () => void;
  onEditResubmit: () => void;
}

export const SellerApplicationStatusCard: React.FC<SellerApplicationStatusCardProps> = ({
  seller,
  isRefetching,
  onRefresh,
  onEditResubmit,
}) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { hasSellerRole, isSyncingRole, needsRelogin } = useSellerRoleSync(seller.status);

  const handleRelogin = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="ew-card ew-seller-card">
      <div className="ew-seller-card__header">
        <div>
          <h2 className="ew-seller-card__title">{seller.businessName}</h2>
          <p className="ew-seller-card__subtitle">
            Mã hồ sơ #{seller.sellerId} · Gửi lúc {formatDate(seller.createdAt)}
          </p>
        </div>
        <StatusBadge status={seller.status} domain="seller" size="md" />
      </div>

      {seller.status === "Pending" && (
        <div className="ew-banner ew-banner--warning">
          <Clock size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Hồ sơ đang chờ Admin xét duyệt.</strong>
            <p className="ew-banner__desc">
              Quản trị viên sẽ kiểm tra thông tin đăng ký và phản hồi trong thời gian sớm nhất.
            </p>
          </div>
        </div>
      )}

      {seller.status === "Approved" && (
        <div className="ew-banner ew-banner--success">
          <CheckCircle2 size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Hồ sơ người bán đã được duyệt!</strong>
            <p className="ew-banner__desc">
              {isSyncingRole
                ? "Đang đồng bộ quyền Kênh người bán cho phiên đăng nhập hiện tại..."
                : hasSellerRole
                  ? "Bạn đã có quyền truy cập Kênh người bán để tạo shop và đăng sản phẩm."
                  : "Hồ sơ của bạn đã được kích hoạt trên hệ thống."}
            </p>
          </div>
        </div>
      )}

      {seller.status === "Approved" && needsRelogin && (
        <div className="ew-banner ew-banner--warning" role="alert">
          <AlertTriangle size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Cần đăng nhập lại để cập nhật quyền Seller.</strong>
            <p className="ew-banner__desc">
              Không thể tự làm mới phiên đăng nhập hiện tại hoặc token mới chưa có quyền Seller. Vui lòng đăng nhập lại để vào Kênh người bán.
            </p>
          </div>
        </div>
      )}

      {seller.status === "Rejected" && (
        <div className="ew-banner ew-banner--danger" role="alert">
          <XCircle size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Hồ sơ đăng ký bị từ chối.</strong>
            <p className="ew-banner__desc">
              Lý do: {seller.rejectReason || "Không có lý do cụ thể."}
            </p>
          </div>
        </div>
      )}

      {seller.status === "Suspended" && (
        <div className="ew-banner ew-banner--danger" role="alert">
          <Lock size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Tài khoản người bán đang bị khóa.</strong>
            <p className="ew-banner__desc">
              {seller.rejectReason
                ? `Lý do: ${seller.rejectReason}`
                : "Vui lòng liên hệ quản trị viên sàn để biết thêm chi tiết."}
            </p>
          </div>
        </div>
      )}

      <dl className="ew-detail-grid">
        <div className="ew-detail-item">
          <dt>Tên doanh nghiệp / Hộ KD</dt>
          <dd>{seller.businessName}</dd>
        </div>
        <div className="ew-detail-item">
          <dt>Mã số thuế</dt>
          <dd>{seller.taxCode || "Chưa cung cấp"}</dd>
        </div>
        <div className="ew-detail-item">
          <dt>Hoa hồng sàn</dt>
          <dd>{seller.commissionRate}%</dd>
        </div>
        <div className="ew-detail-item">
          <dt>Ngày duyệt</dt>
          <dd>{seller.approvedAt ? formatDate(seller.approvedAt) : "—"}</dd>
        </div>
        <div className="ew-detail-item ew-detail-item--full">
          <dt>Mô tả ngành hàng</dt>
          <dd>{seller.description || "Không có mô tả."}</dd>
        </div>
      </dl>

      <div className="ew-seller-card__actions">
        {seller.status === "Pending" && (
          <Button
            variant="secondary"
            loading={isRefetching}
            leftIcon={<RefreshCw size={16} />}
            onClick={onRefresh}
          >
            Kiểm tra lại trạng thái
          </Button>
        )}

        {seller.status === "Rejected" && (
          <Button variant="primary" onClick={onEditResubmit}>
            Chỉnh sửa và gửi lại hồ sơ
          </Button>
        )}

        {seller.status === "Approved" && hasSellerRole && (
          <Button
            variant="primary"
            leftIcon={<Store size={16} />}
            onClick={() => navigate(ROUTES.SELLER)}
          >
            Vào Kênh người bán
          </Button>
        )}

        {seller.status === "Approved" && needsRelogin && (
          <Button variant="primary" onClick={handleRelogin}>
            Đăng nhập lại
          </Button>
        )}
      </div>
    </div>
  );
};

