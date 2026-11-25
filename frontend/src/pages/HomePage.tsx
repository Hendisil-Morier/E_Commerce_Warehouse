import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Coffee,
  CreditCard,
  FolderTree,
  Heart,
  Home as HomeIcon,
  Laptop,
  RotateCcw,
  ShieldCheck,
  Shirt,
  Smartphone,
  Store,
  Truck,
  Warehouse,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ProductCard } from "@/components/common/ProductCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import {
  usePublicCategories,
  usePublicProducts,
} from "@/features/catalog/hooks/usePublicCatalog";
import { useAuthStore } from "@/stores/authStore";
import { hasRole, ROLES } from "@/utils/roleUtils";

function getCategoryIcon(categoryName: string) {
  const normalized = categoryName.toLowerCase();
  if (normalized.includes("điện thoại")) return Smartphone;
  if (normalized.includes("máy tính") || normalized.includes("laptop")) return Laptop;
  if (normalized.includes("thời trang")) return Shirt;
  if (normalized.includes("nhà cửa") || normalized.includes("đời sống")) return HomeIcon;
  if (normalized.includes("sức khỏe") || normalized.includes("làm đẹp")) return Heart;
  if (normalized.includes("thực phẩm") || normalized.includes("đồ uống")) return Coffee;
  return FolderTree;
}

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const isSeller = isAuthenticated && hasRole(user, ROLES.SELLER);

  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = usePublicCategories();

  const {
    data: productsPage,
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError,
    refetch: refetchProducts,
  } = usePublicProducts({
    page: 1,
    pageSize: 8,
    sort: "-createdAt",
  });

  const activeCategories = categories.filter((c) => c.isActive).slice(0, 6);
  const latestProducts = productsPage?.items ?? [];

  return (
    <div className="ks-container ks-store-main">
      {/* 1. Editorial Hero Banner (KHO SÀN+ Aesthetic) */}
      <section className="ks-store-hero" aria-label="Giới thiệu sàn thương mại điện tử KHO SÀN+">
        <div>
          <div className="ks-store-hero-kicker">
            <ShieldCheck size={15} aria-hidden="true" />
            <span>KHO SÀN TẬP TRUNG · KIỂM ĐỊNH &amp; QUÉT MÃ KHI XUẤT KHO</span>
          </div>

          <h1 className="ks-store-hero-title">
            Mua từ nhiều gian hàng,
            <br />
            xuất kho minh bạch từ Kho Sàn+
          </h1>

          <p className="ks-store-hero-desc">
            Gộp sản phẩm từ nhiều người bán vào một giỏ hàng duy nhất. Mọi đơn hàng đều
            được phân bổ vị trí kệ tại Kho sàn, quét kiểm mã vạch đúng SKU và theo dõi
            vận đơn trực tiếp đến tay bạn.
          </p>

          <div className="ks-store-hero-actions">
            <Link to={ROUTES.PRODUCTS} className="ew-btn ew-btn--primary ew-btn--lg">
              <Warehouse size={17} aria-hidden="true" />
              <span>Khám phá sản phẩm</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              to={isSeller ? ROUTES.SELLER : ROUTES.BECOME_SELLER}
              className="ew-btn ew-btn--secondary ew-btn--lg"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderColor: "rgba(255, 255, 255, 0.35)",
                color: "#ffffff",
              }}
            >
              <Store size={17} aria-hidden="true" />
              <span>{isSeller ? "Vào Kênh người bán" : "Trở thành người bán"}</span>
            </Link>
          </div>
        </div>

        <div className="ks-hero-proof-grid ks-tabular">
          <div className="ks-hero-proof-card">
            <div className="ks-hero-proof-value">
              {productsPage ? `${productsPage.totalItems}` : "—"}
            </div>
            <div className="ks-hero-proof-label">
              Sản phẩm đang mở bán đã qua kiểm duyệt trên sàn
            </div>
          </div>
          <div className="ks-hero-proof-card">
            <div className="ks-hero-proof-value">100%</div>
            <div className="ks-hero-proof-label">
              Quét mã vạch SKU &amp; đối soát số lượng trước khi bàn giao vận chuyển
            </div>
          </div>
          <div className="ks-hero-proof-card">
            <div className="ks-hero-proof-value">5 hãng</div>
            <div className="ks-hero-proof-label">
              Kết nối vận chuyển GHN, GHTK, Viettel Post, J&amp;T Express &amp; SPX
            </div>
          </div>
          <div className="ks-hero-proof-card">
            <div className="ks-hero-proof-value">7 ngày</div>
            <div className="ks-hero-proof-label">
              Quy trình trả hàng &amp; kiểm định rõ ràng tại khu vực hoàn kho
            </div>
          </div>
        </div>
      </section>

      {/* 2. Guarantees Strip */}
      <section className="ks-guarantees-bar" aria-label="Cam kết dịch vụ">
        <div className="ks-guarantee-item">
          <span className="ks-guarantee-icon" aria-hidden="true">
            <CreditCard size={20} />
          </span>
          <div>
            <div className="ks-guarantee-title">Thanh toán linh hoạt</div>
            <div className="ks-guarantee-desc">COD, chuyển khoản, ví điện tử &amp; thẻ</div>
          </div>
        </div>

        <div className="ks-guarantee-item">
          <span className="ks-guarantee-icon" aria-hidden="true">
            <ShieldCheck size={20} />
          </span>
          <div>
            <div className="ks-guarantee-title">Quét kiểm khi đóng gói</div>
            <div className="ks-guarantee-desc">Đúng biến thể SKU, đủ số lượng mới xuất</div>
          </div>
        </div>

        <div className="ks-guarantee-item">
          <span className="ks-guarantee-icon" aria-hidden="true">
            <RotateCcw size={20} />
          </span>
          <div>
            <div className="ks-guarantee-title">Đổi trả minh bạch</div>
            <div className="ks-guarantee-desc">Kiểm định hàng hoàn &amp; đối soát hoàn tiền</div>
          </div>
        </div>

        <div className="ks-guarantee-item">
          <span className="ks-guarantee-icon" aria-hidden="true">
            <Truck size={20} />
          </span>
          <div>
            <div className="ks-guarantee-title">Tách đơn theo từng shop</div>
            <div className="ks-guarantee-desc">Theo dõi từng kiện hàng &amp; mã vận đơn riêng</div>
          </div>
        </div>
      </section>

      {/* 3. Live Featured Categories */}
      <section aria-label="Danh mục nổi bật">
        <div className="ks-section-head">
          <div>
            <h2 className="ks-section-title">Danh mục nổi bật</h2>
            <p className="ks-section-subtitle">
              Khám phá ngành hàng đang hoạt động trên hệ thống KHO SÀN+
            </p>
          </div>
          <Link to={ROUTES.PRODUCTS} className="ks-section-link">
            <span>Xem tất cả sản phẩm</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        {isCategoriesLoading ? (
          <div className="ks-category-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="ks-category-tile">
                <Skeleton variant="circle" width={48} height={48} />
                <Skeleton width="80%" height={14} />
              </div>
            ))}
          </div>
        ) : isCategoriesError ? (
          <div className="ew-card" style={{ marginBottom: "32px" }}>
            <ErrorState
              title="Không thể tải danh mục ngành hàng"
              onRetry={() => void refetchCategories()}
            />
          </div>
        ) : (
          <div className="ks-category-grid">
            {activeCategories.map((cat) => {
              const IconComp = getCategoryIcon(cat.categoryName);
              return (
                <Link
                  key={cat.categoryId}
                  to={`${ROUTES.PRODUCTS}?categoryId=${cat.categoryId}`}
                  className="ks-category-tile"
                >
                  <span className="ks-category-tile__icon" aria-hidden="true">
                    <IconComp size={22} />
                  </span>
                  <span className="ks-category-tile__name">{cat.categoryName}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Live Active Products Grid */}
      <section aria-label="Sản phẩm mới lên kệ">
        <div className="ks-section-head">
          <div>
            <h2 className="ks-section-title">Sản phẩm nổi bật trên sàn</h2>
            <p className="ks-section-subtitle">
              Dữ liệu trực tiếp từ danh mục sản phẩm đã duyệt kèm tồn khả dụng tại Kho sàn
            </p>
          </div>
          <Link to={ROUTES.PRODUCTS} className="ks-section-link">
            <span>Xem toàn bộ danh mục</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        {isProductsLoading ? (
          <div className="ks-product-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="ks-product-card" style={{ padding: "16px", gap: "12px" }}>
                <Skeleton height={160} />
                <Skeleton width="60%" height={14} />
                <Skeleton width="90%" height={18} />
                <Skeleton width="45%" height={22} />
                <Skeleton height={44} />
              </div>
            ))}
          </div>
        ) : isProductsError ? (
          <div className="ew-card">
            <ErrorState
              title="Không thể tải danh sách sản phẩm"
              error={productsError}
              onRetry={() => void refetchProducts()}
            />
          </div>
        ) : latestProducts.length === 0 ? (
          <div className="ew-card">
            <EmptyState
              title="Chưa có sản phẩm nào đang mở bán"
              description="Khi người bán đăng tải sản phẩm và được Quản trị viên phê duyệt, sản phẩm sẽ tự động hiển thị tại đây."
              action={
                <Link
                  to={isSeller ? ROUTES.SELLER_PRODUCTS : ROUTES.BECOME_SELLER}
                  className="ew-btn ew-btn--primary ew-btn--md"
                >
                  {isSeller ? "Đăng sản phẩm đầu tiên" : "Đăng ký mở gian hàng"}
                </Link>
              }
            />
          </div>
        ) : (
          <div className="ks-product-grid">
            {latestProducts.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Seller CTA Banner */}
      <section className="ks-cta-banner" aria-label="Mở gian hàng trên KHO SÀN+">
        <div>
          <h2 className="ks-section-title" style={{ color: "var(--color-forest-900)" }}>
            Mở gian hàng &amp; ký gửi hàng hóa tại Kho Sàn+
          </h2>
          <p className="ks-section-subtitle" style={{ marginTop: "6px", maxWidth: "620px" }}>
            Đăng ký tài khoản người bán, tạo shop, quản lý biến thể SKU và theo dõi tồn kho
            theo thời gian thực ngay trên nền tảng KHO SÀN+.
          </p>
        </div>
        <Link
          to={isSeller ? ROUTES.SELLER : ROUTES.BECOME_SELLER}
          className="ew-btn ew-btn--primary ew-btn--lg"
        >
          <Store size={17} aria-hidden="true" />
          <span>{isSeller ? "Quản lý Kênh người bán" : "Đăng ký bán hàng ngay"}</span>
        </Link>
      </section>
    </div>
  );
};
