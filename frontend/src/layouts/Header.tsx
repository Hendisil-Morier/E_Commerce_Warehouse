import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ShoppingCart,
  Heart,
  User,
  LogOut,
  Search,
  ChevronDown,
  Truck,
  Sparkles,
  Headphones,
  Laptop,
  Shirt,
  Watch,
  Coffee,
  Flame,
  Store,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const categories = [
    { name: "Đồ điện tử & Công nghệ", icon: Laptop, tag: "Hot", link: "/products?category=electronics" },
    { name: "Thời trang & May mặc", icon: Shirt, tag: "", link: "/products?category=apparel" },
    { name: "Phụ kiện cao cấp", icon: Watch, tag: "New", link: "/products?category=accessories" },
    { name: "Thiết bị gia dụng", icon: Coffee, tag: "", link: "/products?category=home" },
    { name: "Âm thanh & Giải trí", icon: Headphones, tag: "", link: "/products?category=audio" },
  ];

  return (
    <header style={{
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #e2e8f0",
      position: "sticky",
      top: 0,
      zIndex: 50,
      width: "100%",
    }}>
      {/* Top Bar / Announcement ticker */}
      <div style={{
        backgroundColor: "#f8fafc",
        borderBottom: "1px solid #f1f5f9",
        padding: "6px 24px",
        fontSize: "0.8rem",
        color: "#64748b",
      }}>
        <div style={{
          maxWidth: "1320px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Shopee-style Kênh Người Bán link right on topbar */}
            <Link
              to={ROUTES.SELLER}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                color: "#4f46e5",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <Store size={14} />
              <span>Kênh Người Bán</span>
            </Link>

            <span style={{ color: "#cbd5e1" }}>|</span>

            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#334155", fontWeight: 500 }}>
              <Sparkles size={14} color="#6366f1" /> Chào mừng bạn đến với Hệ sinh thái Thương mại & Kho bãi E-Warehouse!
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Truck size={14} color="#4f46e5" /> Hotline: <strong style={{ color: "#0f172a" }}>1900 6868</strong>
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", color: "#334155" }}>
              <span>🇻🇳 VN / VND</span>
              <ChevronDown size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div style={{
        maxWidth: "1320px",
        margin: "0 auto",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
      }}>
        {/* Logo */}
        <Link to={ROUTES.HOME} style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
          userSelect: "none",
        }}>
          <div style={{
            backgroundColor: "#4f46e5",
            color: "#ffffff",
            padding: "6px 12px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            fontWeight: 800,
            fontSize: "1.2rem",
            letterSpacing: "-0.5px",
          }}>
            modu<span style={{ color: "#c7d2fe" }}>+</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{
              fontSize: "1.28rem",
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.1,
              letterSpacing: "-0.5px",
            }}>
              E-Warehouse
            </span>
            <span style={{ fontSize: "0.72rem", color: "#64748b", letterSpacing: "0.2px" }}>
              Smart Living & Logistics
            </span>
          </div>
        </Link>

        {/* Global Search Input */}
        <div style={{
          flex: 1,
          maxWidth: "560px",
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}>
          <Search size={18} color="#94a3b8" style={{ position: "absolute", left: "14px" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm hơn 50.000+ sản phẩm, danh mục, phụ kiện..."
            style={{
              width: "100%",
              padding: "11px 80px 11px 42px",
              borderRadius: "24px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#f8fafc",
              fontSize: "0.9rem",
              color: "#1e293b",
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#4f46e5";
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#cbd5e1";
              e.currentTarget.style.backgroundColor = "#f8fafc";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <span style={{
            position: "absolute",
            right: "12px",
            fontSize: "0.75rem",
            backgroundColor: "#e2e8f0",
            color: "#64748b",
            padding: "2px 8px",
            borderRadius: "6px",
            fontWeight: 600,
            pointerEvents: "none",
          }}>
            ⌘K
          </span>
        </div>

        {/* Actions & User State */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Wishlist */}
          <Link
            to="/wishlist"
            title="Sản phẩm yêu thích"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#475569",
              textDecoration: "none",
              padding: "8px",
              borderRadius: "50%",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              position: "relative",
            }}
          >
            <Heart size={19} />
            <span style={{
              position: "absolute",
              top: "-3px",
              right: "-3px",
              backgroundColor: "#ef4444",
              color: "#ffffff",
              fontSize: "0.65rem",
              fontWeight: 700,
              borderRadius: "50%",
              width: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              3
            </span>
          </Link>

          {/* Cart */}
          <Link
            to={ROUTES.CART}
            title="Giỏ hàng"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#0f172a",
              textDecoration: "none",
              padding: "8px 14px",
              borderRadius: "20px",
              backgroundColor: "#f1f5f9",
              fontWeight: 600,
              fontSize: "0.88rem",
            }}
          >
            <ShoppingCart size={18} color="#4f46e5" />
            <span>Giỏ hàng</span>
            <span style={{
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: 700,
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              2
            </span>
          </Link>

          {/* User state */}
          {isAuthenticated && user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 12px",
                backgroundColor: "#f1f5f9",
                borderRadius: "20px",
              }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}>
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1e293b" }}>
                  {user.fullName}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Đăng xuất"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  color: "#ef4444",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <LogOut size={15} />
                <span>Thoát</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Link
                to={ROUTES.LOGIN}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "20px",
                  color: "#1e293b",
                  textDecoration: "none",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  border: "1px solid #cbd5e1",
                }}
              >
                <User size={16} />
                <span>Đăng nhập</span>
              </Link>

              <Link
                to={ROUTES.REGISTER}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)",
                }}
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Sub-navbar / Categories bar */}
      <div style={{
        borderTop: "1px solid #f1f5f9",
        backgroundColor: "#ffffff",
        position: "relative",
      }}>
        <div style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "46px",
        }}>
          {/* Left: Category toggle & quick links */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <button
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                backgroundColor: showCategoryMenu ? "#1e293b" : "#f1f5f9",
                color: showCategoryMenu ? "#ffffff" : "#1e293b",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
            >
              <ShoppingBag size={16} />
              <span>Tất cả danh mục</span>
              <ChevronDown
                size={14}
                style={{
                  transform: showCategoryMenu ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            <nav style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "0.88rem", fontWeight: 500 }}>
              <Link to={ROUTES.PRODUCTS} style={{ color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                <Laptop size={15} color="#64748b" /> Đồ điện tử
              </Link>
              <Link to={ROUTES.PRODUCTS} style={{ color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                <Shirt size={15} color="#64748b" /> Thời trang
              </Link>
              <Link to={ROUTES.PRODUCTS} style={{ color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                <Watch size={15} color="#64748b" /> Phụ kiện
              </Link>
              <Link to={ROUTES.PRODUCTS} style={{ color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                <Coffee size={15} color="#64748b" /> Thiết bị gia dụng
              </Link>
              <Link
                to={ROUTES.PRODUCTS}
                style={{
                  color: "#dc2626",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Flame size={15} /> Flash Sale -40%
              </Link>
            </nav>
          </div>

          {/* Right: Track order & Warehouse portals */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.85rem" }}>
            <Link
              to={ROUTES.ORDERS}
              style={{
                color: "#475569",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 500,
              }}
            >
              <Truck size={15} color="#4f46e5" />
              <span>Tra cứu đơn hàng</span>
            </Link>

            <span style={{ color: "#cbd5e1" }}>|</span>

            <Link
              to={ROUTES.WAREHOUSE}
              style={{
                color: "#0f766e",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>Vào Cổng Quản Lý Kho →</span>
            </Link>
          </div>
        </div>

        {/* Dropdown Mega-Menu Panel */}
        {showCategoryMenu && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            boxShadow: "0 15px 30px rgba(15, 23, 42, 0.08)",
            borderTop: "1px solid #f1f5f9",
            borderBottom: "1px solid #e2e8f0",
            padding: "24px 0",
            zIndex: 40,
          }}>
            <div style={{
              maxWidth: "1320px",
              margin: "0 auto",
              padding: "0 24px",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px",
            }}>
              {categories.map((cat, idx) => {
                const IconComponent = cat.icon;
                return (
                  <Link
                    key={idx}
                    to={cat.link}
                    onClick={() => setShowCategoryMenu(false)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#eef2ff";
                      e.currentTarget.style.borderColor = "#c7d2fe";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8fafc";
                      e.currentTarget.style.borderColor = "#f1f5f9";
                    }}
                  >
                    <div style={{
                      padding: "8px",
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                      color: "#4f46e5",
                    }}>
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#1e293b", marginBottom: "4px" }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        Hàng sẵn kho, bảo hành chính hãng
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
