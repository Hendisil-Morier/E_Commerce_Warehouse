import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Percent, ShieldCheck, Store, User } from "lucide-react";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";
import { ROUTES } from "@/constants/routes";
import { useSellerShopsQuery } from "@/features/seller/hooks/useSellerCatalog";
import { useMySeller } from "@/features/seller/hooks/useSellerRegistration";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/stores/authStore";
import { getErrorMessage } from "@/utils/errorHandler";
import { formatDate } from "@/utils/formatters";

export const SellerProfilePage: React.FC = () => {
  const toast = useToast();
  const authUser = useAuthStore((s) => s.user);
  const sellerQuery = useMySeller();
  const shopsQuery = useSellerShopsQuery();

  const [descriptionDraft, setDescriptionDraft] = useState<string | null>(null);
  const [contactPhoneDraft, setContactPhoneDraft] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const profile = sellerQuery.data;
  const description = descriptionDraft ?? profile?.description ?? "";
  const contactPhone =
    contactPhoneDraft ?? profile?.user?.phoneNumber ?? authUser?.phoneNumber ?? "";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhone = contactPhone.trim();
    if (trimmedPhone && !/^0\d{9,10}$/.test(trimmedPhone)) {
      const msg = "Số điện thoại liên hệ phải bắt đầu bằng 0 và gồm 10–11 chữ số.";
      setPhoneError(msg);
      toast.error(msg);
      return;
    }

    setPhoneError(null);
    setSaving(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      toast.info(
        "Đã ghi nhận thông tin cập nhật cục bộ. Backend sẽ lưu chính thức khi bổ sung endpoint PUT /api/v1/sellers/me."
      );
    } finally {
      setSaving(false);
    }
  };

  if (sellerQuery.isLoading) {
    return (
      <div className="ew-card" style={{ padding: "24px" }}>
        <Skeleton lines={6} height={20} gap={14} />
      </div>
    );
  }

  if (sellerQuery.isError) {
    return (
      <ErrorState
        title="Không thể tải hồ sơ người bán"
        message={getErrorMessage(sellerQuery.error)}
        onRetry={() => void sellerQuery.refetch()}
      />
    );
  }

  if (!profile) {
    return (
      <div className="ew-card" style={{ padding: "28px", textAlign: "center" }}>
        <h2 style={{ marginBottom: "8px" }}>Chưa có hồ sơ người bán</h2>
        <p style={{ color: "var(--color-muted)", marginBottom: "16px" }}>
          Vui lòng đăng ký thông tin doanh nghiệp để kích hoạt Kênh người bán.
        </p>
        <Link to={ROUTES.BECOME_SELLER} className="ew-btn ew-btn--primary ew-btn--md">
          Đi tới trang Đăng ký Seller
        </Link>
      </div>
    );
  }

  return (
    <section>
      <PageHeader
        title="Hồ sơ người bán"
        subtitle={`Mã hồ sơ #${profile.sellerId} · MST: ${profile.taxCode || "Chưa cập nhật"} · Dữ liệu trực tiếp từ GET /api/v1/sellers/me`}
        badge={<StatusBadge status={profile.status} domain="seller" size="md" />}
      />

      {profile.status === "Rejected" && profile.rejectReason && (
        <div className="ew-notice ew-notice--danger" style={{ marginBottom: "18px" }}>
          <div className="ew-notice__head">Hồ sơ bị từ chối</div>
          <div>{profile.rejectReason}</div>
        </div>
      )}

      <div className="ew-split-2">
        {/* Left: Thông tin bảng Sellers + Form cập nhật */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="ew-card">
            <div className="ew-card-head">
              <h2 className="ew-card-title">
                <Building2 size={17} color="var(--color-primary)" aria-hidden="true" />
                <span>Thông tin doanh nghiệp (Bảng Sellers)</span>
              </h2>
            </div>
            <div className="ew-card-body">
              <div className="ew-info-list">
                <div className="ew-info-row">
                  <span className="ew-info-key">Tên doanh nghiệp / cá nhân</span>
                  <span className="ew-info-val">{profile.businessName}</span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Mã số thuế (TaxCode)</span>
                  <span className="ew-info-val ks-tabular">{profile.taxCode || "Chưa khai báo"}</span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Mức hoa hồng sàn (CommissionRate)</span>
                  <span className="ew-info-val ks-tabular" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-primary)" }}>
                    <Percent size={13} aria-hidden="true" />
                    <span>{profile.commissionRate}%</span>
                  </span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Ngày đăng ký</span>
                  <span className="ew-info-val ks-tabular">{formatDate(profile.createdAt)}</span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Ngày duyệt (ApprovedAt)</span>
                  <span className="ew-info-val ks-tabular">
                    {profile.approvedAt ? formatDate(profile.approvedAt) : "Chưa duyệt"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="ew-card">
            <div className="ew-card-head">
              <h2 className="ew-card-title">
                <ShieldCheck size={17} color="var(--color-primary)" aria-hidden="true" />
                <span>Cập nhật mô tả &amp; liên hệ vận hành</span>
              </h2>
            </div>
            <form
              className="ew-card-body"
              onSubmit={handleSave}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <FormField
                label="Số điện thoại liên hệ vận hành"
                error={phoneError ?? undefined}
                hint="Định dạng Việt Nam: bắt đầu bằng 0, gồm 10–11 chữ số."
              >
                <Input
                  value={contactPhone}
                  hasError={Boolean(phoneError)}
                  onChange={(e) => {
                    setContactPhoneDraft(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  placeholder="VD: 0988123456"
                />
              </FormField>

              <FormField label="Mô tả doanh nghiệp (Description)">
                <Textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  placeholder="Giới thiệu ngành hàng, cam kết chất lượng của doanh nghiệp..."
                />
              </FormField>

              <div className="ew-notice ew-notice--info">
                Tên doanh nghiệp và Mã số thuế đã được khóa sau khi Admin xét duyệt (<code>Approved</code>). Biểu mẫu này sẵn sàng nối với <code>PUT /api/v1/sellers/me</code> khi Backend bổ sung.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button type="submit" variant="primary" loading={saving}>
                  Lưu thay đổi hồ sơ
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Tài khoản liên kết + Danh sách Shop (API thật) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="ew-card">
            <div className="ew-card-head">
              <h2 className="ew-card-title">
                <User size={17} color="var(--color-primary)" aria-hidden="true" />
                <span>Tài khoản chủ sở hữu (Users)</span>
              </h2>
            </div>
            <div className="ew-card-body">
              <div className="ew-info-list">
                <div className="ew-info-row">
                  <span className="ew-info-key">Họ và tên</span>
                  <span className="ew-info-val">
                    {profile.user?.fullName ?? authUser?.fullName ?? "—"}
                  </span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Email đăng nhập</span>
                  <span className="ew-info-val">
                    {profile.user?.email ?? authUser?.email ?? "—"}
                  </span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Số điện thoại</span>
                  <span className="ew-info-val ks-tabular">
                    {profile.user?.phoneNumber ?? authUser?.phoneNumber ?? "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="ew-card">
            <div className="ew-card-head">
              <h2 className="ew-card-title">
                <Store size={17} color="var(--color-primary)" aria-hidden="true" />
                <span>Gian hàng trực thuộc ({shopsQuery.data?.length ?? 0})</span>
              </h2>
              <Link to={ROUTES.SELLER_SHOPS} className="ew-back-link" style={{ marginBottom: 0 }}>
                Quản lý shop
              </Link>
            </div>
            <div className="ew-card-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {shopsQuery.isLoading ? (
                <Skeleton lines={3} height={18} />
              ) : (shopsQuery.data ?? []).length === 0 ? (
                <p style={{ fontSize: "0.86rem", color: "var(--color-muted)" }}>
                  Chưa có gian hàng nào. Hãy tạo shop đầu tiên tại mục Quản lý Shop.
                </p>
              ) : (
                (shopsQuery.data ?? []).map((shop) => (
                  <div key={shop.shopId} className="ew-line-item">
                    <div>
                      <div className="ew-line-item__title">{shop.shopName}</div>
                      <div className="ew-line-item__meta">
                        {shop.description || "Không có mô tả"}
                      </div>
                    </div>
                    <StatusBadge status={shop.isActive ? "Active" : "Inactive"} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
