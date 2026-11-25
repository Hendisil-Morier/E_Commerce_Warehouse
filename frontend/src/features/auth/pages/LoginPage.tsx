import React, { useId, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import type { AuthResponse } from "@/types/auth";
import { getErrorMessage } from "@/utils/errorHandler";
import { getDefaultRouteForUser, hasRole, ROLES } from "@/utils/roleUtils";

/**
 * Kiểm tra tài khoản vừa đăng nhập có quyền truy cập đường dẫn trước đó hay không,
 * tránh điều hướng chéo vai trò sang trang 403 sau khi đổi tài khoản.
 */
function canUserAccessPath(
  pathname: string,
  userData: Pick<AuthResponse, "role" | "roles">
): boolean {
  if (pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER || pathname === ROUTES.FORBIDDEN) {
    return false;
  }
  if (pathname.startsWith(ROUTES.ADMIN)) {
    return hasRole(userData, ROLES.ADMIN);
  }
  if (pathname.startsWith(ROUTES.WAREHOUSE)) {
    return hasRole(userData, ROLES.WAREHOUSE_MANAGER);
  }
  if (pathname.startsWith(ROUTES.SELLER)) {
    return hasRole(userData, ROLES.SELLER);
  }
  if (pathname === ROUTES.CART) {
    return hasRole(userData, ROLES.CUSTOMER);
  }
  if (pathname === ROUTES.BECOME_SELLER) {
    return hasRole(userData, [ROLES.CUSTOMER, ROLES.SELLER]);
  }
  return true;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectByRole = (userData: Pick<AuthResponse, "role" | "roles">) => {
    const fromState = (
      location.state as { from?: { pathname?: string; search?: string } } | null
    )?.from;

    if (fromState?.pathname && canUserAccessPath(fromState.pathname, userData)) {
      navigate(`${fromState.pathname}${fromState.search || ""}`, { replace: true });
      return;
    }

    navigate(getDefaultRouteForUser(userData), { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMessage("Vui lòng nhập đầy đủ Email/Tên đăng nhập và Mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      const data = await authService.login({ email: cleanEmail, password: cleanPass });
      setAuth(data);
      redirectByRole(data);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ks-auth-card">
      <div style={{ marginBottom: "22px" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--color-dark)",
            margin: 0,
          }}
        >
          Đăng nhập
        </h2>
        <p style={{ fontSize: "0.86rem", color: "var(--color-muted)", marginTop: "6px" }}>
          Sử dụng tài khoản KHO SÀN+ để mua sắm, quản lý shop hoặc vận hành kho.
        </p>
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
            marginBottom: "18px",
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
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <div className="ew-field">
          <label htmlFor={emailId} className="ew-field__label">
            Email hoặc Tên đăng nhập <span className="ew-field__required">*</span>
          </label>
          <input
            id={emailId}
            type="text"
            className="ew-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ví dụ: customer@gmail.com hoặc customer"
            autoComplete="username"
            disabled={loading}
            required
          />
        </div>

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
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
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

        <button
          type="submit"
          disabled={loading}
          className="ew-btn ew-btn--primary ew-btn--lg ew-btn--full"
          style={{ marginTop: "4px", letterSpacing: "0.02em" }}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-muted)",
            textAlign: "center",
            lineHeight: 1.5,
            marginTop: "2px",
          }}
        >
          Bằng việc đăng nhập, bạn đồng ý với Điều khoản dịch vụ &amp; Chính sách bảo mật của KHO SÀN+.
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
          Bạn chưa có tài khoản KHO SÀN+?{" "}
          <Link
            to={ROUTES.REGISTER}
            style={{
              color: "var(--color-primary)",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Đăng ký ngay
          </Link>
        </div>
      </form>
    </div>
  );
};
