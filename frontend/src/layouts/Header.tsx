import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  User,
  LogOut,
  Search,
  ChevronDown,
  Menu,
  Smartphone,
  Laptop,
  Shirt,
  Home,
  Heart,
  Coffee,
  Package,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";
import {
  ROLES,
  getDefaultRouteForUser,
  hasRole,
} from "@/utils/roleUtils";

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
    { name: "Điện thoại & Phụ kiện", icon: Smartphone, link: "/products?category=phone" },
    { name: "Máy tính & Laptop", icon: Laptop, link: "/products?category=laptop" },
    { name: "Thời trang", icon: Shirt, link: "/products?category=fashion" },
    { name: "Nhà cửa & Đời sống", icon: Home, link: "/products?category=home" },
    { name: "Sức khỏe & Làm đẹp", icon: Heart, link: "/products?category=beauty" },
    { name: "Thực phẩm & Đồ uống", icon: Coffee, link: "/products?category=food" },
  ];

  return (
    <header style={{
      backgroundColor: "#ffffff",
      position: "sticky",
      top: 0,
      zIndex: 50,
      width: "100%",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    }}>
      {/* 1. Top Bar (Dark Forest Green matching the design image) */}
      <div style={{
        backgroundColor: "#072b22",
        padding: "6px 24px",
        fontSize: "0.8rem",
        color: "#cbd5e1",
      }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Top Left Links */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {isAuthenticated && hasRole(user, ROLES.SELLER) && (
              <Link
                to={ROUTES.SELLER}
                style={{
                  color: "#6ee7b7",
                  textDecoration: "none",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#34d399")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6ee7b7")}
              >
                Kênh người bán
              </Link>
            )}

            {isAuthenticated &&
              hasRole(user, ROLES.CUSTOMER) &&
              !hasRole(user, ROLES.SELLER) && (
                <Link
                  to={ROUTES.BECOME_SELLER}
                  style={{
                    color: "#e2e8f0",
                    textDecoration: "none",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#34d399")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#e2e8f0")}
                >
                  Trở thành người bán
                </Link>
              )}

            {isAuthenticated && hasRole(user, ROLES.WAREHOUSE_MANAGER) && (
              <Link
                to={ROUTES.WAREHOUSE}
                style={{
                  color: "#6ee7b7",
                  textDecoration: "none",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#34d399")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6ee7b7")}
              >
                Quản lý kho
              </Link>
            )}

            {isAuthenticated && hasRole(user, ROLES.ADMIN) && (
              <Link
                to={ROUTES.ADMIN}
                style={{
                  color: "#6ee7b7",
                  textDecoration: "none",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#34d399")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6ee7b7")}
              >
                Trang quản trị
              </Link>
            )}

            <Link
              to={ROUTES.ORDERS}
              style={{
                color: "#e2e8f0",
                textDecoration: "none",
                fontSize: "0.78rem",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#34d399")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#e2e8f0")}
            >
              Theo dõi đơn hàng
            </Link>

            <a
              href="#support"
              style={{
                color: "#e2e8f0",
                textDecoration: "none",
                fontSize: "0.78rem",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#34d399")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#e2e8f0")}
            >
              Hỗ trợ khách hàng
            </a>
          </div>

          {/* Top Right Auth / User */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {isAuthenticated && user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "#a7f3d0", fontSize: "0.8rem" }}>
                  Xin chào, <strong>{user.fullName}</strong> ({user.role || "Customer"})
                </span>
                <span style={{ color: "#334155" }}>|</span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f87171",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: 0,
                  }}
                >
                  <LogOut size={13} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <Link
                  to={ROUTES.REGISTER}
                  style={{
                    color: "#e2e8f0",
                    textDecoration: "none",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#34d399")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#e2e8f0")}
                >
                  Đăng ký
                </Link>
                <span style={{ color: "#334155" }}>|</span>
                <Link
                  to={ROUTES.LOGIN}
                  style={{
                    color: "#e2e8f0",
                    textDecoration: "none",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#34d399")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#e2e8f0")}
                >
                  Đăng nhập
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Header Bar (Logo + Search Input + Cart + Account) */}
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "32px",
      }}>
        {/* Logo matching image: Green badge with icon + "Tên sàn" / "E-Warehouse" */}
        <Link to={ROUTES.HOME} style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          textDecoration: "none",
          flexShrink: 0,
        }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            backgroundColor: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)",
          }}>
            <Package size={22} strokeWidth={2.4} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "#064e3b",
              lineHeight: 1.1,
              letterSpacing: "-0.3px",
            }}>
              Tên sàn
            </span>
            <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 500 }}>
              Kho vận & Sàn TMĐT
            </span>
          </div>
        </Link>

        {/* Global Search Input with Green Search Button */}
        <div style={{
          flex: 1,
          maxWidth: "680px",
          display: "flex",
          alignItems: "center",
          border: "1.5px solid #059669",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm sản phẩm, shop..."
            style={{
              flex: 1,
              padding: "10px 16px",
              border: "none",
              outline: "none",
              fontSize: "0.9rem",
              color: "#1e293b",
            }}
          />
          <button
            type="button"
            style={{
              backgroundColor: "#064e3b",
              border: "none",
              color: "#ffffff",
              padding: "0 20px",
              height: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#047857")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#064e3b")}
          >
            <Search size={19} />
          </button>
        </div>

        {/* Right side: Cart & Account */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexShrink: 0 }}>
          {/* Cart Icon with badge */}
          <Link
            to={ROUTES.CART}
            title="Giỏ hàng"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#1e293b",
              textDecoration: "none",
              position: "relative",
              padding: "6px",
            }}
          >
            <div style={{ position: "relative" }}>
              <ShoppingCart size={24} color="#064e3b" />
              <span style={{
                position: "absolute",
                top: "-8px",
                right: "-10px",
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
                2
              </span>
            </div>
          </Link>

          {/* Account Icon + Text */}
          {isAuthenticated && user ? (
            <Link
              to={getDefaultRouteForUser(user)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                color: "#1e293b",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#e8f5f1",
                border: "1.5px solid #059669",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}>
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <span>Tài khoản</span>
            </Link>
          ) : (
            <Link
              to={ROUTES.LOGIN}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                color: "#1e293b",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              <User size={21} color="#064e3b" />
              <span>Tài khoản</span>
            </Link>
          )}
        </div>
      </div>

      {/* 3. Sub-navbar / Category Bar */}
      <div style={{
        borderTop: "1px solid #e2e8f0",
        borderBottom: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
      }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          height: "44px",
          gap: "28px",
        }}>
          {/* Left: Tất cả danh mục button */}
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              color: "#059669",
              fontSize: "0.88rem",
              fontWeight: 700,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            <Menu size={18} />
            <span>Tất cả danh mục</span>
            <ChevronDown size={14} style={{ transform: showCategoryMenu ? "rotate(180deg)" : "none", transition: "0.2s" }} />
          </button>

          {/* Center Category Links */}
          <nav style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            fontSize: "0.86rem",
            fontWeight: 500,
            overflowX: "auto",
            flex: 1,
          }}>
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                to={cat.link}
                style={{
                  color: "#334155",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#059669")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#334155")}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Right link: Warehouse portal */}
          <Link
            to={ROUTES.WAREHOUSE}
            style={{
              color: "#059669",
              textDecoration: "none",
              fontSize: "0.82rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Cổng Kho Bãi →
          </Link>
        </div>

        {/* Category Dropdown */}
        {showCategoryMenu && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            borderBottom: "1px solid #e2e8f0",
            padding: "20px 24px",
            zIndex: 40,
          }}>
            <div style={{
              maxWidth: "1280px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "16px",
            }}>
              {categories.map((cat, idx) => {
                const IconComp = cat.icon;
                return (
                  <Link
                    key={idx}
                    to={cat.link}
                    onClick={() => setShowCategoryMenu(false)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      padding: "16px 12px",
                      borderRadius: "10px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      textDecoration: "none",
                      color: "#1e293b",
                      gap: "10px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#e8f5f1";
                      e.currentTarget.style.borderColor = "#059669";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8fafc";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      backgroundColor: "#e8f5f1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#059669",
                    }}>
                      <IconComp size={22} />
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{cat.name}</span>
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
