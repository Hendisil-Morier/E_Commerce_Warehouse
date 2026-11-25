import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Warehouse } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Header } from "./Header";

export const MainLayout: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-bg)",
        fontFamily: "var(--font-sans)",
        width: "100%",
      }}
    >
      <Header />

      <main
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Outlet />
      </main>

      <footer className="ks-footer">
        <div className="ks-container">
          <div className="ks-footer-grid">
            <div>
              <div className="ks-footer-brand">
                <span className="ks-brand-mark" aria-hidden="true">
                  <Warehouse size={18} />
                </span>
                <span>
                  KHO SÀN<span style={{ color: "#34d399" }}>+</span>
                </span>
              </div>
              <p className="ks-footer-text">
                Sàn thương mại điện tử đa người bán tích hợp hệ thống Kho sàn tập trung.
                Mọi đơn hàng được phân bổ kệ, quét mã kiểm tra và xuất kho minh bạch.
              </p>
            </div>

            <div>
              <div className="ks-footer-heading">Mua sắm</div>
              <ul className="ks-footer-list">
                <li>
                  <Link to={ROUTES.HOME}>Trang chủ</Link>
                </li>
                <li>
                  <Link to={ROUTES.PRODUCTS}>Tất cả sản phẩm</Link>
                </li>
                <li>
                  <Link to={ROUTES.CART}>Giỏ hàng</Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="ks-footer-heading">Khách hàng</div>
              <ul className="ks-footer-list">
                <li>
                  <Link to={ROUTES.ORDERS}>Đơn hàng của tôi</Link>
                </li>
                <li>
                  <Link to={ROUTES.ACCOUNT}>Hồ sơ cá nhân</Link>
                </li>
                <li>
                  <Link to={ROUTES.ACCOUNT_ADDRESSES}>Sổ địa chỉ nhận hàng</Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="ks-footer-heading">Đối tác &amp; Vận hành</div>
              <ul className="ks-footer-list">
                <li>
                  <Link to={ROUTES.BECOME_SELLER} style={{ color: "#6ee7b7", fontWeight: 600 }}>
                    Trở thành người bán
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.SELLER}>Kênh người bán</Link>
                </li>
                <li>
                  <Link to={ROUTES.WAREHOUSE}>Cổng vận hành kho</Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="ks-footer-heading">Đối tác vận chuyển</div>
              <ul className="ks-footer-list">
                <li>Giao Hàng Nhanh (GHN)</li>
                <li>Giao Hàng Tiết Kiệm (GHTK)</li>
                <li>Viettel Post (VTP)</li>
                <li>J&amp;T Express · SPX Express</li>
              </ul>
            </div>
          </div>

          <div className="ks-footer-bottom">
            <span>© 2026 KHO SÀN+ (E-Commerce Warehouse). Bảo lưu mọi quyền.</span>
            <span>Kho sàn tập trung · Đa gian hàng · Đối soát tồn kho thực</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
