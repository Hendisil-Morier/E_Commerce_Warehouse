import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  HelpCircle,
  Package,
  ShieldCheck,
  Truck,
  CreditCard,
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
      {/* 1. Header (Logo + Action title + Need help?) */}
      <header style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
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
              gap: "10px",
              textDecoration: "none",
            }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#059669",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)",
              }}>
                <Package size={20} />
              </div>
              <span style={{
                fontSize: "1.3rem",
                fontWeight: 800,
                color: "#064e3b",
                letterSpacing: "-0.5px",
              }}>
                Tên sàn
              </span>
            </Link>

            <span style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#334155",
              paddingLeft: "14px",
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
              color: "#059669",
              fontSize: "0.88rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <HelpCircle size={16} />
            <span>Bạn cần trợ giúp?</span>
          </a>
        </div>
      </header>

      {/* 2. Main Hero Split (Forest Green #072b22 / #0a3d31) */}
      <main style={{
        flex: 1,
        backgroundColor: "#072b22",
        backgroundImage: "linear-gradient(135deg, #05241c 0%, #072b22 55%, #0a3d31 100%)",
        padding: "48px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle ambient glow */}
        <div style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, rgba(7, 43, 34, 0) 70%)",
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
          {/* Left Promotional Banner in Forest Green */}
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
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(10px)",
              padding: "7px 18px",
              borderRadius: "30px",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#a7f3d0",
              letterSpacing: "0.5px",
              marginBottom: "24px",
              border: "1px solid rgba(255,255,255,0.2)",
            }}>
              <span>🌐 HỆ SINH THÁI THƯƠNG MẠI & KHO VẬN TÊN SÀN</span>
            </div>

            <h1 style={{
              fontSize: "2.5rem",
              fontWeight: 900,
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
              color: "#ffffff",
              marginBottom: "12px",
            }}>
              Mua từ nhiều shop,<br />trả một lần.
            </h1>

            <p style={{
              fontSize: "1.05rem",
              color: "#cbd5e1",
              maxWidth: "460px",
              lineHeight: 1.5,
              marginBottom: "32px",
            }}>
              Bán hàng trên sàn, kho lo phần còn lại. Quét kiểm khi đóng gói, giao hàng đúng chuẩn.
            </p>

            {/* 3 Prominent Feature Cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.25fr 1fr",
              gap: "12px",
              width: "100%",
              maxWidth: "540px",
              marginBottom: "28px",
            }}>
              {/* Card 1 */}
              <div style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "14px",
                padding: "16px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}>
                <ShieldCheck size={20} color="#6ee7b7" />
                <div style={{ fontSize: "0.75rem", color: "#a7f3d0", fontWeight: 700, textTransform: "uppercase" }}>
                  QUÉT KIỂM
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ffffff" }}>
                  XUẤT KHO SÀN
                </div>
              </div>

              {/* Card 2 (Center Highlight Card) */}
              <div style={{
                backgroundColor: "rgba(5, 150, 105, 0.25)",
                border: "2px solid #34d399",
                borderRadius: "14px",
                padding: "16px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                transform: "scale(1.05)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
              }}>
                <CreditCard size={22} color="#fde047" />
                <div style={{ fontSize: "0.75rem", color: "#fde047", fontWeight: 800 }}>
                  THANH TOÁN 1 LẦN
                </div>
                <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "#ffffff" }}>
                  3 GÓI · COD HOẶC ONLINE
                </div>
              </div>

              {/* Card 3 */}
              <div style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "14px",
                padding: "16px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}>
                <Truck size={20} color="#6ee7b7" />
                <div style={{ fontSize: "0.75rem", color: "#a7f3d0", fontWeight: 700, textTransform: "uppercase" }}>
                  ĐỐI TÁC GIAO HÀNG
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ffffff" }}>
                  GHN · GHTK · SPX
                </div>
              </div>
            </div>

            {/* Bottom slogan badge */}
            <div style={{
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              padding: "7px 20px",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#cbd5e1",
            }}>
              SIÊU NHANH — AN TOÀN — THEO DÕI TỒN KHO THỜI GIAN THỰC
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

      {/* 3. Dark Navy / Forest Footer */}
      <footer style={{
        backgroundColor: "#071c17",
        color: "#94a3b8",
        padding: "36px 24px 20px",
        fontSize: "0.82rem",
        borderTop: "1px solid #0f3d32",
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          textAlign: "center",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "24px",
            fontSize: "0.8rem",
            color: "#cbd5e1",
          }}>
            <a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Trung tâm trợ giúp</a>
            <a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Chính sách bảo mật</a>
            <a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Quy chế hoạt động</a>
            <a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Chính sách vận chuyển</a>
          </div>
          <div style={{ fontSize: "0.76rem", color: "#64748b" }}>
            © Tên sàn. Sàn thương mại điện tử kết nối kho vận tập trung. Bảo lưu mọi quyền.
          </div>
        </div>
      </footer>
    </div>
  );
};
