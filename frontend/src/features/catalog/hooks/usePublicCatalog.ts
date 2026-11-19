import { useQuery } from "@tanstack/react-query";
import { catalogService } from "@/services/catalog.service";
import type { PublicProductQuery } from "@/types/catalog";

export const PUBLIC_PRODUCTS_QUERY_KEY = ["public", "products"] as const;
export const publicProductDetailKey = (productId: number) =>
  ["public", "product", productId] as const;
export const publicShopDetailKey = (shopId: number) =>
  ["public", "shop", shopId] as const;

export function usePublicProductsQuery(query?: PublicProductQuery) {
  return useQuery({
    queryKey: [...PUBLIC_PRODUCTS_QUERY_KEY, query],
    queryFn: () => catalogService.getPublicProducts(query),
  });
}

export function usePublicProductDetailQuery(productId: number | null) {
  return useQuery({
    queryKey: productId ? publicProductDetailKey(productId) : ["public", "product", "none"],
    queryFn: () => catalogService.getPublicProductDetail(productId as number),
    enabled: productId !== null && Number.isFinite(productId) && productId > 0,
  });
}

export function usePublicShopDetailQuery(shopId: number | null) {
  return useQuery({
    queryKey: shopId ? publicShopDetailKey(shopId) : ["public", "shop", "none"],
    queryFn: () => catalogService.getPublicShopById(shopId as number),
    enabled: shopId !== null && Number.isFinite(shopId) && shopId > 0,
  });
}

export function useCategoriesTree() {
  return useQuery({
    queryKey: ["public", "categories"],
    queryFn: () => catalogService.getCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

// Backward-compatibility aliases
export const usePublicProducts = usePublicProductsQuery;
export const usePublicProductDetail = (productId: number) =>
  usePublicProductDetailQuery(productId);
export const usePublicShop = (shopId: number) =>
  usePublicShopDetailQuery(shopId);
