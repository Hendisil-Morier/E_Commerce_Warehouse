import React from "react";
import { Link, Outlet } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export const AuthLayout: React.FC = () => {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#f8f9fa",
      fontFamily: "var(--sans)",
    }}>
      {/* Top Header bar */}
      <header style={{
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #eaeaea",
        backgroundColor: "#ffffff",
      }}>
        <Link to={ROUTES.HOME} style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
          color: "#111827",
          fontWeight: 700,
          fontSize: "1.2rem",
        }}>
          <ShoppingBag size={24} color="#2563eb" />
          <span>E-Warehouse</span>
        </Link>

        <Link to={ROUTES.HOME} style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          textDecoration: "none",
          color: "#4b5563",
          fontSize: "0.95rem",
          fontWeight: 500,
        }}>
          <ArrowLeft size={18} />
          <span>Trang chủ</span>
        </Link>
      </header>

      {/* Center Auth Card container */}
      <main style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "32px 16px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          padding: "32px",
          border: "1px solid #eaeaea",
        }}>
          <Outlet />
        </div>
      </main>

      {/* Simple Footer */}
      <footer style={{
        padding: "16px",
        textAlign: "center",
        color: "#9ca3af",
        fontSize: "0.85rem",
        borderTop: "1px solid #eaeaea",
      }}>
        © 2026 E-Commerce & Warehouse Management System (Team-4)
      </footer>
    </div>
  );
};

