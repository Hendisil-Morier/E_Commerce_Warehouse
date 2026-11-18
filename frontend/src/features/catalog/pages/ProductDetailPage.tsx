import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Store,
  Package,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  ChevronRight,
} from "lucide-react";
import { usePublicProductDetail } from "@/features/catalog/hooks/usePublicCatalog";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/useToast";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { formatCurrency, resolveAssetUrl } from "@/utils/formatters";
import type { PublicProductVariantDto } from "@/types/catalog";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isAuthenticated } = useAuthStore();

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = usePublicProductDetail(productId);

  const [selectedVariant, setSelectedVariant] = useState<PublicProductVariantDto | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  // Default to first variant when product loads
  useEffect(() => {
    if (product && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  // Reset quantity when variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant]);

  if (isLoading) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Skeleton width="30%" height={24} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "36px" }}>
          <div>
            <div style={{ borderRadius: "10px", overflow: "hidden" }}>
              <Skeleton width="100%" height={420} variant="rect" />
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ borderRadius: "8px", overflow: "hidden" }}>
                  <Skeleton width={80} height={80} variant="rect" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Skeleton width="80%" height={32} />
            <div style={{ marginTop: "14px" }}>
              <Skeleton width="40%" height={24} />
            </div>
            <div style={{ marginTop: "24px" }}>
              <Skeleton width="50%" height={40} />
            </div>
            <div style={{ marginTop: "28px" }}>
              <Skeleton lines={5} gap={10} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            padding: "36px",
          }}
        >
          <ErrorState
            error={error ?? new Error("Không tìm thấy thông tin sản phẩm.")}
            onRetry={() => void refetch()}
          />
        </div>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [];
  const currentImageUrl =
    images.length > 0
      ? resolveAssetUrl(images[selectedImageIndex]?.imageUrl)
      : "";

  const effectiveAvailable = selectedVariant
    ? selectedVariant.availableQuantity
    : product.availableQuantity;

  const isOutOfStock = selectedVariant
    ? !selectedVariant.inStock || selectedVariant.availableQuantity <= 0
    : !product.inStock || product.availableQuantity <= 0;

  const isLowStock = !isOutOfStock && effectiveAvailable <= 5;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.warning("Sản phẩm hiện đang hết hàng.");
      return;
    }

    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      navigate(ROUTES.LOGIN, { state: { returnUrl: location.pathname } });
      return;
    }

    toast.info("Tính năng giỏ hàng và đặt hàng sắp có (thuộc phân hệ Đơn hàng).");
  };

  const handleBuyNow = () => {
    handleAddToCart();
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 20px" }}>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.85rem",
          color: "#64748b",
          marginBottom: "20px",
        }}
      >
        <Link to={ROUTES.HOME} style={{ color: "#64748b", textDecoration: "none" }}>
          Trang chủ
        </Link>
        <ChevronRight size={14} />
        <Link
          to={`/products?categoryId=${product.categoryId}`}
          style={{ color: "#64748b", textDecoration: "none" }}
        >
          {product.categoryName}
        </Link>
        <ChevronRight size={14} />
        <span
          style={{
            color: "#0f172a",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "350px",
          }}
        >
          {product.productName}
        </span>
      </nav>

      {/* Main Product Section */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "28px",
          display: "grid",
          gridTemplateColumns: "minmax(320px, 460px) 1fr",
          gap: "40px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}
      >
        {/* LEFT COLUMN: IMAGE GALLERY */}
        <div>
          {/* Main Preview Image */}
          <div
            style={{
              position: "relative",
              width: "100%",
              paddingTop: "100%",
              borderRadius: "10px",
              border: "1px solid #f1f5f9",
              backgroundColor: "#f8fafc",
              overflow: "hidden",
            }}
          >
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={product.productName}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                }}
              >
                <Package size={64} strokeWidth={1.5} />
              </div>
            )}
          </div>

          {/* Thumbnails row */}
          {images.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "14px",
                overflowX: "auto",
                paddingBottom: "4px",
              }}
            >
              {images.map((img, idx) => {
                const isSelected = idx === selectedImageIndex;
                const thumbUrl = resolveAssetUrl(img.imageUrl);
                return (
                  <button
                    key={img.imageId || idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "8px",
                      border: isSelected ? "2px solid #0E7C66" : "1px solid #e2e8f0",
                      padding: 0,
                      backgroundColor: "#ffffff",
                      overflow: "hidden",
                      cursor: "pointer",
                      flexShrink: 0,
                      opacity: isSelected ? 1 : 0.7,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <img
                      src={thumbUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Shop Card below images */}
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "#059669",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {product.shop.logoUrl ? (
                  <img
                    src={resolveAssetUrl(product.shop.logoUrl)}
                    alt={product.shop.shopName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Store size={22} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: "0.95rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {product.shop.shopName}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  {product.shop.sellerBusinessName}
                </div>
              </div>
            </div>

            <Link to={`/shops/${product.shop.shopId}`} style={{ textDecoration: "none" }}>
              <Button variant="secondary" size="sm">
                Xem shop
              </Button>
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: PRODUCT INFO & VARIANTS */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Title */}
          <h1
            style={{
              fontSize: "1.65rem",
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.3,
              margin: "0 0 14px 0",
            }}
          >
            {product.productName}
          </h1>

          {/* Pricing Box */}
          <div
            style={{
              backgroundColor: "#f0fdf4",
              borderRadius: "10px",
              padding: "16px 20px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "baseline",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: "1.9rem",
                fontWeight: 800,
                color: "#0E7C66",
              }}
            >
              {selectedVariant
                ? formatCurrency(selectedVariant.price)
                : product.minPrice === product.maxPrice
                ? formatCurrency(product.minPrice)
                : `${formatCurrency(product.minPrice)} - ${formatCurrency(product.maxPrice)}`}
            </div>

            {selectedVariant?.weightGrams && (
              <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                (Trọng lượng: {selectedVariant.weightGrams}g)
              </span>
            )}
          </div>

          {/* Variant Selector */}
          {product.variants.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: "10px",
                }}
              >
                Chọn biến thể:
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.variantId === variant.variantId;
                  const variantOutOfStock = !variant.inStock || variant.availableQuantity <= 0;

                  return (
                    <button
                      key={variant.variantId}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: isSelected ? "2px solid #0E7C66" : "1px solid #cbd5e1",
                        backgroundColor: isSelected ? "#ecfdf5" : "#ffffff",
                        color: isSelected ? "#065f46" : "#334155",
                        fontWeight: isSelected ? 600 : 400,
                        fontSize: "0.88rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span>{variant.variantName}</span>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: isSelected ? "#0E7C66" : "#64748b",
                        }}
                      >
                        {formatCurrency(variant.price)}
                      </span>
                      {variantOutOfStock && (
                        <span style={{ fontSize: "0.72rem", color: "#ef4444" }}>
                          (Hết)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Variant details (SKU & Stock status) */}
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #f1f5f9",
              backgroundColor: "#fafafa",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                rowGap: "8px",
                fontSize: "0.85rem",
              }}
            >
              <span style={{ color: "#64748b" }}>Mã SKU:</span>
              <span style={{ fontWeight: 600, color: "#1e293b" }}>
                {selectedVariant ? selectedVariant.sku : "—"}
              </span>

              {selectedVariant?.barcode && (
                <>
                  <span style={{ color: "#64748b" }}>Mã vạch:</span>
                  <span style={{ color: "#1e293b" }}>{selectedVariant.barcode}</span>
                </>
              )}

              <span style={{ color: "#64748b" }}>Tình trạng kho:</span>
              <div>
                {isOutOfStock ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      color: "#ef4444",
                      fontWeight: 600,
                    }}
                  >
                    <XCircle size={15} />
                    Hết hàng tại kho sàn
                  </span>
                ) : isLowStock ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      color: "#d97706",
                      fontWeight: 600,
                    }}
                  >
                    <AlertTriangle size={15} />
                    Sắp hết hàng (Còn {effectiveAvailable} sản phẩm có sẵn)
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      color: "#059669",
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={15} />
                    Còn hàng ({effectiveAvailable} sản phẩm sẵn sàng giao)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#334155" }}>
              Số lượng:
            </span>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                disabled={isOutOfStock || quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{
                  width: "36px",
                  height: "36px",
                  border: "none",
                  backgroundColor: "#f8fafc",
                  cursor: isOutOfStock || quantity <= 1 ? "not-allowed" : "pointer",
                  fontSize: "1.1rem",
                  color: "#334155",
                }}
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={effectiveAvailable || 1}
                value={quantity}
                disabled={isOutOfStock}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 1 && val <= effectiveAvailable) setQuantity(val);
                }}
                style={{
                  width: "50px",
                  height: "36px",
                  border: "none",
                  textAlign: "center",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
              <button
                type="button"
                disabled={isOutOfStock || quantity >= effectiveAvailable}
                onClick={() => setQuantity((q) => Math.min(effectiveAvailable, q + 1))}
                style={{
                  width: "36px",
                  height: "36px",
                  border: "none",
                  backgroundColor: "#f8fafc",
                  cursor:
                    isOutOfStock || quantity >= effectiveAvailable
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "1.1rem",
                  color: "#334155",
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "14px", marginTop: "auto" }}>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              style={{
                flex: 1,
                borderColor: "#0E7C66",
                color: "#0E7C66",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <ShoppingCart size={18} />
              <span>Thêm vào giỏ hàng</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              style={{ flex: 1, justifyContent: "center" }}
            >
              {isOutOfStock ? "Hết hàng" : "Mua ngay"}
            </Button>
          </div>

          {/* Commitments & Policy */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              marginTop: "28px",
              paddingTop: "20px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "#64748b" }}>
              <ShieldCheck size={18} color="#0E7C66" />
              <span>100% Chính hãng</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "#64748b" }}>
              <Truck size={18} color="#0E7C66" />
              <span>Giao hàng toàn quốc</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "#64748b" }}>
              <RotateCcw size={18} color="#0E7C66" />
              <span>Đổi trả trong 7 ngày</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div
        style={{
          marginTop: "32px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "28px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}
      >
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: 700,
            color: "#0f172a",
            paddingBottom: "14px",
            borderBottom: "1px solid #f1f5f9",
            margin: "0 0 18px 0",
          }}
        >
          Mô tả sản phẩm
        </h2>

        {product.description ? (
          <div
            style={{
              fontSize: "0.92rem",
              lineHeight: 1.7,
              color: "#334155",
              whiteSpace: "pre-line",
            }}
          >
            {product.description}
          </div>
        ) : (
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", fontStyle: "italic" }}>
            Người bán chưa cung cấp mô tả chi tiết cho sản phẩm này.
          </p>
        )}
      </div>
    </div>
  );
};
