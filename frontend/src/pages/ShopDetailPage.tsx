import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Package, Store } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import {
  usePublicProductsQuery,
  usePublicShopDetailQuery,
} from "@/features/catalog/hooks/usePublicCatalog";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { resolveAssetUrl } from "@/utils/formatters";

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Mới nhất" },
  { value: "price", label: "Giá tăng dần" },
  { value: "-price", label: "Giá giảm dần" },
];

export const ShopDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const shopId = id ? Number(id) : null;

  const { page, pageSize, sort, setPage, setPageSize, setSort } = useUrlFilters({
    defaults: { q: "" },
    defaultPageSize: 12,
    defaultSort: "-createdAt",
  });

  const shopQuery = usePublicShopDetailQuery(shopId);
  const productsQuery = usePublicProductsQuery({
    shopId: shopId || undefined,
    page,
    pageSize,
    sort,
  });

  const shop = shopQuery.data;
  const paged = productsQuery.data;

  if (shopQuery.isLoading) {
    return (
      <div className="ew-catalog-container">
        <Skeleton height={140} variant="rect" />
        <div style={{ marginTop: "24px" }}>
          <Skeleton lines={4} gap={12} />
        </div>
      </div>
    );
  }

  if (shopQuery.isError || !shop) {
    return (
      <div className="ew-catalog-container">
        <Link to={ROUTES.HOME} className="ew-back-link" style={{ marginBottom: "16px" }}>
          <ArrowLeft size={16} /> Quay lại trang chủ
        </Link>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", padding: "40px", border: "1px solid #e2e8f0" }}>
          <ErrorState
            title="Không tìm thấy gian hàng"
            message="Gian hàng này có thể đã tạm đóng hoặc không tồn tại trên hệ thống."
            onRetry={() => void shopQuery.refetch()}
          />
        </div>
      </div>
    );
  }

  const logoUrl = resolveAssetUrl(shop.logoUrl);

  return (
    <div className="ew-catalog-container">
      {/* Back button */}
      <div>
        <Link to={ROUTES.PRODUCTS} className="ew-back-link">
          <ArrowLeft size={16} /> Khám phá thêm sản phẩm khác
        </Link>
      </div>

      {/* Shop Profile Banner */}
      <section className="ew-shop-banner-card">
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div className="ew-shop-avatar-large">
            {logoUrl ? <img src={logoUrl} alt={shop.shopName} /> : <Store size={36} />}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a" }}>
                {shop.shopName}
              </h1>
              <span className="ew-storefront-card__warehouse-tag">Gian hàng uy tín</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "3px" }}>
              Doanh nghiệp: <strong>{shop.sellerBusinessName}</strong>
            </div>
            {shop.description && (
              <p style={{ fontSize: "0.85rem", color: "#334155", marginTop: "6px", maxWidth: "600px" }}>
                {shop.description}
              </p>
            )}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#059669" }}>
            {shop.activeProductCount}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Sản phẩm đang bán</div>
        </div>
      </section>

      {/* Products Section */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
            Tất cả sản phẩm của shop
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Sắp xếp:</span>
            <Select
              aria-label="Sắp xếp sản phẩm"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              options={SORT_OPTIONS}
              style={{ width: "190px" }}
            />
          </div>
        </div>

        {productsQuery.isLoading ? (
          <div className="ew-products-grid">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "14px", border: "1px solid #e2e8f0" }}>
                <Skeleton height={140} variant="rect" />
                <div style={{ marginTop: "12px" }}>
                  <Skeleton lines={3} gap={8} />
                </div>
              </div>
            ))}
          </div>
        ) : productsQuery.isError ? (
          <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "32px", border: "1px solid #e2e8f0" }}>
            <ErrorState
              error={productsQuery.error}
              onRetry={() => void productsQuery.refetch()}
            />
          </div>
        ) : paged && paged.items.length > 0 ? (
          <>
            <div className="ew-products-grid">
              {paged.items.map((prod) => (
                <ProductCard key={prod.productId} product={prod} />
              ))}
            </div>

            {paged.totalPages > 1 && (
              <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "10px 16px" }}>
                <Pagination
                  page={paged.page}
                  pageSize={paged.pageSize}
                  totalItems={paged.totalItems}
                  totalPages={paged.totalPages}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[12, 24, 48]}
                />
              </div>
            )}
          </>
        ) : (
          <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "40px", border: "1px solid #e2e8f0" }}>
            <EmptyState
              icon={<Package size={34} />}
              title="Shop chưa có sản phẩm nào đang bán"
              description="Hãy quay lại sau để cập nhật các sản phẩm mới nhất từ gian hàng này."
            />
          </div>
        )}
      </section>
    </div>
  );
};

