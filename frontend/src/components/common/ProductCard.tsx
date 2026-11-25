import React from "react";
import { Link } from "react-router-dom";
import { Eye, Package, Store, Warehouse } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PublicProductListItemDto } from "@/types/catalog";
import { formatPriceRange, resolveStockStatusKey } from "@/utils/catalogHelpers";
import { resolveAssetUrl } from "@/utils/formatters";

export interface ProductCardProps {
  product: PublicProductListItemDto;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const thumbnail = resolveAssetUrl(product.thumbnailUrl);
  const stockStatus = resolveStockStatusKey(
    product.inStock,
    product.availableQuantity
  );
  const detailPath = `/products/${product.productId}`;
  const shopPath = `/shops/${product.shopId}`;

  return (
    <article className="ks-product-card">
      <Link to={detailPath} className="ks-product-media" aria-label={product.productName}>
        <div className="ks-product-badge-anchor">
          <span className="ks-warehouse-tag">
            <Warehouse size={12} aria-hidden="true" />
            <span>Kho sàn</span>
          </span>
          <StatusBadge status={stockStatus} size="sm" />
        </div>

        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.productName}
            className="ks-product-img"
            loading="lazy"
          />
        ) : (
          <div className="ks-product-placeholder" aria-hidden="true">
            <Package size={36} strokeWidth={1.5} />
            <span>Chưa có ảnh</span>
          </div>
        )}
      </Link>

      <div className="ks-product-body">
        <div className="ks-product-meta-row">
          <Link to={shopPath} className="ks-product-shop-link" title={product.shopName}>
            <Store size={12} aria-hidden="true" />
            <span>{product.shopName}</span>
          </Link>
          <span
            style={{
              fontSize: "11px",
              color: "var(--color-muted)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {product.categoryName}
          </span>
        </div>

        <Link to={detailPath} className="ks-product-title-link">
          {product.productName}
        </Link>

        <div className="ks-product-stock-note ks-tabular">
          {product.inStock && product.availableQuantity > 0
            ? `Sẵn sàng xuất kho: ${product.availableQuantity} sản phẩm`
            : "Tạm hết hàng tại Kho sàn"}
        </div>

        <div className="ks-product-price-row ks-tabular">
          <span className="ks-product-price">
            {formatPriceRange(product.minPrice, product.maxPrice)}
          </span>
        </div>

        <div className="ks-product-foot">
          <Link
            to={detailPath}
            className={`ew-btn ${
              product.inStock ? "ew-btn--primary" : "ew-btn--secondary"
            } ew-btn--md ew-btn--full`}
          >
            <Eye size={15} aria-hidden="true" />
            <span>{product.inStock ? "Chọn phân loại & Mua" : "Xem chi tiết"}</span>
          </Link>
        </div>
      </div>
    </article>
  );
};
