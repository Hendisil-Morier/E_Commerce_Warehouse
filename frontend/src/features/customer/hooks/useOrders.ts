import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services/order.service";
import type {
  CancelOrderRequest,
  CheckoutRequest,
  CreatePaymentRequest,
  OrderQuery,
} from "@/types/order";

export const ORDER_QUERY_KEYS = {
  all: ["orders"] as const,
  list: (query: OrderQuery) => ["orders", "list", query] as const,
  detail: (orderId: number) => ["orders", "detail", orderId] as const,
};

export function useMyOrders(query: OrderQuery) {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.list(query),
    queryFn: () => orderService.getMyOrders(query),
  });
}

export function useMyOrderDetail(orderId: number | null) {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.detail(orderId ?? 0),
    queryFn: () => orderService.getMyOrderById(orderId!),
    enabled: orderId !== null && Number.isFinite(orderId) && orderId > 0,
  });
}

export function useCheckoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: CheckoutRequest;
      idempotencyKey?: string;
    }) => orderService.checkout(payload, idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customer", "cart"] });
      void queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: ["public"] });
    },
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: number;
      payload: CancelOrderRequest;
    }) => orderService.cancelMyOrder(orderId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      void queryClient.invalidateQueries({
        queryKey: ORDER_QUERY_KEYS.detail(variables.orderId),
      });
      void queryClient.invalidateQueries({ queryKey: ["public"] });
    },
  });
}

export function usePayOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: number;
      payload: CreatePaymentRequest;
    }) => orderService.payOrder(orderId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      void queryClient.invalidateQueries({
        queryKey: ORDER_QUERY_KEYS.detail(variables.orderId),
      });
    },
  });
}
