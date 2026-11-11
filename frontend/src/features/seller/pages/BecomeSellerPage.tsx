import React, { useState } from "react";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { SellerApplicationStatusCard } from "@/features/seller/components/SellerApplicationStatusCard";
import { SellerRegisterForm } from "@/features/seller/components/SellerRegisterForm";
import { useMySeller } from "@/features/seller/hooks/useSellerRegistration";

export const BecomeSellerPage: React.FC = () => {
  const [isEditingResubmit, setIsEditingResubmit] = useState(false);
  const { data: seller, isLoading, isFetching, isError, error, refetch } = useMySeller();

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="ew-card ew-seller-card">
          <Skeleton width="45%" height={24} />
          <Skeleton lines={4} gap={14} />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="ew-card">
          <ErrorState error={error} onRetry={() => void refetch()} />
        </div>
      );
    }

    if (!seller || (isEditingResubmit && seller.status === "Rejected")) {
      return (
        <SellerRegisterForm
          key={seller ? `resubmit-${seller.sellerId}-${seller.updatedAt ?? ""}` : "new"}
          initialValues={
            seller
              ? {
                  businessName: seller.businessName,
                  taxCode: seller.taxCode,
                  description: seller.description,
                }
              : undefined
          }
          isResubmit={Boolean(seller)}
          onCancel={seller ? () => setIsEditingResubmit(false) : undefined}
          onSubmitted={() => setIsEditingResubmit(false)}
        />
      );
    }

    return (
      <SellerApplicationStatusCard
        seller={seller}
        isRefetching={isFetching}
        onRefresh={() => void refetch()}
        onEditResubmit={() => setIsEditingResubmit(true)}
      />
    );
  };

  return (
    <section className="ew-become-seller-page">
      <PageHeader
        title="Đăng ký trở thành người bán"
        subtitle="Mở tài khoản Seller để tạo gian hàng, đăng bán sản phẩm và đồng bộ tồn kho sàn E-Warehouse."
      />

      {renderBody()}
    </section>
  );
};

