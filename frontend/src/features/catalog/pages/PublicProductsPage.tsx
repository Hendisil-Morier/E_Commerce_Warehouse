import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, ChevronRight, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ProductCard } from "@/components/common/ProductCard";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import {
  usePublicCategories,
  usePublicProducts,
} from "@/features/catalog/hooks/usePublicCatalog";
import type { PublicProductQuery } from "@/types/catalog";

function parsePositiveNumber(value: string | null): number | "" {
  if (!value) return "";
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : "";
}

export const PublicProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryId = parsePositiveNumber(searchParams.get("categoryId"));
  const shopId = parsePositiveNumber(searchParams.get("shopId"));
  const minPrice = parsePositiveNumber(searchParams.get("minPrice"));
  const maxPrice = parsePositiveNumber(searchParams.get("maxPrice"));
  const inStockOnly = searchParams.get("inStockOnly") === "true";
  const urlQ = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") || "-createdAt";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(48, Math.max(6, Number(searchParams.get("pageSize")) || 12));

  const [localQ, setLocalQ] = useState(urlQ);
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  const [priceInputError, setPriceInputError] = useState<string | null>(null);

  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    setLocalQ(urlQ);
  }

  // Debounce từ khóa tìm kiếm 300ms trước khi ghi lên URL
  useEffect(() => {
    if (localQ === urlQ) return;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (localQ.trim()) {
        next.set("q", localQ.trim());
      } else {
        next.delete("q");
      }
      next.set("page", "1");
      setSearchParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [localQ, searchParams, setSearchParams, urlQ]);

  const isPriceRangeInvalid =
    minPrice !== "" && maxPrice !== "" && maxPrice < minPrice;

  const query: PublicProductQuery = useMemo(
    () => ({
      categoryId,
      shopId,
      minPrice: isPriceRangeInvalid ? "" : minPrice,
      maxPrice: isPriceRangeInvalid ? "" : maxPrice,
      inStockOnly: inStockOnly ? true : undefined,
      q: urlQ.trim() || undefined,
      sort,
      page,
      pageSize,
    }),
    [categoryId, shopId, minPrice, maxPrice, isPriceRangeInvalid, inStockOnly, urlQ, sort, page, pageSize]
  );

  const { data: categories = [] } = usePublicCategories();
  const { data, isLoading, isError, error, refetch } = usePublicProducts(query);

  const activeCategories = categories.filter((c) => c.isActive);
  const items = data?.items ?? [];

  const updateParams = (updates: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === "") {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    }
    if (resetPage) {
      next.set("page", "1");
    }
    setSearchParams(next);
  };

  const handlePriceChange = (field: "minPrice" | "maxPrice", rawValue: string) => {
    if (rawValue === "") {
      setPriceInputError(null);
      updateParams({ [field]: null });
      return;
    }
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setPriceInputError("Giá lọc không được nhỏ hơn 0₫.");
      return;
    }
    setPriceInputError(null);
    updateParams({ [field]: String(Math.floor(parsed)) });
  };

  const resetAllFilters = () => {
    setLocalQ("");
    setPriceInputError(null);
    setSearchParams({});
  };

  const hasFilters =
    categoryId !== "" ||
    shopId !== "" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    inStockOnly ||
    urlQ.trim().length > 0;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="ks-breadcrumb-bar">
        <div className="ks-container">
          <nav className="ks-breadcrumb" aria-label="Đường dẫn trang">
            <Link to={ROUTES.HOME}>Trang chủ</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="ks-breadcrumb-current">Danh mục sản phẩm</span>
          </nav>
        </div>
      </div>

      <div className="ks-container ks-store-main">
        <div className="ks-section-head">
          <div>
            <h1 className="ks-section-title" style={{ fontSize: "24px" }}>
              Danh sách sản phẩm KHO SÀN+
            </h1>
            <p className="ks-section-subtitle ks-tabular">
              {data
                ? `Tìm thấy ${data.totalItems} sản phẩm đang mở bán`
                : "Khám phá các sản phẩm đã kiểm duyệt và có sẵn tại Kho sàn"}
            </p>
          </div>

          {hasFilters && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={resetAllFilters}
            >
              Đặt lại bộ lọc
            </Button>
          )}
        </div>

        {/* Filter & Search Toolbar */}
        <section className="ks-catalog-toolbar" aria-label="Bộ lọc sản phẩm">
          <div className="ks-store-cat-tabs" role="tablist" aria-label="Lọc theo danh mục">
            <button
              type="button"
              role="tab"
              aria-selected={categoryId === ""}
              className={`ks-tab-pill ${categoryId === "" ? "ks-tab-pill--active" : ""}`}
              onClick={() => updateParams({ categoryId: null })}
            >
              Tất cả danh mục
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat.categoryId}
                type="button"
                role="tab"
                aria-selected={categoryId === cat.categoryId}
                className={`ks-tab-pill ${
                  categoryId === cat.categoryId ? "ks-tab-pill--active" : ""
                }`}
                onClick={() => updateParams({ categoryId: String(cat.categoryId) })}
              >
                {cat.categoryName}
              </button>
            ))}
          </div>

          <div className="ks-catalog-controls">
            {/* Search by keyword */}
            <div className="ew-control-wrap">
              <label
                htmlFor="catalog-search-input"
                style={{
                  position: "absolute",
                  width: "1px",
                  height: "1px",
                  overflow: "hidden",
                }}
              >
                Tìm sản phẩm theo từ khóa
              </label>
              <span className="ew-control__addon-left">
                <Search size={16} aria-hidden="true" />
              </span>
              <input
                id="catalog-search-input"
                type="text"
                className="ew-control ew-control--has-left ew-control--has-right"
                placeholder="Tìm tên sản phẩm, mô tả..."
                value={localQ}
                onChange={(e) => setLocalQ(e.target.value)}
              />
              {localQ && (
                <span className="ew-control__addon-right">
                  <button
                    type="button"
                    className="ew-icon-btn"
                    aria-label="Xóa từ khóa tìm kiếm"
                    onClick={() => {
                      setLocalQ("");
                      updateParams({ q: null });
                    }}
                  >
                    <X size={15} />
                  </button>
                </span>
              )}
            </div>

            {/* Min price */}
            <div>
              <label
                htmlFor="catalog-min-price"
                style={{
                  position: "absolute",
                  width: "1px",
                  height: "1px",
                  overflow: "hidden",
                }}
              >
                Giá tối thiểu
              </label>
              <input
                id="catalog-min-price"
                type="number"
                min={0}
                step={10000}
                className={`ew-control ks-tabular ${
                  isPriceRangeInvalid || priceInputError ? "ew-control--error" : ""
                }`}
                placeholder="Giá từ (₫)"
                value={minPrice === "" ? "" : String(minPrice)}
                onChange={(e) => handlePriceChange("minPrice", e.target.value)}
              />
            </div>

            {/* Max price */}
            <div>
              <label
                htmlFor="catalog-max-price"
                style={{
                  position: "absolute",
                  width: "1px",
                  height: "1px",
                  overflow: "hidden",
                }}
              >
                Giá tối đa
              </label>
              <input
                id="catalog-max-price"
                type="number"
                min={0}
                step={10000}
                className={`ew-control ks-tabular ${
                  isPriceRangeInvalid || priceInputError ? "ew-control--error" : ""
                }`}
                placeholder="Giá đến (₫)"
                value={maxPrice === "" ? "" : String(maxPrice)}
                onChange={(e) => handlePriceChange("maxPrice", e.target.value)}
              />
            </div>

            {/* Sort */}
            <div>
              <label
                htmlFor="catalog-sort"
                style={{
                  position: "absolute",
                  width: "1px",
                  height: "1px",
                  overflow: "hidden",
                }}
              >
                Sắp xếp sản phẩm
              </label>
              <select
                id="catalog-sort"
                className="ew-control"
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
              >
                <option value="-createdAt">Mới nhất</option>
                <option value="price">Giá thấp đến cao</option>
                <option value="-price">Giá cao đến thấp</option>
              </select>
            </div>

            {/* In-stock toggle */}
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                minHeight: "44px",
                padding: "0 12px",
                borderRadius: "10px",
                border: "1px solid var(--color-slate-300)",
                backgroundColor: inStockOnly ? "var(--color-accent-soft)" : "var(--color-white)",
                borderColor: inStockOnly ? "var(--color-primary)" : "var(--color-slate-300)",
                fontSize: "13px",
                fontWeight: 600,
                color: inStockOnly ? "var(--color-primary)" : "var(--color-dark)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) =>
                  updateParams({ inStockOnly: e.target.checked ? "true" : null })
                }
                style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }}
              />
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span>Còn hàng</span>
            </label>
          </div>

          {(priceInputError || isPriceRangeInvalid) && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-danger)",
              }}
            >
              <AlertCircle size={15} aria-hidden="true" />
              <span>
                {priceInputError ??
                  "Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu để áp dụng bộ lọc giá."}
              </span>
            </div>
          )}
        </section>

        {/* Product Grid States */}
        {isLoading ? (
          <div className="ks-product-grid ks-product-grid--3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="ks-product-card" style={{ padding: "16px", gap: "12px" }}>
                <Skeleton height={180} />
                <Skeleton width="55%" height={14} />
                <Skeleton width="90%" height={18} />
                <Skeleton width="45%" height={22} />
                <Skeleton height={44} />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="ew-card">
            <ErrorState
              title="Không thể tải danh mục sản phẩm"
              error={error}
              onRetry={() => void refetch()}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="ew-card">
            <EmptyState
              title="Không tìm thấy sản phẩm phù hợp"
              description={
                hasFilters
                  ? "Thử nới lỏng khoảng giá, bỏ lọc danh mục hoặc tìm từ khóa khác."
                  : "Hiện chưa có sản phẩm nào đang mở bán trên sàn."
              }
              action={
                hasFilters ? (
                  <Button variant="primary" onClick={resetAllFilters}>
                    Xem tất cả sản phẩm
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="ks-product-grid ks-product-grid--3">
              {items.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>

            {data && data.totalPages > 1 && (
              <div className="ew-card" style={{ marginTop: "24px" }}>
                <Pagination
                  page={data.page}
                  pageSize={data.pageSize}
                  totalItems={data.totalItems}
                  totalPages={data.totalPages}
                  pageSizeOptions={[12, 24, 36]}
                  onPageChange={(nextPage) =>
                    updateParams({ page: String(nextPage) }, false)
                  }
                  onPageSizeChange={(nextSize) =>
                    updateParams({ pageSize: String(nextSize) }, true)
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
