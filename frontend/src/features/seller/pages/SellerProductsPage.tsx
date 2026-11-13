import React, { useMemo, useState } from "react";
import { Image as ImageIcon, Pencil, Plus, RotateCcw, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";
import type { TableColumn } from "@/components/ui/Table";
import { ROUTES } from "@/constants/routes";
import {
  useSellerProductsQuery,
  useSellerShopsQuery,
  useSubmitProductMutation,
} from "@/features/seller/hooks/useSellerCatalog";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import type { ProductStatus, SellerProductListItemDto } from "@/types/catalog";
import { formatPriceRange } from "@/utils/catalogHelpers";
import { formatDate, resolveAssetUrl } from "@/utils/formatters";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Draft", label: "Nháp" },
  { value: "PendingReview", label: "Chờ duyệt" },
  { value: "Active", label: "Đang bán" },
  { value: "Rejected", label: "Bị từ chối" },
  { value: "Inactive", label: "Ngừng bán" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới tạo nhất" },
  { value: "updated", label: "Cập nhật gần nhất" },
  { value: "name_asc", label: "Tên A → Z" },
  { value: "name_desc", label: "Tên Z → A" },
];

export const SellerProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitTarget, setSubmitTarget] = useState<SellerProductListItemDto | null>(null);

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
    defaults: { status: "", shopId: "", q: "" },
    defaultPageSize: 10,
    defaultSort: "updated",
  });

  const shopsQuery = useSellerShopsQuery();
  const submitProduct = useSubmitProductMutation();

  const parsedShopId = filters.shopId ? Number(filters.shopId) : "";
  const productsQuery = useSellerProductsQuery({
    status: (filters.status as ProductStatus | "") || undefined,
    shopId: Number.isFinite(parsedShopId) ? parsedShopId : undefined,
    q: filters.q || undefined,
    page,
    pageSize,
    sort,
  });

  const shopOptions = useMemo(
    () => [
      { value: "", label: "Tất cả gian hàng" },
      ...(shopsQuery.data ?? []).map((shop) => ({
        value: String(shop.shopId),
        label: shop.isActive ? shop.shopName : `${shop.shopName} (Tạm ẩn)`,
      })),
    ],
    [shopsQuery.data]
  );

  const handleConfirmSubmit = async () => {
    if (!submitTarget) return;
    await submitProduct.mutateAsync(submitTarget.productId);
    setSubmitTarget(null);
  };

  const columns: TableColumn<SellerProductListItemDto>[] = [
    {
      key: "product",
      header: "Sản phẩm",
      render: (item) => {
        const thumb = resolveAssetUrl(item.thumbnailUrl);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="ew-thumb-sm">
              {thumb ? (
                <img src={thumb} alt={item.productName} />
              ) : (
                <ImageIcon size={18} aria-hidden="true" />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{item.productName}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--color-muted)" }}>
                {item.shopName} · {item.categoryName}
              </div>
              {item.productStatus === "Rejected" && item.rejectReason && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-danger)",
                    marginTop: "2px",
                  }}
                >
                  Lý do từ chối: {item.rejectReason}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "variants",
      header: "Biến thể & Giá",
      width: "210px",
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {formatPriceRange(item.minPrice, item.maxPrice)}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--color-muted)" }}>
            {item.variantCount} biến thể
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "150px",
      render: (item) => <StatusBadge status={item.productStatus} domain="product" />,
    },
    {
      key: "updatedAt",
      header: "Cập nhật",
      width: "155px",
      render: (item) => formatDate(item.updatedAt),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      width: "230px",
      render: (item) => {
        const canSubmit =
          item.productStatus === "Draft" || item.productStatus === "Rejected";
        return (
          <div className="ew-table-actions">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Pencil size={14} />}
              onClick={() => navigate(`/seller/products/${item.productId}/edit`)}
            >
              {item.productStatus === "PendingReview" ? "Xem" : "Sửa"}
            </Button>
            {canSubmit && (
              <Button
                size="sm"
                leftIcon={<Send size={14} />}
                onClick={() => setSubmitTarget(item)}
              >
                Gửi duyệt
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const paged = productsQuery.data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Danh sách sản phẩm"
        subtitle="Theo dõi trạng thái duyệt, quản lý biến thể SKU và gửi duyệt sản phẩm lên sàn."
        actions={
          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => navigate(ROUTES.SELLER_PRODUCT_NEW)}
          >
            Thêm sản phẩm mới
          </Button>
        }
      />

      <section className="ew-card" style={{ padding: "18px 20px" }}>
        <div className="ew-toolbar">
          <div className="ew-toolbar__group" style={{ flex: 1 }}>
            <div style={{ minWidth: "260px", flex: "1 1 260px" }}>
              <SearchInput
                value={filters.q}
                onChange={(value) => setFilter("q", value)}
                placeholder="Tìm theo tên sản phẩm hoặc SKU..."
              />
            </div>

            <Select
              aria-label="Lọc theo trạng thái sản phẩm"
              value={filters.status}
              onChange={(e) => setFilter("status", e.target.value)}
              options={STATUS_OPTIONS}
              style={{ width: "180px" }}
            />

            <Select
              aria-label="Lọc theo gian hàng"
              value={filters.shopId}
              onChange={(e) => setFilter("shopId", e.target.value)}
              options={shopOptions}
              style={{ width: "200px" }}
            />

            <Select
              aria-label="Sắp xếp danh sách sản phẩm"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              options={SORT_OPTIONS}
              style={{ width: "190px" }}
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
          <Table
            columns={columns}
            data={paged?.items ?? []}
            rowKey={(item) => item.productId}
            loading={productsQuery.isLoading}
            emptyTitle="Chưa có sản phẩm phù hợp"
            emptyDescription="Tạo sản phẩm mới hoặc thay đổi bộ lọc tìm kiếm."
            emptyAction={
              <Button
                leftIcon={<Plus size={16} />}
                onClick={() => navigate(ROUTES.SELLER_PRODUCT_NEW)}
              >
                Tạo sản phẩm mới
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

      <ConfirmDialog
        open={submitTarget !== null}
        title="Gửi duyệt sản phẩm"
        description={
          submitTarget
            ? `Gửi "${submitTarget.productName}" cho Admin kiểm duyệt? Sản phẩm sẽ tạm khóa chỉnh sửa trong lúc chờ duyệt.`
            : ""
        }
        confirmText="Gửi duyệt ngay"
        loading={submitProduct.isPending}
        onClose={() => setSubmitTarget(null)}
        onConfirm={() => void handleConfirmSubmit()}
      />
    </div>
  );
};

