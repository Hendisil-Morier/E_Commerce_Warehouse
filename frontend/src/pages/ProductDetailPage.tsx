import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Package,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import { usePublicProductDetailQuery } from "@/features/catalog/hooks/usePublicCatalog";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/stores/authStore";
import type { PublicProductVariantDto } from "@/types/catalog";
import { formatPriceRange } from "@/utils/catalogHelpers";
import { formatCurrency, resolveAssetUrl } from "@/utils/formatters";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isAuthenticated } = useAuthStore();

  const productId = id ? Number(id) : null;
  const detailQuery = usePublicProductDetailQuery(productId);
  const product = detailQuery.data;

  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<PublicProductVariantDto | null>(null);

  useEffect(() => {
    if (!product) return;

    // Pick primary or first image
    const primaryImg = product.images.find((img) => img.isPrimary) || product.images[0];
    setSelectedImage(primaryImg ? primaryImg.imageUrl : "");

    // Pick first available active variant
    if (product.variants && product.variants.length > 0) {
      const firstInStock = product.variants.find((v) => v.inStock && v.availableQuantity > 0);
      setSelectedVariant(firstInStock || product.variants[0]);
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    toast.info("Tính năng giỏ hàng sẽ được hoàn thiện ở bước 6b.");
  };

  if (detailQuery.isLoading) {
    return (
      <div className="ew-detail-container">
        <Skeleton height={20} width={180} />
        <div className="ew-detail-grid-layout">
          <Skeleton height={420} variant="rect" />
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Skeleton height={32} width="80%" />
            <Skeleton height={60} variant="rect" />
            <Skeleton lines={4} gap={10} />
          </div>
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !product) {
    return (
      <div className="ew-detail-container">
        <Link to={ROUTES.PRODUCTS} className="ew-back-link" style={{ marginBottom: "16px" }}>
          <ArrowLeft size={16} /> Quay lại danh sách sản phẩm
        </Link>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", padding: "40px", border: "1px solid #e2e8f0" }}>
          <ErrorState
            title="Không tìm thấy sản phẩm"
            message="Sản phẩm này có thể đã ngừng kinh doanh hoặc đường dẫn không tồn tại."
            onRetry={() => void detailQuery.refetch()}
          />
        </div>
      </div>
    );
  }

  // Stock status determination
  const activeAvailable = selectedVariant
    ? selectedVariant.availableQuantity
    : product.availableQuantity;
  const activeInStock = selectedVariant ? selectedVariant.inStock : product.inStock;
  const isOutOfStock = !activeInStock || activeAvailable <= 0;
  const isLowStock = !isOutOfStock && activeAvailable <= 5;

  const currentPriceText = selectedVariant
    ? formatCurrency(selectedVariant.price)
    : formatPriceRange(product.minPrice, product.maxPrice);

  const mainImageUrl = resolveAssetUrl(selectedImage);
  const shopLogoUrl = resolveAssetUrl(product.shop.logoUrl);

  return (
    <div className="ew-detail-container">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#64748b" }}>
        <Link to={ROUTES.HOME} style={{ color: "inherit", textDecoration: "none" }}>
          Trang chủ
        </Link>
        <span>/</span>
        <Link to={ROUTES.PRODUCTS} style={{ color: "inherit", textDecoration: "none" }}>
          Sản phẩm
        </Link>
        <span>/</span>
        <Link
          to={`${ROUTES.PRODUCTS}?categoryId=${product.categoryId}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          {product.categoryName}
        </Link>
        <span>/</span>
        <span style={{ color: "#0f172a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "320px" }}>
          {product.productName}
        </span>
      </nav>

      {/* Main Product Layout */}
      <div className="ew-detail-grid-layout">
        {/* Left: Gallery */}
        <div className="ew-detail-gallery">
          <div className="ew-detail-main-img">
            {mainImageUrl ? (
              <img src={mainImageUrl} alt={product.productName} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "#94a3b8" }}>
                <Package size={54} strokeWidth={1.5} />
                <span style={{ fontSize: "0.85rem" }}>Chưa có hình ảnh</span>
              </div>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="ew-detail-thumbs">
              {product.images.map((img, idx) => {
                const thumb = resolveAssetUrl(img.imageUrl);
                const isSelected = img.imageUrl === selectedImage;
                return (
                  <button
                    key={img.imageId || idx}
                    type="button"
                    onClick={() => setSelectedImage(img.imageUrl)}
                    className={`ew-detail-thumb-btn ${isSelected ? "ew-detail-thumb-btn--active" : ""}`}
                    aria-label={`Xem ảnh ${idx + 1}`}
                  >
                    <img src={thumb} alt={`Thumbnail ${idx + 1}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Info & Actions */}
        <div className="ew-detail-info">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span className="ew-storefront-card__warehouse-tag">Giao từ kho sàn</span>
              <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                Mã SP: #{product.productId}
              </span>
            </div>

            <h1 className="ew-detail-title">{product.productName}</h1>
          </div>

          {/* Price Box */}
          <div className="ew-detail-price-box">
            <span className="ew-detail-price">{currentPriceText}</span>
            {selectedVariant && (
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                SKU: <strong>{selectedVariant.sku}</strong>
                {selectedVariant.weightGrams ? ` · ${selectedVariant.weightGrams}g` : ""}
              </span>
            )}
          </div>

          {/* Variants Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="ew-detail-variant-group">
              <label style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>
                Phân loại hàng ({product.variants.length} biến thể):
              </label>
              <div className="ew-variant-chips">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.variantId === v.variantId;
                  const isVarOut = !v.inStock || v.availableQuantity <= 0;
                  return (
                    <button
                      key={v.variantId}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`ew-variant-chip ${isSelected ? "ew-variant-chip--selected" : ""} ${isVarOut ? "ew-variant-chip--disabled" : ""}`}
                    >
                      <span>{v.variantName}</span>
                      {isVarOut && <span style={{ fontSize: "0.72rem", marginLeft: "4px" }}>(Hết)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock Condition Indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.88rem", color: "#64748b" }}>Tình trạng:</span>
            {isOutOfStock ? (
              <span className="ew-stock-status-pill ew-stock-status-pill--out">
                Hết hàng
              </span>
            ) : isLowStock ? (
              <span className="ew-stock-status-pill ew-stock-status-pill--low">
                Chỉ còn {activeAvailable} sản phẩm
              </span>
            ) : (
              <span className="ew-stock-status-pill ew-stock-status-pill--in">
                Còn hàng ({activeAvailable} sẵn sàng)
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "14px", marginTop: "8px", flexWrap: "wrap" }}>
            <Button
              size="lg"
              variant="primary"
              leftIcon={<ShoppingCart size={18} />}
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              {isOutOfStock ? "Tạm hết hàng" : "Thêm vào giỏ hàng"}
            </Button>
          </div>

          {/* Service Guarantee Badges */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#475569" }}>
              <Truck size={17} color="#059669" />
              <span>Giao hàng nhanh toàn quốc</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#475569" }}>
              <ShieldCheck size={17} color="#059669" />
              <span>Hàng chính hãng 100%</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#475569" }}>
              <CheckCircle size={17} color="#059669" />
              <span>Được quét mã vạch kiểm tra</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Info Card */}
      <div className="ew-shop-banner-card">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className="ew-shop-avatar-large">
            {shopLogoUrl ? (
              <img src={shopLogoUrl} alt={product.shop.shopName} />
            ) : (
              <Store size={32} />
            )}
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
              {product.shop.shopName}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "2px" }}>
              Doanh nghiệp: {product.shop.sellerBusinessName}
            </div>
            {product.shop.description && (
              <p style={{ fontSize: "0.82rem", color: "#475569", marginTop: "4px", maxWidth: "560px" }}>
                {product.shop.description}
              </p>
            )}
          </div>
        </div>

        <Link to={`/shops/${product.shop.shopId}`}>
          <Button variant="secondary" size="md" leftIcon={<Store size={15} />}>
            Xem gian hàng
          </Button>
        </Link>
      </div>

      {/* Product Description Section */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "26px" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "14px" }}>
          Mô tả sản phẩm
        </h2>
        <div style={{ fontSize: "0.92rem", lineHeight: 1.65, color: "#334155", whiteSpace: "pre-wrap" }}>
          {product.description || "Người bán chưa cung cấp mô tả chi tiết cho sản phẩm này."}
        </div>
      </div>
    </div>
  );
};
