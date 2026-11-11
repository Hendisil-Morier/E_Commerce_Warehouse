import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { authService } from "@/services/authService";
import { sellerService } from "@/services/seller.service";
import { useAuthStore } from "@/stores/authStore";
import type { RegisterSellerRequest, SellerStatus } from "@/types/seller";
import { getErrorCode, getErrorMessage, isHttpStatus } from "@/utils/errorHandler";
import { ROLES, hasRole } from "@/utils/roleUtils";

export const sellerKeys = {
  all: ["sellers"] as const,
  me: (userId: number | null | undefined) =>
    [...sellerKeys.all, "me", userId ?? "guest"] as const,
};

export function useMySeller() {
  const userId = useAuthStore((state) => state.user?.userId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: sellerKeys.me(userId),
    enabled: isAuthenticated && Boolean(userId),
    queryFn: async () => {
      try {
        return await sellerService.getMySeller();
      } catch (error: unknown) {
        if (isHttpStatus(error, 404)) {
          return null;
        }
        throw error;
      }
    },
    retry: (failureCount, error) => !isHttpStatus(error, 404) && failureCount < 1,
  });
}

export function useRegisterSellerMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.userId);
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: RegisterSellerRequest) =>
      sellerService.registerOrResubmit(payload),
    onSuccess: (sellerProfile) => {
      queryClient.setQueryData(sellerKeys.me(userId), sellerProfile);
      void queryClient.invalidateQueries({ queryKey: sellerKeys.all });
      toast.success("Đã gửi hồ sơ đăng ký người bán. Vui lòng chờ Admin xét duyệt.");
    },
    onError: (error: unknown) => {
      if (getErrorCode(error) === "SELLER_ALREADY_EXISTS") {
        void queryClient.invalidateQueries({ queryKey: sellerKeys.me(userId) });
      }
      toast.error(getErrorMessage(error));
    },
  });
}

export interface UseSellerRoleSyncResult {
  hasSellerRole: boolean;
  isSyncingRole: boolean;
  needsRelogin: boolean;
}

/**
 * Tự động gọi refresh token tối đa 1 lần mỗi lần vào trang khi hồ sơ đã Approved
 * nhưng token hiện tại chưa có vai trò Seller.
 */
export function useSellerRoleSync(
  sellerStatus: SellerStatus | undefined
): UseSellerRoleSyncResult {
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setAuth = useAuthStore((state) => state.setAuth);
  const toast = useToast();

  const hasAttemptedRef = useRef(false);
  const [syncOutcome, setSyncOutcome] = useState<"idle" | "failed" | "missing_role">("idle");

  const hasSellerRole = hasRole(user, ROLES.SELLER);

  const { mutate: mutateRefresh, isPending: isSyncingRole } = useMutation({
    mutationFn: (token: string) => authService.refresh(token),
    onSuccess: (nextAuth) => {
      setAuth(nextAuth);
      if (hasRole(nextAuth, ROLES.SELLER)) {
        setSyncOutcome("idle");
        toast.success("Hồ sơ đã được duyệt! Bạn đã có quyền truy cập Kênh người bán.");
      } else {
        setSyncOutcome("missing_role");
      }
    },
    onError: () => {
      setSyncOutcome("failed");
    },
  });

  useEffect(() => {
    if (sellerStatus !== "Approved") return;
    if (hasSellerRole) return;
    if (!refreshToken) return;
    if (hasAttemptedRef.current) return;

    hasAttemptedRef.current = true;
    mutateRefresh(refreshToken);
  }, [hasSellerRole, mutateRefresh, refreshToken, sellerStatus]);

  const needsRelogin =
    sellerStatus === "Approved" &&
    !hasSellerRole &&
    !isSyncingRole &&
    (!refreshToken || syncOutcome === "failed" || syncOutcome === "missing_role");

  return {
    hasSellerRole,
    isSyncingRole,
    needsRelogin,
  };
}

