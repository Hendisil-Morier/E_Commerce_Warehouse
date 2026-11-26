import type { StatusTimelineItem } from "@/types/common";
import type { UserRole } from "@/utils/roleUtils";

/* ============================================================================
 * Domain Types — Chuẩn 100% theo database/scripts/02_CreateTables.sql
 * ============================================================================ */

export type OrderStatus =
  | "PendingPayment"
  | "Confirmed"
  | "Processing"
  | "PartiallyShipped"
  | "Shipped"
  | "Completed"
  | "Cancelled"
  | "Expired";

export type SellerOrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "ReadyToShip"
  | "Shipped"
  | "Delivered"
  | "DeliveryFailed"
  | "Cancelled"
  | "Returned";

export type PaymentMethod = "COD" | "BankTransfer" | "EWallet" | "CreditCard";

export type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed"
  | "Refunded"
  | "PartiallyRefunded";

export type RefundStatus = "Pending" | "Approved" | "Rejected" | "Completed";

export type WarehouseType = "Platform" | "Seller";

export type StorageType =
  | "Standard"
  | "Cold"
  | "Hazardous"
  | "Fragile"
  | "Inbound"
  | "Returns"
  | "Damaged";

export type ReceiptType =
  | "SellerInbound"
  | "TransferInbound"
  | "CustomerReturn"
  | "Adjustment";

export type ReceiptStatus = "Draft" | "Confirmed" | "Cancelled";

export type IssueType =
  | "OrderFulfillment"
  | "TransferOutbound"
  | "Adjustment"
  | "ReturnToSeller"
  | "Disposal";

export type IssueStatus =
  | "Draft"
  | "Approved"
  | "Picking"
  | "Packed"
  | "Dispatched"
  | "Cancelled";

export type StockMovementType =
  | "Receipt"
  | "Issue"
  | "TransferIn"
  | "TransferOut"
  | "Adjustment"
  | "ReturnIn"
  | "StockCount"
  | "Reserve"
  | "ReleaseReserve";

export type StockReferenceType =
  | "Receipt"
  | "Issue"
  | "Transfer"
  | "StockCount"
  | "Reservation"
  | "ReturnRequest"
  | "Manual";

export type ShippingStatus =
  | "Preparing"
  | "PickedUp"
  | "InTransit"
  | "Delivered"
  | "Failed"
  | "Returned";

export type ReturnStatus =
  | "Requested"
  | "Approved"
  | "Rejected"
  | "ItemsReceived"
  | "Inspected"
  | "Completed"
  | "Cancelled";

export type InspectionResult = "Pending" | "Good" | "MinorDefect" | "Damaged";

/* ---------- Orders & SellerOrders ---------- */

