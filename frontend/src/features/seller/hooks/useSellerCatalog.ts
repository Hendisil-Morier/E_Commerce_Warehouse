import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { catalogService } from "@/services/catalog.service";
import { useAuthStore } from "@/stores/authStore";
import type {
  CreateProductRequest,
  CreateShopRequest,
  SellerProductQuery,
  UpdateProductRequest,
  UpdateShopRequest,
  UpsertVariantRequest,
} from "@/types/catalog";
import { getErrorMessage } from "@/utils/errorHandler";

export const CATEGORIES_QUERY_KEY = ["catalog", "categories"] as const;
export const SELLER_SHOPS_QUERY_KEY = ["seller", "shops"] as const;
export const SELLER_PRODUCTS_QUERY_KEY = ["seller", "products"] as const;

export const sellerProductDetailKey = (productId: number, userId?: number | null) =>
  ["seller", "product", userId ?? "anon", productId] as const;

export function useCategoriesQuery() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => catalogService.getCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSellerShopsQuery(isActive?: boolean) {
  const userId = useAuthStore((s) => s.user?.userId);

  return useQuery({
    queryKey: [...SELLER_SHOPS_QUERY_KEY, userId ?? "anon", isActive ?? "all"],
    queryFn: () => catalogService.getSellerShops(isActive),
    enabled: Boolean(userId),
    staleTime: 0,
  });
}

export function useSellerProductsQuery(query: SellerProductQuery) {
  const userId = useAuthStore((s) => s.user?.userId);

  return useQuery({
    queryKey: [...SELLER_PRODUCTS_QUERY_KEY, userId ?? "anon", query],
    queryFn: () => catalogService.getSellerProducts(query),
    enabled: Boolean(userId),
    staleTime: 0,
  });
}

export function useSellerProductDetailQuery(productId: number | null) {
  const userId = useAuthStore((s) => s.user?.userId);

  return useQuery({
    queryKey: productId
      ? sellerProductDetailKey(productId, userId)
      : ["seller", "product", "none"],
    queryFn: () => catalogService.getSellerProductDetail(productId as number),
    enabled: Boolean(userId) && productId !== null && Number.isFinite(productId) && productId > 0,
    staleTime: 0,
  });
}

export function useCreateShopMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: CreateShopRequest) => catalogService.createSellerShop(payload),
    onSuccess: (shop) => {
      toast.success(`Đã tạo shop "${shop.shopName}".`);
      void queryClient.invalidateQueries({ queryKey: SELLER_SHOPS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateShopMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ shopId, payload }: { shopId: number; payload: UpdateShopRequest }) =>
      catalogService.updateSellerShop(shopId, payload),
    onSuccess: (shop) => {
      toast.success(`Đã cập nhật shop "${shop.shopName}".`);
      void queryClient.invalidateQueries({ queryKey: SELLER_SHOPS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUploadSellerImageMutation() {
  const toast = useToast();

  return useMutation({
    mutationFn: (file: File) => catalogService.uploadSellerImage(file),
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: CreateProductRequest) => catalogService.createSellerProduct(payload),
    onSuccess: (product) => {
      toast.success(`Đã tạo bản nháp "${product.productName}".`);
      void queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateProductMutation(productId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: UpdateProductRequest) =>
      catalogService.updateSellerProduct(productId, payload),
    onSuccess: (product) => {
      toast.success(`Đã lưu thay đổi "${product.productName}".`);
      void queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: sellerProductDetailKey(productId) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useSubmitProductMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (productId: number) => catalogService.submitSellerProduct(productId),
    onSuccess: (product) => {
      toast.success(`Đã gửi duyệt "${product.productName}".`);
      void queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: sellerProductDetailKey(product.productId),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCreateVariantMutation(productId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: UpsertVariantRequest) =>
      catalogService.createProductVariant(productId, payload),
    onSuccess: (variant) => {
      toast.success(`Đã thêm biến thể SKU "${variant.sku}".`);
      void queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: sellerProductDetailKey(productId) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateVariantMutation(productId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      variantId,
      payload,
    }: {
      variantId: number;
      payload: UpsertVariantRequest;
    }) => catalogService.updateProductVariant(variantId, payload),
    onSuccess: (variant) => {
      toast.success(`Đã cập nhật biến thể SKU "${variant.sku}".`);
      void queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: sellerProductDetailKey(productId) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

