import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Vui lòng nhập đầy đủ Email và Mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      const data = await authService.login({ email, password });
      setAuth(data);
      navigate(ROUTES.HOME);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        setErrorMessage(response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!");
      } else {
        setErrorMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
          Đăng nhập
        </h2>
        <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
          Chào mừng trở lại! Vui lòng nhập thông tin tài khoản.
        </p>
      </div>

      {errorMessage && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#dc2626",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "0.9rem",
        }}>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Email */}
        <div>
          <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
            Địa chỉ Email
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: "12px", color: "#9ca3af" }}>
              <Mail size={18} />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              required
              style={{
                width: "100%",
                padding: "10px 12px 10px 38px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "0.95rem",
                outline: "none",
                transition: "border-color 0.2s",
              }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#374151" }}>
              Mật khẩu
            </label>
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: "12px", color: "#9ca3af" }}>
              <Lock size={18} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "10px 40px 10px 38px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "10px",
            padding: "12px",
            backgroundColor: loading ? "#93c5fd" : "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            transition: "background-color 0.2s",
          }}
        >
          <LogIn size={20} />
          <span>{loading ? "Đang xác thực..." : "Đăng nhập"}</span>
        </button>
      </form>

      <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.92rem", color: "#6b7280" }}>
        Chưa có tài khoản?{" "}
        <Link to={ROUTES.REGISTER} style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
};

