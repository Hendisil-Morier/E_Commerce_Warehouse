import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  HelpCircle,
  QrCode,
  ShieldCheck,
  Truck,
  Sparkles,
  Plane,
  Tag,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";

export const AuthLayout: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === ROUTES.LOGIN;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#ffffff",
      fontFamily: "var(--font-sans)",
      width: "100%",
    }}>
      {/* 1. Header (Shopee style with Logo + Action title + Need help?) */}
      <header style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #f1f5f9",
        padding: "16px 24px",
      }}>
        <div style={{
          maxWidth: "1240px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link to={ROUTES.HOME} style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
            }}>
              <div style={{
                backgroundColor: "#4f46e5",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "8px",
                fontWeight: 800,
                fontSize: "1.2rem",
                letterSpacing: "-0.5px",
              }}>
                modu<span style={{ color: "#c7d2fe" }}>+</span>
              </div>
              <span style={{
                fontSize: "1.3rem",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.5px",
              }}>
                E-Warehouse
              </span>
            </Link>

            <span style={{
              fontSize: "1.3rem",
              fontWeight: 600,
              color: "#334155",
              paddingLeft: "12px",
              borderLeft: "2px solid #e2e8f0",
            }}>
              {isLoginPage ? "Đăng nhập" : "Đăng ký"}
            </span>
          </div>

          <a
            href="#help"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#4f46e5",
              fontSize: "0.9rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <HelpCircle size={16} />
            <span>Bạn cần trợ giúp?</span>
          </a>
        </div>
      </header>

      {/* 2. Main Hero Split (Indigo + Slate + White) */}
      <main style={{
        flex: 1,
        backgroundColor: "#4338ca",
        backgroundImage: "linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #1e1b4b 100%)",
        padding: "48px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle background glow effect */}
        <div style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(79, 70, 229, 0) 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          maxWidth: "1200px",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1.15fr 0.95fr",
          gap: "48px",
          alignItems: "center",
          position: "relative",
          zIndex: 2,
        }}>
          {/* Left Promotional Banner (Shopee Style Event Poster in Indigo/White/Slate) */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            color: "#ffffff",
            padding: "20px 0",
          }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              padding: "8px 20px",
              borderRadius: "30px",
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "#e0e7ff",
              letterSpacing: "0.5px",
              marginBottom: "24px",
              border: "1px solid rgba(255,255,255,0.25)",
            }}>
              <Sparkles size={18} color="#fde047" /> HỆ SINH THÁI THƯƠNG MẠI & KHO VẬN 2026
            </div>

            <div style={{
              fontSize: "4.5rem",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-2px",
              color: "#ffffff",
              textShadow: "0 4px 20px rgba(0,0,0,0.3)",
              marginBottom: "8px",
            }}>
              11.11
            </div>

            <h1 style={{
              fontSize: "2.4rem",
              fontWeight: 900,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "#ffffff",
              marginBottom: "28px",
              textShadow: "0 2px 10px rgba(0,0,0,0.25)",
            }}>
              SIÊU SALE KHO HÀNG
            </h1>

            {/* 3 Prominent Feature Cards (Voucher, Flight, FreeShip) */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.3fr 1fr",
              gap: "12px",
              width: "100%",
              maxWidth: "580px",
              marginBottom: "28px",
            }}>
              {/* Card 1 */}
              <div style={{
                backgroundColor: "#1e1b4b",
                border: "1px solid rgba(199, 210, 254, 0.3)",
                borderRadius: "14px",
                padding: "14px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "#a5b4fc", fontWeight: 700, textTransform: "uppercase" }}>
                  <Tag size={13} /> VOUCHER SÀN
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                  GIẢM ĐẾN
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#fde047" }}>
                  11 TRIỆU
                </div>
              </div>

              {/* Card 2 (Center Hero Card) */}
              <div style={{
                backgroundColor: "#312e81",
                border: "2px solid #818cf8",
                borderRadius: "14px",
                padding: "14px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "0 10px 24px rgba(0,0,0,0.3)",
                transform: "scale(1.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "#c7d2fe", fontWeight: 800 }}>
                  <Plane size={14} color="#fde047" /> CƠ HỘI TRÚNG
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fde047", marginTop: "2px" }}>
                  1.000 VÉ
                </div>
                <div style={{ fontSize: "0.8rem", color: "#e0e7ff", fontWeight: 600 }}>
                  MÁY BAY DU LỊCH
                </div>
              </div>

              {/* Card 3 */}
              <div style={{
                backgroundColor: "#1e1b4b",
                border: "1px solid rgba(199, 210, 254, 0.3)",
                borderRadius: "14px",
                padding: "14px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "#a5b4fc", fontWeight: 700, textTransform: "uppercase" }}>
                  <Truck size={13} /> FREESHIP
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                  GIAO 2-4H
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#86efac" }}>
                  0 ĐỒNG
                </div>
              </div>
            </div>

            {/* Bottom slogan badge */}
            <div style={{
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              padding: "8px 24px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#e2e8f0",
              letterSpacing: "0.5px",
            }}>
              SIÊU NHANH — SIÊU RẺ — GIỮ TỒN KHO THỜI GIAN THỰC
            </div>
          </div>

          {/* Right White Card container (Outlet for Login / Register form) */}
          <div style={{
            display: "flex",
            justifyContent: "center",
          }}>
            <Outlet />
          </div>
        </div>
      </main>

      {/* 3. Comprehensive E-Commerce Footer (Shopee Style matching Image 2 in Slate & White) */}
      <footer style={{
        backgroundColor: "#f8fafc",
        borderTop: "1px solid #e2e8f0",
        color: "#64748b",
        padding: "48px 24px 28px",
        fontSize: "0.82rem",
      }}>
        <div style={{
          maxWidth: "1240px",
          margin: "0 auto",
        }}>
          {/* Top 5 columns */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "32px",
            marginBottom: "40px",
          }}>
            {/* Col 1: Chăm sóc khách hàng */}
            <div>
              <h4 style={{ color: "#1e293b", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "16px" }}>
                Chăm sóc khách hàng
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><a href="#" style={{ color: "#64748b" }}>Trung tâm trợ giúp</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Hướng dẫn mua hàng</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Hướng dẫn bán hàng</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Thanh toán an toàn</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Vận chuyển & Giao nhận</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Trả hàng & Hoàn tiền</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Chính sách bảo hành</a></li>
              </ul>
            </div>

            {/* Col 2: Về E-Warehouse */}
            <div>
              <h4 style={{ color: "#1e293b", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "16px" }}>
                Về E-Warehouse
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><a href="#" style={{ color: "#64748b" }}>Giới thiệu về sàn</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Tuyển dụng nhân sự</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Điều khoản sàn TMĐT</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Chính sách bảo mật</a></li>
                <li><a href="#" style={{ color: "#4f46e5", fontWeight: 600 }}>Kênh Người Bán (Seller)</a></li>
                <li><a href="#" style={{ color: "#0f766e", fontWeight: 600 }}>Cổng Quản Lý Kho Bãi</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Flash Deals & Khuyến mãi</a></li>
              </ul>
            </div>

            {/* Col 3: Thanh toán */}
            <div>
              <h4 style={{ color: "#1e293b", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "16px" }}>
                Thanh toán
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", maxWidth: "200px" }}>
                <span style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 8px", borderRadius: "6px", textAlign: "center", fontWeight: 700, color: "#1e293b", fontSize: "0.75rem" }}>VISA</span>
                <span style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 8px", borderRadius: "6px", textAlign: "center", fontWeight: 700, color: "#ef4444", fontSize: "0.75rem" }}>Master</span>
                <span style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 8px", borderRadius: "6px", textAlign: "center", fontWeight: 700, color: "#2563eb", fontSize: "0.75rem" }}>JCB</span>
                <span style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 8px", borderRadius: "6px", textAlign: "center", fontWeight: 700, color: "#0f766e", fontSize: "0.75rem" }}>Amex</span>
                <span style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 8px", borderRadius: "6px", textAlign: "center", fontWeight: 700, color: "#4f46e5", fontSize: "0.75rem" }}>SPay</span>
                <span style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 8px", borderRadius: "6px", textAlign: "center", fontWeight: 700, color: "#ea580c", fontSize: "0.75rem" }}>Trả góp</span>
              </div>
            </div>

            {/* Col 4: Đơn vị vận chuyển (Khớp bảng Carriers) */}
            <div>
              <h4 style={{ color: "#1e293b", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "16px" }}>
                Đơn vị vận chuyển
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", maxWidth: "200px" }}>
                <span style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 8px", borderRadius: "6px", textAlign: "center", fontWeight: 700, color: "#ea580c", fontSize: "0.75rem" }}>SPX</span>
                <span style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 8px", borderRadius: "6px", textAlign: "center", fontWeight: 700, color: "#16a34a", fontSize: "0.75rem" }}>GHTK</span>
                <span style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 8px", borderRadius: "6px", textAlign: "center", fontWeight: 700, color: "#2563eb", fontSize: "0.75rem" }}>GHN</span>
                <span style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 8px", borderRadius: "6px", textAlign: "center", fontWeight: 700, color: "#dc2626", fontSize: "0.75rem" }}>ViettelPost</span>
                <span style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 8px", borderRadius: "6px", textAlign: "center", fontWeight: 700, color: "#d97706", fontSize: "0.75rem" }}>J&T Express</span>
              </div>
            </div>

            {/* Col 5: Tải ứng dụng */}
            <div>
              <h4 style={{ color: "#1e293b", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "16px" }}>
                Theo dõi & Tải app
              </h4>
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem" }}>f</span>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#ec4899", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem" }}>in</span>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#0ea5e9", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem" }}>yt</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  padding: "6px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}>
                  <QrCode size={48} color="#1e293b" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.75rem" }}>
                  <span style={{ padding: "3px 8px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "4px", fontWeight: 600 }}>App Store</span>
                  <span style={{ padding: "3px 8px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "4px", fontWeight: 600 }}>Google Play</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px", marginBottom: "20px" }}>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              fontSize: "0.8rem",
            }}>
              <div>
                © 2026 E-Warehouse Marketplace. Tất cả các quyền được bảo lưu.
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                <span>Quốc gia & Khu vực:</span>
                <span style={{ color: "#1e293b", fontWeight: 600 }}>Việt Nam</span>
                <span>Singapore</span>
                <span>Thái Lan</span>
                <span>Malaysia</span>
                <span>Indonesia</span>
              </div>
            </div>
          </div>

          {/* Legal Bar & Red Registered Badge */}
          <div style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            paddingTop: "12px",
          }}>
            <div style={{ display: "flex", gap: "24px", fontSize: "0.78rem", textTransform: "uppercase", fontWeight: 600, color: "#64748b" }}>
              <a href="#">CHÍNH SÁCH BẢO MẬT</a>
              <a href="#">QUY CHẾ HOẠT ĐỘNG</a>
              <a href="#">CHÍNH SÁCH VẬN CHUYỂN</a>
              <a href="#">CHÍNH SÁCH TRẢ HÀNG & HOÀN TIỀN</a>
            </div>

            {/* Red Badge */}
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                border: "2px solid #dc2626",
                color: "#dc2626",
                borderRadius: "30px",
                padding: "4px 14px",
                fontSize: "0.75rem",
                fontWeight: 800,
                textTransform: "uppercase",
              }}>
                <ShieldCheck size={16} /> ĐÃ ĐĂNG KÝ BỘ CÔNG THƯƠNG
              </div>
            </div>

            <div style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.5, maxWidth: "700px", marginTop: "6px" }}>
              Địa chỉ: Tầng 4-5-6, Tòa nhà Capital Place, số 29 Liễu Giai, Phường Ngọc Khánh, Ba Đình, Hà Nội.<br />
              Chăm sóc khách hàng: Hotline 1900 6868 | Email: hotro@ewarehouse.vn<br />
              Mã số doanh nghiệp: 0106773786 do Sở KH&ĐT TP. Hà Nội cấp ngày 10/02/2026.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
