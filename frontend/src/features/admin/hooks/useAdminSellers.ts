import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { sellerService } from "@/services/seller.service";
import type { AdminSellerListQuery, SellerProfile } from "@/types/seller";
import { getErrorCode, getErrorMessage } from "@/utils/errorHandler";

export const adminSellerKeys = {
  all: ["admin", "sellers"] as const,
  list: (query: AdminSellerListQuery) =>
    [...adminSellerKeys.all, "list", query] as const,
};

export function useAdminSellers(query: AdminSellerListQuery) {
  return useQuery({
    queryKey: adminSellerKeys.list(query),
    queryFn: () => sellerService.getAdminSellers(query),
  });
}

interface SellerModerationConfig<TVariables> {
  mutationFn: (variables: TVariables) => Promise<SellerProfile>;
  successMessage: string;
  onSuccess?: (updated: SellerProfile) => void;
  onConflict?: () => void;
}

function useSellerModerationMutation<TVariables>({
  mutationFn,
  successMessage,
  onSuccess,
  onConflict,
}: SellerModerationConfig<TVariables>) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn,
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: adminSellerKeys.all });
      toast.success(successMessage);
      onSuccess?.(updated);
    },
    onError: (error: unknown) => {
      const code = getErrorCode(error);
      if (code === "INVALID_STATUS_TRANSITION" || code === "CONCURRENCY_CONFLICT") {
        void queryClient.invalidateQueries({ queryKey: adminSellerKeys.all });
        onConflict?.();
      }
      toast.error(getErrorMessage(error));
    },
  });
}

interface ModerationCallbacks {
  onSuccess?: (updated: SellerProfile) => void;
  onConflict?: () => void;
}

export function useApproveSellerMutation(callbacks?: ModerationCallbacks) {
  return useSellerModerationMutation<number>({
    mutationFn: (sellerId) => sellerService.approveSeller(sellerId),
    successMessage: "Đã duyệt hồ sơ người bán thành công.",
    ...callbacks,
  });
}

export function useRejectSellerMutation(callbacks?: ModerationCallbacks) {
  return useSellerModerationMutation<{ sellerId: number; reason: string }>({
    mutationFn: ({ sellerId, reason }) =>
      sellerService.rejectSeller(sellerId, { reason }),
    successMessage: "Đã từ chối hồ sơ người bán.",
    ...callbacks,
  });
}

export function useSuspendSellerMutation(callbacks?: ModerationCallbacks) {
  return useSellerModerationMutation<{ sellerId: number; reason?: string }>({
    mutationFn: ({ sellerId, reason }) =>
      sellerService.suspendSeller(sellerId, { reason }),
    successMessage: "Đã khóa tài khoản người bán.",
    ...callbacks,
  });
}

