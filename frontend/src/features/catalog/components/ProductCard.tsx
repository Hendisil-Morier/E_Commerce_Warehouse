import React from "react";
import { Link } from "react-router-dom";
import { Package, Store } from "lucide-react";
import type { PublicProductListItemDto } from "@/types/catalog";
import { formatPriceRange } from "@/utils/catalogHelpers";
import { resolveAssetUrl } from "@/utils/formatters";

export interface ProductCardProps {
  product: PublicProductListItemDto;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const thumbUrl = resolveAssetUrl(product.thumbnailUrl);
  const isOutOfStock = !product.inStock || product.availableQuantity <= 0;
  const isLowStock = !isOutOfStock && product.availableQuantity <= 5;

  return (
    <article className="ew-storefront-card">
      <Link
        to={`/products/${product.productId}`}
        className="ew-storefront-card__img-wrap"
        tabIndex={-1}
        aria-hidden="true"
      >
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={product.productName}
            className="ew-storefront-card__img"
            loading="lazy"
          />
        ) : (
          <div className="ew-storefront-card__placeholder">
            <Package size={34} strokeWidth={1.5} color="#94a3b8" />
            <span>Ảnh sản phẩm</span>
          </div>
        )}

        {isOutOfStock ? (
          <span className="ew-storefront-card__badge ew-storefront-card__badge--out">
            Hết hàng
          </span>
        ) : isLowStock ? (
          <span className="ew-storefront-card__badge ew-storefront-card__badge--low">
            Chỉ còn {product.availableQuantity}
          </span>
        ) : null}
      </Link>

      <div className="ew-storefront-card__body">
        <div>
          <Link
            to={`/products/${product.productId}`}
            className="ew-storefront-card__title"
            title={product.productName}
          >
            {product.productName}
          </Link>

          <div className="ew-storefront-card__shop-row">
            <Store size={13} aria-hidden="true" />
            <Link
              to={`/shops/${product.shopId}`}
              className="ew-storefront-card__shop-link"
              title={`Xem shop ${product.shopName}`}
            >
              {product.shopName}
            </Link>
          </div>

          <div className="ew-storefront-card__price">
            {formatPriceRange(product.minPrice, product.maxPrice)}
          </div>
        </div>

        <div className="ew-storefront-card__footer">
          <span className="ew-storefront-card__category">
            {product.categoryName}
          </span>
          <span className="ew-storefront-card__warehouse-tag">
            Kho sàn
          </span>
        </div>
      </div>
    </article>
  );
};
