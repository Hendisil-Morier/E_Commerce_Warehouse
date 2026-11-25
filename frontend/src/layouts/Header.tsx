import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Coffee,
  FolderTree,
  Heart,
  Home,
  Laptop,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Shirt,
  ShoppingCart,
  Smartphone,
  Store,
  User,
  Warehouse,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useMyCart } from "@/features/cart/hooks/useCart";
import { usePublicCategories } from "@/features/catalog/hooks/usePublicCatalog";
import { useAuthStore } from "@/stores/authStore";
import {
  ROLES,
  ROLE_LABELS,
  getDefaultRouteForUser,
  getPrimaryRole,
  hasRole,
} from "@/utils/roleUtils";

function getCategoryIcon(categoryName: string) {
  const normalized = categoryName.toLowerCase();
  if (normalized.includes("điện thoại")) return Smartphone;
  if (normalized.includes("máy tính") || normalized.includes("laptop")) return Laptop;
  if (normalized.includes("thời trang")) return Shirt;
  if (normalized.includes("nhà cửa") || normalized.includes("đời sống")) return Home;
  if (normalized.includes("sức khỏe") || normalized.includes("làm đẹp")) return Heart;
  if (normalized.includes("thực phẩm") || normalized.includes("đồ uống")) return Coffee;
  return FolderTree;
}

