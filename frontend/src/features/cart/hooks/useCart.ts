import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { cartService } from "@/services/cartService";
import { useAuthStore } from "@/stores/authStore";
import type { AddCartItemRequest, Cart, UpdateCartItemRequest } from "@/types/cart";
import { getErrorMessage } from "@/utils/errorHandler";
import { hasRole, ROLES } from "@/utils/roleUtils";

export const cartKeys = {
  all: ["cart"] as const,
  me: () => [...cartKeys.all, "me"] as const,
};

export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isCustomer = isAuthenticated && hasRole(user, [ROLES.CUSTOMER]);

  return useQuery<Cart>({
    queryKey: cartKeys.me(),
    queryFn: () => cartService.getMyCart(),
    enabled: isCustomer,
  });
}

export function useAddToCartMutation(options?: {
  onSuccess?: (cart: Cart) => void;
  silent?: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: AddCartItemRequest) => cartService.addItem(data),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.me(), updatedCart);
      if (!options?.silent) {
        toast.success("Đã thêm sản phẩm vào giỏ hàng.");
      }
      options?.onSuccess?.(updatedCart);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateCartItemMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      cartItemId,
      data,
    }: {
      cartItemId: number;
      data: UpdateCartItemRequest;
    }) => cartService.updateItemQuantity(cartItemId, data),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.me(), updatedCart);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
      void queryClient.invalidateQueries({ queryKey: cartKeys.me() });
    },
  });
}

export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (cartItemId: number) => cartService.removeItem(cartItemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.me() });
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
