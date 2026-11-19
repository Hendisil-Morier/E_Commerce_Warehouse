import React, { useMemo, useState } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { usePublicProductsQuery } from "@/features/catalog/hooks/usePublicCatalog";
import { useCategoriesQuery } from "@/features/seller/hooks/useSellerCatalog";
import { useUrlFilters } from "@/hooks/useUrlFilters";

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Mới nhất" },
  { value: "price", label: "Giá: Thấp đến Cao" },
  { value: "-price", label: "Giá: Cao đến Thấp" },
];

export const ProductsPage: React.FC = () => {
  const {
    filters,
    page,
    pageSize,
    sort,
    setFilter,
    setPage,
    setPageSize,
    setSort,
    resetFilters,
  } = useUrlFilters({
    defaults: {
      categoryId: "",
      q: "",
      minPrice: "",
      maxPrice: "",
      inStockOnly: "",
    },
    defaultPageSize: 12,
    defaultSort: "-createdAt",
  });

  const categoriesQuery = useCategoriesQuery();

  // Local price input state so user can type before submitting
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice);

  const parsedCategoryId = filters.categoryId ? Number(filters.categoryId) : undefined;
  const parsedMinPrice = filters.minPrice ? Number(filters.minPrice) : undefined;
  const parsedMaxPrice = filters.maxPrice ? Number(filters.maxPrice) : undefined;
  const parsedInStockOnly = filters.inStockOnly === "true";

  const productsQuery = usePublicProductsQuery({
    categoryId: Number.isFinite(parsedCategoryId) ? parsedCategoryId : undefined,
    q: filters.q || undefined,
    minPrice: Number.isFinite(parsedMinPrice) ? parsedMinPrice : undefined,
    maxPrice: Number.isFinite(parsedMaxPrice) ? parsedMaxPrice : undefined,
    inStockOnly: parsedInStockOnly || undefined,
    sort,
    page,
    pageSize,
  });

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter("minPrice", localMinPrice.trim());
    setFilter("maxPrice", localMaxPrice.trim());
  };

  const handleResetAll = () => {
    setLocalMinPrice("");
    setLocalMaxPrice("");
    resetFilters();
  };

  const categories = categoriesQuery.data ?? [];
  const selectedCatId = filters.categoryId;

  const currentCategoryName = useMemo(() => {
    if (!selectedCatId) return null;
    const findCat = (items: typeof categories): string | null => {
      for (const item of items) {
        if (String(item.categoryId) === selectedCatId) return item.categoryName;
        if (item.children.length > 0) {
          const sub = findCat(item.children);
          if (sub) return sub;
        }
      }
      return null;
    };
    return findCat(categories);
  }, [categories, selectedCatId]);

  const paged = productsQuery.data;

  return (
    <div className="ew-catalog-container">
      {/* Breadcrumb / Page Title */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>
            {currentCategoryName ? currentCategoryName : filters.q ? `Kết quả tìm kiếm cho "${filters.q}"` : "Tất cả sản phẩm"}
          </h1>
          <p style={{ fontSize: "0.86rem", color: "#64748b" }}>
            Khám phá hàng nghìn sản phẩm chất lượng, đóng gói và vận chuyển từ kho sàn.
          </p>
        </div>

        {paged && (
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Hiển thị <strong>{paged.items.length}</strong> trên <strong>{paged.totalItems}</strong> sản phẩm
          </div>
        )}
      </div>

      <div className="ew-catalog-layout">
        {/* ================= Sidebar Filter ================= */}
        <aside className="ew-filter-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
              <Filter size={18} color="#059669" />
              <span>Bộ lọc tìm kiếm</span>
            </div>
            <button
              type="button"
              onClick={handleResetAll}
              style={{ background: "none", border: "none", color: "#059669", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}
            >
              Đặt lại
            </button>
          </div>

          {/* Categories List */}
          <div>
            <div className="ew-filter-title">Danh mục sản phẩm</div>
            <ul className="ew-filter-cat-list">
              <li>
                <button
                  type="button"
                  className={`ew-filter-cat-btn ${!selectedCatId ? "ew-filter-cat-btn--active" : ""}`}
                  onClick={() => setFilter("categoryId", "")}
                >
                  Tất cả danh mục
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.categoryId}>
                  <button
                    type="button"
                    className={`ew-filter-cat-btn ${selectedCatId === String(cat.categoryId) ? "ew-filter-cat-btn--active" : ""}`}
                    onClick={() => setFilter("categoryId", String(cat.categoryId))}
                  >
                    {cat.categoryName}
                  </button>
                  {cat.children && cat.children.length > 0 && selectedCatId === String(cat.categoryId) && (
                    <ul style={{ listStyle: "none", paddingLeft: "14px", marginTop: "4px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {cat.children.map((sub) => (
                        <li key={sub.categoryId}>
                          <button
                            type="button"
                            className={`ew-filter-cat-btn ${selectedCatId === String(sub.categoryId) ? "ew-filter-cat-btn--active" : ""}`}
                            onClick={() => setFilter("categoryId", String(sub.categoryId))}
                            style={{ fontSize: "0.8rem" }}
                          >
                            ↳ {sub.categoryName}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Price Range Filter */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
            <div className="ew-filter-title">Khoảng giá (₫)</div>
            <form onSubmit={handleApplyPrice} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="ew-price-inputs">
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  placeholder="Từ ₫"
                  className="ew-price-input"
                />
                <span style={{ color: "#94a3b8" }}>—</span>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  placeholder="Đến ₫"
                  className="ew-price-input"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm" fullWidth>
                Áp dụng giá
              </Button>
            </form>
          </div>

          {/* Availability Filter */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
            <label className="ew-inline-check" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={parsedInStockOnly}
                onChange={(e) => setFilter("inStockOnly", e.target.checked ? "true" : "")}
              />
              <span style={{ fontSize: "0.85rem", color: "#1e293b" }}>Chỉ hiện hàng có sẵn</span>
            </label>
          </div>
        </aside>

        {/* ================= Main Products Area ================= */}
        <main style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Top Sort and Search Bar */}
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
            <div style={{ width: "260px" }}>
              <SearchInput
                value={filters.q}
                onChange={(val) => setFilter("q", val)}
                placeholder="Tìm trong danh mục..."
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b", whiteSpace: "nowrap" }}>
                Sắp xếp:
              </span>
              <Select
                aria-label="Sắp xếp sản phẩm"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                options={SORT_OPTIONS}
                style={{ width: "190px" }}
              />
            </div>
          </div>

          {/* Products Content */}
          {productsQuery.isLoading ? (
            <div className="ew-products-grid">
              {Array.from({ length: 8 }).map((_, idx) => (
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
                <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "10px 16px", marginTop: "10px" }}>
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
                title="Không tìm thấy sản phẩm nào"
                description="Hãy thử bỏ bớt bộ lọc khoảng giá, chọn danh mục khác hoặc tìm kiếm với từ khóa khác."
                action={
                  <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={14} />} onClick={handleResetAll}>
                    Xóa tất cả bộ lọc
                  </Button>
                }
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
