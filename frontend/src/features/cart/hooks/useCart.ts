import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/services/cart.service";
import { useAuthStore } from "@/stores/authStore";
import type { AddCartItemRequest, UpdateCartItemRequest } from "@/types/cart";
import { isHttpStatus } from "@/utils/errorHandler";
import { hasRole, ROLES } from "@/utils/roleUtils";

export const CART_QUERY_KEYS = {
  all: ["customer", "cart"] as const,
  myCart: (userId?: number) => ["customer", "cart", userId ?? "guest"] as const,
};

export function useMyCart() {
  const { user, isAuthenticated } = useAuthStore();
  const isCustomer = isAuthenticated && hasRole(user, ROLES.CUSTOMER);

  return useQuery({
    queryKey: CART_QUERY_KEYS.myCart(user?.userId),
    queryFn: () => cartService.getMyCart(),
    enabled: isCustomer,
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.userId);

  return useMutation({
    mutationFn: (payload: AddCartItemRequest) => cartService.addItem(payload),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEYS.myCart(userId), updatedCart);
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.all });
    },
    onError: (error) => {
      // Đồng bộ lại giỏ hàng & tồn kho nếu gặp xung đột 409 (hết hàng / ngừng bán / đồng thời)
      if (isHttpStatus(error, 409)) {
        void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.all });
        void queryClient.invalidateQueries({ queryKey: ["public", "products"] });
      }
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.userId);

  return useMutation({
    mutationFn: ({
      cartItemId,
      payload,
    }: {
      cartItemId: number;
      payload: UpdateCartItemRequest;
    }) => cartService.updateItemQuantity(cartItemId, payload),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEYS.myCart(userId), updatedCart);
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.all });
    },
    onError: (error) => {
      if (isHttpStatus(error, 409) || isHttpStatus(error, 404)) {
        void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.all });
      }
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartItemId: number) => cartService.removeItem(cartItemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.all });
    },
    onError: (error) => {
      if (isHttpStatus(error, 409) || isHttpStatus(error, 404)) {
        void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.all });
      }
    },
  });
}
