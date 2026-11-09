import React from "react";
import { Outlet } from "react-router-dom";
import {
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { Header } from "./Header";

export const MainLayout: React.FC = () => {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#ffffff",
      fontFamily: "var(--font-sans)",
      width: "100%",
    }}>
      <Header />

      <main style={{
        flex: 1,
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}>
        <Outlet />
      </main>

      {/* Comprehensive E-Commerce Footer (Shopee Style matching Image 2 in Slate & White) */}
      <footer style={{
        backgroundColor: "#f8fafc",
        borderTop: "1px solid #e2e8f0",
        color: "#64748b",
        padding: "54px 24px 30px",
        fontSize: "0.82rem",
        width: "100%",
      }}>
        <div style={{
          maxWidth: "1320px",
          margin: "0 auto",
        }}>
          {/* Top 5 columns */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "36px",
            marginBottom: "44px",
          }}>
            {/* Col 1: Chăm sóc khách hàng */}
            <div>
              <h4 style={{ color: "#1e293b", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "16px" }}>
                Chăm sóc khách hàng
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><a href="#" style={{ color: "#64748b" }}>Trung tâm trợ giúp 24/7</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Hướng dẫn mua sắm</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Hướng dẫn bán hàng</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Chính sách thanh toán</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Vận chuyển & Giao nhận 2-4h</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Trả hàng & Hoàn tiền</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Chính sách bảo hành chính hãng</a></li>
              </ul>
            </div>

            {/* Col 2: Về E-Warehouse */}
            <div>
              <h4 style={{ color: "#1e293b", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "16px" }}>
                Về E-Warehouse
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><a href="#" style={{ color: "#64748b" }}>Giới thiệu hệ sinh thái</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Tuyển dụng & Cơ hội việc làm</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Điều khoản hoạt động sàn TMĐT</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Chính sách bảo mật dữ liệu</a></li>
                <li><a href="/seller" style={{ color: "#4f46e5", fontWeight: 700 }}>Kênh Người Bán (Seller Centre)</a></li>
                <li><a href="/warehouse" style={{ color: "#0f766e", fontWeight: 700 }}>Cổng Vận Hành Kho Bãi</a></li>
                <li><a href="#" style={{ color: "#64748b" }}>Flash Deals & Ưu đãi thành viên</a></li>
              </ul>
            </div>

            {/* Col 3: Thanh toán */}
            <div>
              <h4 style={{ color: "#1e293b", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "16px" }}>
                Thanh toán
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", maxWidth: "210px" }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", maxWidth: "210px" }}>
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
                © 2026 E-Warehouse Marketplace & Warehouse Management System — Team-4.
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
