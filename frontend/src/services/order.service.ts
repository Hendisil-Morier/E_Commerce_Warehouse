import { API_ENDPOINTS } from "@/constants/endpoints";
import axiosClient from "@/lib/axios";
import type {
  CancelOrderRequest,
  CheckoutRequest,
  CreatePaymentRequest,
  OrderDetailDto,
  OrderListItemDto,
  OrderPagedResult,
  OrderQuery,
  PaymentDto,
} from "@/types/order";

export const orderService = {
  async checkout(
    payload: CheckoutRequest,
    idempotencyKey?: string
  ): Promise<OrderDetailDto> {
    const response = await axiosClient.post<OrderDetailDto>(
      API_ENDPOINTS.ORDERS.BASE,
      payload,
      idempotencyKey
        ? { headers: { "Idempotency-Key": idempotencyKey } }
        : undefined
    );
    return response.data;
  },

  async getMyOrders(query: OrderQuery): Promise<OrderPagedResult<OrderListItemDto>> {
    const cleanParams = Object.fromEntries(
      Object.entries(query).filter(
        ([, v]) => v !== undefined && v !== null && v !== ""
      )
    );
    const response = await axiosClient.get<OrderPagedResult<OrderListItemDto>>(
      API_ENDPOINTS.ORDERS.BASE,
      { params: cleanParams }
    );
    return response.data;
  },

  async getMyOrderById(orderId: number): Promise<OrderDetailDto> {
    const response = await axiosClient.get<OrderDetailDto>(
      API_ENDPOINTS.ORDERS.BY_ID(orderId)
    );
    return response.data;
  },

  async cancelMyOrder(
    orderId: number,
    payload: CancelOrderRequest
  ): Promise<OrderDetailDto> {
    const response = await axiosClient.post<OrderDetailDto>(
      API_ENDPOINTS.ORDERS.CANCEL(orderId),
      payload
    );
    return response.data;
  },

  async payOrder(
    orderId: number,
    payload: CreatePaymentRequest
  ): Promise<PaymentDto> {
    const response = await axiosClient.post<PaymentDto>(
      API_ENDPOINTS.ORDERS.PAYMENTS(orderId),
      payload
    );
    return response.data;
  },
};
