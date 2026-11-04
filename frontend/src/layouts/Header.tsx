import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, ShoppingCart, User, LogOut, Search } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header style={{
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #e5e7eb",
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
      }}>
        {/* Brand / Logo */}
        <Link to={ROUTES.HOME} style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          textDecoration: "none",
          color: "#111827",
          fontSize: "1.3rem",
          fontWeight: 700,
        }}>
          <div style={{
            backgroundColor: "#2563eb",
            color: "#ffffff",
            padding: "8px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
          }}>
            <ShoppingBag size={22} />
          </div>
          <span>E-Warehouse</span>
        </Link>

        {/* Search Bar */}
        <div style={{
          flex: 1,
          maxWidth: "480px",
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}>
          <Search size={18} color="#9ca3af" style={{ position: "absolute", left: "12px" }} />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm, danh mục, thương hiệu..."
            style={{
              width: "100%",
              padding: "9px 12px 9px 38px",
              borderRadius: "20px",
              border: "1px solid #d1d5db",
              backgroundColor: "#f9fafb",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
        </div>

        {/* Action icons & Auth state */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Cart Icon */}
          <Link
            to={ROUTES.CART}
            title="Giỏ hàng"
            style={{
              display: "flex",
              alignItems: "center",
              color: "#374151",
              textDecoration: "none",
              padding: "8px",
              borderRadius: "8px",
              position: "relative",
            }}
          >
            <ShoppingCart size={22} />
            <span style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              backgroundColor: "#ef4444",
              color: "#ffffff",
              fontSize: "0.7rem",
              fontWeight: 700,
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              0
            </span>
          </Link>

          {/* User state */}
          {isAuthenticated && user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                backgroundColor: "#f3f4f6",
                borderRadius: "20px",
              }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}>
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1f2937" }}>
                  {user.fullName}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Đăng xuất"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  color: "#ef4444",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <LogOut size={16} />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link
                to={ROUTES.LOGIN}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  color: "#374151",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                <User size={16} />
                <span>Đăng nhập</span>
              </Link>

              <Link
                to={ROUTES.REGISTER}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

