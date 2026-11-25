import React, { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar, ChevronRight, Package, Search, Store, X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ProductCard } from "@/components/common/ProductCard";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import {
  usePublicProducts,
  usePublicShopDetail,
} from "@/features/catalog/hooks/usePublicCatalog";
import type { PublicProductQuery } from "@/types/catalog";
import { formatDate, resolveAssetUrl } from "@/utils/formatters";

export const ShopDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const shopId = id ? Number(id) : null;

  const q = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") || "-createdAt";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const {
    data: shop,
    isLoading: isShopLoading,
    isError: isShopError,
    error: shopError,
    refetch: refetchShop,
  } = usePublicShopDetail(shopId);

  const productsQuery: PublicProductQuery = useMemo(
    () => ({
      shopId: shopId ?? undefined,
      q: q.trim() || undefined,
      sort,
      page,
      pageSize: 12,
    }),
    [shopId, q, sort, page]
  );

  const {
    data: productsData,
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError,
    refetch: refetchProducts,
  } = usePublicProducts(productsQuery);

  const updateParams = (updates: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, val] of Object.entries(updates)) {
      if (!val) next.delete(key);
      else next.set(key, val);
    }
    if (resetPage) next.set("page", "1");
    setSearchParams(next);
  };

  const fallbackBreadcrumb = (
    <div className="ks-breadcrumb-bar">
      <div className="ks-container">
        <nav className="ks-breadcrumb" aria-label="Đường dẫn trang">
          <Link to={ROUTES.HOME}>Trang chủ</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <Link to={ROUTES.PRODUCTS}>Sản phẩm</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span className="ks-breadcrumb-current">Gian hàng</span>
        </nav>
      </div>
    </div>
  );

  if (isShopLoading) {
    return (
      <div>
        {fallbackBreadcrumb}
        <div className="ks-container ks-store-main">
          <Skeleton height={150} />
        </div>
      </div>
    );
  }

  if (isShopError) {
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
              title="Không thể tải thông tin gian hàng"
              error={shopError}
              onRetry={() => void refetchShop()}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div>
        {fallbackBreadcrumb}
        <div className="ks-container ks-store-main">
          <div className="ew-card">
            <EmptyState
              title="Không tìm thấy gian hàng"
              description="Gian hàng này không tồn tại hoặc hiện đang tạm ngừng hoạt động."
              action={
                <Link to={ROUTES.PRODUCTS} className="ew-btn ew-btn--primary ew-btn--md">
                  Khám phá sản phẩm khác
                </Link>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  const logoSrc = resolveAssetUrl(shop.logoUrl);
  const items = productsData?.items ?? [];

  return (
    <div>
      <div className="ks-breadcrumb-bar">
        <div className="ks-container">
          <nav className="ks-breadcrumb" aria-label="Đường dẫn trang">
            <Link to={ROUTES.HOME}>Trang chủ</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <Link to={ROUTES.PRODUCTS}>Sản phẩm</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="ks-breadcrumb-current">{shop.shopName}</span>
          </nav>
        </div>
      </div>

      <div className="ks-container ks-store-main">
        {/* Shop Banner */}
        <section className="ks-shop-banner">
          <div style={{ display: "flex", alignItems: "center", gap: "20px", minWidth: 0 }}>
            <div
              className="ks-shop-avatar"
              style={{
                width: "72px",
                height: "72px",
                fontSize: "24px",
                backgroundColor: "rgba(255,255,255,0.16)",
                border: "2px solid rgba(255,255,255,0.28)",
              }}
            >
              {logoSrc ? (
                <img src={logoSrc} alt={shop.shopName} />
              ) : (
                shop.shopName.slice(0, 2).toUpperCase()
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "#a7f3d0",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                <Store size={14} aria-hidden="true" />
                <span>Gian hàng đối tác · {shop.sellerBusinessName}</span>
              </div>
              <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#ffffff" }}>
                {shop.shopName}
              </h1>
              {shop.description && (
                <p
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.84)",
                    marginTop: "6px",
                    maxWidth: "640px",
                  }}
                >
                  {shop.description}
                </p>
              )}
            </div>
          </div>

          <div
            className="ks-tabular"
            style={{
              display: "flex",
              gap: "24px",
              flexShrink: 0,
              backgroundColor: "rgba(255,255,255,0.1)",
              padding: "14px 20px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.16)",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "#a7f3d0", display: "flex", alignItems: "center", gap: "4px" }}>
                <Package size={13} aria-hidden="true" />
                <span>Sản phẩm đang bán</span>
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, marginTop: "2px" }}>
                {shop.activeProductCount}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#a7f3d0", display: "flex", alignItems: "center", gap: "4px" }}>
                <Calendar size={13} aria-hidden="true" />
                <span>Tham gia từ</span>
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, marginTop: "6px" }}>
                {formatDate(shop.createdAt, { includeTime: false })}
              </div>
            </div>
          </div>
        </section>

        {/* Shop Products Search & Sort */}
        <div
          className="ew-card"
          style={{
            padding: "14px 18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div className="ew-control-wrap" style={{ maxWidth: "420px" }}>
            <label
              htmlFor="shop-search-input"
              style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden" }}
            >
              Tìm kiếm sản phẩm trong gian hàng
            </label>
            <span className="ew-control__addon-left">
              <Search size={16} aria-hidden="true" />
            </span>
            <input
              id="shop-search-input"
              type="text"
              className="ew-control ew-control--has-left ew-control--has-right"
              placeholder={`Tìm sản phẩm trong ${shop.shopName}...`}
              value={q}
              onChange={(e) => updateParams({ q: e.target.value })}
            />
            {q && (
              <span className="ew-control__addon-right">
                <button
                  type="button"
                  className="ew-icon-btn"
                  aria-label="Xóa từ khóa tìm kiếm"
                  onClick={() => updateParams({ q: null })}
                >
                  <X size={15} />
                </button>
              </span>
            )}
          </div>

          <select
            aria-label="Sắp xếp sản phẩm của shop"
            className="ew-control"
            style={{ width: "210px" }}
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
          >
            <option value="-createdAt">Mới nhất</option>
            <option value="price">Giá thấp đến cao</option>
            <option value="-price">Giá cao đến thấp</option>
          </select>
        </div>

        {/* Shop Product Grid */}
        {isProductsLoading ? (
          <div className="ks-product-grid ks-product-grid--3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="ks-product-card" style={{ padding: "16px", gap: "12px" }}>
                <Skeleton height={180} />
                <Skeleton width="75%" height={18} />
                <Skeleton height={44} />
              </div>
            ))}
          </div>
        ) : isProductsError ? (
          <div className="ew-card">
            <ErrorState
              title="Không thể tải danh sách sản phẩm của gian hàng"
              error={productsError}
              onRetry={() => void refetchProducts()}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="ew-card">
            <EmptyState
              title="Gian hàng chưa có sản phẩm phù hợp"
              description="Thử xóa từ khóa tìm kiếm hoặc quay lại danh mục chung."
            />
          </div>
        ) : (
          <>
            <div className="ks-product-grid ks-product-grid--3">
              {items.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>

            {productsData && productsData.totalPages > 1 && (
              <div className="ew-card" style={{ marginTop: "24px" }}>
                <Pagination
                  page={productsData.page}
                  pageSize={productsData.pageSize}
                  totalItems={productsData.totalItems}
                  totalPages={productsData.totalPages}
                  onPageChange={(nextPage) =>
                    updateParams({ page: String(nextPage) }, false)
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
