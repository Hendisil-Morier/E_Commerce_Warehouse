import React, { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { authService } from "@/services/authService";
import { getErrorCode, getErrorMessage, getFieldErrors } from "@/utils/errorHandler";

type Step = 1 | 2 | 3;

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const emailId = useId();
  const newPassId = useId();
  const confirmPassId = useId();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    document.title = "Quên mật khẩu | KHO SÀN+";
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const extractRetryAfter = (err: unknown): number => {
    if (axios.isAxiosError<{ retryAfterSeconds?: number }>(err)) {
      const val = err.response?.data?.retryAfterSeconds;
      if (typeof val === "number" && val > 0) return val;
    }
    return 60;
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setFieldError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFieldError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword({ email: cleanEmail });
      setEmail(cleanEmail);
      setInfoMessage("Nếu email tồn tại, chúng tôi đã gửi mã OTP 6 chữ số đến hộp thư của bạn (hiệu lực 5 phút).");
      setResendCooldown(60);
      setStep(2);
      window.setTimeout(() => otpInputRefs.current[0]?.focus(), 50);
    } catch (err: unknown) {
      const code = getErrorCode(err);
      if (code === "OTP_RESEND_TOO_SOON") {
        const retry = extractRetryAfter(err);
        setResendCooldown(retry);
        setFieldError(`Vui lòng chờ ${retry} giây trước khi yêu cầu gửi lại mã OTP.`);
      } else {
        const serverFields = getFieldErrors(err);
        setFieldError(serverFields.email ?? getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setFieldError(null);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtpDigits(next);
    setFieldError(null);
    const focusIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIdx]?.focus();
  };

  const otpValue = otpDigits.join("");

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    if (!/^\d{6}$/.test(otpValue)) {
      setFieldError("Vui lòng nhập đầy đủ 6 chữ số OTP.");
      return;
    }

    try {
      setLoading(true);
      await authService.verifyOtp({ email, otp: otpValue });
      setStep(3);
    } catch (err: unknown) {
      const serverFields = getFieldErrors(err);
      setFieldError(serverFields.otp ?? getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setConfirmError(null);

    if (newPassword.length < 6) {
      setFieldError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword({
        email,
        otp: otpValue,
        newPassword,
      });
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: {
          resetSuccessMessage: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.",
        },
      });
    } catch (err: unknown) {
      const code = getErrorCode(err);
      const serverFields = getFieldErrors(err);
      if (code === "OTP_INVALID" || code === "OTP_EXPIRED" || code === "OTP_TOO_MANY_ATTEMPTS") {
        setStep(2);
        setFieldError(getErrorMessage(err));
      } else {
        setFieldError(serverFields.newPassword ?? getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ks-auth-card">
      <div style={{ marginBottom: "18px" }}>
        <Link
          to={ROUTES.LOGIN}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.83rem",
            color: "var(--color-muted)",
            textDecoration: "none",
            marginBottom: "10px",
          }}
        >
          <ArrowLeft size={15} /> Quay lại đăng nhập
        </Link>

        <h2
          style={{
            fontSize: "1.45rem",
            fontWeight: 800,
            color: "var(--color-dark)",
            margin: 0,
          }}
        >
          Quên mật khẩu
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginTop: "14px",
          }}
        >
          {[
            { num: 1, label: "1. Email" },
            { num: 2, label: "2. Xác thực OTP" },
            { num: 3, label: "3. Mật khẩu mới" },
          ].map((item) => {
            const active = step >= item.num;
            return (
              <div
                key={item.num}
                style={{
                  padding: "6px 8px",
                  borderRadius: "8px",
                  textAlign: "center",
                  fontSize: "0.78rem",
                  fontWeight: active ? 700 : 500,
                  backgroundColor: active ? "#f0fdfa" : "#f8fafc",
                  color: active ? "var(--color-primary)" : "var(--color-muted)",
                  border: `1px solid ${active ? "#99f6e4" : "var(--color-border)"}`,
                }}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      </div>

      {infoMessage && step === 2 && (
        <div
          role="status"
          style={{
            backgroundColor: "#f0fdfa",
            border: "1px solid #99f6e4",
            color: "#0f766e",
            padding: "10px 14px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "0.84rem",
            lineHeight: 1.5,
          }}
        >
          {infoMessage}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={(e) => void handleSendOtp(e)} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="ew-field">
            <label htmlFor={emailId} className="ew-field__label">
              Email tài khoản <span className="ew-field__required">*</span>
            </label>
            <div className="ew-control-wrap">
              <input
                id={emailId}
                type="email"
                className="ew-control"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldError(null);
                }}
                placeholder="Ví dụ: customer@gmail.com"
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>
            {fieldError && (
              <div role="alert" style={{ color: "var(--color-danger)", fontSize: "0.82rem", marginTop: "6px" }}>
                {fieldError}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ew-btn ew-btn--primary ew-btn--lg ew-btn--full"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Mail size={17} />
            {loading ? "Đang gửi mã OTP..." : "Gửi mã OTP"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={(e) => void handleVerifyOtp(e)} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="ew-field">
            <label className="ew-field__label">
              Nhập mã OTP 6 chữ số gửi tới <strong>{email}</strong>
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                gap: "8px",
                marginTop: "6px",
              }}
            >
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpInputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Chữ số OTP thứ ${index + 1}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  disabled={loading}
                  className="ew-control"
                  style={{
                    textAlign: "center",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    padding: "10px 4px",
                  }}
                />
              ))}
            </div>
            {fieldError && (
              <div role="alert" style={{ color: "var(--color-danger)", fontSize: "0.82rem", marginTop: "8px" }}>
                {fieldError}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ew-btn ew-btn--primary ew-btn--lg ew-btn--full"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <ShieldCheck size={17} />
            {loading ? "Đang xác thực..." : "Xác nhận OTP"}
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem" }}>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setStep(1);
                setFieldError(null);
                setOtpDigits(["", "", "", "", "", ""]);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-muted)",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Đổi email khác
            </button>

            <button
              type="button"
              disabled={loading || resendCooldown > 0}
              onClick={() => void handleSendOtp()}
              style={{
                background: "none",
                border: "none",
                color: resendCooldown > 0 ? "var(--color-muted)" : "var(--color-primary)",
                fontWeight: 600,
                cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                padding: 0,
              }}
            >
              {resendCooldown > 0 ? `Gửi lại mã (${resendCooldown}s)` : "Gửi lại mã OTP"}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={(e) => void handleResetPassword(e)} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="ew-field">
            <label htmlFor={newPassId} className="ew-field__label">
              Mật khẩu mới <span className="ew-field__required">*</span>
            </label>
            <div className="ew-control-wrap">
              <input
                id={newPassId}
                type={showNewPass ? "text" : "password"}
                className="ew-control ew-control--has-right"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setFieldError(null);
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
                  onClick={() => setShowNewPass((prev) => !prev)}
                  aria-label={showNewPass ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                >
                  {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </div>
            {fieldError && (
              <div role="alert" style={{ color: "var(--color-danger)", fontSize: "0.82rem", marginTop: "6px" }}>
                {fieldError}
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
                type={showConfirmPass ? "text" : "password"}
                className="ew-control ew-control--has-right"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmError(null);
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
                  onClick={() => setShowConfirmPass((prev) => !prev)}
                  aria-label={showConfirmPass ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
                >
                  {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </div>
            {confirmError && (
              <div role="alert" style={{ color: "var(--color-danger)", fontSize: "0.82rem", marginTop: "6px" }}>
                {confirmError}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ew-btn ew-btn--primary ew-btn--lg ew-btn--full"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <KeyRound size={17} />
            {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
          </button>
        </form>
      )}
    </div>
  );
};
