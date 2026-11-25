import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Info, Mail, MapPin, Plus, ShieldCheck, Store, Trash2, User } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import {
  useCreateAddress,
  useDeleteAddress,
  useMyAddresses,
  useSetDefaultAddress,
} from "@/features/customer/hooks/useAddresses";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/stores/authStore";
import { getErrorMessage } from "@/utils/errorHandler";
import { getUserRoles, hasRole, ROLE_LABELS, ROLES } from "@/utils/roleUtils";

function getInitials(fullName: string | undefined): string {
  if (!fullName?.trim()) return "KH";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const CustomerAccountPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const isAddressesTab = location.pathname.startsWith(ROUTES.ACCOUNT_ADDRESSES);
  const roles = getUserRoles(user);
  const isSeller = hasRole(user, ROLES.SELLER);

  const { data: addresses = [], isLoading: addrLoading } = useMyAddresses();
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();

  const [showAddModal, setShowAddModal] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [streetAddress, setStreetAddress] = useState("");

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAddress.mutateAsync({
        recipientName: recipientName.trim(),
        phoneNumber: phoneNumber.trim(),
        province: province.trim(),
        district: district.trim(),
        ward: ward.trim(),
        streetAddress: streetAddress.trim(),
        isDefault: addresses.length === 0,
      });
      setShowAddModal(false);
      setRecipientName("");
      setPhoneNumber("");
      setProvince("");
      setDistrict("");
      setWard("");
      setStreetAddress("");
      toast.success("Đã thêm địa chỉ nhận hàng.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="ew-page-header" style={{ marginBottom: "18px" }}>
        <div>
          <h1 className="ew-page-header__title">Tài khoản &amp; Sổ địa chỉ</h1>
          <p className="ew-page-header__subtitle">
            Thông tin định danh tài khoản hiện tại và sổ địa chỉ nhận hàng trên hệ thống KHO SÀN+.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div
        className="ks-tabs-bar"
        role="tablist"
        aria-label="Phân mục tài khoản"
        style={{ width: "fit-content" }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={!isAddressesTab}
          className={`ks-tab-btn ${!isAddressesTab ? "ks-tab-btn--active" : ""}`}
          onClick={() => navigate(ROUTES.ACCOUNT)}
        >
          <User size={16} aria-hidden="true" />
          <span>Hồ sơ cá nhân</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isAddressesTab}
          className={`ks-tab-btn ${isAddressesTab ? "ks-tab-btn--active" : ""}`}
          onClick={() => navigate(ROUTES.ACCOUNT_ADDRESSES)}
        >
          <MapPin size={16} aria-hidden="true" />
          <span>Sổ địa chỉ nhận hàng</span>
        </button>
      </div>

      {!isAddressesTab ? (
        <div className="ks-profile-grid">
          {/* Left: Real User Info from Auth Session */}
          <section className="ew-card" style={{ padding: "24px" }}>
            <h2 className="ew-section-heading">Thông tin tài khoản đăng nhập</h2>

            <div className="ew-form-grid-2" style={{ marginBottom: "18px" }}>
              <div className="ew-field">
                <label htmlFor="profile-fullname" className="ew-field__label">
                  Họ và tên
                </label>
                <input
                  id="profile-fullname"
                  type="text"
                  className="ew-control"
                  value={user?.fullName ?? ""}
                  readOnly
                  disabled
                />
              </div>

              <div className="ew-field">
                <label htmlFor="profile-email" className="ew-field__label">
                  Địa chỉ Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="ew-control"
                  value={user?.email ?? ""}
                  readOnly
                  disabled
                />
              </div>

              <div className="ew-field">
                <label htmlFor="profile-userid" className="ew-field__label">
                  Mã tài khoản (User ID)
                </label>
                <input
                  id="profile-userid"
                  type="text"
                  className="ew-control ks-tabular"
                  value={user ? `#${user.userId}` : "—"}
                  readOnly
                  disabled
                />
              </div>

              <div className="ew-field">
                <label htmlFor="profile-phone" className="ew-field__label">
                  Số điện thoại
                </label>
                <input
                  id="profile-phone"
                  type="text"
                  className="ew-control ks-tabular"
                  value={user?.phoneNumber || "Chưa cập nhật"}
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="ks-alert-banner ks-alert-banner--info">
              <Info size={16} style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
              <span>
                Tính năng chỉnh sửa hồ sơ trực tuyến (<code>GET / PUT /api/v1/users/me</code>) sẽ
                được kích hoạt khi Backend bổ sung endpoint quản lý hồ sơ cá nhân.
              </span>
            </div>
          </section>

          {/* Right: Member Summary & Roles Card */}
          <aside className="ew-card" style={{ padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "10px",
                  backgroundColor: "var(--color-forest-900)",
                  color: "#ffffff",
                  fontSize: "18px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {getInitials(user?.fullName)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-dark)" }}>
                  {user?.fullName || "Tài khoản"}
                </div>
                <div className="ks-tabular" style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                  ID #{user?.userId ?? "—"}
                </div>
              </div>
            </div>

            <div className="ks-verify-list">
              <div className="ks-verify-row">
                <span className="ks-verify-label">
                  <Mail size={15} color="var(--color-primary)" aria-hidden="true" />
                  <span>Tài khoản Email</span>
                </span>
                <StatusBadge status="Active" labelOverride="Đã đăng nhập" size="sm" />
              </div>

              <div className="ks-verify-row">
                <span className="ks-verify-label">
                  <ShieldCheck size={15} color="var(--color-primary)" aria-hidden="true" />
                  <span>Trạng thái bảo mật</span>
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-primary)",
                  }}
                >
                  <CheckCircle2 size={14} aria-hidden="true" />
                  <span>JWT Active</span>
                </span>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--color-muted)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Vai trò được cấp
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {roles.map((role) => (
                  <StatusBadge
                    key={role}
                    status="Active"
                    labelOverride={ROLE_LABELS[role] ?? role}
                    size="sm"
                  />
                ))}
              </div>
            </div>

            <Link
              to={isSeller ? ROUTES.SELLER : ROUTES.BECOME_SELLER}
              className="ew-btn ew-btn--secondary ew-btn--md ew-btn--full"
            >
              <Store size={15} aria-hidden="true" />
              <span>{isSeller ? "Mở Kênh người bán" : "Đăng ký làm Người bán"}</span>
            </Link>
          </aside>
        </div>
      ) : (
        <div className="ew-card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={18} color="var(--color-primary)" />
              <span>Sổ địa chỉ nhận hàng ({addresses.length})</span>
            </h2>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={() => setShowAddModal(true)}
            >
              Thêm địa chỉ mới
            </Button>
          </div>

          {addrLoading ? (
            <Skeleton lines={4} height={24} gap={12} />
          ) : addresses.length === 0 ? (
            <EmptyState
              icon={<MapPin size={28} />}
              title="Bạn chưa lưu địa chỉ nhận hàng nào"
              description="Thêm địa chỉ nhận hàng để đặt hàng nhanh hơn trong các lần mua sắm tiếp theo."
              action={
                <Button variant="primary" size="md" leftIcon={<Plus size={15} />} onClick={() => setShowAddModal(true)}>
                  Thêm địa chỉ đầu tiên
                </Button>
              }
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {addresses.map((addr) => (
                <div
                  key={addr.addressId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: addr.isDefault
                      ? "1.5px solid var(--color-primary)"
                      : "1px solid var(--color-border)",
                    background: addr.isDefault ? "#f0fdf4" : "transparent",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{addr.recipientName} • {addr.phoneNumber}</span>
                      {addr.isDefault && (
                        <StatusBadge status="Active" labelOverride="Mặc định" size="sm" />
                      )}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--color-muted)", marginTop: "4px" }}>
                      {addr.fullAddress}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    {!addr.isDefault && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={setDefaultAddress.isPending}
                        onClick={() =>
                          void setDefaultAddress
                            .mutateAsync(addr.addressId)
                            .then(() => toast.success("Đã đặt làm địa chỉ mặc định."))
                            .catch((err) => toast.error(getErrorMessage(err)))
                        }
                      >
                        Đặt mặc định
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 size={14} />}
                      loading={deleteAddress.isPending}
                      onClick={() =>
                        void deleteAddress
                          .mutateAsync(addr.addressId)
                          .then(() => toast.success("Đã xóa địa chỉ."))
                          .catch((err) => toast.error(getErrorMessage(err)))
                      }
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Modal
            open={showAddModal}
            title="Thêm địa chỉ nhận hàng"
            onClose={() => setShowAddModal(false)}
          >
            <form
              onSubmit={(e) => void handleCreateAddress(e)}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <FormField label="Họ tên người nhận" required>
                <Input required value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Nguyễn Văn A" />
              </FormField>
              <FormField label="Số điện thoại" required>
                <Input required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0987654321" />
              </FormField>
              <FormField label="Tỉnh / Thành phố" required>
                <Input required value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Hà Nội" />
              </FormField>
              <FormField label="Quận / Huyện" required>
                <Input required value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Cầu Giấy" />
              </FormField>
              <FormField label="Phường / Xã" required>
                <Input required value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Dịch Vọng" />
              </FormField>
              <FormField label="Địa chỉ chi tiết" required>
                <Input required value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="Số 1 Xuân Thủy" />
              </FormField>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" loading={createAddress.isPending}>
                  Lưu địa chỉ
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
};
