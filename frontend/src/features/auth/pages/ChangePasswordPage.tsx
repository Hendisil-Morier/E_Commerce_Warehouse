import React, { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import { getErrorCode, getErrorMessage, getFieldErrors } from "@/utils/errorHandler";

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);

  const currentPassId = useId();
  const newPassId = useId();
  const confirmPassId = useId();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [currentPassError, setCurrentPassError] = useState<string | null>(null);
  const [newPassError, setNewPassError] = useState<string | null>(null);
  const [confirmPassError, setConfirmPassError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Đổi mật khẩu | KHO SÀN+";
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPassError(null);
    setNewPassError(null);
    setConfirmPassError(null);
    setGeneralError(null);

    if (!currentPassword) {
      setCurrentPassError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 6) {
      setNewPassError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword === currentPassword) {
      setNewPassError("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPassError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);
      const authData = await authService.changePassword({
        currentPassword,
        newPassword,
      });
      setAuth(authData);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Đổi mật khẩu thành công! Phiên đăng nhập đã được làm mới.");
    } catch (err: unknown) {
      const code = getErrorCode(err);
      const fields = getFieldErrors(err);
      const message = getErrorMessage(err);

      if (code === "WRONG_CURRENT_PASSWORD" || fields.currentPassword) {
        setCurrentPassError(fields.currentPassword ?? message);
      } else if (fields.newPassword) {
        setNewPassError(fields.newPassword);
      } else {
        setGeneralError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto", padding: "8px 0" }}>
      <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft size={15} />}
          onClick={() => navigate(-1)}
        >
          Quay lại
        </Button>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Đổi mật khẩu</h1>
          <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>
            Tài khoản: <strong>{user?.email}</strong>
          </div>
        </div>
      </div>

      <div className="ew-card" style={{ padding: "24px" }}>
        {generalError && (
          <div
            role="alert"
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "var(--color-danger)",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "0.85rem",
            }}
          >
            {generalError}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="ew-field">
            <label htmlFor={currentPassId} className="ew-field__label">
              Mật khẩu hiện tại <span className="ew-field__required">*</span>
            </label>
            <div className="ew-control-wrap">
              <input
                id={currentPassId}
                type={showCurrent ? "text" : "password"}
                className="ew-control ew-control--has-right"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setCurrentPassError(null);
                }}
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <span className="ew-control__addon-right">
                <button
                  type="button"
                  className="ew-icon-btn"
                  onClick={() => setShowCurrent((prev) => !prev)}
                  aria-label={showCurrent ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"}
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </div>
            {currentPassError && (
              <div role="alert" style={{ color: "var(--color-danger)", fontSize: "0.82rem", marginTop: "6px" }}>
                {currentPassError}
              </div>
            )}
          </div>

          <div className="ew-field">
            <label htmlFor={newPassId} className="ew-field__label">
              Mật khẩu mới <span className="ew-field__required">*</span>
            </label>
            <div className="ew-control-wrap">
              <input
                id={newPassId}
                type={showNew ? "text" : "password"}
                className="ew-control ew-control--has-right"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setNewPassError(null);
                }}
                placeholder="Tối thiểu 6 ký tự"
                autoComplete="new-password"
                disabled={loading}
                required
              />
              <span className="ew-control__addon-right">
                <button
                  type="button"
                  className="ew-icon-btn"
                  onClick={() => setShowNew((prev) => !prev)}
                  aria-label={showNew ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </div>
            {newPassError && (
              <div role="alert" style={{ color: "var(--color-danger)", fontSize: "0.82rem", marginTop: "6px" }}>
                {newPassError}
              </div>
            )}
          </div>

          <div className="ew-field">
            <label htmlFor={confirmPassId} className="ew-field__label">
              Xác nhận mật khẩu mới <span className="ew-field__required">*</span>
            </label>
            <div className="ew-control-wrap">
              <input
                id={confirmPassId}
                type={showConfirm ? "text" : "password"}
                className="ew-control ew-control--has-right"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmPassError(null);
                }}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                disabled={loading}
                required
              />
              <span className="ew-control__addon-right">
                <button
                  type="button"
                  className="ew-icon-btn"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={showConfirm ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </div>
            {confirmPassError && (
              <div role="alert" style={{ color: "var(--color-danger)", fontSize: "0.82rem", marginTop: "6px" }}>
                {confirmPassError}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "4px" }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              leftIcon={<KeyRound size={16} />}
              loading={loading}
            >
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
