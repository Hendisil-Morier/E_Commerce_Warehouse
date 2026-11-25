export type PaymentMethod = "COD" | "BankTransfer" | "EWallet" | "CreditCard";

export interface OrderPagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CheckoutRequest {
  addressId: number;
  paymentMethod: PaymentMethod;
  note?: string | null;
  cartItemIds?: number[] | null;
}

export interface CancelOrderRequest {
  reason: string;
}

export interface CreatePaymentRequest {
  paymentMethod: PaymentMethod;
}

export interface OrderQuery {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface OrderItemDto {
  orderItemId: number;
  variantId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderSellerOrderDto {
  sellerOrderId: number;
  sellerId: number;
  sellerBusinessName: string;
  warehouseId: number | null;
  warehouseName: string | null;
  subtotal: number;
  status: string;
  cancelReason: string | null;
  cancelledAt: string | null;
  items: OrderItemDto[];
}

export interface PaymentDto {
  paymentId: number;
  orderId: number;
  paymentMethod: string;
  amount: number;
  paymentStatus: string;
  transactionCode: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface OrderStatusHistoryDto {
  historyId: number;
  sellerOrderId: number | null;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  changedBy: number | null;
  createdAt: string;
}

export interface OrderListItemDto {
  orderId: number;
  orderCode: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  expiresAt: string | null;
  createdAt: string;
  sellerOrderCount: number;
  totalItemCount: number;
}

export interface OrderDetailDto {
  orderId: number;
  orderCode: string;
  idempotencyKey: string | null;
  recipientName: string;
  recipientPhone: string;
  shippingProvince: string;
  shippingDistrict: string;
  shippingWard: string;
  shippingStreetAddress: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  orderStatus: string;
  expiresAt: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string | null;
  sellerOrders: OrderSellerOrderDto[];
  payments: PaymentDto[];
  statusHistories: OrderStatusHistoryDto[];
}
