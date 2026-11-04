import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export const MainLayout: React.FC = () => {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#f9fafb",
      fontFamily: "var(--sans)",
    }}>
      <Header />

      <main style={{
        flex: 1,
        width: "100%",
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "32px 24px",
      }}>
        <Outlet />
      </main>

      <footer style={{
        backgroundColor: "#ffffff",
        borderTop: "1px solid #e5e7eb",
        padding: "24px",
        textAlign: "center",
        color: "#6b7280",
        fontSize: "0.9rem",
      }}>
        <p style={{ margin: 0 }}>
          © 2026 E-Commerce Marketplace & Warehouse Management System — Team-4
        </p>
      </footer>
    </div>
  );
};

