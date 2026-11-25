import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Truck,
  Warehouse,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";

export const AuthLayout: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === ROUTES.LOGIN;

  return (
    <div className="ks-auth-shell">
      {/* 1. Clean Auth Header */}
      <header className="ks-auth-header">
        <div className="ks-container ks-auth-header__inner">
          <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
            <Link to={ROUTES.HOME} className="ks-brand">
              <span className="ks-brand-mark" aria-hidden="true">
                <Warehouse size={20} strokeWidth={2.2} />
              </span>
              <span className="ks-brand-text">
                <span className="ks-brand-name">
                  KHO SÀN<span className="ks-brand-plus">+</span>
                </span>
              </span>
            </Link>

            <span className="ks-auth-header__divider">
              {isLoginPage ? "Đăng nhập" : "Đăng ký"}
            </span>
          </div>

          <Link to={ROUTES.HOME} className="ew-back-link">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Về sàn mua sắm</span>
          </Link>
        </div>
      </header>

      {/* 2. Main Hero Split (ambient radial gradient directly on main — zero overflow) */}
      <main className="ks-auth-main">
        <div className="ks-container ks-auth-grid">
          <div className="ks-auth-promo">
            <div className="ks-store-hero-kicker">
              <ShieldCheck size={15} aria-hidden="true" />
              <span>HỆ SINH THÁI THƯƠNG MẠI &amp; KHO VẬN KHO SÀN+</span>
            </div>

            <h1 className="ks-auth-promo__title">
              Mua từ nhiều shop,
              <br />
              xuất kho chuẩn một điểm.
            </h1>

            <p className="ks-auth-promo__desc">
              Bán hàng trên sàn, kho sàn lo phần lưu trữ và kiểm định. Quét mã vạch khi đóng
              gói, giao hàng đúng chuẩn theo thời gian thực.
            </p>

            <div className="ks-auth-features">
              <div className="ks-auth-feature-card">
                <ShieldCheck size={20} color="#6ee7b7" aria-hidden="true" />
                <div className="ks-auth-feature-kicker">Quét kiểm</div>
                <div className="ks-auth-feature-val">Xuất kho sàn</div>
              </div>

              <div className="ks-auth-feature-card ks-auth-feature-card--highlight">
                <CreditCard size={21} color="#fde047" aria-hidden="true" />
                <div className="ks-auth-feature-kicker" style={{ color: "#fde047" }}>
                  Thanh toán 1 lần
                </div>
                <div className="ks-auth-feature-val">Đa gian hàng · Tách đơn tự động</div>
              </div>

              <div className="ks-auth-feature-card">
                <Truck size={20} color="#6ee7b7" aria-hidden="true" />
                <div className="ks-auth-feature-kicker">Đối tác giao hàng</div>
                <div className="ks-auth-feature-val">GHN · GHTK · VTP · SPX</div>
              </div>
            </div>
          </div>

          <div className="ks-auth-form-col">
            <Outlet />
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="ks-auth-footer">
        <div className="ks-container ks-auth-footer__inner">
          <div className="ks-auth-footer__links">
            <Link to={ROUTES.HOME}>Trang chủ</Link>
            <Link to={ROUTES.PRODUCTS}>Danh mục sản phẩm</Link>
            <Link to={ROUTES.LOGIN}>Đăng nhập</Link>
            <Link to={ROUTES.REGISTER}>Đăng ký</Link>
          </div>
          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
            © 2026 KHO SÀN+ (E-Commerce Warehouse). Bảo lưu mọi quyền.
          </div>
        </div>
      </footer>
    </div>
  );
};