function getInitials(fullName: string | undefined): string {
  if (!fullName?.trim()) return "KH";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const urlQuery = new URLSearchParams(location.search).get("q") ?? "";
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);

  // Đồng bộ ô tìm kiếm Header khi URL ?q= thay đổi (ví dụ bấm "Đặt lại bộ lọc" trên /products)
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearchQuery(urlQuery);
  }

  const { data: categories = [] } = usePublicCategories();
  const { data: cart } = useMyCart();

  const activeCategories = categories.filter((c) => c.isActive);
  const cartTotalQty = cart?.totalQuantity ?? 0;
  const isCartPage = location.pathname === ROUTES.CART;
  const isProductsPage = location.pathname.startsWith(ROUTES.PRODUCTS);
  const canUseCart = !isAuthenticated || hasRole(user, ROLES.CUSTOMER);
  const primaryWorkspaceRoute = getDefaultRouteForUser(user);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`${ROUTES.PRODUCTS}?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate(ROUTES.PRODUCTS);
    }
    setShowCategoryMenu(false);
  };

  return (
    <header className="ks-header">
      {/* 1. Dark Pine Top Utility Bar */}
      <div className="ks-topbar">
        <div className="ks-container ks-topbar-inner">
          <div className="ks-topbar-group">
            <span className="ks-topbar-item">
              <Warehouse size={14} aria-hidden="true" />
              <span>Hệ thống Kho sàn tập trung · Kiểm định &amp; đối soát SKU trước khi xuất kho</span>
            </span>
          </div>

          <div className="ks-topbar-group">
            {isAuthenticated && hasRole(user, ROLES.SELLER) && (
              <Link to={ROUTES.SELLER} className="ks-topbar-link">
                <Store size={13} aria-hidden="true" />
                <span>Kênh người bán</span>
              </Link>
            )}

            {isAuthenticated &&
              hasRole(user, ROLES.CUSTOMER) &&
              !hasRole(user, ROLES.SELLER) && (
                <Link to={ROUTES.BECOME_SELLER} className="ks-topbar-link--muted">
                  Trở thành người bán
                </Link>
              )}

            {isAuthenticated && hasRole(user, ROLES.WAREHOUSE_MANAGER) && (
              <Link to={ROUTES.WAREHOUSE} className="ks-topbar-link">
                <Warehouse size={13} aria-hidden="true" />
                <span>Quản lý kho</span>
              </Link>
            )}

            {isAuthenticated && hasRole(user, ROLES.ADMIN) && (
              <Link to={ROUTES.ADMIN} className="ks-topbar-link">
                <ShieldCheck size={13} aria-hidden="true" />
                <span>Quản trị sàn</span>
              </Link>
            )}

            <Link to={ROUTES.ORDERS} className="ks-topbar-link--muted">
              Theo dõi đơn hàng
            </Link>

            <span className="ks-topbar-divider" aria-hidden="true">|</span>

            {isAuthenticated && user ? (
              <>
                <span className="ks-topbar-item">
                  <span>Xin chào,</span>
                  <strong style={{ color: "#ffffff" }}>{user.fullName}</strong>
                  <span>({ROLE_LABELS[getPrimaryRole(user)] ?? "Khách hàng"})</span>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Đăng xuất"
                  style={{
                    color: "#fca5a5",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <LogOut size={13} aria-hidden="true" />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <Link to={ROUTES.REGISTER} className="ks-topbar-link--muted">
                  Đăng ký
                </Link>
                <Link to={ROUTES.LOGIN} className="ks-topbar-link">
                  Đăng nhập
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Header Bar */}
      <div className="ks-container ks-header-inner">
        <Link
          to={ROUTES.HOME}
          className="ks-brand"
          onClick={() => setShowCategoryMenu(false)}
        >
          <span className="ks-brand-mark" aria-hidden="true">
            <Warehouse size={20} strokeWidth={2.2} />
          </span>
          <span className="ks-brand-text">
            <span className="ks-brand-name">
              KHO SÀN<span className="ks-brand-plus">+</span>
            </span>
            <span className="ks-brand-tagline">Sàn TMĐT &amp; Kho vận tập trung</span>
          </span>
        </Link>

        {/* Working Global Search Bar */}
        <form
          className="ks-header-search"
          role="search"
          onSubmit={handleSearchSubmit}
        >
          <label
            htmlFor="global-storefront-search"
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              overflow: "hidden",
            }}
          >
            Tìm kiếm sản phẩm trên sàn
          </label>
          <input
            id="global-storefront-search"
            type="search"
            className="ks-header-search__input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên sản phẩm, từ khóa, danh mục..."
          />
          <button
            type="submit"
            className="ks-header-search__btn"
            aria-label="Tìm kiếm sản phẩm"
          >
            <Search size={17} aria-hidden="true" />
            <span>Tìm kiếm</span>
          </button>
        </form>

        {/* Right Actions: Live Cart (Guest/Customer) or Workspace Shortcut + Account */}
        <div className="ks-header-actions">
          {canUseCart ? (
            <Link
              to={ROUTES.CART}
              className={`ks-cart-btn ${isCartPage ? "ks-cart-btn--active" : ""}`}
              aria-label={`Giỏ hàng hiện có ${cartTotalQty} sản phẩm`}
            >
              <ShoppingCart size={18} aria-hidden="true" />
              <span>Giỏ hàng</span>
              <span className="ks-cart-count-pill ks-tabular">{cartTotalQty}</span>
            </Link>
          ) : (
            <Link to={primaryWorkspaceRoute} className="ks-cart-btn">
              <LayoutDashboard size={17} color="var(--color-primary)" aria-hidden="true" />
              <span>Khu vực quản lý</span>
            </Link>
          )}

          {isAuthenticated && user ? (
            <Link to={ROUTES.ACCOUNT} className="ks-user-trigger">
              <span className="ks-user-avatar-sm" aria-hidden="true">
                {getInitials(user.fullName)}
              </span>
              <span>{user.fullName}</span>
            </Link>
          ) : (
            <Link to={ROUTES.LOGIN} className="ks-user-trigger">
              <User size={18} color="var(--color-primary)" aria-hidden="true" />
              <span>Tài khoản</span>
            </Link>
          )}
        </div>
      </div>

      {/* 3. Category Navigation Bar */}
      <div className="ks-catbar">
        <div className="ks-container ks-catbar-inner">
          <button
            type="button"
            className="ks-catbar-trigger"
            aria-expanded={showCategoryMenu}
            onClick={() => setShowCategoryMenu((prev) => !prev)}
          >
            <Menu size={17} aria-hidden="true" />
            <span>Tất cả danh mục</span>
            <ChevronDown
              size={14}
              aria-hidden="true"
              style={{
                transform: showCategoryMenu ? "rotate(180deg)" : "none",
                transition: "transform 0.15s ease",
              }}
            />
          </button>

          <nav className="ks-catbar-nav" aria-label="Danh mục ngành hàng">
            <Link
              to={ROUTES.PRODUCTS}
              className={`ks-catbar-link ${
                isProductsPage && !location.search ? "ks-catbar-link--active" : ""
              }`}
              onClick={() => setShowCategoryMenu(false)}
            >
              Tất cả sản phẩm
            </Link>
            {activeCategories.map((cat) => (
              <Link
                key={cat.categoryId}
                to={`${ROUTES.PRODUCTS}?categoryId=${cat.categoryId}`}
                className="ks-catbar-link"
                onClick={() => setShowCategoryMenu(false)}
              >
                {cat.categoryName}
              </Link>
            ))}
          </nav>

          <Link
            to={ROUTES.ORDERS}
            className="ks-catbar-link"
            style={{ color: "var(--color-primary)", fontWeight: 600 }}
          >
            Đơn hàng của tôi
          </Link>
        </div>

        {/* Category Mega Dropdown */}
        {showCategoryMenu && activeCategories.length > 0 && (
          <div className="ks-cat-dropdown">
            <div className="ks-container ks-cat-dropdown-grid">
              {activeCategories.map((cat) => {
                const IconComp = getCategoryIcon(cat.categoryName);
                return (
                  <Link
                    key={cat.categoryId}
                    to={`${ROUTES.PRODUCTS}?categoryId=${cat.categoryId}`}
                    className="ks-cat-dropdown-card"
                    onClick={() => setShowCategoryMenu(false)}
                  >
                    <span className="ks-cat-dropdown-icon" aria-hidden="true">
                      <IconComp size={21} />
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>
                      {cat.categoryName}
                    </span>
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
