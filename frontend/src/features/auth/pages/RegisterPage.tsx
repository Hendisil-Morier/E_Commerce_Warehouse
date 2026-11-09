import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Store,
  ShoppingBag,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [accountType, setAccountType] = useState<"customer" | "seller">("customer");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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

    // 1. Kiểm tra định dạng Gmail hợp lệ (@gmail.com)
    const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!GMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage("Địa chỉ email phải là Gmail hợp lệ (kết thúc bằng @gmail.com, ví dụ: yourname@gmail.com).");
      return;
    }

    // 2. Kiểm tra số điện thoại: đúng 10 số và thuộc các đầu số nhà mạng VN quy định
    // Các đầu số hợp lệ: 070, 076-079, 089, 090, 093, 032-039, 086, 096-098, 081-085, 088, 091, 094, 092, 056, 058, 052, 099, 059
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
        password,
        phoneNumber: cleanPhone,
        accountType,
        shopName: accountType === "seller" ? shopName.trim() : undefined,
      });

      setAuth(data);

      if (accountType === "seller") {
        navigate(ROUTES.SELLER);
      } else {
        navigate(ROUTES.HOME);
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        setErrorMessage(response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại!");
      } else {
        setErrorMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 20px 40px rgba(15, 23, 42, 0.25)",
      padding: "32px 36px",
      width: "100%",
      maxWidth: "480px",
      boxSizing: "border-box",
    }}>
      <h2 style={{
        fontSize: "1.45rem",
        fontWeight: 800,
        color: "#0f172a",
        marginBottom: "16px",
      }}>
        Đăng ký tài khoản
      </h2>

      {/* Account Type Selector (Khách hàng vs Người bán) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        marginBottom: "20px",
      }}>
        <button
          type="button"
          onClick={() => setAccountType("customer")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px",
            borderRadius: "8px",
            border: accountType === "customer" ? "2px solid #4f46e5" : "1px solid #cbd5e1",
            backgroundColor: accountType === "customer" ? "#eef2ff" : "#ffffff",
            color: accountType === "customer" ? "#4f46e5" : "#64748b",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <ShoppingBag size={17} />
          <span>Khách mua hàng</span>
        </button>

        <button
          type="button"
          onClick={() => setAccountType("seller")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px",
            borderRadius: "8px",
            border: accountType === "seller" ? "2px solid #4f46e5" : "1px solid #cbd5e1",
            backgroundColor: accountType === "seller" ? "#eef2ff" : "#ffffff",
            color: accountType === "seller" ? "#4f46e5" : "#64748b",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <Store size={17} />
          <span>Đối tác Người bán</span>
        </button>
      </div>

      {errorMessage && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#dc2626",
          padding: "10px 14px",
          borderRadius: "8px",
          marginBottom: "16px",
          fontSize: "0.85rem",
        }}>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Full Name */}
        <div>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Họ và tên đầy đủ *"
            required
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.92rem",
              outline: "none",
            }}
          />
        </div>

        {/* Username */}
        <div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tên đăng nhập *"
            required
            autoCapitalize="none"
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.92rem",
              outline: "none",
            }}
          />
        </div>

        {/* Email (Gmail) */}
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Địa chỉ Gmail (ví dụ: name@gmail.com) *"
            required
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.92rem",
              outline: "none",
            }}
          />
        </div>

        {/* Phone */}
        <div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
              setPhoneNumber(val);
            }}
            placeholder="Số điện thoại liên hệ (10 chữ số) *"
            required
            maxLength={10}
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.92rem",
              outline: "none",
            }}
          />
        </div>

        {/* Extra fields if Seller */}
        {accountType === "seller" && (
          <div>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Tên gian hàng / Doanh nghiệp dự kiến *"
              required
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "8px",
                border: "1px solid #818cf8",
                backgroundColor: "#f8fafc",
                fontSize: "0.92rem",
                outline: "none",
              }}
            />
          </div>
        )}

        {/* Password */}
        <div>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu (tối thiểu 6 ký tự) *"
              required
              style={{
                width: "100%",
                padding: "11px 42px 11px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.92rem",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                color: "#64748b",
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Xác nhận lại mật khẩu *"
            required
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.92rem",
              outline: "none",
            }}
          />
        </div>

        {/* Big Submit Button (Indigo) */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            backgroundColor: loading ? "#94a3b8" : "#4f46e5",
            color: "#ffffff",
            borderRadius: "8px",
            fontWeight: 800,
            fontSize: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
            marginTop: "6px",
          }}
        >
          {loading ? "ĐANG TẠO TÀI KHOẢN..." : (accountType === "seller" ? "ĐĂNG KÝ MỞ GIAN HÀNG" : "ĐĂNG KÝ NGAY")}
        </button>

        {/* Disclaimer */}
        <p style={{
          fontSize: "0.72rem",
          color: "#94a3b8",
          textAlign: "center",
          lineHeight: 1.4,
          margin: "4px 0 0",
        }}>
          Bằng việc đăng ký, bạn xác nhận đã đọc và đồng ý với Điều khoản dịch vụ & Chính sách bảo mật của E-Warehouse.
        </p>

        {/* Switch to Login */}
        <div style={{
          textAlign: "center",
          fontSize: "0.85rem",
          color: "#64748b",
          paddingTop: "6px",
        }}>
          Bạn đã có tài khoản?{" "}
          <Link
            to={ROUTES.LOGIN}
            style={{
              color: "#4f46e5",
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
