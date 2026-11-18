import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Package } from "lucide-react";
import { Header } from "./Header";
import { ROUTES } from "@/constants/routes";

export const MainLayout: React.FC = () => {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#f8fafc",
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

      {/* Footer matching design image: Dark Navy / Forest with 4 columns */}
      <footer style={{
        backgroundColor: "#071c17",
        color: "#94a3b8",
        padding: "50px 24px 30px",
        fontSize: "0.82rem",
        width: "100%",
        borderTop: "1px solid #0f3d32",
      }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
        }}>
          {/* Top Columns */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr",
            gap: "40px",
            marginBottom: "40px",
          }}>
            {/* Brand Intro */}
            <div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                }}>
                  <Package size={18} />
                </div>
                <span style={{
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  color: "#ffffff",
                }}>
                  Tên sàn
                </span>
              </div>
              <p style={{
                color: "#94a3b8",
                fontSize: "0.82rem",
                lineHeight: 1.6,
                maxWidth: "280px",
              }}>
                Sàn thương mại điện tử nhiều người bán, hàng được đóng gói và giao từ kho.
              </p>
            </div>

            {/* Col 1: Về sàn */}
            <div>
              <h4 style={{ color: "#ffffff", fontSize: "0.88rem", fontWeight: 700, marginBottom: "16px" }}>
                Về sàn
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                <li><a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Giới thiệu</a></li>
                <li><a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Điều khoản sử dụng</a></li>
                <li><a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Chính sách bảo mật</a></li>
              </ul>
            </div>

            {/* Col 2: Hỗ trợ khách hàng */}
            <div>
              <h4 style={{ color: "#ffffff", fontSize: "0.88rem", fontWeight: 700, marginBottom: "16px" }}>
                Hỗ trợ khách hàng
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                <li><a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Trung tâm trợ giúp</a></li>
                <li><Link to={ROUTES.ORDERS} style={{ color: "#94a3b8", textDecoration: "none" }}>Theo dõi đơn hàng</Link></li>
                <li><a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Chính sách đổi trả</a></li>
                <li><a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Phương thức thanh toán</a></li>
              </ul>
            </div>

            {/* Col 3: Dành cho người bán */}
            <div>
              <h4 style={{ color: "#ffffff", fontSize: "0.88rem", fontWeight: 700, marginBottom: "16px" }}>
                Dành cho người bán
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                <li><Link to={ROUTES.REGISTER} style={{ color: "#34d399", fontWeight: 600, textDecoration: "none" }}>Đăng ký bán hàng</Link></li>
                <li><Link to={ROUTES.SELLER} style={{ color: "#94a3b8", textDecoration: "none" }}>Kênh người bán</Link></li>
                <li><a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Hướng dẫn gửi hàng vào kho</a></li>
                <li><Link to={ROUTES.WAREHOUSE} style={{ color: "#94a3b8", textDecoration: "none" }}>Cổng kho sàn</Link></li>
              </ul>
            </div>

            {/* Col 4: Vận chuyển */}
            <div>
              <h4 style={{ color: "#ffffff", fontSize: "0.88rem", fontWeight: 700, marginBottom: "16px" }}>
                Vận chuyển
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                <li><span style={{ color: "#94a3b8" }}>Giao Hàng Nhanh</span></li>
                <li><span style={{ color: "#94a3b8" }}>Giao Hàng Tiết Kiệm</span></li>
                <li><span style={{ color: "#94a3b8" }}>Viettel Post</span></li>
                <li><span style={{ color: "#94a3b8" }}>J&T Express - SPX Express</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div style={{
            borderTop: "1px solid #133a30",
            paddingTop: "24px",
            textAlign: "center",
            fontSize: "0.78rem",
            color: "#64748b",
          }}>
            © Tên sàn. Bảo lưu mọi quyền.
          </div>
        </div>
      </footer>
    </div>
  );
};
