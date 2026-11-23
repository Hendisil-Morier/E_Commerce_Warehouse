import { useQuery } from "@tanstack/react-query";
import { catalogService } from "@/services/catalog.service";
import type { PublicProductQuery } from "@/types/catalog";

export const PUBLIC_CATALOG_QUERY_KEYS = {
  all: ["publicCatalog"] as const,
  categories: () => [...PUBLIC_CATALOG_QUERY_KEYS.all, "categories"] as const,
  products: (query: PublicProductQuery) =>
    [...PUBLIC_CATALOG_QUERY_KEYS.all, "products", query] as const,
  productDetail: (id: number) =>
    [...PUBLIC_CATALOG_QUERY_KEYS.all, "productDetail", id] as const,
  shop: (shopId: number) =>
    [...PUBLIC_CATALOG_QUERY_KEYS.all, "shop", shopId] as const,
};

export function useCategoriesTree() {
  return useQuery({
    queryKey: PUBLIC_CATALOG_QUERY_KEYS.categories(),
    queryFn: () => catalogService.getCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicProducts(query: PublicProductQuery) {
  return useQuery({
    queryKey: PUBLIC_CATALOG_QUERY_KEYS.products(query),
    queryFn: () => catalogService.getPublicProducts(query),
  });
}

export function usePublicProductDetail(productId: number) {
  return useQuery({
    queryKey: PUBLIC_CATALOG_QUERY_KEYS.productDetail(productId),
    queryFn: () => catalogService.getPublicProductDetail(productId),
    enabled: Number.isFinite(productId) && productId > 0,
  });
}

export function usePublicShop(shopId: number) {
  return useQuery({
    queryKey: PUBLIC_CATALOG_QUERY_KEYS.shop(shopId),
    queryFn: () => catalogService.getPublicShop(shopId),
    enabled: Number.isFinite(shopId) && shopId > 0,
  });
}

