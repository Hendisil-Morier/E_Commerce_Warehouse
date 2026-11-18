import React from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";
import type { TableColumn } from "@/components/ui/Table";
import type { SellerModerationAction } from "@/features/admin/components/SellerModerationConfirmDialog";
import type { PagedResult } from "@/types/api";
import type { SellerProfile } from "@/types/seller";
import { formatDate } from "@/utils/formatters";

export interface AdminSellersTableProps {
  data: PagedResult<SellerProfile> | undefined;
  isLoading: boolean;
  error: unknown;
  isMutating: boolean;
  onRetry: () => void;
  onSelectSeller: (seller: SellerProfile) => void;
  onAction: (action: SellerModerationAction, seller: SellerProfile) => void;
  onPageChange: (page: number) => void;
}

export const AdminSellersTable: React.FC<AdminSellersTableProps> = ({
  data,
  isLoading,
  error,
  isMutating,
  onRetry,
  onSelectSeller,
  onAction,
  onPageChange,
}) => {
  const columns: readonly TableColumn<SellerProfile>[] = [
    {
      key: "businessName",
      header: "Doanh nghiệp",
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: "var(--color-dark)" }}>{item.businessName}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>ID #{item.sellerId}</div>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Người đăng ký",
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600 }}>{item.user?.fullName || "—"}</div>
          <div style={{ fontSize: "0.82rem", color: "var(--color-muted)" }}>
            {item.user?.email || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "taxCode",
      header: "Mã số thuế",
      render: (item) => <span>{item.taxCode || "—"}</span>,
    },
    {
      key: "createdAt",
      header: "Ngày đăng ký",
      render: (item) => <span>{formatDate(item.createdAt)}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (item) => <StatusBadge status={item.status} domain="seller" />,
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (item) => (
        <div className="ew-table-actions">
          <Button size="sm" variant="ghost" onClick={() => onSelectSeller(item)}>
            Chi tiết
          </Button>
          {item.status === "Pending" && (
            <>
              <Button
                size="sm"
                variant="primary"
                disabled={isMutating}
                onClick={() => onAction("approve", item)}
              >
                Duyệt
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={isMutating}
                onClick={() => onAction("reject", item)}
              >
                Từ chối
              </Button>
            </>
          )}
          {item.status === "Approved" && (
            <Button
              size="sm"
              variant="danger"
              disabled={isMutating}
              onClick={() => onAction("suspend", item)}
            >
              Khóa
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={data?.items ?? []}
      rowKey={(item) => item.sellerId}
      loading={isLoading}
      error={error}
      onRetry={onRetry}
      onRowClick={onSelectSeller}
      emptyTitle="Không có hồ sơ người bán phù hợp"
      emptyDescription="Thử đổi trạng thái lọc hoặc xóa từ khóa tìm kiếm để xem các hồ sơ khác."
      pagination={
        data
          ? {
              page: data.page,
              pageSize: data.pageSize,
              totalItems: data.totalItems,
              totalPages: data.totalPages,
              onPageChange,
            }
          : undefined
      }
    />
  );
};

