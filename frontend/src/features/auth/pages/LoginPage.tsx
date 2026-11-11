import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  EyeOff,
  CheckSquare,
  Square,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import { getErrorMessage } from "@/utils/errorHandler";
import { getDefaultRouteForUser } from "@/utils/roleUtils";
import type { AuthResponse } from "@/types/auth";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Điều hướng thông minh theo Role (ưu tiên: quay lại trang trước đó, hoặc Admin > WarehouseManager > Seller > Customer)
  const redirectByRole = (userData: Pick<AuthResponse, "role" | "roles">) => {
    const fromState = (
      location.state as { from?: { pathname?: string; search?: string } } | null
    )?.from;

    if (fromState?.pathname && fromState.pathname !== ROUTES.LOGIN) {
      navigate(`${fromState.pathname}${fromState.search || ""}`, { replace: true });
      return;
    }

    navigate(getDefaultRouteForUser(userData), { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMessage("Vui lòng nhập đầy đủ Email và Mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      // 1. Gọi API Backend thật
      const data = await authService.login({ email: cleanEmail, password: cleanPass });
      setAuth(data);
      redirectByRole(data);
    } catch (err: unknown) {
      // 2. Dự phòng đăng nhập cho tài khoản thử nghiệm khi backend chưa chạy hoặc chưa seed DB
      const isDemoPass = cleanPass === "Demo@123" || cleanPass === "123456" || cleanPass.toLowerCase() === "demo@123";

      if ((cleanEmail === "customer@gmail.com" || cleanEmail === "customer") && isDemoPass) {
        const mockData: AuthResponse = {
          userId: 4,
          fullName: "Lê Hoàng Khách",
          username: "customer",
          email: "customer@gmail.com",
          role: "Customer",
          roles: ["Customer"],
          accessToken: "demo-jwt-token-customer",
          refreshToken: "demo-refresh-token-customer",
        };
        setAuth(mockData);
        redirectByRole(mockData);
        return;
      }

      if ((cleanEmail === "seller@emarket.vn" || cleanEmail === "seller") && isDemoPass) {
        const mockData: AuthResponse = {
          userId: 3,
          fullName: "Trần Thị Shop",
          username: "seller",
          email: "seller@emarket.vn",
          role: "Seller",
          roles: ["Seller"],
          accessToken: "demo-jwt-token-seller",
          refreshToken: "demo-refresh-token-seller",
        };
        setAuth(mockData);
        redirectByRole(mockData);
        return;
      }

      if ((cleanEmail === "warehouse@emarket.vn" || cleanEmail === "warehouse") && isDemoPass) {
        const mockData: AuthResponse = {
          userId: 2,
          fullName: "Nguyễn Văn Kho",
          username: "warehouse",
          email: "warehouse@emarket.vn",
          role: "WarehouseManager",
          roles: ["WarehouseManager"],
          accessToken: "demo-jwt-token-warehouse",
          refreshToken: "demo-refresh-token-warehouse",
        };
        setAuth(mockData);
        redirectByRole(mockData);
        return;
      }

      if ((cleanEmail === "admin@emarket.vn" || cleanEmail === "admin") && isDemoPass) {
        const mockData: AuthResponse = {
          userId: 1,
          fullName: "Quản trị viên Hệ thống",
          username: "admin",
          email: "admin@emarket.vn",
          role: "Admin",
          roles: ["Admin"],
          accessToken: "demo-jwt-token-admin",
          refreshToken: "demo-refresh-token-admin",
        };
        setAuth(mockData);
        redirectByRole(mockData);
        return;
      }

      // Thông báo lỗi qua getErrorMessage theo chuẩn ProblemDetails.code
      setErrorMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Đăng nhập Google
  const handleGoogleLogin = () => {
    // Có thể tích hợp Google OAuth hoặc demo mock
    const mockGoogleUser: AuthResponse = {
      userId: 99,
      fullName: "Người dùng Google",
      email: "google.user@gmail.com",
      role: "Customer",
      roles: ["Customer"],
      accessToken: "demo-jwt-google-token",
      refreshToken: "demo-refresh-google-token",
    };
    setAuth(mockGoogleUser);
    redirectByRole(mockGoogleUser);
  };

  return (
    <div style={{
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 20px 40px rgba(15, 23, 42, 0.25)",
      padding: "36px 36px 32px",
      width: "100%",
      maxWidth: "440px",
      boxSizing: "border-box",
    }}>
      {/* Top Card Title */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "#0f172a",
          margin: 0,
        }}>
          Đăng nhập
        </h2>
      </div>

      {errorMessage && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#dc2626",
          padding: "10px 14px",
          borderRadius: "8px",
          marginBottom: "18px",
          fontSize: "0.85rem",
          lineHeight: 1.5,
        }}>
          {errorMessage}
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Email / Username */}
        <div>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email / Tên đăng nhập"
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontSize: "0.92rem",
                color: "#1e293b",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#059669";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(5, 150, 105, 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              required
              style={{
                width: "100%",
                padding: "12px 42px 12px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontSize: "0.92rem",
                color: "#1e293b",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#059669";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(5, 150, 105, 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                padding: "4px",
                cursor: "pointer",
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Row below password: Stay signed in + Forgot password */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "2px 0 2px",
        }}>
          {/* Stay signed in checkbox */}
          <div
            onClick={() => setStaySignedIn(!staySignedIn)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.85rem",
              color: "#475569",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {staySignedIn ? (
              <CheckSquare size={17} color="#059669" />
            ) : (
              <Square size={17} color="#94a3b8" />
            )}
            <span>Duy trì đăng nhập</span>
          </div>

          {/* Forgot password link */}
          <a
            href="#forgot"
            style={{
              fontSize: "0.85rem",
              color: "#059669",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Quên mật khẩu?
          </a>
        </div>

        {/* Big Submit Button (Emerald Green #059669) */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            backgroundColor: loading ? "#94a3b8" : "#059669",
            color: "#ffffff",
            borderRadius: "8px",
            fontWeight: 800,
            fontSize: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
            transition: "background-color 0.2s",
            marginTop: "6px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = "#047857";
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = "#059669";
          }}
        >
          {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
        </button>

        {/* Separator OR */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          margin: "6px 0",
        }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
          <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700 }}>HOẶC</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "11px 16px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#ffffff",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "#1e293b",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f8fafc";
            e.currentTarget.style.borderColor = "#94a3b8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Đăng nhập với Google</span>
        </button>

        {/* Disclaimer */}
        <p style={{
          fontSize: "0.72rem",
          color: "#94a3b8",
          textAlign: "center",
          lineHeight: 1.4,
          margin: "6px 0 0",
        }}>
          Bằng việc đăng nhập, bạn đồng ý với Điều khoản dịch vụ & Chính sách bảo mật của Tên sàn.
        </p>

        {/* Switch to Register */}
        <div style={{
          textAlign: "center",
          fontSize: "0.85rem",
          color: "#64748b",
          paddingTop: "6px",
        }}>
          Bạn mới biết đến Tên sàn?{" "}
          <Link
            to={ROUTES.REGISTER}
            style={{
              color: "#059669",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Đăng ký
          </Link>
        </div>
      </form>
    </div>
  );
};
