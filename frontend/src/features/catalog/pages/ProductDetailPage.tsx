import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Package,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  Warehouse,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { useAddCartItem } from "@/features/cart/hooks/useCart";
import { usePublicProductDetail } from "@/features/catalog/hooks/usePublicCatalog";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/stores/authStore";
import { formatPriceRange, resolveStockStatusKey } from "@/utils/catalogHelpers";
import { getErrorMessage } from "@/utils/errorHandler";
import { formatCurrency, resolveAssetUrl } from "@/utils/formatters";
import { hasRole, ROLES } from "@/utils/roleUtils";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isAuthenticated } = useAuthStore();

  const productId = id ? Number(id) : null;
  const { data: product, isLoading, isError, error, refetch } =
    usePublicProductDetail(productId);
  const addCartMutation = useAddCartItem();

  const sortedImages = useMemo(() => {
    if (!product?.images) return [];
    return [...product.images].sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return a.displayOrder - b.displayOrder;
    });
  }, [product]);

  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const activeVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    if (selectedVariantId !== null) {
      const found = product.variants.find((v) => v.variantId === selectedVariantId);
      if (found) return found;
    }
    return product.variants.find((v) => v.inStock) ?? product.variants[0];
  }, [product, selectedVariantId]);

  const activeImageSrc = resolveAssetUrl(
    selectedImageUrl || sortedImages[0]?.imageUrl || ""
  );

  const maxOrderQty = activeVariant?.inStock ? activeVariant.availableQuantity : 0;
  const clampedQty = maxOrderQty > 0 ? Math.min(Math.max(1, quantity), maxOrderQty) : 1;
  const isCustomer = isAuthenticated && hasRole(user, ROLES.CUSTOMER);

  const handleAddToCart = async (goToCartAfter: boolean) => {
    if (!activeVariant || !activeVariant.inStock) return;

    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập tài khoản Khách hàng để thêm sản phẩm vào giỏ.");
      navigate(ROUTES.LOGIN);
      return;
    }

    if (!isCustomer) {
      toast.error("Tài khoản hiện tại không có quyền Khách hàng để mua sắm.");
      return;
    }

    try {
      await addCartMutation.mutateAsync({
        variantId: activeVariant.variantId,
        quantity: clampedQty,
      });
      toast.success(
        `Đã thêm ${clampedQty} × "${product?.productName} (${activeVariant.variantName})" vào giỏ hàng.`
      );
      if (goToCartAfter) {
        navigate(ROUTES.CART);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  const fallbackBreadcrumb = (
    <div className="ks-breadcrumb-bar">
      <div className="ks-container">
        <nav className="ks-breadcrumb" aria-label="Đường dẫn trang">
          <Link to={ROUTES.HOME}>Trang chủ</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <Link to={ROUTES.PRODUCTS}>Sản phẩm</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span className="ks-breadcrumb-current">Chi tiết sản phẩm</span>
        </nav>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div>
        {fallbackBreadcrumb}
        <div className="ks-container ks-store-main">
          <div className="ks-pdp-grid">
            <div className="ks-pdp-gallery">
              <Skeleton height={380} />
              <Skeleton height={44} />
            </div>
            <div className="ks-pdp-panel">
              <Skeleton width="40%" height={24} />
              <Skeleton width="85%" height={32} />
              <Skeleton height={64} />
              <Skeleton height={44} />
              <Skeleton height={120} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        {fallbackBreadcrumb}
        <div className="ks-container ks-store-main" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <Link to={ROUTES.PRODUCTS} className="ew-back-link">
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Quay lại danh sách sản phẩm</span>
            </Link>
          </div>
          <div className="ew-card">
            <ErrorState
              title="Không thể tải chi tiết sản phẩm"
              error={error}
              onRetry={() => void refetch()}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        {fallbackBreadcrumb}
        <div className="ks-container ks-store-main">
          <div className="ew-card">
            <EmptyState
              title="Không tìm thấy sản phẩm"
              description="Sản phẩm này không tồn tại hoặc đã ngừng kinh doanh."
              action={
                <Link to={ROUTES.PRODUCTS} className="ew-btn ew-btn--primary ew-btn--md">
                  Quay lại danh mục sản phẩm
                </Link>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  const stockBadgeKey = resolveStockStatusKey(
    activeVariant ? activeVariant.inStock : product.inStock,
    activeVariant ? activeVariant.availableQuantity : product.availableQuantity
  );

  return (
    <div>
      {/* Breadcrumb */}
      <div className="ks-breadcrumb-bar">
        <div className="ks-container">
          <nav className="ks-breadcrumb" aria-label="Đường dẫn trang">
            <Link to={ROUTES.HOME}>Trang chủ</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <Link to={ROUTES.PRODUCTS}>Sản phẩm</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <Link to={`${ROUTES.PRODUCTS}?categoryId=${product.categoryId}`}>
              {product.categoryName}
            </Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="ks-breadcrumb-current">{product.productName}</span>
          </nav>
        </div>
      </div>

      <div className="ks-container ks-store-main" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <Link to={ROUTES.PRODUCTS} className="ew-back-link">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Quay lại danh sách sản phẩm</span>
          </Link>
        </div>

        <div className="ks-pdp-grid">
          {/* Left: Product Image Gallery */}
          <div className="ks-pdp-gallery">
            <div className="ks-pdp-main-img-wrap">
              {activeImageSrc ? (
                <img
                  src={activeImageSrc}
                  alt={product.productName}
                  className="ks-pdp-main-img"
                />
              ) : (
                <div className="ks-product-placeholder">
                  <Package size={52} strokeWidth={1.4} />
                  <span>Chưa có ảnh sản phẩm</span>
                </div>
              )}
            </div>

            {sortedImages.length > 1 && (
              <div className="ks-pdp-thumbs" role="list" aria-label="Album ảnh sản phẩm">
                {sortedImages.map((img) => {
                  const thumbSrc = resolveAssetUrl(img.imageUrl);
                  const isActive = activeImageSrc === thumbSrc;
                  return (
                    <button
                      key={img.imageId}
                      type="button"
                      className={`ks-pdp-thumb-btn ${
                        isActive ? "ks-pdp-thumb-btn--active" : ""
                      }`}
                      aria-label={`Xem ảnh ${img.displayOrder + 1} của ${product.productName}`}
                      onClick={() => setSelectedImageUrl(img.imageUrl)}
                    >
                      <img src={thumbSrc} alt={product.productName} />
                    </button>
                  );
                })}
              </div>
            )}

            <div
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "8px",
                backgroundColor: "var(--color-accent-soft)",
                fontSize: "13px",
                color: "var(--color-forest-900)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ShieldCheck size={17} aria-hidden="true" />
              <span>
                Hàng lưu trữ &amp; xuất trực tiếp tại <strong>Kho sàn tập trung</strong> — quét
                kiểm mã vạch khi đóng gói.
              </span>
            </div>
          </div>

          {/* Right: Purchase & Variant Panel */}
          <section className="ks-pdp-panel">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span className="ks-warehouse-tag">
                <Warehouse size={12} aria-hidden="true" />
                <span>Kho sàn</span>
              </span>
              <StatusBadge status={stockBadgeKey} size="md" />
              {activeVariant && (
                <span className="ks-tabular" style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                  SKU: <strong>{activeVariant.sku}</strong>
                </span>
              )}
            </div>

            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-dark)", lineHeight: 1.3 }}>
              {product.productName}
            </h1>

            {/* Price Box */}
            <div className="ks-pdp-price-box ks-tabular">
              <div>
                <div style={{ fontSize: "12px", color: "var(--color-muted)", marginBottom: "2px" }}>
                  {activeVariant ? `Giá biến thể "${activeVariant.variantName}"` : "Khoảng giá"}
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-primary)" }}>
                  {activeVariant
                    ? formatCurrency(activeVariant.price)
                    : formatPriceRange(product.minPrice, product.maxPrice)}
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: "13px", color: "var(--color-muted)" }}>
                Tồn khả dụng tại Kho sàn
                <div style={{ fontWeight: 700, color: "var(--color-dark)", fontSize: "15px" }}>
                  {activeVariant ? activeVariant.availableQuantity : product.availableQuantity} sản phẩm
                </div>
              </div>
            </div>

            {/* Variant Selector */}
            {product.variants.length > 0 && (
              <div className="ew-field">
                <span className="ew-field__label">Chọn phân loại sản phẩm</span>
                <div className="ks-variant-list" role="radiogroup" aria-label="Phân loại sản phẩm">
                  {product.variants.map((variant) => {
                    const isSelected = activeVariant?.variantId === variant.variantId;
                    return (
                      <button
                        key={variant.variantId}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={!variant.inStock}
                        className={`ks-variant-btn ${
                          isSelected ? "ks-variant-btn--active" : ""
                        }`}
                        onClick={() => {
                          setSelectedVariantId(variant.variantId);
                          setQuantity(1);
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{variant.variantName}</span>
                        <span
                          className="ks-tabular"
                          style={{ fontSize: "12px", color: "var(--color-muted)" }}
                        >
                          {formatCurrency(variant.price)} ·{" "}
                          {variant.inStock ? `Còn ${variant.availableQuantity}` : "Hết hàng"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <span className="ew-field__label">Số lượng</span>
              <div className="ks-qty-stepper">
                <button
                  type="button"
                  className="ks-qty-btn"
                  aria-label="Giảm số lượng"
                  disabled={clampedQty <= 1 || maxOrderQty === 0 || addCartMutation.isPending}
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  −
                </button>
                <span className="ks-qty-val ks-tabular">{maxOrderQty === 0 ? 0 : clampedQty}</span>
                <button
                  type="button"
                  className="ks-qty-btn"
                  aria-label="Tăng số lượng"
                  disabled={
                    clampedQty >= maxOrderQty || maxOrderQty === 0 || addCartMutation.isPending
                  }
                  onClick={() => setQuantity((prev) => Math.min(maxOrderQty, prev + 1))}
                >
                  +
                </button>
              </div>
              {maxOrderQty === 0 && (
                <span style={{ fontSize: "13px", color: "var(--color-danger)", fontWeight: 600 }}>
                  Phân loại này tạm hết hàng
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "4px" }}>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                leftIcon={<ShoppingCart size={17} />}
                loading={addCartMutation.isPending}
                disabled={!activeVariant || !activeVariant.inStock}
                onClick={() => void handleAddToCart(false)}
              >
                Thêm vào giỏ hàng
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<Truck size={17} />}
                loading={addCartMutation.isPending}
                disabled={!activeVariant || !activeVariant.inStock}
                onClick={() => void handleAddToCart(true)}
              >
                Mua ngay
              </Button>
            </div>

            {/* Shop Info Card */}
            <div className="ks-shop-card">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div className="ks-shop-avatar">
                  {product.shop.logoUrl ? (
                    <img
                      src={resolveAssetUrl(product.shop.logoUrl)}
                      alt={product.shop.shopName}
                    />
                  ) : (
                    product.shop.shopName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-dark)" }}>
                    {product.shop.shopName}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                    Đơn vị kinh doanh: {product.shop.sellerBusinessName}
                  </div>
                </div>
              </div>
              <Link
                to={`/shops/${product.shop.shopId}`}
                className="ew-btn ew-btn--secondary ew-btn--sm"
              >
                <Store size={14} aria-hidden="true" />
                <span>Xem gian hàng</span>
              </Link>
            </div>

            {/* Description & Real Technical Specs */}
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
              <h2 className="ew-section-heading">Mô tả &amp; Thông tin chi tiết</h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--color-text)",
                  lineHeight: 1.65,
                  marginBottom: "16px",
                  whiteSpace: "pre-line",
                }}
              >
                {product.description?.trim() ||
                  "Người bán chưa bổ sung mô tả chi tiết cho sản phẩm này."}
              </p>

              <table className="ks-specs-table ks-tabular">
                <tbody>
                  <tr>
                    <th>Danh mục</th>
                    <td>{product.categoryName}</td>
                  </tr>
                  <tr>
                    <th>Gian hàng cung cấp</th>
                    <td>{product.shop.shopName}</td>
                  </tr>
                  <tr>
                    <th>Nguồn lưu kho</th>
                    <td>Kho sàn tập trung (Platform Warehouse)</td>
                  </tr>
                  {activeVariant && (
                    <>
                      <tr>
                        <th>Mã SKU</th>
                        <td>{activeVariant.sku}</td>
                      </tr>
                      {activeVariant.barcode && (
                        <tr>
                          <th>Mã vạch (Barcode)</th>
                          <td>{activeVariant.barcode}</td>
                        </tr>
                      )}
                      {activeVariant.weightGrams !== null && (
                        <tr>
                          <th>Khối lượng đóng gói</th>
                          <td>{activeVariant.weightGrams} g</td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
