import React, { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { AdminSellersTable } from "@/features/admin/components/AdminSellersTable";
import { SellerDetailDrawer } from "@/features/admin/components/SellerDetailDrawer";
import {
  SellerModerationConfirmDialog,
  type SellerDialogTarget,
} from "@/features/admin/components/SellerModerationConfirmDialog";
import {
  useAdminSellers,
  useApproveSellerMutation,
  useRejectSellerMutation,
  useSuspendSellerMutation,
} from "@/features/admin/hooks/useAdminSellers";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import type { SelectOption } from "@/types/common";
import type { SellerProfile, SellerStatus } from "@/types/seller";

const STATUS_FILTER_OPTIONS: readonly SelectOption[] = [
  { value: "Pending", label: "Chờ duyệt (Pending)" },
  { value: "Approved", label: "Đã duyệt (Approved)" },
  { value: "Rejected", label: "Bị từ chối (Rejected)" },
  { value: "Suspended", label: "Bị khóa (Suspended)" },
  { value: "ALL", label: "Tất cả trạng thái" },
];

const DEFAULT_FILTERS = { status: "Pending", search: "" };

function parseStatusFilter(raw: string): SellerStatus | undefined {
  if (raw === "Pending" || raw === "Approved" || raw === "Rejected" || raw === "Suspended") {
    return raw;
  }
  return undefined;
}

export const AdminSellersPage: React.FC = () => {
  const { filters, page, pageSize, sort, setFilter, setPage, resetFilters } = useUrlFilters({
    defaults: DEFAULT_FILTERS,
  });

  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null);
  const [dialogTarget, setDialogTarget] = useState<SellerDialogTarget | null>(null);

  const queryParams = useMemo(
    () => ({
      status: parseStatusFilter(filters.status),
      search: filters.search.trim() || undefined,
      page,
      pageSize,
      sort,
    }),
    [filters.search, filters.status, page, pageSize, sort]
  );

  const { data, isLoading, isError, error, refetch } = useAdminSellers(queryParams);

  const moderationCallbacks = {
    onSuccess: (updated: SellerProfile) => {
      setDialogTarget(null);
      setSelectedSeller((prev) => (prev?.sellerId === updated.sellerId ? updated : prev));
    },
    onConflict: () => {
      setDialogTarget(null);
      setSelectedSeller(null);
    },
  };

  const approveMutation = useApproveSellerMutation(moderationCallbacks);
  const rejectMutation = useRejectSellerMutation(moderationCallbacks);
  const suspendMutation = useSuspendSellerMutation(moderationCallbacks);

  const isMutating =
    approveMutation.isPending || rejectMutation.isPending || suspendMutation.isPending;

  const handleConfirmAction = async (reason?: string) => {
    if (!dialogTarget) return;
    const { action, seller } = dialogTarget;

    if (action === "approve") {
      await approveMutation.mutateAsync(seller.sellerId);
    } else if (action === "reject") {
      await rejectMutation.mutateAsync({ sellerId: seller.sellerId, reason: reason ?? "" });
    } else {
      await suspendMutation.mutateAsync({ sellerId: seller.sellerId, reason });
    }
  };

  return (
    <section>
      <PageHeader
        title="Duyệt đối tác người bán"
        subtitle="Xem xét hồ sơ đăng ký bán hàng, duyệt kích hoạt quyền Seller, từ chối hoặc khóa tài khoản vi phạm."
      />

      <div className="ew-card ew-toolbar">
        <div className="ew-toolbar__search">
          <SearchInput
            value={filters.search}
            onChange={(value) => setFilter("search", value)}
            placeholder="Tìm theo tên doanh nghiệp, MST, tên hoặc email..."
            ariaLabel="Tìm kiếm hồ sơ người bán"
          />
        </div>

        <div className="ew-toolbar__select">
          <Select
            aria-label="Lọc theo trạng thái người bán"
            value={filters.status}
            options={STATUS_FILTER_OPTIONS}
            onChange={(e) => setFilter("status", e.target.value)}
          />
        </div>

        {(filters.status !== DEFAULT_FILTERS.status || filters.search !== "") && (
          <Button variant="secondary" size="sm" onClick={resetFilters}>
            Đặt lại bộ lọc
          </Button>
        )}
      </div>

      <AdminSellersTable
        data={data}
        isLoading={isLoading}
        error={isError ? error : undefined}
        isMutating={isMutating}
        onRetry={() => void refetch()}
        onSelectSeller={setSelectedSeller}
        onAction={(action, seller) => setDialogTarget({ action, seller })}
        onPageChange={setPage}
      />

      <SellerDetailDrawer
        seller={selectedSeller}
        onClose={() => setSelectedSeller(null)}
        onAction={(action, seller) => setDialogTarget({ action, seller })}
        isMutating={isMutating}
        disableEscape={Boolean(dialogTarget)}
      />

      <SellerModerationConfirmDialog
        target={dialogTarget}
        loading={isMutating}
        onClose={() => setDialogTarget(null)}
        onConfirm={handleConfirmAction}
      />
    </section>
  );
};
