import React from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { SellerProfile } from "@/types/seller";

export type SellerModerationAction = "approve" | "reject" | "suspend";

export interface SellerDialogTarget {
  action: SellerModerationAction;
  seller: SellerProfile;
}

export interface SellerModerationConfirmDialogProps {
  target: SellerDialogTarget | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
}

function getDialogConfig({ action, seller }: SellerDialogTarget) {
  if (action === "approve") {
    return {
      title: "Duyệt hồ sơ người bán",
      description: `Xác nhận duyệt "${seller.businessName}"? Tài khoản chủ sở hữu sẽ được cấp vai trò Seller.`,
      confirmText: "Xác nhận duyệt",
      variant: "primary" as const,
      requireReason: false,
      showReason: false,
    };
  }
  if (action === "reject") {
    return {
      title: "Từ chối hồ sơ người bán",
      description: `Nhập lý do từ chối hồ sơ "${seller.businessName}" để người bán nắm thông tin và gửi lại.`,
      confirmText: "Xác nhận từ chối",
      variant: "danger" as const,
      requireReason: true,
      showReason: false,
      reasonLabel: "Lý do từ chối",
      reasonPlaceholder: "Ví dụ: Mã số thuế chưa chính xác hoặc thiếu thông tin mô tả...",
    };
  }
  return {
    title: "Khóa tài khoản người bán",
    description: `Xác nhận đình chỉ hoạt động của "${seller.businessName}"?`,
    confirmText: "Xác nhận khóa",
    variant: "danger" as const,
    requireReason: false,
    showReason: true,
    reasonLabel: "Lý do khóa tài khoản (tùy chọn)",
    reasonPlaceholder: "Nhập lý do đình chỉ nếu cần ghi chú...",
  };
}

export const SellerModerationConfirmDialog: React.FC<SellerModerationConfirmDialogProps> = ({
  target,
  loading = false,
  onClose,
  onConfirm,
}) => {
  if (!target) return null;

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      {...getDialogConfig(target)}
    />
  );
};

