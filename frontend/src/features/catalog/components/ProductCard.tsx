import React from "react";
import { Link } from "react-router-dom";
import { Store, Package } from "lucide-react";
import type { PublicProductListItemDto } from "@/types/catalog";
import { formatCurrency, resolveAssetUrl } from "@/utils/formatters";

interface ProductCardProps {
  product: PublicProductListItemDto;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const imageUrl = resolveAssetUrl(product.thumbnailUrl);
  const formattedPrice =
    product.minPrice === product.maxPrice
      ? formatCurrency(product.minPrice)
      : `${formatCurrency(product.minPrice)} - ${formatCurrency(product.maxPrice)}`;

  const isOutOfStock = !product.inStock || product.availableQuantity <= 0;
  const isLowStock = !isOutOfStock && product.availableQuantity <= 5;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
      }}
    >
      {/* Product Image Link */}
      <Link
        to={`/products/${product.productId}`}
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "100%",
          backgroundColor: "#f8fafc",
          display: "block",
          overflow: "hidden",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.productName}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s ease",
            }}
            loading="lazy"
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
            <Package size={48} strokeWidth={1.5} />
          </div>
        )}

        {/* Stock badge overlay */}
        {isOutOfStock ? (
          <span
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              backgroundColor: "rgba(239, 68, 68, 0.9)",
              color: "#ffffff",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "0.72rem",
              fontWeight: 600,
            }}
          >
            Hết hàng
          </span>
        ) : isLowStock ? (
          <span
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              backgroundColor: "rgba(245, 158, 11, 0.95)",
              color: "#ffffff",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "0.72rem",
              fontWeight: 600,
            }}
          >
            Sắp hết hàng
          </span>
        ) : null}
      </Link>

      {/* Card Content */}
      <div
        style={{
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <div>
          {/* Shop and Category info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.75rem",
              color: "#64748b",
              marginBottom: "6px",
            }}
          >
            <Link
              to={`/shops/${product.shopId}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: "#059669",
                textDecoration: "none",
                fontWeight: 600,
                maxWidth: "140px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={product.shopName}
              onClick={(e) => e.stopPropagation()}
            >
              <Store size={12} />
              <span>{product.shopName}</span>
            </Link>

            <span
              style={{
                backgroundColor: "#f1f5f9",
                color: "#475569",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "0.7rem",
                maxWidth: "100px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {product.categoryName}
            </span>
          </div>

          {/* Product Name */}
          <Link
            to={`/products/${product.productId}`}
            style={{
              fontSize: "0.92rem",
              fontWeight: 600,
              color: "#1e293b",
              textDecoration: "none",
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.4em",
            }}
            title={product.productName}
          >
            {product.productName}
          </Link>
        </div>

        {/* Price and Stock status */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: "6px",
            borderTop: "1px dashed #f1f5f9",
          }}
        >
          <div style={{ color: "#0E7C66", fontWeight: 700, fontSize: "1.05rem" }}>
            {formattedPrice}
          </div>

          <div style={{ fontSize: "0.75rem", color: isOutOfStock ? "#ef4444" : "#64748b" }}>
            {isOutOfStock
              ? "Hết hàng"
              : `Còn ${product.availableQuantity}`}
          </div>
        </div>
      </div>
    </div>
  );
};

