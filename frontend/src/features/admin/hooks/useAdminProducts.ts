import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { catalogService } from "@/services/catalog.service";
import type { AdminProductQuery } from "@/types/catalog";
import { getErrorMessage } from "@/utils/errorHandler";

export const ADMIN_PRODUCTS_QUERY_KEY = ["admin", "products"] as const;

export const adminProductDetailKey = (productId: number) =>
  ["admin", "product", productId] as const;

export function useAdminProductsQuery(query: AdminProductQuery) {
  return useQuery({
    queryKey: [...ADMIN_PRODUCTS_QUERY_KEY, query],
    queryFn: () => catalogService.getAdminProducts(query),
  });
}

export function useAdminProductDetailQuery(productId: number | null) {
  return useQuery({
    queryKey: productId ? adminProductDetailKey(productId) : ["admin", "product", "none"],
    queryFn: () => catalogService.getAdminProductDetail(productId as number),
    enabled: productId !== null && Number.isFinite(productId) && productId > 0,
  });
}

export function useApproveAdminProductMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (productId: number) => catalogService.approveAdminProduct(productId),
    onSuccess: (product) => {
      toast.success(`Đã duyệt sản phẩm "${product.productName}".`);
      void queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: adminProductDetailKey(product.productId),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useRejectAdminProductMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ productId, reason }: { productId: number; reason: string }) =>
      catalogService.rejectAdminProduct(productId, { reason }),
    onSuccess: (product) => {
      toast.success(`Đã từ chối sản phẩm "${product.productName}".`);
      void queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: adminProductDetailKey(product.productId),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

