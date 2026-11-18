import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Store, Search } from "lucide-react";
import { usePublicShop, usePublicProducts } from "@/features/catalog/hooks/usePublicCatalog";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { formatDate, resolveAssetUrl } from "@/utils/formatters";

export const ShopDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const shopId = Number(id);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(16);
  const [sort, setSort] = useState<string>("-createdAt");
  const [search, setSearch] = useState<string>("");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  const {
    data: shop,
    isLoading: isLoadingShop,
    isError: isShopError,
    error: shopError,
    refetch: refetchShop,
  } = usePublicShop(shopId);

  const {
    data: productsData,
    isLoading: isLoadingProducts,
    isError: isProductsError,
    error: productsError,
    refetch: refetchProducts,
  } = usePublicProducts({
    shopId,
    q: search ? search.trim() : undefined,
    inStockOnly: inStockOnly ? true : undefined,
    sort,
    page,
    pageSize,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  if (isLoadingShop) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "28px" }}>
          <Skeleton width="100%" height={160} variant="rect" />
        </div>
        <Skeleton lines={6} gap={14} />
      </div>
    );
  }

  if (isShopError || !shop) {
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
            error={shopError ?? new Error("Không tìm thấy gian hàng này.")}
            onRetry={() => void refetchShop()}
          />
        </div>
      </div>
    );
  }

  const logoUrl = resolveAssetUrl(shop.logoUrl);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 20px" }}>
      {/* SHOP BANNER & HEADER */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "24px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          flexWrap: "wrap",
          marginBottom: "28px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "#059669",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(5, 150, 105, 0.2)",
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={shop.shopName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Store size={36} />
            )}
          </div>

          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 6px 0",
              }}
            >
              {shop.shopName}
            </h1>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "4px" }}>
              Doanh nghiệp: <strong>{shop.sellerBusinessName}</strong>
            </div>
            {shop.description && (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569", maxWidth: "600px" }}>
                {shop.description}
              </p>
            )}
          </div>
        </div>

        {/* Shop Stats */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            borderLeft: "1px solid #e2e8f0",
            paddingLeft: "24px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Sản phẩm đang bán</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0E7C66" }}>
              {shop.activeProductCount}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Tham gia sàn từ</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#334155" }}>
              {formatDate(shop.createdAt, { includeTime: false })}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & TOOLBAR FOR SHOP PRODUCTS */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        {/* Search within shop */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            flex: "1 1 260px",
            maxWidth: "380px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            overflow: "hidden",
            backgroundColor: "#f8fafc",
          }}
        >
          <input
            type="text"
            placeholder="Tìm kiếm tại gian hàng này..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "none",
              outline: "none",
              fontSize: "0.88rem",
              backgroundColor: "transparent",
              color: "#1e293b",
            }}
          />
          <button
            type="submit"
            style={{
              background: "none",
              border: "none",
              padding: "0 10px",
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            <Search size={16} />
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "0.85rem",
              color: "#334155",
            }}
          >
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => {
                setInStockOnly(e.target.checked);
                setPage(1);
              }}
              style={{ accentColor: "#0E7C66" }}
            />
            <span>Chỉ còn hàng</span>
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.85rem", color: "#475569" }}>Sắp xếp:</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="-createdAt">Mới nhất</option>
              <option value="price">Giá tăng dần</option>
              <option value="-price">Giá giảm dần</option>
            </select>
          </div>
        </div>
      </div>

      {/* SHOP PRODUCTS GRID */}
      {isLoadingProducts ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                padding: "12px",
              }}
            >
              <Skeleton width="100%" height={180} />
              <div style={{ marginTop: "12px" }}>
                <Skeleton width="60%" height={16} />
                <div style={{ marginTop: "8px" }}>
                  <Skeleton width="90%" height={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isProductsError ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            padding: "32px",
          }}
        >
          <ErrorState error={productsError} onRetry={() => void refetchProducts()} />
        </div>
      ) : !productsData || productsData.items.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            padding: "32px",
          }}
        >
          <EmptyState
            title="Gian hàng chưa có sản phẩm nào"
            description="Các sản phẩm của gian hàng sẽ xuất hiện tại đây sau khi được kiểm duyệt mở bán."
          />
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            {productsData.items.map((prod) => (
              <ProductCard key={prod.productId} product={prod} />
            ))}
          </div>

          {productsData.totalPages > 1 && (
            <div style={{ marginTop: "28px" }}>
              <Pagination
                page={productsData.page}
                pageSize={productsData.pageSize}
                totalItems={productsData.totalItems}
                totalPages={productsData.totalPages}
                onPageChange={(next) => {
                  setPage(next);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
                pageSizeOptions={[12, 16, 24, 32]}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
