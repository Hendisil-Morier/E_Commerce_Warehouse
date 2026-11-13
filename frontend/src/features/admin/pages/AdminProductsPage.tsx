import React, { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { AdminProductDetailDrawer } from "@/features/admin/components/AdminProductDetailDrawer";
import { AdminProductsTable } from "@/features/admin/components/AdminProductsTable";
import type { ProductModerationAction } from "@/features/admin/components/AdminProductsTable";
import { ProductModerationConfirmDialog } from "@/features/admin/components/ProductModerationConfirmDialog";
import type { ProductModerationTarget } from "@/features/admin/components/ProductModerationConfirmDialog";
import {
  useAdminProductsQuery,
  useApproveAdminProductMutation,
  useRejectAdminProductMutation,
} from "@/features/admin/hooks/useAdminProducts";
import { useCategoriesQuery } from "@/features/seller/hooks/useSellerCatalog";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import type {
  AdminProductDetailDto,
  AdminProductListItemDto,
  ProductStatus,
} from "@/types/catalog";
import { flattenCategoryTree } from "@/utils/catalogHelpers";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PendingReview", label: "Chờ duyệt" },
  { value: "Active", label: "Đang bán" },
  { value: "Rejected", label: "Bị từ chối" },
  { value: "Draft", label: "Nháp" },
  { value: "Inactive", label: "Ngừng bán" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới tạo nhất" },
  { value: "updated", label: "Cập nhật gần nhất" },
  { value: "name_asc", label: "Tên A → Z" },
  { value: "name_desc", label: "Tên Z → A" },
];

export const AdminProductsPage: React.FC = () => {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [moderationTarget, setModerationTarget] =
    useState<ProductModerationTarget | null>(null);

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
    defaults: { status: "PendingReview", categoryId: "", q: "" },
    defaultPageSize: 10,
    defaultSort: "updated",
  });

  const categoriesQuery = useCategoriesQuery();
  const parsedCategoryId = filters.categoryId ? Number(filters.categoryId) : "";

  const productsQuery = useAdminProductsQuery({
    status: (filters.status as ProductStatus | "") || undefined,
    categoryId: Number.isFinite(parsedCategoryId) ? parsedCategoryId : undefined,
    q: filters.q || undefined,
    page,
    pageSize,
    sort,
  });

  const approveMutation = useApproveAdminProductMutation();
  const rejectMutation = useRejectAdminProductMutation();
  const isModerating = approveMutation.isPending || rejectMutation.isPending;

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "Tất cả danh mục" },
      ...flattenCategoryTree(categoriesQuery.data ?? []),
    ],
    [categoriesQuery.data]
  );

  const openModerationFromRow = (
    item: AdminProductListItemDto,
    action: ProductModerationAction
  ) => {
    setModerationTarget({
      productId: item.productId,
      productName: item.productName,
      shopName: item.shopName,
      action,
    });
  };

  const openModerationFromDrawer = (
    detail: AdminProductDetailDto,
    action: ProductModerationAction
  ) => {
    setModerationTarget({
      productId: detail.productId,
      productName: detail.productName,
      shopName: detail.shop.shopName,
      action,
    });
  };

  const handleConfirmModeration = async (reason?: string) => {
    if (!moderationTarget) return;

    if (moderationTarget.action === "approve") {
      await approveMutation.mutateAsync(moderationTarget.productId);
    } else {
      await rejectMutation.mutateAsync({
        productId: moderationTarget.productId,
        reason: reason?.trim() ?? "",
      });
    }
    setModerationTarget(null);
  };

  const paged = productsQuery.data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Duyệt sản phẩm"
        subtitle="Kiểm duyệt thông tin, hình ảnh và biến thể sản phẩm từ các gian hàng trước khi hiển thị công khai."
      />

      <section className="ew-card" style={{ padding: "18px 20px" }}>
        <div className="ew-toolbar">
          <div className="ew-toolbar__group" style={{ flex: 1 }}>
            <div style={{ minWidth: "260px", flex: "1 1 260px" }}>
              <SearchInput
                value={filters.q}
                onChange={(value) => setFilter("q", value)}
                placeholder="Tìm sản phẩm, shop, doanh nghiệp hoặc SKU..."
              />
            </div>

            <Select
              aria-label="Lọc trạng thái kiểm duyệt"
              value={filters.status}
              onChange={(e) => setFilter("status", e.target.value)}
              options={STATUS_OPTIONS}
              style={{ width: "185px" }}
            />

            <Select
              aria-label="Lọc theo danh mục"
              value={filters.categoryId}
              onChange={(e) => setFilter("categoryId", e.target.value)}
              options={categoryOptions}
              style={{ width: "220px" }}
            />

            <Select
              aria-label="Sắp xếp sản phẩm"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              options={SORT_OPTIONS}
              style={{ width: "185px" }}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw size={15} />}
            onClick={resetFilters}
          >
            Đặt lại
          </Button>
        </div>
      </section>

      {productsQuery.isError ? (
        <section className="ew-card" style={{ padding: "24px" }}>
          <ErrorState
            error={productsQuery.error}
            onRetry={() => void productsQuery.refetch()}
          />
        </section>
      ) : (
        <section className="ew-card" style={{ overflow: "hidden" }}>
          <AdminProductsTable
            items={paged?.items ?? []}
            loading={productsQuery.isLoading}
            onSelectDetail={setSelectedProductId}
            onRequestAction={openModerationFromRow}
            emptyTitle="Không có sản phẩm nào trong bộ lọc này"
            emptyDescription="Thử chuyển trạng thái sang 'Tất cả trạng thái' hoặc đặt lại điều kiện lọc."
            emptyAction={
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Đặt lại bộ lọc
              </Button>
            }
          />

          {paged && paged.totalItems > 0 && (
            <Pagination
              page={paged.page}
              pageSize={paged.pageSize}
              totalItems={paged.totalItems}
              totalPages={paged.totalPages}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </section>
      )}

      <AdminProductDetailDrawer
        productId={selectedProductId}
        isActionPending={isModerating}
        onClose={() => setSelectedProductId(null)}
        onRequestAction={openModerationFromDrawer}
      />

      <ProductModerationConfirmDialog
        target={moderationTarget}
        loading={isModerating}
        onCancel={() => setModerationTarget(null)}
        onConfirm={handleConfirmModeration}
      />
    </div>
  );
};

