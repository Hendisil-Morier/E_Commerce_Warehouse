import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Search,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import {
  useCategoriesTree,
  usePublicProducts,
} from "@/features/catalog/hooks/usePublicCatalog";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import type { CategoryTreeDto } from "@/types/catalog";

interface FilterState extends Record<string, string> {
  categoryId: string;
  q: string;
  minPrice: string;
  maxPrice: string;
  inStockOnly: string;
  sort: string;
}

const DEFAULT_FILTERS: FilterState = {
  categoryId: "",
  q: "",
  minPrice: "",
  maxPrice: "",
  inStockOnly: "",
  sort: "-createdAt",
};

export const ProductsPage: React.FC = () => {
  const {
    filters,
    page,
    pageSize,
    setFilter,
    setFilters,
    setPage,
    setPageSize,
    resetFilters,
  } = useUrlFilters<FilterState>({
    defaults: DEFAULT_FILTERS,
    defaultPage: 1,
    defaultPageSize: 16,
    defaultSort: "-createdAt",
  });

  const [localSearch, setLocalSearch] = useState(filters.q);
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice);
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});

  // Sync local inputs when URL filter changes (e.g. back button or header search)
  useEffect(() => {
    setLocalSearch(filters.q);
  }, [filters.q]);

  useEffect(() => {
    setLocalMinPrice(filters.minPrice);
  }, [filters.minPrice]);

  useEffect(() => {
    setLocalMaxPrice(filters.maxPrice);
  }, [filters.maxPrice]);

  const { data: categoryTree = [], isLoading: isLoadingCategories } = useCategoriesTree();

  const queryParams = {
    categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
    q: filters.q ? filters.q.trim() : undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    inStockOnly: filters.inStockOnly === "true" ? true : undefined,
    sort: filters.sort || "-createdAt",
    page,
    pageSize,
  };

  const {
    data: productData,
    isLoading: isLoadingProducts,
    isFetching,
    isError,
    error,
    refetch,
  } = usePublicProducts(queryParams);

  const toggleCategoryExpand = (catId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleSelectCategory = (catId: number | "") => {
    setFilter("categoryId", catId ? String(catId) : "");
    setPage(1);
  };

  const handleApplyPriceFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({
      minPrice: localMinPrice ? localMinPrice.trim() : "",
      maxPrice: localMaxPrice ? localMaxPrice.trim() : "",
    });
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter("q", localSearch.trim());
    setPage(1);
  };

  const handleToggleInStockOnly = () => {
    const nextVal = filters.inStockOnly === "true" ? "" : "true";
    setFilter("inStockOnly", nextVal);
    setPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setFilter("sort", newSort);
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    filters.categoryId ||
      filters.q ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.inStockOnly ||
      filters.sort !== "-createdAt"
  );

  const renderCategoryNode = (cat: CategoryTreeDto, depth = 0) => {
    const isSelected = filters.categoryId === String(cat.categoryId);
    const hasChildren = Boolean(cat.children && cat.children.length > 0);
    const isExpanded = expandedCategories[cat.categoryId] ?? true;

    return (
      <div key={cat.categoryId} style={{ marginLeft: depth > 0 ? "12px" : 0 }}>
        <div
          onClick={() => handleSelectCategory(cat.categoryId)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 8px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: depth === 0 ? "0.88rem" : "0.82rem",
            fontWeight: isSelected ? 600 : depth === 0 ? 500 : 400,
            color: isSelected ? "#0E7C66" : "#334155",
            backgroundColor: isSelected ? "#f0fdf4" : "transparent",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!isSelected) e.currentTarget.style.backgroundColor = "#f8fafc";
          }}
          onMouseLeave={(e) => {
            if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {cat.categoryName}
          </span>

          {hasChildren && (
            <span
              onClick={(e) => toggleCategoryExpand(cat.categoryId, e)}
              style={{ padding: "2px", color: "#64748b" }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div style={{ borderLeft: "1px solid #e2e8f0", marginLeft: "10px", marginTop: "2px" }}>
            {cat.children!.map((child) => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 20px" }}>
      {/* Breadcrumb & Title */}
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 6px 0",
          }}
        >
          Khám phá Sản phẩm
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
          Tìm kiếm sản phẩm chính hãng, kiểm tra tồn kho sẵn sàng và giá tốt nhất toàn sàn.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: "28px",
          alignItems: "start",
        }}
      >
        {/* LEFT SIDEBAR: FILTERS */}
        <aside
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: "14px",
              borderBottom: "1px solid #f1f5f9",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 700,
                color: "#1e293b",
                fontSize: "1rem",
              }}
            >
              <SlidersHorizontal size={18} color="#0E7C66" />
              <span>Bộ lọc tìm kiếm</span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: 0,
                }}
                title="Xóa tất cả bộ lọc"
              >
                <RotateCcw size={12} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          {/* 1. Category Tree Filter */}
          <div style={{ marginBottom: "22px" }}>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "10px",
              }}
            >
              Danh mục
            </div>

            <div
              onClick={() => handleSelectCategory("")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 8px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.88rem",
                fontWeight: !filters.categoryId ? 600 : 400,
                color: !filters.categoryId ? "#0E7C66" : "#334155",
                backgroundColor: !filters.categoryId ? "#f0fdf4" : "transparent",
                marginBottom: "4px",
              }}
            >
              <span>Tất cả ngành hàng</span>
              {!filters.categoryId && <Check size={14} color="#0E7C66" />}
            </div>

            {isLoadingCategories ? (
              <div style={{ padding: "8px 0" }}>
                <Skeleton lines={4} gap={8} />
              </div>
            ) : (
              <div
                style={{
                  maxHeight: "320px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {categoryTree.map((cat) => renderCategoryNode(cat))}
              </div>
            )}
          </div>

          {/* 2. In Stock Only Checkbox */}
          <div style={{ marginBottom: "22px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                fontSize: "0.88rem",
                fontWeight: 500,
                color: "#1e293b",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={filters.inStockOnly === "true"}
                onChange={handleToggleInStockOnly}
                style={{
                  width: "16px",
                  height: "16px",
                  accentColor: "#0E7C66",
                  cursor: "pointer",
                }}
              />
              <span>Chỉ hiện sản phẩm còn hàng</span>
            </label>
          </div>

          {/* 3. Price Range Filter */}
          <div style={{ marginBottom: "14px" }}>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "10px",
              }}
            >
              Khoảng giá (₫)
            </div>

            <form onSubmit={handleApplyPriceFilter}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <input
                  type="number"
                  placeholder="Từ"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                  min={0}
                />
                <span style={{ color: "#94a3b8" }}>—</span>
                <input
                  type="number"
                  placeholder="Đến"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                  min={0}
                />
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="sm"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Áp dụng giá
              </Button>
            </form>
          </div>
        </aside>

        {/* RIGHT CONTENT: TOOLBAR & PRODUCT GRID */}
        <main>
          {/* Top Filter Bar */}
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
            {/* Search within catalog */}
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
                placeholder="Tìm theo tên sản phẩm..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Tìm kiếm"
              >
                <Search size={16} />
              </button>
            </form>

            {/* Sort & Stats */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                {productData
                  ? `Tìm thấy ${productData.totalItems} sản phẩm`
                  : "Đang tải dữ liệu..."}
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 500 }}>
                  Sắp xếp:
                </span>
                <select
                  value={filters.sort || "-createdAt"}
                  onChange={(e) => handleSortChange(e.target.value)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    backgroundColor: "#ffffff",
                    color: "#1e293b",
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

          {/* ACTIVE FILTER PILLS */}
          {hasActiveFilters && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Đang lọc:</span>

              {filters.q && (
                <span
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#334155",
                    fontSize: "0.78rem",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Từ khóa: <strong>"{filters.q}"</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setFilter("q", "");
                      setLocalSearch("");
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              )}

              {filters.inStockOnly === "true" && (
                <span
                  style={{
                    backgroundColor: "#ecfdf5",
                    color: "#065f46",
                    fontSize: "0.78rem",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Chỉ còn hàng
                  <button
                    type="button"
                    onClick={() => setFilter("inStockOnly", "")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              )}

              {(filters.minPrice || filters.maxPrice) && (
                <span
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#334155",
                    fontSize: "0.78rem",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Giá: {filters.minPrice || "0"}₫ – {filters.maxPrice || "∞"}₫
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({ minPrice: "", maxPrice: "" });
                      setLocalMinPrice("");
                      setLocalMaxPrice("");
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {/* MAIN PRODUCT LIST */}
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
                    <div style={{ marginTop: "12px" }}>
                      <Skeleton width="40%" height={22} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                padding: "32px",
              }}
            >
              <ErrorState error={error} onRetry={() => void refetch()} />
            </div>
          ) : !productData || productData.items.length === 0 ? (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                padding: "32px",
              }}
            >
              <EmptyState
                title="Không tìm thấy sản phẩm nào"
                description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc danh mục/giá đang áp dụng."
                action={
                  hasActiveFilters ? (
                    <Button variant="secondary" size="sm" onClick={resetFilters}>
                      Xóa tất cả bộ lọc
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "20px",
                  opacity: isFetching ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {productData.items.map((prod) => (
                  <ProductCard key={prod.productId} product={prod} />
                ))}
              </div>

              {/* Pagination */}
              {productData.totalPages > 1 && (
                <div style={{ marginTop: "28px" }}>
                  <Pagination
                    page={productData.page}
                    pageSize={productData.pageSize}
                    totalItems={productData.totalItems}
                    totalPages={productData.totalPages}
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
        </main>
      </div>
    </div>
  );
};
