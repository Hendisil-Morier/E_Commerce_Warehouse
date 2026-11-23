import React, { useState, useEffect } from "react";
import { User, MapPin, KeyRound, Plus, Trash2, Edit2, CheckCircle2, ShieldCheck } from "lucide-react";
import { userService } from "@/services/userService";
import { addressService } from "@/services/addressService";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/useToast";
import type { UserProfile, UserAddress, CreateAddressRequest } from "@/types/user";

export const ProfilePage: React.FC = () => {
  const { user: authUser, setAuth } = useAuthStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "password">("profile");

  // Profile State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<CreateAddressRequest>({
    recipientName: "",
    phoneNumber: "",
    province: "",
    district: "",
    ward: "",
    streetAddress: "",
    isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Load Profile
  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const data = await userService.getProfile();
      setProfile(data);
      setFullName(data.fullName || "");
      setPhoneNumber(data.phoneNumber || "");
      setAvatarUrl(data.avatarUrl || "");
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tải thông tin hồ sơ." });
    } finally {
      setLoadingProfile(false);
    }
  };

  // Load Addresses
  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const data = await addressService.getMyAddresses();
      setAddresses(data);
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tải sổ địa chỉ." });
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadAddresses();
  }, []);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast({ type: "warning", title: "Lưu ý", message: "Họ và tên không được để trống." });
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await userService.updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      setProfile(updated);

      // Cập nhật auth store local
      if (authUser) {
        setAuth({
          userId: updated.userId,
          fullName: updated.fullName,
          email: updated.email,
          role: authUser.role || "Customer",
          roles: authUser.roles || ["Customer"],
          accessToken: useAuthStore.getState().accessToken || "",
          refreshToken: useAuthStore.getState().refreshToken || "",
        });
      }

      showToast({ type: "success", title: "Thành công", message: "Cập nhật hồ sơ cá nhân thành công!" });
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Không thể cập nhật hồ sơ.";
      showToast({ type: "error", title: "Thất bại", message: msg });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast({ type: "warning", title: "Lưu ý", message: "Vui lòng nhập mật khẩu hiện tại." });
      return;
    }
    if (newPassword.length < 6) {
      showToast({ type: "warning", title: "Lưu ý", message: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ type: "warning", title: "Lưu ý", message: "Xác nhận mật khẩu mới không khớp." });
      return;
    }

    try {
      setChangingPassword(true);
      await userService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast({ type: "success", title: "Thành công", message: "Đổi mật khẩu thành công!" });
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Mật khẩu hiện tại không chính xác.";
      showToast({ type: "error", title: "Thất bại", message: msg });
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle Open Create Address
  const handleOpenCreateAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      recipientName: fullName || "",
      phoneNumber: phoneNumber || "",
      province: "",
      district: "",
      ward: "",
      streetAddress: "",
      isDefault: addresses.length === 0,
    });
    setShowAddressModal(true);
  };

  // Handle Open Edit Address
  const handleOpenEditAddress = (addr: UserAddress) => {
    setEditingAddressId(addr.addressId);
    setAddressForm({
      recipientName: addr.recipientName,
      phoneNumber: addr.phoneNumber,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      streetAddress: addr.streetAddress,
      isDefault: addr.isDefault,
    });
    setShowAddressModal(true);
  };

  // Handle Save Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.recipientName.trim() || !addressForm.phoneNumber.trim()) {
      showToast({ type: "warning", title: "Lưu ý", message: "Vui lòng nhập tên người nhận và số điện thoại." });
      return;
    }
    if (!addressForm.province.trim() || !addressForm.district.trim() || !addressForm.ward.trim() || !addressForm.streetAddress.trim()) {
      showToast({ type: "warning", title: "Lưu ý", message: "Vui lòng nhập đầy đủ địa chỉ 4 cấp." });
      return;
    }

    try {
      setSavingAddress(true);
      if (editingAddressId) {
        await addressService.updateAddress(editingAddressId, addressForm);
        showToast({ type: "success", title: "Thành công", message: "Đã cập nhật địa chỉ." });
      } else {
        await addressService.createAddress(addressForm);
        showToast({ type: "success", title: "Thành công", message: "Đã thêm địa chỉ mới." });
      }
      setShowAddressModal(false);
      await loadAddresses();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Không thể lưu địa chỉ.";
      showToast({ type: "error", title: "Thất bại", message: msg });
    } finally {
      setSavingAddress(false);
    }
  };

  // Handle Set Default Address
  const handleSetDefaultAddress = async (id: number) => {
    try {
      await addressService.setDefaultAddress(id);
      showToast({ type: "success", title: "Thành công", message: "Đã đặt làm địa chỉ mặc định." });
      await loadAddresses();
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể đặt địa chỉ mặc định." });
    }
  };

  // Handle Delete Address
  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này không?")) return;
    try {
      await addressService.deleteAddress(id);
      showToast({ type: "success", title: "Thành công", message: "Đã xóa địa chỉ." });
      await loadAddresses();
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể xóa địa chỉ này." });
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "2rem auto", padding: "0 1rem", minHeight: "75vh" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1e293b" }}>Tài khoản của tôi</h1>
        <p style={{ color: "#64748b", marginTop: "0.25rem" }}>Quản lý thông tin cá nhân, sổ địa chỉ và bảo mật mật khẩu</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "2px solid #e2e8f0", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setActiveTab("profile")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "profile" ? "3px solid #0E7C66" : "3px solid transparent",
            color: activeTab === "profile" ? "#0E7C66" : "#64748b",
            fontWeight: activeTab === "profile" ? 600 : 500,
            cursor: "pointer",
          }}
        >
          <User size={18} />
          Hồ sơ cá nhân
        </button>

        <button
          onClick={() => setActiveTab("addresses")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "addresses" ? "3px solid #0E7C66" : "3px solid transparent",
            color: activeTab === "addresses" ? "#0E7C66" : "#64748b",
            fontWeight: activeTab === "addresses" ? 600 : 500,
            cursor: "pointer",
          }}
        >
          <MapPin size={18} />
          Sổ địa chỉ ({addresses.length})
        </button>

        <button
          onClick={() => setActiveTab("password")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "password" ? "3px solid #0E7C66" : "3px solid transparent",
            color: activeTab === "password" ? "#0E7C66" : "#64748b",
            fontWeight: activeTab === "password" ? 600 : 500,
            cursor: "pointer",
          }}
        >
          <KeyRound size={18} />
          Đổi mật khẩu
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === "profile" && (
        <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          {loadingProfile ? (
            <p style={{ color: "#64748b" }}>Đang tải thông tin hồ sơ...</p>
          ) : (
            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 600 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
                  Địa chỉ Email (Cố định)
                </label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", background: "#f8fafc", color: "#64748b" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={profile?.username || "(Chưa đặt)"}
                  disabled
                  style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", background: "#f8fafc", color: "#64748b" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0912345678"
                  style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
                  Đường dẫn ảnh đại diện (Avatar URL)
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.875rem" }}>
                <ShieldCheck size={16} color="#0E7C66" />
                <span>Vai trò tài khoản: <strong>{profile?.roles.join(", ") || "Customer"}</strong></span>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                style={{
                  alignSelf: "flex-start",
                  background: "#0E7C66",
                  color: "#ffffff",
                  padding: "0.625rem 1.5rem",
                  borderRadius: 6,
                  border: "none",
                  fontWeight: 600,
                  cursor: savingProfile ? "not-allowed" : "pointer",
                }}
              >
                {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: Addresses */}
      {activeTab === "addresses" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#334155" }}>Danh sách địa chỉ nhận hàng</h2>
            <button
              onClick={handleOpenCreateAddress}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                background: "#0E7C66",
                color: "#ffffff",
                padding: "0.5rem 1rem",
                borderRadius: 6,
                border: "none",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Plus size={16} />
              Thêm địa chỉ mới
            </button>
          </div>

          {loadingAddresses ? (
            <p style={{ color: "#64748b" }}>Đang tải sổ địa chỉ...</p>
          ) : addresses.length === 0 ? (
            <div style={{ background: "#ffffff", padding: "2rem", borderRadius: 8, border: "1px solid #e2e8f0", textAlign: "center" }}>
              <MapPin size={36} color="#94a3b8" style={{ margin: "0 auto 0.75rem" }} />
              <p style={{ color: "#64748b", fontWeight: 500 }}>Bạn chưa có địa chỉ nhận hàng nào.</p>
              <button
                onClick={handleOpenCreateAddress}
                style={{
                  marginTop: "0.75rem",
                  background: "#0E7C66",
                  color: "#ffffff",
                  padding: "0.5rem 1rem",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                + Thêm địa chỉ đầu tiên
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {addresses.map((addr) => (
                <div
                  key={addr.addressId}
                  style={{
                    background: "#ffffff",
                    padding: "1.25rem",
                    borderRadius: 8,
                    border: addr.isDefault ? "2px solid #0E7C66" : "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.375rem" }}>
                      <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem" }}>{addr.recipientName}</span>
                      <span style={{ color: "#64748b", fontSize: "0.875rem" }}>|</span>
                      <span style={{ color: "#64748b", fontSize: "0.875rem" }}>{addr.phoneNumber}</span>
                      {addr.isDefault && (
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#15803d",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.2rem 0.5rem",
                            borderRadius: 4,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <CheckCircle2 size={12} />
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p style={{ color: "#475569", fontSize: "0.875rem", margin: "0.25rem 0" }}>
                      {addr.fullAddress}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefaultAddress(addr.addressId)}
                        style={{
                          background: "#f1f5f9",
                          color: "#475569",
                          padding: "0.375rem 0.75rem",
                          borderRadius: 4,
                          border: "1px solid #cbd5e1",
                          fontSize: "0.8125rem",
                          cursor: "pointer",
                        }}
                      >
                        Thiết lập mặc định
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditAddress(addr)}
                      style={{
                        background: "none",
                        border: "1px solid #cbd5e1",
                        padding: "0.375rem 0.5rem",
                        borderRadius: 4,
                        color: "#0E7C66",
                        cursor: "pointer",
                      }}
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(addr.addressId)}
                      style={{
                        background: "none",
                        border: "1px solid #fecaca",
                        padding: "0.375rem 0.5rem",
                        borderRadius: 4,
                        color: "#ef4444",
                        cursor: "pointer",
                      }}
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Password */}
      {activeTab === "password" && (
        <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 500 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
                Mật khẩu hiện tại *
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu đang dùng"
                style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
                Mật khẩu mới *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Tối thiểu 6 ký tự"
                style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
                Xác nhận mật khẩu mới *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Nhập lại mật khẩu mới"
                style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              style={{
                alignSelf: "flex-start",
                background: "#0E7C66",
                color: "#ffffff",
                padding: "0.625rem 1.5rem",
                borderRadius: 6,
                border: "none",
                fontWeight: 600,
                cursor: changingPassword ? "not-allowed" : "pointer",
              }}
            >
              {changingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </form>
        </div>
      )}

      {/* Modal Add / Edit Address */}
      {showAddressModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 8,
              width: "100%",
              maxWidth: 550,
              padding: "1.5rem",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b", marginBottom: "1rem" }}>
              {editingAddressId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ nhận hàng mới"}
            </h3>

            <form onSubmit={handleSaveAddress} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                    Tên người nhận *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.recipientName}
                    onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phoneNumber}
                    onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                    placeholder="0912345678"
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                    Tỉnh / Thành phố *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                    placeholder="VD: Hà Nội"
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                    Quận / Huyện *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.district}
                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                    placeholder="VD: Cầu Giấy"
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                    Phường / Xã *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.ward}
                    onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })}
                    placeholder="VD: Dịch Vọng"
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                  Địa chỉ chi tiết (Số nhà, tòa nhà, tên đường) *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.streetAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                  placeholder="VD: Số 15 ngõ 86 Duy Tân"
                  style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="isDefaultCheckbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                />
                <label htmlFor="isDefaultCheckbox" style={{ fontSize: "0.875rem", color: "#334155", cursor: "pointer" }}>
                  Đặt làm địa chỉ nhận hàng mặc định
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: 6,
                    border: "none",
                    background: "#0E7C66",
                    color: "#ffffff",
                    fontWeight: 600,
                    cursor: savingAddress ? "not-allowed" : "pointer",
                  }}
                >
                  {savingAddress ? "Đang lưu..." : "Lưu địa chỉ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
