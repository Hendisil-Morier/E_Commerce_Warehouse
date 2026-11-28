import React, { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Mail, ShoppingBag, Store } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import { getErrorMessage } from "@/utils/errorHandler";
import { getDefaultRouteForUser } from "@/utils/roleUtils";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const fullNameId = useId();
  const usernameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const shopNameId = useId();
  const otpId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const [accountType, setAccountType] = useState<"customer" | "seller">("customer");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpInfo, setOtpInfo] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = window.setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [otpCooldown]);

  const handleSendRegisterOtp = async () => {
    setErrorMessage(null);
    setOtpInfo(null);

    const cleanEmail = email.trim().toLowerCase();
    const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!GMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage("Vui lòng nhập địa chỉ Gmail hợp lệ (@gmail.com) trước khi gửi mã OTP.");
      return;
    }

    try {
      setOtpLoading(true);
      await authService.sendRegisterOtp(cleanEmail);
      setEmail(cleanEmail);
      setOtpCooldown(60);
      setOtpInfo(`Đã gửi mã OTP 6 chữ số tới ${cleanEmail} (hiệu lực 5 phút).`);
    } catch (err: unknown) {
      if (axios.isAxiosError<{ retryAfterSeconds?: number }>(err)) {
        const retry = err.response?.data?.retryAfterSeconds;
        if (typeof retry === "number" && retry > 0) {
          setOtpCooldown(retry);
        }
      }
      setErrorMessage(getErrorMessage(err));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanFullName = fullName.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, "");

    if (!cleanFullName || !cleanUsername || !cleanEmail || !cleanPhone || !password.trim()) {
      setErrorMessage("Vui lòng nhập đầy đủ các trường bắt buộc.");
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMessage("Tên đăng nhập phải có ít nhất 3 ký tự.");
      return;
    }

    // Khớp ràng buộc Gmail (@gmail.com) của AuthService ở Backend
    const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!GMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage(
        "Địa chỉ email phải là Gmail hợp lệ (kết thúc bằng @gmail.com, ví dụ: yourname@gmail.com)."
      );
      return;
    }

    const cleanOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage("Vui lòng nhập đầy đủ mã OTP 6 chữ số đã gửi về Gmail của bạn.");
      return;
    }

    const VIETNAM_PHONE_REGEX = /^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-46-9])\d{7}$/;
    if (cleanPhone.length !== 10) {
      setErrorMessage("Số điện thoại phải gồm đúng 10 chữ số.");
      return;
    }

    if (!VIETNAM_PHONE_REGEX.test(cleanPhone)) {
      setErrorMessage(
        "Đầu số điện thoại không hợp lệ. Chỉ chấp nhận các đầu số: 032-039, 052/056/058/059, 070/076-079, 081-086/088/089, 090-094/096-099."
      );
      return;
    }

    if (accountType === "seller" && !shopName.trim()) {
      setErrorMessage("Vui lòng nhập tên gian hàng hoặc doanh nghiệp dự kiến.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);
      const data = await authService.register({
        fullName: cleanFullName,
        username: cleanUsername,
        email: cleanEmail,
        otp: cleanOtp,
        password,
        phoneNumber: cleanPhone,
        accountType,
        shopName: accountType === "seller" ? shopName.trim() : undefined,
      });

      setAuth(data);
      navigate(getDefaultRouteForUser(data), { replace: true });
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ks-auth-card ks-auth-card--wide">
      <h2
        style={{
          fontSize: "1.45rem",
          fontWeight: 800,
          color: "var(--color-dark)",
          marginBottom: "16px",
        }}
      >
        Đăng ký tài khoản KHO SÀN+
      </h2>

      {/* Account Type Selector */}
      <div
        role="tablist"
        aria-label="Chọn loại tài khoản đăng ký"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "18px",
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={accountType === "customer"}
          onClick={() => setAccountType("customer")}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minHeight: "44px",
            padding: "8px 10px",
            borderRadius: "8px",
            border:
              accountType === "customer"
                ? "2px solid var(--color-primary)"
                : "1px solid var(--color-border-strong)",
            backgroundColor:
              accountType === "customer" ? "var(--color-accent-soft)" : "var(--color-white)",
            color:
              accountType === "customer" ? "var(--color-primary)" : "var(--color-muted)",
            fontWeight: 700,
            fontSize: "0.85rem",
          }}
        >
          <ShoppingBag size={17} aria-hidden="true" />
          <span>Khách mua hàng</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={accountType === "seller"}
          onClick={() => setAccountType("seller")}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minHeight: "44px",
            padding: "8px 10px",
            borderRadius: "8px",
            border:
              accountType === "seller"
                ? "2px solid var(--color-primary)"
                : "1px solid var(--color-border-strong)",
            backgroundColor:
              accountType === "seller" ? "var(--color-accent-soft)" : "var(--color-white)",
            color:
              accountType === "seller" ? "var(--color-primary)" : "var(--color-muted)",
            fontWeight: 700,
            fontSize: "0.85rem",
          }}
        >
          <Store size={17} aria-hidden="true" />
          <span>Đối tác Người bán</span>
        </button>
      </div>

      {errorMessage && (
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
            lineHeight: 1.5,
          }}
        >
          {errorMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        style={{ display: "flex", flexDirection: "column", gap: "14px" }}
      >
        <div className="ew-field">
          <label htmlFor={fullNameId} className="ew-field__label">
            Họ và tên đầy đủ <span className="ew-field__required">*</span>
          </label>
          <input
            id={fullNameId}
            type="text"
            className="ew-control"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ví dụ: Nguyễn Văn An"
            disabled={loading}
            required
          />
        </div>

        <div className="ew-field">
          <label htmlFor={usernameId} className="ew-field__label">
            Tên đăng nhập <span className="ew-field__required">*</span>
          </label>
          <input
            id={usernameId}
            type="text"
            className="ew-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tối thiểu 3 ký tự"
            autoCapitalize="none"
            disabled={loading}
            required
          />
        </div>

        <div className="ew-field">
          <label htmlFor={emailId} className="ew-field__label">
            Địa chỉ Gmail <span className="ew-field__required">*</span>
          </label>
          <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
            <input
              id={emailId}
              type="email"
              className="ew-control"
              style={{ flex: 1 }}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setOtpInfo(null);
              }}
              placeholder="Ví dụ: tenban@gmail.com"
              disabled={loading || otpLoading}
              required
            />
            <button
              type="button"
              disabled={loading || otpLoading || otpCooldown > 0}
              onClick={() => void handleSendRegisterOtp()}
              className="ew-btn ew-btn--secondary"
              style={{
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0 14px",
              }}
            >
              <Mail size={15} />
              {otpLoading
                ? "Đang gửi..."
                : otpCooldown > 0
                  ? `Gửi lại (${otpCooldown}s)`
                  : "Gửi mã OTP"}
            </button>
          </div>
          <span className="ew-field__hint">
            Hệ thống hiện yêu cầu địa chỉ Gmail kết thúc bằng <strong>@gmail.com</strong>.
          </span>
          {otpInfo && (
            <div
              role="status"
              style={{
                color: "#0f766e",
                backgroundColor: "#f0fdfa",
                border: "1px solid #99f6e4",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "0.8rem",
                marginTop: "6px",
              }}
            >
              {otpInfo}
            </div>
          )}
        </div>

        <div className="ew-field">
          <label htmlFor={otpId} className="ew-field__label">
            Mã OTP xác thực Gmail <span className="ew-field__required">*</span>
          </label>
          <input
            id={otpId}
            type="text"
            inputMode="numeric"
            className="ew-control ks-tabular"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Nhập 6 chữ số OTP từ hộp thư Gmail"
            maxLength={6}
            disabled={loading}
            required
          />
        </div>

        <div className="ew-field">
          <label htmlFor={phoneId} className="ew-field__label">
            Số điện thoại liên hệ <span className="ew-field__required">*</span>
          </label>
          <input
            id={phoneId}
            type="tel"
            className="ew-control ks-tabular"
            value={phoneNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
              setPhoneNumber(val);
            }}
            placeholder="10 chữ số (đầu số di động Việt Nam)"
            maxLength={10}
            disabled={loading}
            required
          />
        </div>

        {accountType === "seller" && (
          <div className="ew-field">
            <label htmlFor={shopNameId} className="ew-field__label">
              Tên gian hàng / Doanh nghiệp dự kiến <span className="ew-field__required">*</span>
            </label>
            <input
              id={shopNameId}
              type="text"
              className="ew-control"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Ví dụ: Công ty TNHH Thiết Bị Số An Phát"
              disabled={loading}
              required
            />
          </div>
        )}

        <div className="ew-field">
          <label htmlFor={passwordId} className="ew-field__label">
            Mật khẩu <span className="ew-field__required">*</span>
          </label>
          <div className="ew-control-wrap">
            <input
              id={passwordId}
              type={showPassword ? "text" : "password"}
              className="ew-control ew-control--has-right"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              autoComplete="new-password"
              disabled={loading}
              required
            />
            <span className="ew-control__addon-right">
              <button
                type="button"
                className="ew-icon-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </span>
          </div>
        </div>

        <div className="ew-field">
          <label htmlFor={confirmPasswordId} className="ew-field__label">
            Xác nhận lại mật khẩu <span className="ew-field__required">*</span>
          </label>
          <input
            id={confirmPasswordId}
            type={showPassword ? "text" : "password"}
            className="ew-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="ew-btn ew-btn--primary ew-btn--lg ew-btn--full"
          style={{ marginTop: "4px" }}
        >
          {loading
            ? "Đang tạo tài khoản..."
            : accountType === "seller"
              ? "Đăng ký mở gian hàng"
              : "Đăng ký ngay"}
        </button>

        <GoogleSignInButton
          disabled={loading}
          onSuccess={(authData) => navigate(getDefaultRouteForUser(authData), { replace: true })}
          onError={(msg) => setErrorMessage(msg)}
        />

        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-muted)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Bằng việc đăng ký, bạn xác nhận đồng ý với Điều khoản dịch vụ &amp; Chính sách bảo mật của KHO SÀN+.
        </p>

        <div
          style={{
            textAlign: "center",
            fontSize: "0.88rem",
            color: "var(--color-muted)",
            paddingTop: "8px",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          Bạn đã có tài khoản?{" "}
          <Link
            to={ROUTES.LOGIN}
            style={{
              color: "var(--color-primary)",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Đăng nhập
          </Link>
        </div>
      </form>
    </div>
  );
};
