import { useQuery } from "@tanstack/react-query";
import { catalogService } from "@/services/catalog.service";
import type { PublicProductQuery } from "@/types/catalog";

export const PUBLIC_CATALOG_QUERY_KEYS = {
  categories: ["public", "categories"] as const,
  products: (query: PublicProductQuery) => ["public", "products", query] as const,
  productDetail: (productId: number) =>
    ["public", "products", "detail", productId] as const,
  shopDetail: (shopId: number) => ["public", "shops", "detail", shopId] as const,
};

export function usePublicCategories() {
  return useQuery({
    queryKey: PUBLIC_CATALOG_QUERY_KEYS.categories,
    queryFn: () => catalogService.getCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicProducts(query: PublicProductQuery) {
  return useQuery({
    queryKey: PUBLIC_CATALOG_QUERY_KEYS.products(query),
    queryFn: () => catalogService.getPublicProducts(query),
    placeholderData: (previous) => previous,
  });
}

export function usePublicProductDetail(productId: number | null) {
  return useQuery({
    queryKey: PUBLIC_CATALOG_QUERY_KEYS.productDetail(productId ?? 0),
    queryFn: () => catalogService.getPublicProductDetail(productId!),
    enabled: productId !== null && Number.isFinite(productId) && productId > 0,
  });
}

export function usePublicShopDetail(shopId: number | null) {
  return useQuery({
    queryKey: PUBLIC_CATALOG_QUERY_KEYS.shopDetail(shopId ?? 0),
    queryFn: () => catalogService.getPublicShopDetail(shopId!),
    enabled: shopId !== null && Number.isFinite(shopId) && shopId > 0,
  });
}

export const useCategoriesTree = usePublicCategories;