export interface OrderItemSnapshotDto {
  orderItemId: number;
  sellerOrderId: number;
  variantId: number;
  productNameSnapshot: string;
  skuSnapshot: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface ShipmentRecordDto {
  shipmentId: number;
  sellerOrderId: number;
  sellerOrderCode: string;
  orderCode: string;
  carrierId: number;
  carrierCode: string;
  carrierName: string;
  trackingNumber: string;
  shippingStatus: ShippingStatus;
  codAmount: number;
  recipientName: string;
  destinationProvince: string;
  failedReason: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface SellerOrderRecordDto {
  sellerOrderId: number;
  sellerOrderCode: string;
  orderId: number;
  orderCode: string;
  sellerId: number;
  sellerBusinessName: string;
  shopId: number;
  shopName: string;
  warehouseId: number;
  warehouseName: string;
  customerId: number;
  customerName: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  status: SellerOrderStatus;
  cancelReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  items: OrderItemSnapshotDto[];
  shipment: ShipmentRecordDto | null;
  statusHistory: StatusTimelineItem[];
}

export interface MasterOrderRecordDto {
  orderId: number;
  orderCode: string;
  customerId: number;
  customerName: string;
  recipientName: string;
  recipientPhone: string;
  shippingProvince: string;
  shippingAddress: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentId: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  transactionCode: string | null;
  cancelReason: string | null;
  note: string | null;
  createdAt: string;
  sellerOrderIds: number[];
  statusHistory: StatusTimelineItem[];
}

/* ---------- Warehouse & Inventory ---------- */

export interface WarehouseRecordDto {
  warehouseId: number;
  warehouseName: string;
  warehouseType: WarehouseType;
  ownerSellerId: number | null;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface WarehouseLocationRecordDto {
  locationId: number;
  warehouseId: number;
  warehouseName: string;
  locationCode: string;
  storageType: StorageType;
  isSellable: boolean;
  isActive: boolean;
}

export interface InventoryRecordDto {
  inventoryId: number;
  warehouseId: number;
  warehouseName: string;
  locationId: number;
  locationCode: string;
  storageType: StorageType;
  isSellable: boolean;
  variantId: number;
  sku: string;
  barcode: string;
  productName: string;
  variantName: string;
  sellerId: number;
  shopId: number;
  shopName: string;
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export interface StockMovementRecordDto {
  stockMovementId: number;
  warehouseId: number;
  warehouseName: string;
  locationId: number;
  locationCode: string;
  variantId: number;
  sku: string;
  productName: string;
  movementType: StockMovementType;
  onHandChange: number;
  reservedChange: number;
  onHandAfter: number;
  reservedAfter: number;
  referenceType: StockReferenceType;
  referenceId: number;
  referenceCode: string;
  createdBy: number | null;
  createdByName: string;
  createdAt: string;
  note: string | null;
}

export interface ReceiptDetailRecordDto {
  receiptDetailId: number;
  variantId: number;
  sku: string;
  barcode: string;
  productName: string;
  locationId: number;
  locationCode: string;
  quantity: number;
  unitCost: number | null;
}

export interface InventoryReceiptRecordDto {
  receiptId: number;
  receiptCode: string;
  warehouseId: number;
  warehouseName: string;
  senderSellerId: number | null;
  senderSellerName: string | null;
  returnRequestId: number | null;
  receiptType: ReceiptType;
  status: ReceiptStatus;
  note: string | null;
  createdBy: number;
  createdByName: string;
  createdByEmail?: string | null;
  confirmedBy: number | null;
  confirmedByName: string | null;
  createdAt: string;
  confirmedAt: string | null;
  details: ReceiptDetailRecordDto[];
}

export interface IssueDetailRecordDto {
  issueDetailId: number;
  variantId: number;
  sku: string;
  barcode: string;
  productName: string;
  locationId: number;
  locationCode: string;
  storageType: StorageType;
  quantity: number;
  pickedQuantity: number;
}

export interface InventoryIssueRecordDto {
  issueId: number;
  issueCode: string;
  warehouseId: number;
  warehouseName: string;
  sellerOrderId: number | null;
  sellerOrderCode: string | null;
  orderCode: string | null;
  shopName: string | null;
  customerName: string | null;
  issueType: IssueType;
  status: IssueStatus;
  note: string | null;
  createdBy: number;
  createdByName: string;
  createdByEmail?: string | null;
  approvedBy: number | null;
  approvedByName: string | null;
  dispatchedBy: number | null;
  dispatchedByName: string | null;
  createdAt: string;
  approvedAt: string | null;
  dispatchedAt: string | null;
  packageBoxType?: string;
  packageWeightGrams?: number;
  packageSealCode?: string;
  details: IssueDetailRecordDto[];
  statusHistory: StatusTimelineItem[];
}

export interface CarrierRecordDto {
  carrierId: number;
  carrierCode: string;
  carrierName: string;
  isActive: boolean;
}

/* ---------- Returns & Refunds ---------- */

export interface ReturnRequestItemRecordDto {
  returnItemId: number;
  orderItemId: number;
  variantId: number;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  inspectionResult: InspectionResult;
  inspectionNote: string | null;
  inspectedBy: number | null;
  inspectedByName: string | null;
  inspectedAt: string | null;
  restockLocationId: number | null;
  restockLocationCode: string | null;
}

export interface ReturnRequestRecordDto {
  returnRequestId: number;
  requestCode: string;
  sellerOrderId: number;
  sellerOrderCode: string;
  orderId: number;
  orderCode: string;
  sellerId: number;
  shopName: string;
  sellerSuspended?: boolean;
  customerId: number;
  customerName: string;
  reason: string;
  status: ReturnStatus;
  reviewedBy: number | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  evidenceFiles: string[];
  createdAt: string;
  updatedAt: string | null;
  items: ReturnRequestItemRecordDto[];
}

export interface RefundRecordDto {
  refundId: number;
  refundCode: string;
  paymentId: number;
  orderId: number;
  orderCode: string;
  sellerOrderId: number | null;
  sellerOrderCode: string | null;
  returnRequestId: number | null;
  returnRequestCode: string | null;
  customerName: string;
  shopName: string;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  previouslyRefundedAmount: number;
  amount: number;
  reason: string;
  refundStatus: RefundStatus;
  approvedBy: number | null;
  approvedByName: string | null;
  processedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
}

/* ---------- Admin Users (A7) ---------- */

export interface AdminUserRecordDto {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  isActive: boolean;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string | null;
  lockReason?: string | null;
}

/* ---------- Helper Maps ---------- */

export const NON_SELLABLE_STORAGE_TYPES: readonly StorageType[] = [
  "Inbound",
  "Returns",
  "Damaged",
];

export const STORAGE_TYPE_META: Record<
  StorageType,
  { label: string; shortLabel: string; cssClass: string; colorVar: string; forceNonSellable: boolean }
> = {
  Standard: {
    label: "Kệ tiêu chuẩn (Standard)",
    shortLabel: "Tiêu chuẩn",
    cssClass: "wms-zone-standard",
    colorVar: "var(--color-wms-standard)",
    forceNonSellable: false,
  },
  Cold: {
    label: "Kho lạnh (Cold)",
    shortLabel: "Kho lạnh",
    cssClass: "wms-zone-cold",
    colorVar: "var(--color-wms-cold)",
    forceNonSellable: false,
  },
  Fragile: {
    label: "Hàng dễ vỡ (Fragile)",
    shortLabel: "Dễ vỡ",
    cssClass: "wms-zone-fragile",
    colorVar: "var(--color-wms-fragile)",
    forceNonSellable: false,
  },
  Hazardous: {
    label: "Hàng đặc thù / Pin (Hazardous)",
    shortLabel: "Đặc thù",
    cssClass: "wms-zone-hazardous",
    colorVar: "var(--color-wms-hazardous)",
    forceNonSellable: false,
  },
  Inbound: {
    label: "Khu nhận hàng (Inbound)",
    shortLabel: "Nhận hàng",
    cssClass: "wms-zone-inbound",
    colorVar: "var(--color-wms-inbound)",
    forceNonSellable: true,
  },
  Returns: {
    label: "Khu hàng hoàn (Returns)",
    shortLabel: "Hàng trả",
    cssClass: "wms-zone-returns",
    colorVar: "var(--color-wms-returns)",
    forceNonSellable: true,
  },
  Damaged: {
    label: "Khu hàng hỏng (Damaged)",
    shortLabel: "Hàng hỏng",
    cssClass: "wms-zone-damaged",
    colorVar: "var(--color-wms-damaged)",
    forceNonSellable: true,
  },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  BankTransfer: "Chuyển khoản ngân hàng",
  EWallet: "Ví điện tử (E-Wallet)",
  CreditCard: "Thẻ tín dụng / Ghi nợ",
};

export const RECEIPT_TYPE_LABELS: Record<ReceiptType, string> = {
  SellerInbound: "Nhập hàng từ Người bán",
  TransferInbound: "Nhập điều chuyển kho",
  CustomerReturn: "Nhập hàng khách trả",
  Adjustment: "Nhập điều chỉnh kiểm kê",
};

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  OrderFulfillment: "Xuất đơn hàng",
  TransferOutbound: "Xuất điều chuyển",
  Adjustment: "Xuất điều chỉnh",
  ReturnToSeller: "Xuất trả Người bán",
  Disposal: "Xuất tiêu hủy",
};
