import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileQuestion, Home } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          padding: "40px 36px",
          backgroundColor: "var(--color-white)",
          borderRadius: "16px",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            backgroundColor: "var(--color-accent-soft)",
            color: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <FileQuestion size={34} aria-hidden="true" />
        </div>

        <div
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "999px",
            backgroundColor: "var(--color-accent-soft)",
            color: "var(--color-forest-700)",
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            marginBottom: "12px",
          }}
        >
          MÃ LỖI 404
        </div>

        <h1
          style={{
            fontSize: "1.55rem",
            fontWeight: 800,
            color: "var(--color-dark)",
            marginBottom: "10px",
          }}
        >
          Không tìm thấy trang bạn yêu cầu
        </h1>

        <p
          style={{
            color: "var(--color-muted)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          Đường dẫn có thể đã thay đổi, bị xóa hoặc không tồn tại trên hệ thống{" "}
          <strong style={{ color: "var(--color-dark)" }}>KHO SÀN+</strong>.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="ew-btn ew-btn--secondary ew-btn--md"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Quay lại</span>
          </button>

          <Link to={ROUTES.HOME} className="ew-btn ew-btn--primary ew-btn--md">
            <Home size={16} aria-hidden="true" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
