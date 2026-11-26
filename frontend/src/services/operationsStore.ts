import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AdminUserRecordDto,
  CarrierRecordDto,
  InspectionResult,
  InventoryIssueRecordDto,
  InventoryReceiptRecordDto,
  InventoryRecordDto,
  MasterOrderRecordDto,
  ReceiptType,
  RefundRecordDto,
  ReturnRequestRecordDto,
  SellerOrderRecordDto,
  ShipmentRecordDto,
  ShippingStatus,
  StockMovementRecordDto,
  StorageType,
  WarehouseLocationRecordDto,
  WarehouseRecordDto,
} from "@/types/operations";
import { NON_SELLABLE_STORAGE_TYPES } from "@/types/operations";
import type { UserRole } from "@/utils/roleUtils";

/**
 * Kiểm tra xem người thực hiện hiện tại có phải chính là người đã tạo chứng từ hay không.
 * Ưu tiên đối chiếu theo email (không phân biệt hoa/thường) khi có sẵn cả 2 email để tránh
 * sai lệch UserId giữa dữ liệu seed MySQL thực tế và dữ liệu mô phỏng WMS.
 */
export function isSameWarehouseActor(
  createdBy: number,
  createdByEmail: string | null | undefined,
  actorId: number,
  actorEmail?: string | null
): boolean {
  const normCreated = createdByEmail?.trim().toLowerCase();
  const normActor = actorEmail?.trim().toLowerCase();
  if (normCreated && normActor) {
    return normCreated === normActor;
  }
  return createdBy === actorId;
}

export interface ActionOutcome {
  ok: boolean;
  code?: string;
  message: string;
}

export interface CreateReceiptInput {
  warehouseId: number;
  receiptType: ReceiptType;
  senderSellerId: number | null;
  senderSellerName: string | null;
  note: string;
  createdBy: number;
  createdByName: string;
  createdByEmail?: string | null;
  lines: Array<{
    variantId: number;
    sku: string;
    barcode: string;
    productName: string;
    locationId: number;
    quantity: number;
    unitCost: number | null;
  }>;
}

export interface OperationsState {
  warehouses: WarehouseRecordDto[];
  locations: WarehouseLocationRecordDto[];
  inventory: InventoryRecordDto[];
  stockMovements: StockMovementRecordDto[];
  receipts: InventoryReceiptRecordDto[];
  issues: InventoryIssueRecordDto[];
  carriers: CarrierRecordDto[];
  shipments: ShipmentRecordDto[];
  masterOrders: MasterOrderRecordDto[];
  sellerOrders: SellerOrderRecordDto[];
  returns: ReturnRequestRecordDto[];
  refunds: RefundRecordDto[];
  adminUsers: AdminUserRecordDto[];

  // Seller Actions (S5, S6, S8)
  confirmSellerOrder: (sellerOrderId: number, actorName: string) => ActionOutcome;
  cancelSellerOrder: (sellerOrderId: number, reason: string, actorName: string) => ActionOutcome;
  approveReturnRequest: (returnRequestId: number, actorId: number, actorName: string) => ActionOutcome;
  rejectReturnRequest: (
    returnRequestId: number,
    reason: string,
    actorId: number,
    actorName: string
  ) => ActionOutcome;

  // Warehouse Actions (W2, W5, W6, W7, W8, W9)
  addWarehouse: (payload: { warehouseName: string; address: string }) => ActionOutcome;
  addLocation: (payload: {
    warehouseId: number;
    locationCode: string;
    storageType: StorageType;
    isSellable: boolean;
  }) => ActionOutcome;
  toggleLocationActive: (locationId: number) => ActionOutcome;

  createReceiptDraft: (input: CreateReceiptInput) => ActionOutcome & { receiptId?: number };
  confirmReceipt: (
    receiptId: number,
    actorId: number,
    actorName: string,
    actorEmail?: string | null
  ) => ActionOutcome;
  cancelReceipt: (receiptId: number, reason: string, actorName: string) => ActionOutcome;

  approveIssue: (
    issueId: number,
    actorId: number,
    actorName: string,
    actorEmail?: string | null
  ) => ActionOutcome;
  startPickingIssue: (issueId: number, actorName: string) => ActionOutcome;
  scanIssueBarcode: (issueId: number, code: string) => ActionOutcome & { matchedSku?: string };
  packIssue: (
    issueId: number,
    payload: { boxType: string; weightGrams: number; sealCode: string },
    actorName: string
  ) => ActionOutcome;
  dispatchIssue: (issueId: number, actorId: number, actorName: string) => ActionOutcome;

  createShipment: (payload: {
    sellerOrderId: number;
    carrierId: number;
    trackingNumber: string;
    codAmount: number;
  }) => ActionOutcome;
  updateShipmentStatus: (
    shipmentId: number,
    nextStatus: ShippingStatus,
    failedReason?: string
  ) => ActionOutcome;

  receiveReturnAtWarehouse: (returnRequestId: number, actorName: string) => ActionOutcome;
  inspectReturnItem: (payload: {
    returnRequestId: number;
    returnItemId: number;
    result: Exclude<InspectionResult, "Pending">;
    restockLocationId: number;
    note: string;
    actorId: number;
    actorName: string;
  }) => ActionOutcome;

  // Admin Actions (A6, A7)
  approveRefund: (refundId: number, actorId: number, actorName: string) => ActionOutcome;
  rejectRefund: (refundId: number, reason: string, actorId: number, actorName: string) => ActionOutcome;
  completeRefund: (refundId: number, actorName: string) => ActionOutcome;
  toggleUserActive: (userId: number, reason?: string) => ActionOutcome;
  updateUserRoles: (userId: number, roles: UserRole[]) => ActionOutcome;
}

/* ============================================================================
 * Seed Data — Đồng bộ 100% với 06_SeedData.sql & DataSeeder.cs
 * ============================================================================ */

const INITIAL_CARRIERS: CarrierRecordDto[] = [
  { carrierId: 1, carrierCode: "GHN", carrierName: "Giao Hàng Nhanh", isActive: true },
  { carrierId: 2, carrierCode: "GHTK", carrierName: "Giao Hàng Tiết Kiệm", isActive: true },
  { carrierId: 3, carrierCode: "VTP", carrierName: "Viettel Post", isActive: true },
  { carrierId: 4, carrierCode: "JT", carrierName: "J&T Express", isActive: true },
  { carrierId: 5, carrierCode: "SPX", carrierName: "SPX Express", isActive: true },
];

const INITIAL_WAREHOUSES: WarehouseRecordDto[] = [
  {
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    warehouseType: "Platform",
    ownerSellerId: null,
    address: "KCN Bắc Thăng Long, Đông Anh, TP. Hà Nội",
    isActive: true,
    createdAt: "2026-10-01T02:00:00Z",
  },
];

const INITIAL_LOCATIONS: WarehouseLocationRecordDto[] = [
  { locationId: 1, warehouseId: 1, warehouseName: "Kho sàn Hà Nội", locationCode: "A-01-01", storageType: "Standard", isSellable: true, isActive: true },
  { locationId: 2, warehouseId: 1, warehouseName: "Kho sàn Hà Nội", locationCode: "A-01-02", storageType: "Standard", isSellable: true, isActive: true },
  { locationId: 3, warehouseId: 1, warehouseName: "Kho sàn Hà Nội", locationCode: "A-01-03", storageType: "Standard", isSellable: true, isActive: true },
  { locationId: 4, warehouseId: 1, warehouseName: "Kho sàn Hà Nội", locationCode: "C-01-01", storageType: "Cold", isSellable: true, isActive: true },
  { locationId: 5, warehouseId: 1, warehouseName: "Kho sàn Hà Nội", locationCode: "F-01-01", storageType: "Fragile", isSellable: true, isActive: true },
  { locationId: 6, warehouseId: 1, warehouseName: "Kho sàn Hà Nội", locationCode: "H-01-01", storageType: "Hazardous", isSellable: true, isActive: true },
  { locationId: 7, warehouseId: 1, warehouseName: "Kho sàn Hà Nội", locationCode: "INBOUND-01", storageType: "Inbound", isSellable: false, isActive: true },
  { locationId: 8, warehouseId: 1, warehouseName: "Kho sàn Hà Nội", locationCode: "RETURNS-01", storageType: "Returns", isSellable: false, isActive: true },
  { locationId: 9, warehouseId: 1, warehouseName: "Kho sàn Hà Nội", locationCode: "DAMAGED-01", storageType: "Damaged", isSellable: false, isActive: true },
];

export const CATALOG_VARIANTS_REFERENCE = [
  {
    variantId: 101,
    sku: "KB-K2PRO-RED",
    barcode: "8938501204881",
    productName: "Bàn phím cơ không dây Keychron K2 Pro",
    variantName: "Red Switch · Nhôm CNC",
    sellerId: 1,
    shopId: 1,
    shopName: "Modu Official Flagship Store",
    unitPrice: 2490000,
  },
  {
    variantId: 102,
    sku: "MS-MX3S-BLK",
    barcode: "8938501204898",
    productName: "Chuột công thái học Logitech MX Master 3S",
    variantName: "Đen Graphite",
    sellerId: 1,
    shopId: 1,
    shopName: "Modu Official Flagship Store",
    unitPrice: 2150000,
  },
  {
    variantId: 103,
    sku: "CF-ESP-20BAR",
    barcode: "8938501204904",
    productName: "Máy pha cà phê Espresso bán tự động 20 Bar",
    variantName: "Thép không gỉ Bạc",
    sellerId: 1,
    shopId: 1,
    shopName: "Modu Official Flagship Store",
    unitPrice: 4650000,
  },
  {
    variantId: 104,
    sku: "SR-VITC-30ML",
    barcode: "8938501204911",
    productName: "Tinh chất Vitamin C 15% bảo quản lạnh",
    variantName: "Chai 30ml",
    sellerId: 2,
    shopId: 2,
    shopName: "BioDerma Pure Official",
    unitPrice: 680000,
  },
  {
    variantId: 105,
    sku: "PB-20000-65W",
    barcode: "8938501204928",
    productName: "Pin sạc dự phòng GaN 20.000mAh 65W PD",
    variantName: "Xám Titan",
    sellerId: 1,
    shopId: 1,
    shopName: "Modu Official Flagship Store",
    unitPrice: 1290000,
  },
];

const INITIAL_INVENTORY: InventoryRecordDto[] = [
  {
    inventoryId: 1,
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    locationId: 1,
    locationCode: "A-01-01",
    storageType: "Standard",
    isSellable: true,
    variantId: 101,
    sku: "KB-K2PRO-RED",
    barcode: "8938501204881",
    productName: "Bàn phím cơ không dây Keychron K2 Pro",
    variantName: "Red Switch · Nhôm CNC",
    sellerId: 1,
    shopId: 1,
    shopName: "Modu Official Flagship Store",
    quantityOnHand: 42,
    quantityReserved: 4,
    availableQuantity: 38,
    lowStockThreshold: 10,
    updatedAt: "2026-11-25T03:15:00Z",
  },
  {
    inventoryId: 2,
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    locationId: 2,
    locationCode: "A-01-02",
    storageType: "Standard",
    isSellable: true,
    variantId: 102,
    sku: "MS-MX3S-BLK",
    barcode: "8938501204898",
    productName: "Chuột công thái học Logitech MX Master 3S",
    variantName: "Đen Graphite",
    sellerId: 1,
    shopId: 1,
    shopName: "Modu Official Flagship Store",
    quantityOnHand: 8,
    quantityReserved: 3,
    availableQuantity: 5,
    lowStockThreshold: 10,
    updatedAt: "2026-11-25T03:40:00Z",
  },
  {
    inventoryId: 3,
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    locationId: 5,
    locationCode: "F-01-01",
    storageType: "Fragile",
    isSellable: true,
    variantId: 103,
    sku: "CF-ESP-20BAR",
    barcode: "8938501204904",
    productName: "Máy pha cà phê Espresso bán tự động 20 Bar",
    variantName: "Thép không gỉ Bạc",
    sellerId: 1,
    shopId: 1,
    shopName: "Modu Official Flagship Store",
    quantityOnHand: 14,
    quantityReserved: 2,
    availableQuantity: 12,
    lowStockThreshold: 5,
    updatedAt: "2026-11-25T02:20:00Z",
  },
  {
    inventoryId: 4,
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    locationId: 4,
    locationCode: "C-01-01",
    storageType: "Cold",
    isSellable: true,
    variantId: 104,
    sku: "SR-VITC-30ML",
    barcode: "8938501204911",
    productName: "Tinh chất Vitamin C 15% bảo quản lạnh",
    variantName: "Chai 30ml",
    sellerId: 2,
    shopId: 2,
    shopName: "BioDerma Pure Official",
    quantityOnHand: 28,
    quantityReserved: 2,
    availableQuantity: 26,
    lowStockThreshold: 12,
    updatedAt: "2026-11-25T01:50:00Z",
  },
  {
    inventoryId: 5,
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    locationId: 6,
    locationCode: "H-01-01",
    storageType: "Hazardous",
    isSellable: true,
    variantId: 105,
    sku: "PB-20000-65W",
    barcode: "8938501204928",
    productName: "Pin sạc dự phòng GaN 20.000mAh 65W PD",
    variantName: "Xám Titan",
    sellerId: 1,
    shopId: 1,
    shopName: "Modu Official Flagship Store",
    quantityOnHand: 3,
    quantityReserved: 3,
    availableQuantity: 0,
    lowStockThreshold: 8,
    updatedAt: "2026-11-25T04:05:00Z",
  },
];

const INITIAL_STOCK_MOVEMENTS: StockMovementRecordDto[] = [
  {
    stockMovementId: 5001,
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    locationId: 1,
    locationCode: "A-01-01",
    variantId: 101,
    sku: "KB-K2PRO-RED",
    productName: "Bàn phím cơ không dây Keychron K2 Pro",
    movementType: "Receipt",
    onHandChange: 50,
    reservedChange: 0,
    onHandAfter: 50,
    reservedAfter: 0,
    referenceType: "Receipt",
    referenceId: 201,
    referenceCode: "PN-261120-001",
    createdBy: 3,
    createdByName: "Trần Văn Kho 2 (manager2)",
    createdAt: "2026-11-20T03:00:00Z",
    note: "Xác nhận phiếu nhập hàng Seller Modu Official",
  },
  {
    stockMovementId: 5002,
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    locationId: 1,
    locationCode: "A-01-01",
    variantId: 101,
    sku: "KB-K2PRO-RED",
    productName: "Bàn phím cơ không dây Keychron K2 Pro",
    movementType: "Reserve",
    onHandChange: 0,
    reservedChange: 2,
    onHandAfter: 44,
    reservedAfter: 4,
    referenceType: "Reservation",
    referenceId: 901,
    referenceCode: "ORD-261125-001",
    createdBy: null,
    createdByName: "Hệ thống (Checkout)",
    createdAt: "2026-11-25T02:10:00Z",
    note: "Giữ chỗ tồn kho nguyên tử cho đơn hàng ORD-261125-001",
  },
  {
    stockMovementId: 5003,
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    locationId: 5,
    locationCode: "F-01-01",
    variantId: 103,
    sku: "CF-ESP-20BAR",
    productName: "Máy pha cà phê Espresso bán tự động 20 Bar",
    movementType: "Issue",
    onHandChange: -1,
    reservedChange: -1,
    onHandAfter: 14,
    reservedAfter: 2,
    referenceType: "Issue",
    referenceId: 303,
    referenceCode: "PX-261124-018",
    createdBy: 2,
    createdByName: "Nguyễn Văn Kho 1 (manager1)",
    createdAt: "2026-11-24T09:15:00Z",
    note: "Xuất kho Dispatched & tiêu thụ giữ chỗ cho đơn SO-261124-018",
  },
];

const INITIAL_RECEIPTS: InventoryReceiptRecordDto[] = [
  {
    receiptId: 201,
    receiptCode: "PN-261120-001",
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    senderSellerId: 1,
    senderSellerName: "Công ty TNHH Thiết Bị Số Modu+",
    returnRequestId: null,
    receiptType: "SellerInbound",
    status: "Confirmed",
    note: "Đợt nhập bổ sung tháng 11 tại cổng INBOUND-01",
    createdBy: 2,
    createdByName: "Nguyễn Văn Kho 1 (manager1)",
    createdByEmail: "manager1@gmail.com",
    confirmedBy: 3,
    confirmedByName: "Trần Văn Kho 2 (manager2)",
    createdAt: "2026-11-20T01:30:00Z",
    confirmedAt: "2026-11-20T03:00:00Z",
    details: [
      {
        receiptDetailId: 1,
        variantId: 101,
        sku: "KB-K2PRO-RED",
        barcode: "8938501204881",
        productName: "Bàn phím cơ không dây Keychron K2 Pro",
        locationId: 1,
        locationCode: "A-01-01",
        quantity: 50,
        unitCost: 1850000,
      },
    ],
  },
  {
    receiptId: 202,
    receiptCode: "PN-261125-002",
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    senderSellerId: 1,
    senderSellerName: "Công ty TNHH Thiết Bị Số Modu+",
    returnRequestId: null,
    receiptType: "SellerInbound",
    status: "Draft",
    note: "Hàng mới về cần kiểm đếm và xác nhận tách quyền bởi Quản lý kho khác",
    createdBy: 2,
    createdByName: "Nguyễn Văn Kho 1 (manager1)",
    createdByEmail: "manager1@gmail.com",
    confirmedBy: null,
    confirmedByName: null,
    createdAt: "2026-11-25T03:00:00Z",
    confirmedAt: null,
    details: [
      {
        receiptDetailId: 2,
        variantId: 102,
        sku: "MS-MX3S-BLK",
        barcode: "8938501204898",
        productName: "Chuột công thái học Logitech MX Master 3S",
        locationId: 2,
        locationCode: "A-01-02",
        quantity: 25,
        unitCost: 1620000,
      },
      {
        receiptDetailId: 3,
        variantId: 105,
        sku: "PB-20000-65W",
        barcode: "8938501204928",
        productName: "Pin sạc dự phòng GaN 20.000mAh 65W PD",
        locationId: 6,
        locationCode: "H-01-01",
        quantity: 30,
        unitCost: 890000,
      },
    ],
  },
  {
    receiptId: 203,
    receiptCode: "PN-261125-003",
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    senderSellerId: 2,
    senderSellerName: "BioDerma Pure Official",
    returnRequestId: null,
    receiptType: "SellerInbound",
    status: "Draft",
    note: "Lô tinh chất bảo quản lạnh 2–8°C — do manager2 khởi tạo",
    createdBy: 3,
    createdByName: "Trần Văn Kho 2 (manager2)",
    createdByEmail: "manager2@gmail.com",
    confirmedBy: null,
    confirmedByName: null,
    createdAt: "2026-11-25T04:10:00Z",
    confirmedAt: null,
    details: [
      {
        receiptDetailId: 4,
        variantId: 104,
        sku: "SR-VITC-30ML",
        barcode: "8938501204911",
        productName: "Tinh chất Vitamin C 15% bảo quản lạnh",
        locationId: 4,
        locationCode: "C-01-01",
        quantity: 40,
        unitCost: 420000,
      },
    ],
  },
];

const INITIAL_SHIPMENTS: ShipmentRecordDto[] = [
  {
    shipmentId: 401,
    sellerOrderId: 1003,
    sellerOrderCode: "SO-261124-018",
    orderCode: "ORD-261124-018",
    carrierId: 1,
    carrierCode: "GHN",
    carrierName: "Giao Hàng Nhanh",
    trackingNumber: "GHN2611249901",
    shippingStatus: "InTransit",
    codAmount: 0,
    recipientName: "Phạm Minh Đức",
    destinationProvince: "TP. Hải Phòng",
    failedReason: null,
    shippedAt: "2026-11-24T10:30:00Z",
    deliveredAt: null,
    createdAt: "2026-11-24T09:20:00Z",
  },
  {
    shipmentId: 402,
    sellerOrderId: 1004,
    sellerOrderCode: "SO-261121-009",
    orderCode: "ORD-261121-009",
    carrierId: 3,
    carrierCode: "VTP",
    carrierName: "Viettel Post",
    trackingNumber: "VTP2611217742",
    shippingStatus: "Delivered",
    codAmount: 0,
    recipientName: "Lê Hoàng Khách",
    destinationProvince: "TP. Hà Nội",
    failedReason: null,
    shippedAt: "2026-11-21T08:00:00Z",
    deliveredAt: "2026-11-22T07:45:00Z",
    createdAt: "2026-11-21T06:15:00Z",
  },
];

const INITIAL_SELLER_ORDERS: SellerOrderRecordDto[] = [
  {
    sellerOrderId: 1001,
    sellerOrderCode: "SO-261125-001",
    orderId: 901,
    orderCode: "ORD-261125-001",
    sellerId: 1,
    sellerBusinessName: "Công ty TNHH Thiết Bị Số Modu+",
    shopId: 1,
    shopName: "Modu Official Flagship Store",
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    customerId: 5,
    customerName: "Lê Hoàng Khách",
    recipientName: "Lê Hoàng Khách",
    recipientPhone: "0988123456",
    shippingAddress: "Số 18 Hoàng Quốc Việt, P. Nghĩa Đô, Q. Cầu Giấy, TP. Hà Nội",
    paymentMethod: "BankTransfer",
    paymentStatus: "Paid",
    subtotal: 4640000,
    status: "Pending",
    cancelReason: null,
    cancelledAt: null,
    createdAt: "2026-11-25T02:10:00Z",
    updatedAt: null,
    items: [
      {
        orderItemId: 1,
        sellerOrderId: 1001,
        variantId: 101,
        productNameSnapshot: "Bàn phím cơ không dây Keychron K2 Pro",
        skuSnapshot: "KB-K2PRO-RED",
        variantName: "Red Switch · Nhôm CNC",
        unitPrice: 2490000,
        quantity: 1,
        lineTotal: 2490000,
      },
      {
        orderItemId: 2,
        sellerOrderId: 1001,
        variantId: 102,
        productNameSnapshot: "Chuột công thái học Logitech MX Master 3S",
        skuSnapshot: "MS-MX3S-BLK",
        variantName: "Đen Graphite",
        unitPrice: 2150000,
        quantity: 1,
        lineTotal: 2150000,
      },
    ],
    shipment: null,
    statusHistory: [
      {
        id: "h-1001-1",
        status: "Pending",
        domain: "sellerOrder",
        actorName: "Hệ thống (Checkout)",
        changedAt: "2026-11-25T02:10:00Z",
        note: "Khách đã thanh toán chuyển khoản; hệ thống đã giữ chỗ tồn tại Kho sàn Hà Nội.",
      },
    ],
  },
  {
    sellerOrderId: 1002,
    sellerOrderCode: "SO-261125-002",
    orderId: 902,
    orderCode: "ORD-261125-002",
    sellerId: 1,
    sellerBusinessName: "Công ty TNHH Thiết Bị Số Modu+",
    shopId: 1,
    shopName: "Modu Official Flagship Store",
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    customerId: 6,
    customerName: "Nguyễn Thị Lan Anh",
    recipientName: "Nguyễn Thị Lan Anh",
    recipientPhone: "0912334455",
    shippingAddress: "Tòa nhà Keangnam, Phạm Hùng, Q. Nam Từ Liêm, TP. Hà Nội",
    paymentMethod: "COD",
    paymentStatus: "Pending",
    subtotal: 2490000,
    status: "Preparing",
    cancelReason: null,
    cancelledAt: null,
    createdAt: "2026-11-25T01:05:00Z",
    updatedAt: "2026-11-25T01:40:00Z",
    items: [
      {
        orderItemId: 3,
        sellerOrderId: 1002,
        variantId: 101,
        productNameSnapshot: "Bàn phím cơ không dây Keychron K2 Pro",
        skuSnapshot: "KB-K2PRO-RED",
        variantName: "Red Switch · Nhôm CNC",
        unitPrice: 2490000,
        quantity: 1,
        lineTotal: 2490000,
      },
    ],
    shipment: null,
    statusHistory: [
      {
        id: "h-1002-1",
        status: "Pending",
        domain: "sellerOrder",
        actorName: "Hệ thống (Checkout)",
        changedAt: "2026-11-25T01:05:00Z",
      },
      {
        id: "h-1002-2",
        status: "Confirmed",
        domain: "sellerOrder",
        actorName: "Trần Thị Shop (Seller)",
        changedAt: "2026-11-25T01:22:00Z",
        note: "Người bán đã xác nhận đơn con.",
      },
      {
        id: "h-1002-3",
        status: "Preparing",
        domain: "sellerOrder",
        actorName: "Nguyễn Văn Kho 1 (WMS)",
        changedAt: "2026-11-25T01:40:00Z",
        note: "Kho sàn Hà Nội đang soạn hàng theo phiếu xuất PX-261125-001.",
      },
    ],
  },
  {
    sellerOrderId: 1003,
    sellerOrderCode: "SO-261124-018",
    orderId: 903,
    orderCode: "ORD-261124-018",
    sellerId: 1,
    sellerBusinessName: "Công ty TNHH Thiết Bị Số Modu+",
    shopId: 1,
    shopName: "Modu Official Flagship Store",
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    customerId: 7,
    customerName: "Phạm Minh Đức",
    recipientName: "Phạm Minh Đức",
    recipientPhone: "0977889900",
    shippingAddress: "Số 45 Lạch Tray, Q. Ngô Quyền, TP. Hải Phòng",
    paymentMethod: "EWallet",
    paymentStatus: "Paid",
    subtotal: 4650000,
    status: "Shipped",
    cancelReason: null,
    cancelledAt: null,
    createdAt: "2026-11-24T04:00:00Z",
    updatedAt: "2026-11-24T10:30:00Z",
    items: [
      {
        orderItemId: 4,
        sellerOrderId: 1003,
        variantId: 103,
        productNameSnapshot: "Máy pha cà phê Espresso bán tự động 20 Bar",
        skuSnapshot: "CF-ESP-20BAR",
        variantName: "Thép không gỉ Bạc",
        unitPrice: 4650000,
        quantity: 1,
        lineTotal: 4650000,
      },
    ],
    shipment: INITIAL_SHIPMENTS[0],
    statusHistory: [
      { id: "h-1003-1", status: "Pending", domain: "sellerOrder", actorName: "Hệ thống", changedAt: "2026-11-24T04:00:00Z" },
      { id: "h-1003-2", status: "Confirmed", domain: "sellerOrder", actorName: "Trần Thị Shop", changedAt: "2026-11-24T04:45:00Z" },
      { id: "h-1003-3", status: "ReadyToShip", domain: "sellerOrder", actorName: "Nguyễn Văn Kho 1", changedAt: "2026-11-24T09:15:00Z" },
      { id: "h-1003-4", status: "Shipped", domain: "sellerOrder", actorName: "Giao Hàng Nhanh (GHN)", changedAt: "2026-11-24T10:30:00Z" },
    ],
  },
  {
    sellerOrderId: 1004,
    sellerOrderCode: "SO-261121-009",
    orderId: 904,
    orderCode: "ORD-261121-009",
    sellerId: 1,
    sellerBusinessName: "Công ty TNHH Thiết Bị Số Modu+",
    shopId: 1,
    shopName: "Modu Official Flagship Store",
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    customerId: 5,
    customerName: "Lê Hoàng Khách",
    recipientName: "Lê Hoàng Khách",
    recipientPhone: "0988123456",
    shippingAddress: "Số 18 Hoàng Quốc Việt, P. Nghĩa Đô, Q. Cầu Giấy, TP. Hà Nội",
    paymentMethod: "CreditCard",
    paymentStatus: "Paid",
    subtotal: 5940000,
    status: "Delivered",
    cancelReason: null,
    cancelledAt: null,
    createdAt: "2026-11-21T02:00:00Z",
    updatedAt: "2026-11-22T07:45:00Z",
    items: [
      {
        orderItemId: 5,
        sellerOrderId: 1004,
        variantId: 103,
        productNameSnapshot: "Máy pha cà phê Espresso bán tự động 20 Bar",
        skuSnapshot: "CF-ESP-20BAR",
        variantName: "Thép không gỉ Bạc",
        unitPrice: 4650000,
        quantity: 1,
        lineTotal: 4650000,
      },
      {
        orderItemId: 6,
        sellerOrderId: 1004,
        variantId: 105,
        productNameSnapshot: "Pin sạc dự phòng GaN 20.000mAh 65W PD",
        skuSnapshot: "PB-20000-65W",
        variantName: "Xám Titan",
        unitPrice: 1290000,
        quantity: 1,
        lineTotal: 1290000,
      },
    ],
    shipment: INITIAL_SHIPMENTS[1],
    statusHistory: [
      { id: "h-1004-1", status: "Pending", domain: "sellerOrder", actorName: "Hệ thống", changedAt: "2026-11-21T02:00:00Z" },
      { id: "h-1004-2", status: "Confirmed", domain: "sellerOrder", actorName: "Trần Thị Shop", changedAt: "2026-11-21T02:30:00Z" },
      { id: "h-1004-3", status: "Shipped", domain: "sellerOrder", actorName: "Viettel Post (VTP)", changedAt: "2026-11-21T08:00:00Z" },
      { id: "h-1004-4", status: "Delivered", domain: "sellerOrder", actorName: "Viettel Post (VTP)", changedAt: "2026-11-22T07:45:00Z" },
    ],
  },
  {
    sellerOrderId: 1005,
    sellerOrderCode: "SO-261125-003",
    orderId: 901,
    orderCode: "ORD-261125-001",
    sellerId: 2,
    sellerBusinessName: "BioDerma Pure Official",
    shopId: 2,
    shopName: "BioDerma Pure Official",
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    customerId: 5,
    customerName: "Lê Hoàng Khách",
    recipientName: "Lê Hoàng Khách",
    recipientPhone: "0988123456",
    shippingAddress: "Số 18 Hoàng Quốc Việt, P. Nghĩa Đô, Q. Cầu Giấy, TP. Hà Nội",
    paymentMethod: "BankTransfer",
    paymentStatus: "Paid",
    subtotal: 1360000,
    status: "ReadyToShip",
    cancelReason: null,
    cancelledAt: null,
    createdAt: "2026-11-25T02:10:00Z",
    updatedAt: "2026-11-25T04:00:00Z",
    items: [
      {
        orderItemId: 7,
        sellerOrderId: 1005,
        variantId: 104,
        productNameSnapshot: "Tinh chất Vitamin C 15% bảo quản lạnh",
        skuSnapshot: "SR-VITC-30ML",
        variantName: "Chai 30ml",
        unitPrice: 680000,
        quantity: 2,
        lineTotal: 1360000,
      },
    ],
    shipment: null,
    statusHistory: [
      { id: "h-1005-1", status: "Pending", domain: "sellerOrder", actorName: "Hệ thống", changedAt: "2026-11-25T02:10:00Z" },
      { id: "h-1005-2", status: "Confirmed", domain: "sellerOrder", actorName: "BioDerma Pure Official", changedAt: "2026-11-25T02:25:00Z" },
      { id: "h-1005-3", status: "ReadyToShip", domain: "sellerOrder", actorName: "Kho sàn Hà Nội", changedAt: "2026-11-25T04:00:00Z", note: "Đã đóng gói chờ tạo vận đơn W8." },
    ],
  },
];

const INITIAL_MASTER_ORDERS: MasterOrderRecordDto[] = [
  {
    orderId: 901,
    orderCode: "ORD-261125-001",
    customerId: 5,
    customerName: "Lê Hoàng Khách",
    recipientName: "Lê Hoàng Khách",
    recipientPhone: "0988123456",
    shippingProvince: "TP. Hà Nội",
    shippingAddress: "Số 18 Hoàng Quốc Việt, P. Nghĩa Đô, Q. Cầu Giấy, TP. Hà Nội",
    subtotal: 6000000,
    shippingFee: 35000,
    discountAmount: 100000,
    totalAmount: 5935000,
    orderStatus: "Processing",
    paymentId: 801,
    paymentMethod: "BankTransfer",
    paymentStatus: "Paid",
    paidAt: "2026-11-25T02:11:00Z",
    transactionCode: "VCB-261125-991042",
    cancelReason: null,
    note: "Đơn đa người bán (2 gian hàng: Modu Official & BioDerma Pure)",
    createdAt: "2026-11-25T02:10:00Z",
    sellerOrderIds: [1001, 1005],
    statusHistory: [
      { id: "mo-901-1", status: "PendingPayment", domain: "order", actorName: "Lê Hoàng Khách", changedAt: "2026-11-25T02:10:00Z" },
      { id: "mo-901-2", status: "Confirmed", domain: "order", actorName: "Cổng thanh toán", changedAt: "2026-11-25T02:11:00Z" },
      { id: "mo-901-3", status: "Processing", domain: "order", actorName: "Hệ thống", changedAt: "2026-11-25T02:25:00Z" },
    ],
  },
  {
    orderId: 902,
    orderCode: "ORD-261125-002",
    customerId: 6,
    customerName: "Nguyễn Thị Lan Anh",
    recipientName: "Nguyễn Thị Lan Anh",
    recipientPhone: "0912334455",
    shippingProvince: "TP. Hà Nội",
    shippingAddress: "Tòa nhà Keangnam, Phạm Hùng, Q. Nam Từ Liêm, TP. Hà Nội",
    subtotal: 2490000,
    shippingFee: 25000,
    discountAmount: 0,
    totalAmount: 2515000,
    orderStatus: "Processing",
    paymentId: 802,
    paymentMethod: "COD",
    paymentStatus: "Pending",
    paidAt: null,
    transactionCode: null,
    cancelReason: null,
    note: "Giao giờ hành chính",
    createdAt: "2026-11-25T01:05:00Z",
    sellerOrderIds: [1002],
    statusHistory: [
      { id: "mo-902-1", status: "Confirmed", domain: "order", actorName: "Hệ thống (COD)", changedAt: "2026-11-25T01:05:00Z" },
      { id: "mo-902-2", status: "Processing", domain: "order", actorName: "Kho sàn Hà Nội", changedAt: "2026-11-25T01:40:00Z" },
    ],
  },
  {
    orderId: 903,
    orderCode: "ORD-261124-018",
    customerId: 7,
    customerName: "Phạm Minh Đức",
    recipientName: "Phạm Minh Đức",
    recipientPhone: "0977889900",
    shippingProvince: "TP. Hải Phòng",
    shippingAddress: "Số 45 Lạch Tray, Q. Ngô Quyền, TP. Hải Phòng",
    subtotal: 4650000,
    shippingFee: 45000,
    discountAmount: 50000,
    totalAmount: 4645000,
    orderStatus: "Shipped",
    paymentId: 803,
    paymentMethod: "EWallet",
    paymentStatus: "Paid",
    paidAt: "2026-11-24T04:01:00Z",
    transactionCode: "EW-261124-441209",
    cancelReason: null,
    note: null,
    createdAt: "2026-11-24T04:00:00Z",
    sellerOrderIds: [1003],
    statusHistory: [
      { id: "mo-903-1", status: "Confirmed", domain: "order", actorName: "Cổng thanh toán", changedAt: "2026-11-24T04:01:00Z" },
      { id: "mo-903-2", status: "Shipped", domain: "order", actorName: "Giao Hàng Nhanh (GHN)", changedAt: "2026-11-24T10:30:00Z" },
    ],
  },
  {
    orderId: 904,
    orderCode: "ORD-261121-009",
    customerId: 5,
    customerName: "Lê Hoàng Khách",
    recipientName: "Lê Hoàng Khách",
    recipientPhone: "0988123456",
    shippingProvince: "TP. Hà Nội",
    shippingAddress: "Số 18 Hoàng Quốc Việt, P. Nghĩa Đô, Q. Cầu Giấy, TP. Hà Nội",
    subtotal: 5940000,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 5940000,
    orderStatus: "Completed",
    paymentId: 804,
    paymentMethod: "CreditCard",
    paymentStatus: "Paid",
    paidAt: "2026-11-21T02:02:00Z",
    transactionCode: "VISA-261121-880112",
    cancelReason: null,
    note: null,
    createdAt: "2026-11-21T02:00:00Z",
    sellerOrderIds: [1004],
    statusHistory: [
      { id: "mo-904-1", status: "Confirmed", domain: "order", actorName: "Cổng thanh toán", changedAt: "2026-11-21T02:02:00Z" },
      { id: "mo-904-2", status: "Completed", domain: "order", actorName: "Viettel Post (VTP)", changedAt: "2026-11-22T07:45:00Z" },
    ],
  },
];

const INITIAL_ISSUES: InventoryIssueRecordDto[] = [
  {
    issueId: 301,
    issueCode: "PX-261125-001",
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    sellerOrderId: 1002,
    sellerOrderCode: "SO-261125-002",
    orderCode: "ORD-261125-002",
    shopName: "Modu Official Flagship Store",
    customerName: "Nguyễn Thị Lan Anh",
    issueType: "OrderFulfillment",
    status: "Picking",
    note: "Đơn COD cần hoàn tất đóng gói trước 17:00",
    createdBy: 2,
    createdByName: "Nguyễn Văn Kho 1 (manager1)",
    createdByEmail: "manager1@gmail.com",
    approvedBy: 3,
    approvedByName: "Trần Văn Kho 2 (manager2)",
    dispatchedBy: null,
    dispatchedByName: null,
    createdAt: "2026-11-25T01:25:00Z",
    approvedAt: "2026-11-25T01:32:00Z",
    dispatchedAt: null,
    details: [
      {
        issueDetailId: 1,
        variantId: 101,
        sku: "KB-K2PRO-RED",
        barcode: "8938501204881",
        productName: "Bàn phím cơ không dây Keychron K2 Pro",
        locationId: 1,
        locationCode: "A-01-01",
        storageType: "Standard",
        quantity: 2,
        pickedQuantity: 1,
      },
      {
        issueDetailId: 2,
        variantId: 102,
        sku: "MS-MX3S-BLK",
        barcode: "8938501204898",
        productName: "Chuột công thái học Logitech MX Master 3S",
        locationId: 2,
        locationCode: "A-01-02",
        storageType: "Standard",
        quantity: 1,
        pickedQuantity: 0,
      },
    ],
    statusHistory: [
      { id: "iss-301-1", status: "Draft", domain: "issue", actorName: "Hệ thống", changedAt: "2026-11-25T01:25:00Z" },
      { id: "iss-301-2", status: "Approved", domain: "issue", actorName: "Trần Văn Kho 2 (manager2)", changedAt: "2026-11-25T01:32:00Z" },
      { id: "iss-301-3", status: "Picking", domain: "issue", actorName: "Nguyễn Văn Kho 1 (manager1)", changedAt: "2026-11-25T01:40:00Z" },
    ],
  },
  {
    issueId: 302,
    issueCode: "PX-261125-002",
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    sellerOrderId: 1005,
    sellerOrderCode: "SO-261125-003",
    orderCode: "ORD-261125-001",
    shopName: "BioDerma Pure Official",
    customerName: "Lê Hoàng Khách",
    issueType: "OrderFulfillment",
    status: "Packed",
    note: "Đóng gói kèm túi gel giữ lạnh 2–8°C",
    createdBy: 2,
    createdByName: "Nguyễn Văn Kho 1 (manager1)",
    createdByEmail: "manager1@gmail.com",
    approvedBy: 3,
    approvedByName: "Trần Văn Kho 2 (manager2)",
    dispatchedBy: null,
    dispatchedByName: null,
    createdAt: "2026-11-25T02:30:00Z",
    approvedAt: "2026-11-25T02:40:00Z",
    dispatchedAt: null,
    packageBoxType: "Thùng xốp giữ nhiệt 5 lớp (Kho lạnh)",
    packageWeightGrams: 680,
    packageSealCode: "SEAL-HN-88201",
    details: [
      {
        issueDetailId: 3,
        variantId: 104,
        sku: "SR-VITC-30ML",
        barcode: "8938501204911",
        productName: "Tinh chất Vitamin C 15% bảo quản lạnh",
        locationId: 4,
        locationCode: "C-01-01",
        storageType: "Cold",
        quantity: 2,
        pickedQuantity: 2,
      },
    ],
    statusHistory: [
      { id: "iss-302-1", status: "Draft", domain: "issue", actorName: "Hệ thống", changedAt: "2026-11-25T02:30:00Z" },
      { id: "iss-302-2", status: "Approved", domain: "issue", actorName: "Trần Văn Kho 2", changedAt: "2026-11-25T02:40:00Z" },
      { id: "iss-302-3", status: "Picking", domain: "issue", actorName: "Nguyễn Văn Kho 1", changedAt: "2026-11-25T03:00:00Z" },
      { id: "iss-302-4", status: "Packed", domain: "issue", actorName: "Nguyễn Văn Kho 1", changedAt: "2026-11-25T03:45:00Z" },
    ],
  },
  {
    issueId: 303,
    issueCode: "PX-261124-018",
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    sellerOrderId: 1003,
    sellerOrderCode: "SO-261124-018",
    orderCode: "ORD-261124-018",
    shopName: "Modu Official Flagship Store",
    customerName: "Phạm Minh Đức",
    issueType: "OrderFulfillment",
    status: "Dispatched",
    note: "Đóng gói chống sốc hàng dễ vỡ và đã bàn giao Giao Hàng Nhanh (GHN2611249901)",
    createdBy: 2,
    createdByName: "Nguyễn Văn Kho 1 (manager1)",
    createdByEmail: "manager1@gmail.com",
    approvedBy: 3,
    approvedByName: "Trần Văn Kho 2 (manager2)",
    dispatchedBy: 2,
    dispatchedByName: "Nguyễn Văn Kho 1 (manager1)",
    createdAt: "2026-11-24T05:00:00Z",
    approvedAt: "2026-11-24T05:30:00Z",
    dispatchedAt: "2026-11-24T09:15:00Z",
    packageBoxType: "Thùng carton 5 lớp chống sốc (Hàng dễ vỡ)",
    packageWeightGrams: 5400,
    packageSealCode: "SEAL-HN-87918",
    details: [
      {
        issueDetailId: 5,
        variantId: 103,
        sku: "CF-ESP-20BAR",
        barcode: "8938501204904",
        productName: "Máy pha cà phê Espresso bán tự động 20 Bar",
        locationId: 5,
        locationCode: "F-01-01",
        storageType: "Fragile",
        quantity: 1,
        pickedQuantity: 1,
      },
    ],
    statusHistory: [
      { id: "iss-303-1", status: "Draft", domain: "issue", actorName: "Hệ thống", changedAt: "2026-11-24T05:00:00Z" },
      { id: "iss-303-2", status: "Approved", domain: "issue", actorName: "Trần Văn Kho 2 (manager2)", changedAt: "2026-11-24T05:30:00Z" },
      { id: "iss-303-3", status: "Picking", domain: "issue", actorName: "Nguyễn Văn Kho 1 (manager1)", changedAt: "2026-11-24T06:10:00Z" },
      { id: "iss-303-4", status: "Packed", domain: "issue", actorName: "Nguyễn Văn Kho 1 (manager1)", changedAt: "2026-11-24T08:40:00Z" },
      { id: "iss-303-5", status: "Dispatched", domain: "issue", actorName: "Nguyễn Văn Kho 1 (manager1)", changedAt: "2026-11-24T09:15:00Z", note: "Đã xuất kho, trừ tồn thực và bàn giao vận đơn GHN2611249901." },
    ],
  },
  {
    issueId: 304,
    issueCode: "PX-261125-004",
    warehouseId: 1,
    warehouseName: "Kho sàn Hà Nội",
    sellerOrderId: null,
    sellerOrderCode: null,
    orderCode: null,
    shopName: "Modu Official Flagship Store",
    customerName: null,
    issueType: "Disposal",
    status: "Draft",
    note: "Xuất tiêu hủy 1 mẫu hỏng vỡ vỏ — bắt buộc Quản lý kho khác duyệt tách quyền",
    createdBy: 2,
    createdByName: "Nguyễn Văn Kho 1 (manager1)",
    createdByEmail: "manager1@gmail.com",
    approvedBy: null,
    approvedByName: null,
    dispatchedBy: null,
    dispatchedByName: null,
    createdAt: "2026-11-25T04:15:00Z",
    approvedAt: null,
    dispatchedAt: null,
    details: [
      {
        issueDetailId: 4,
        variantId: 103,
        sku: "CF-ESP-20BAR",
        barcode: "8938501204904",
        productName: "Máy pha cà phê Espresso bán tự động 20 Bar",
        locationId: 5,
        locationCode: "F-01-01",
        storageType: "Fragile",
        quantity: 1,
        pickedQuantity: 0,
      },
    ],
    statusHistory: [
      { id: "iss-304-1", status: "Draft", domain: "issue", actorName: "Nguyễn Văn Kho 1 (manager1)", changedAt: "2026-11-25T04:15:00Z" },
    ],
  },
];

const INITIAL_RETURNS: ReturnRequestRecordDto[] = [
  {
    returnRequestId: 601,
    requestCode: "RMA-261125-001",
    sellerOrderId: 1004,
    sellerOrderCode: "SO-261121-009",
    orderId: 904,
    orderCode: "ORD-261121-009",
    sellerId: 1,
    shopName: "Modu Official Flagship Store",
    customerId: 5,
    customerName: "Lê Hoàng Khách",
    reason: "Máy pha cà phê bị rò nước nhẹ ở van áp suất khi thử lần đầu",
    status: "Requested",
    reviewedBy: null,
    reviewedByName: null,
    reviewedAt: null,
    rejectReason: null,
    evidenceFiles: ["video_kiem_tra_van_ap_suat.mp4", "anh_tem_niem_phong_01.jpg"],
    createdAt: "2026-11-25T01:30:00Z",
    updatedAt: null,
    items: [
      {
        returnItemId: 701,
        orderItemId: 5,
        variantId: 103,
        sku: "CF-ESP-20BAR",
        productName: "Máy pha cà phê Espresso bán tự động 20 Bar",
        quantity: 1,
        unitPrice: 4650000,
        inspectionResult: "Pending",
        inspectionNote: null,
        inspectedBy: null,
        inspectedByName: null,
        inspectedAt: null,
        restockLocationId: null,
        restockLocationCode: null,
      },
    ],
  },
  {
    returnRequestId: 602,
    requestCode: "RMA-261124-002",
    sellerOrderId: 1004,
    sellerOrderCode: "SO-261121-009",
    orderId: 904,
    orderCode: "ORD-261121-009",
    sellerId: 1,
    shopName: "Modu Official Flagship Store",
    customerId: 5,
    customerName: "Lê Hoàng Khách",
    reason: "Đặt nhầm công suất sạc, sản phẩm còn nguyên seal chưa bóc hộp",
    status: "Approved",
    reviewedBy: 4,
    reviewedByName: "Trần Thị Shop (Seller)",
    reviewedAt: "2026-11-24T06:00:00Z",
    rejectReason: null,
    evidenceFiles: ["anh_hop_nguyen_seal.jpg"],
    createdAt: "2026-11-24T04:10:00Z",
    updatedAt: "2026-11-24T06:00:00Z",
    items: [
      {
        returnItemId: 702,
        orderItemId: 6,
        variantId: 105,
        sku: "PB-20000-65W",
        productName: "Pin sạc dự phòng GaN 20.000mAh 65W PD",
        quantity: 1,
        unitPrice: 1290000,
        inspectionResult: "Pending",
        inspectionNote: null,
        inspectedBy: null,
        inspectedByName: null,
        inspectedAt: null,
        restockLocationId: null,
        restockLocationCode: null,
      },
    ],
  },
  {
    returnRequestId: 603,
    requestCode: "RMA-261123-003",
    sellerOrderId: 1003,
    sellerOrderCode: "SO-261124-018",
    orderId: 903,
    orderCode: "ORD-261124-018",
    sellerId: 1,
    shopName: "Modu Official Flagship Store",
    sellerSuspended: false,
    customerId: 7,
    customerName: "Phạm Minh Đức",
    reason: "Hộp móp méo trong quá trình vận chuyển, khách yêu cầu kiểm tra trước khi hoàn",
    status: "ItemsReceived",
    reviewedBy: 1,
    reviewedByName: "Quản trị viên Hệ thống",
    reviewedAt: "2026-11-23T08:00:00Z",
    rejectReason: null,
    evidenceFiles: ["bien_ban_dong_kiem_ghn.pdf"],
    createdAt: "2026-11-23T05:00:00Z",
    updatedAt: "2026-11-24T02:00:00Z",
    items: [
      {
        returnItemId: 703,
        orderItemId: 4,
        variantId: 103,
        sku: "CF-ESP-20BAR",
        productName: "Máy pha cà phê Espresso bán tự động 20 Bar",
        quantity: 1,
        unitPrice: 4650000,
        inspectionResult: "Pending",
        inspectionNote: null,
        inspectedBy: null,
        inspectedByName: null,
        inspectedAt: null,
        restockLocationId: null,
        restockLocationCode: null,
      },
    ],
  },
];

const INITIAL_REFUNDS: RefundRecordDto[] = [
  {
    refundId: 851,
    refundCode: "REF-261125-001",
    paymentId: 804,
    orderId: 904,
    orderCode: "ORD-261121-009",
    sellerOrderId: 1004,
    sellerOrderCode: "SO-261121-009",
    returnRequestId: 602,
    returnRequestCode: "RMA-261124-002",
    customerName: "Lê Hoàng Khách",
    shopName: "Modu Official Flagship Store",
    paymentMethod: "CreditCard",
    paidAmount: 5940000,
    previouslyRefundedAmount: 0,
    amount: 1290000,
    reason: "Hoàn tiền cho yêu cầu trả hàng RMA-261124-002 (Pin dự phòng nguyên seal)",
    refundStatus: "Pending",
    approvedBy: null,
    approvedByName: null,
    processedAt: null,
    rejectReason: null,
    createdAt: "2026-11-25T02:30:00Z",
  },
  {
    refundId: 852,
    refundCode: "REF-261125-002",
    paymentId: 801,
    orderId: 901,
    orderCode: "ORD-261125-001",
    sellerOrderId: 1001,
    sellerOrderCode: "SO-261125-001",
    returnRequestId: null,
    returnRequestCode: null,
    customerName: "Lê Hoàng Khách",
    shopName: "Modu Official Flagship Store",
    paymentMethod: "BankTransfer",
    paidAmount: 5935000,
    previouslyRefundedAmount: 0,
    amount: 5100000,
    reason: "Hoàn tiền giao dịch giá trị cao ≥ 5.000.000₫ (yêu cầu xác nhận kép Admin)",
    refundStatus: "Pending",
    approvedBy: null,
    approvedByName: null,
    processedAt: null,
    rejectReason: null,
    createdAt: "2026-11-25T03:15:00Z",
  },
  {
    refundId: 853,
    refundCode: "REF-261124-009",
    paymentId: 803,
    orderId: 903,
    orderCode: "ORD-261124-018",
    sellerOrderId: 1003,
    sellerOrderCode: "SO-261124-018",
    returnRequestId: 603,
    returnRequestCode: "RMA-261123-003",
    customerName: "Phạm Minh Đức",
    shopName: "Modu Official Flagship Store",
    paymentMethod: "EWallet",
    paidAmount: 4645000,
    previouslyRefundedAmount: 0,
    amount: 450000,
    reason: "Hỗ trợ hoàn một phần do móp vỏ hộp vận chuyển",
    refundStatus: "Approved",
    approvedBy: 1,
    approvedByName: "Quản trị viên Hệ thống",
    processedAt: null,
    rejectReason: null,
    createdAt: "2026-11-24T08:00:00Z",
  },
];

const INITIAL_ADMIN_USERS: AdminUserRecordDto[] = [
  {
    userId: 1,
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    email: "admin@gmail.com",
    phoneNumber: "0988123456",
    isActive: true,
    roles: ["Admin"],
    createdAt: "2026-10-01T01:00:00Z",
    updatedAt: null,
  },
  {
    userId: 2,
    username: "manager1",
    fullName: "Nguyễn Văn Kho 1 (Thủ kho 1)",
    email: "manager1@gmail.com",
    phoneNumber: "0988123456",
    isActive: true,
    roles: ["WarehouseManager"],
    createdAt: "2026-10-01T01:05:00Z",
    updatedAt: null,
  },
  {
    userId: 3,
    username: "manager2",
    fullName: "Trần Văn Kho 2 (Thủ kho 2)",
    email: "manager2@gmail.com",
    phoneNumber: "0988123456",
    isActive: true,
    roles: ["WarehouseManager"],
    createdAt: "2026-10-01T01:06:00Z",
    updatedAt: null,
  },
  {
    userId: 4,
    username: "seller",
    fullName: "Trần Thị Shop (Người bán)",
    email: "seller@gmail.com",
    phoneNumber: "0988123456",
    isActive: true,
    roles: ["Customer", "Seller"],
    createdAt: "2026-10-02T03:15:00Z",
    updatedAt: null,
  },
  {
    userId: 5,
    username: "customer",
    fullName: "Lê Hoàng Khách (Khách hàng)",
    email: "customer@gmail.com",
    phoneNumber: "0988123456",
    isActive: true,
    roles: ["Customer"],
    createdAt: "2026-10-05T07:20:00Z",
    updatedAt: null,
  },
];

/* ============================================================================
 * Store Implementation
 * ============================================================================ */

export const useOperationsStore = create<OperationsState>()(
  persist(
    (set, get) => ({
  warehouses: INITIAL_WAREHOUSES,
  locations: INITIAL_LOCATIONS,
  inventory: INITIAL_INVENTORY,
  stockMovements: INITIAL_STOCK_MOVEMENTS,
  receipts: INITIAL_RECEIPTS,
  issues: INITIAL_ISSUES,
  carriers: INITIAL_CARRIERS,
  shipments: INITIAL_SHIPMENTS,
  masterOrders: INITIAL_MASTER_ORDERS,
  sellerOrders: INITIAL_SELLER_ORDERS,
  returns: INITIAL_RETURNS,
  refunds: INITIAL_REFUNDS,
  adminUsers: INITIAL_ADMIN_USERS,

  confirmSellerOrder: (sellerOrderId, actorName) => {
    const target = get().sellerOrders.find((o) => o.sellerOrderId === sellerOrderId);
    if (!target) return { ok: false, message: "Không tìm thấy đơn con." };
    if (target.status !== "Pending") {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: "Chỉ có thể xác nhận đơn con ở trạng thái Chờ xác nhận (Pending).",
      };
    }

    const now = new Date().toISOString();
    set((state) => ({
      sellerOrders: state.sellerOrders.map((o) =>
        o.sellerOrderId !== sellerOrderId
          ? o
          : {
              ...o,
              status: "Confirmed",
              updatedAt: now,
              statusHistory: [
                ...o.statusHistory,
                {
                  id: `h-${Date.now()}`,
                  status: "Confirmed",
                  domain: "sellerOrder",
                  actorName,
                  changedAt: now,
                  note: "Người bán đã xác nhận đơn con — chuyển lệnh soạn hàng xuống Kho sàn Hà Nội.",
                },
              ],
            }
      ),
    }));

    return { ok: true, message: `Đã xác nhận đơn con ${target.sellerOrderCode} (Confirmed).` };
  },

  cancelSellerOrder: (sellerOrderId, reason, actorName) => {
    const target = get().sellerOrders.find((o) => o.sellerOrderId === sellerOrderId);
    if (!target) return { ok: false, message: "Không tìm thấy đơn con." };
    if (["Shipped", "Delivered", "Cancelled", "Returned"].includes(target.status)) {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: "Không thể hủy đơn con sau khi đã bàn giao vận chuyển (Shipped).",
      };
    }

    const now = new Date().toISOString();
    set((state) => ({
      sellerOrders: state.sellerOrders.map((o) =>
        o.sellerOrderId !== sellerOrderId
          ? o
          : {
              ...o,
              status: "Cancelled",
              cancelReason: reason,
              cancelledAt: now,
              updatedAt: now,
              statusHistory: [
                ...o.statusHistory,
                {
                  id: `h-${Date.now()}`,
                  status: "Cancelled",
                  domain: "sellerOrder",
                  actorName,
                  changedAt: now,
                  reason,
                },
              ],
            }
      ),
    }));

    return { ok: true, message: `Đã hủy đơn con ${target.sellerOrderCode} và nhả giữ chỗ tồn kho.` };
  },

  approveReturnRequest: (returnRequestId, actorId, actorName) => {
    const target = get().returns.find((r) => r.returnRequestId === returnRequestId);
    if (!target) return { ok: false, message: "Không tìm thấy yêu cầu trả hàng." };
    if (target.status !== "Requested") {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: "Chỉ được duyệt yêu cầu ở trạng thái Đã yêu cầu (Requested).",
      };
    }

    const now = new Date().toISOString();
    set((state) => ({
      returns: state.returns.map((r) =>
        r.returnRequestId !== returnRequestId
          ? r
          : {
              ...r,
              status: "Approved",
              reviewedBy: actorId,
              reviewedByName: actorName,
              reviewedAt: now,
              updatedAt: now,
            }
      ),
    }));

    return {
      ok: true,
      message: `Đã duyệt yêu cầu trả hàng ${target.requestCode}. Phiếu đã chuyển sang hàng đợi chờ nhận tại Kho (W9).`,
    };
  },

  rejectReturnRequest: (returnRequestId, reason, actorId, actorName) => {
    const target = get().returns.find((r) => r.returnRequestId === returnRequestId);
    if (!target) return { ok: false, message: "Không tìm thấy yêu cầu trả hàng." };
    if (target.status !== "Requested") {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: "Chỉ được từ chối yêu cầu ở trạng thái Đã yêu cầu (Requested).",
      };
    }

    const now = new Date().toISOString();
    set((state) => ({
      returns: state.returns.map((r) =>
        r.returnRequestId !== returnRequestId
          ? r
          : {
              ...r,
              status: "Rejected",
              reviewedBy: actorId,
              reviewedByName: actorName,
              reviewedAt: now,
              rejectReason: reason,
              updatedAt: now,
            }
      ),
    }));

    return { ok: true, message: `Đã từ chối yêu cầu trả hàng ${target.requestCode}.` };
  },

  addWarehouse: ({ warehouseName, address }) => {
    const trimmedName = warehouseName.trim();
    const trimmedAddr = address.trim();
    if (!trimmedName || !trimmedAddr) {
      return { ok: false, message: "Vui lòng nhập đầy đủ tên kho và địa chỉ." };
    }

    const nextId = Math.max(0, ...get().warehouses.map((w) => w.warehouseId)) + 1;
    const created: WarehouseRecordDto = {
      warehouseId: nextId,
      warehouseName: trimmedName,
      warehouseType: "Platform",
      ownerSellerId: null,
      address: trimmedAddr,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ warehouses: [...state.warehouses, created] }));
    return { ok: true, message: `Đã tạo kho sàn "${trimmedName}".` };
  },

  addLocation: ({ warehouseId, locationCode, storageType, isSellable }) => {
    const wh = get().warehouses.find((w) => w.warehouseId === warehouseId);
    if (!wh) return { ok: false, message: "Kho không tồn tại." };

    const code = locationCode.trim().toUpperCase();
    if (!code) return { ok: false, message: "Vui lòng nhập mã vị trí kệ." };

    const duplicate = get().locations.some(
      (l) => l.warehouseId === warehouseId && l.locationCode.toUpperCase() === code
    );
    if (duplicate) {
      return { ok: false, message: `Mã vị trí "${code}" đã tồn tại trong ${wh.warehouseName}.` };
    }

    // Ràng buộc CSDL CK_Locations_Sellable
    const enforcedSellable = NON_SELLABLE_STORAGE_TYPES.includes(storageType)
      ? false
      : isSellable;

    const nextId = Math.max(0, ...get().locations.map((l) => l.locationId)) + 1;
    const created: WarehouseLocationRecordDto = {
      locationId: nextId,
      warehouseId,
      warehouseName: wh.warehouseName,
      locationCode: code,
      storageType,
      isSellable: enforcedSellable,
      isActive: true,
    };

    set((state) => ({ locations: [...state.locations, created] }));
    return { ok: true, message: `Đã thêm vị trí kệ ${code} (${storageType}).` };
  },

  toggleLocationActive: (locationId) => {
    const target = get().locations.find((l) => l.locationId === locationId);
    if (!target) return { ok: false, message: "Không tìm thấy vị trí kệ." };

    set((state) => ({
      locations: state.locations.map((l) =>
        l.locationId === locationId ? { ...l, isActive: !l.isActive } : l
      ),
    }));

    return {
      ok: true,
      message: target.isActive
        ? `Đã tạm ngừng sử dụng vị trí ${target.locationCode}.`
        : `Đã kích hoạt lại vị trí ${target.locationCode}.`,
    };
  },

  createReceiptDraft: (input) => {
    const wh = get().warehouses.find((w) => w.warehouseId === input.warehouseId);
    if (!wh) return { ok: false, message: "Kho nhập không hợp lệ." };
    if (input.lines.length === 0) {
      return { ok: false, message: "Phiếu nhập phải có ít nhất 1 dòng hàng." };
    }

    const activeWhLocations = get().locations.filter(
      (l) => l.warehouseId === input.warehouseId && l.isActive
    );
    for (const line of input.lines) {
      if (!Number.isFinite(line.quantity) || line.quantity < 1) {
        return { ok: false, message: `Số lượng nhập cho SKU ${line.sku} phải lớn hơn hoặc bằng 1.` };
      }
      if (line.unitCost !== null && (!Number.isFinite(line.unitCost) || line.unitCost < 0)) {
        return { ok: false, message: `Đơn giá vốn cho SKU ${line.sku} không được là số âm.` };
      }
      const validLoc = activeWhLocations.find((l) => l.locationId === line.locationId);
      if (!validLoc) {
        return {
          ok: false,
          message: `Vị trí kệ nhận của SKU ${line.sku} không thuộc ${wh.warehouseName} hoặc đang ngừng dùng. Vui lòng tạo/chọn kệ hợp lệ trong W2.`,
        };
      }
    }

    const nextId = Math.max(200, ...get().receipts.map((r) => r.receiptId)) + 1;
    const code = `PN-261125-${String(nextId).slice(-3)}`;

    const details = input.lines.map((line, idx) => {
      const loc = activeWhLocations.find((l) => l.locationId === line.locationId)!;
      return {
        receiptDetailId: Date.now() + idx,
        variantId: line.variantId,
        sku: line.sku,
        barcode: line.barcode,
        productName: line.productName,
        locationId: loc.locationId,
        locationCode: loc.locationCode,
        quantity: line.quantity,
        unitCost: line.unitCost,
      };
    });

    const created: InventoryReceiptRecordDto = {
      receiptId: nextId,
      receiptCode: code,
      warehouseId: wh.warehouseId,
      warehouseName: wh.warehouseName,
      senderSellerId: input.receiptType === "SellerInbound" ? input.senderSellerId : null,
      senderSellerName: input.receiptType === "SellerInbound" ? input.senderSellerName : null,
      returnRequestId: null,
      receiptType: input.receiptType,
      status: "Draft",
      note: input.note.trim() || null,
      createdBy: input.createdBy,
      createdByName: input.createdByName,
      createdByEmail: input.createdByEmail ?? null,
      confirmedBy: null,
      confirmedByName: null,
      createdAt: new Date().toISOString(),
      confirmedAt: null,
      details,
    };

    set((state) => ({ receipts: [created, ...state.receipts] }));
    return {
      ok: true,
      receiptId: nextId,
      message: `Đã tạo phiếu nhập nháp ${code}. Cần Quản lý kho khác xác nhận (tách quyền).`,
    };
  },

  confirmReceipt: (receiptId, actorId, actorName, actorEmail) => {
    const receipt = get().receipts.find((r) => r.receiptId === receiptId);
    if (!receipt) return { ok: false, message: "Không tìm thấy phiếu nhập kho." };
    if (receipt.status !== "Draft") {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: "Chỉ phiếu nhập ở trạng thái Nháp (Draft) mới được xác nhận.",
      };
    }
    if (isSameWarehouseActor(receipt.createdBy, receipt.createdByEmail, actorId, actorEmail)) {
      return {
        ok: false,
        code: "SELF_APPROVAL_NOT_ALLOWED",
        message: "Người tạo phiếu không được tự xác nhận chính phiếu của mình (SELF_APPROVAL_NOT_ALLOWED).",
      };
    }

    const now = new Date().toISOString();
    const updatedInventory = [...get().inventory];
    const newMovements: StockMovementRecordDto[] = [];
    let nextMovId = Math.max(5000, ...get().stockMovements.map((m) => m.stockMovementId)) + 1;

    for (const line of receipt.details) {
      const existingIdx = updatedInventory.findIndex(
        (inv) => inv.locationId === line.locationId && inv.variantId === line.variantId
      );
      const loc = get().locations.find((l) => l.locationId === line.locationId);
      let onHandAfter = line.quantity;
      let reservedAfter = 0;

      if (existingIdx >= 0) {
        const curr = updatedInventory[existingIdx];
        onHandAfter = curr.quantityOnHand + line.quantity;
        reservedAfter = curr.quantityReserved;
        updatedInventory[existingIdx] = {
          ...curr,
          quantityOnHand: onHandAfter,
          availableQuantity: onHandAfter - reservedAfter,
          updatedAt: now,
        };
      } else {
        const ref = CATALOG_VARIANTS_REFERENCE.find((v) => v.variantId === line.variantId);
        updatedInventory.push({
          inventoryId: Math.max(0, ...updatedInventory.map((i) => i.inventoryId)) + 1,
          warehouseId: receipt.warehouseId,
          warehouseName: receipt.warehouseName,
          locationId: line.locationId,
          locationCode: line.locationCode,
          storageType: loc?.storageType ?? "Standard",
          isSellable: loc?.isSellable ?? true,
          variantId: line.variantId,
          sku: line.sku,
          barcode: line.barcode,
          productName: line.productName,
          variantName: ref?.variantName ?? "Tiêu chuẩn",
          sellerId: receipt.senderSellerId ?? ref?.sellerId ?? 1,
          shopId: ref?.shopId ?? 1,
          shopName: ref?.shopName ?? receipt.senderSellerName ?? "Modu Official Flagship Store",
          quantityOnHand: onHandAfter,
          quantityReserved: 0,
          availableQuantity: onHandAfter,
          lowStockThreshold: 10,
          updatedAt: now,
        });
      }

      newMovements.push({
        stockMovementId: nextMovId++,
        warehouseId: receipt.warehouseId,
        warehouseName: receipt.warehouseName,
        locationId: line.locationId,
        locationCode: line.locationCode,
        variantId: line.variantId,
        sku: line.sku,
        productName: line.productName,
        movementType: "Receipt",
        onHandChange: line.quantity,
        reservedChange: 0,
        onHandAfter,
        reservedAfter,
        referenceType: "Receipt",
        referenceId: receipt.receiptId,
        referenceCode: receipt.receiptCode,
        createdBy: actorId,
        createdByName: actorName,
        createdAt: now,
        note: `Xác nhận nhập kho từ phiếu ${receipt.receiptCode}`,
      });
    }

    set((state) => ({
      inventory: updatedInventory,
      stockMovements: [...newMovements, ...state.stockMovements],
      receipts: state.receipts.map((r) =>
        r.receiptId !== receiptId
          ? r
          : {
              ...r,
              status: "Confirmed",
              confirmedBy: actorId,
              confirmedByName: actorName,
              confirmedAt: now,
            }
      ),
    }));

    return {
      ok: true,
      message: `Đã xác nhận phiếu nhập ${receipt.receiptCode}, cộng tồn kho và ghi ${newMovements.length} bút toán vào Thẻ kho (W4).`,
    };
  },

  cancelReceipt: (receiptId, reason, actorName) => {
    const receipt = get().receipts.find((r) => r.receiptId === receiptId);
    if (!receipt) return { ok: false, message: "Không tìm thấy phiếu nhập kho." };
    if (receipt.status !== "Draft") {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: "Phiếu đã xác nhận (Confirmed) không thể hủy; chỉ được tạo phiếu điều chỉnh đảo.",
      };
    }

    set((state) => ({
      receipts: state.receipts.map((r) =>
        r.receiptId !== receiptId
          ? r
          : {
              ...r,
              status: "Cancelled",
              note: `${r.note ? `${r.note} · ` : ""}Hủy bởi ${actorName}: ${reason}`,
            }
      ),
    }));

    return { ok: true, message: `Đã hủy phiếu nhập nháp ${receipt.receiptCode}.` };
  },

  approveIssue: (issueId, actorId, actorName, actorEmail) => {
    const issue = get().issues.find((i) => i.issueId === issueId);
    if (!issue) return { ok: false, message: "Không tìm thấy phiếu xuất kho." };
    if (issue.status !== "Draft") {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: "Chỉ có thể duyệt phiếu xuất đang ở trạng thái Nháp (Draft).",
      };
    }
    if (isSameWarehouseActor(issue.createdBy, issue.createdByEmail, actorId, actorEmail)) {
      return {
        ok: false,
        code: "SELF_APPROVAL_NOT_ALLOWED",
        message: "Người tạo phiếu xuất không được tự duyệt phiếu của mình (SELF_APPROVAL_NOT_ALLOWED).",
      };
    }

    const now = new Date().toISOString();
    set((state) => ({
      issues: state.issues.map((i) =>
        i.issueId !== issueId
          ? i
          : {
              ...i,
              status: "Approved",
              approvedBy: actorId,
              approvedByName: actorName,
              approvedAt: now,
              statusHistory: [
                ...i.statusHistory,
                { id: `ih-${Date.now()}`, status: "Approved", domain: "issue", actorName, changedAt: now },
              ],
            }
      ),
    }));

    return { ok: true, message: `Đã duyệt phiếu xuất ${issue.issueCode} (Approved).` };
  },

  startPickingIssue: (issueId, actorName) => {
    const issue = get().issues.find((i) => i.issueId === issueId);
    if (!issue) return { ok: false, message: "Không tìm thấy phiếu xuất kho." };
    if (issue.status !== "Approved") {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: "Phiếu phải ở trạng thái Đã duyệt (Approved) mới có thể bắt đầu soạn hàng.",
      };
    }

    const now = new Date().toISOString();
    set((state) => ({
      issues: state.issues.map((i) =>
        i.issueId !== issueId
          ? i
          : {
              ...i,
              status: "Picking",
              statusHistory: [
                ...i.statusHistory,
                { id: `ih-${Date.now()}`, status: "Picking", domain: "issue", actorName, changedAt: now },
              ],
            }
      ),
    }));

    return { ok: true, message: `Phiếu ${issue.issueCode} đã chuyển sang Đang soạn hàng (Picking).` };
  },

  scanIssueBarcode: (issueId, code) => {
    const issue = get().issues.find((i) => i.issueId === issueId);
    if (!issue) return { ok: false, message: "Không tìm thấy phiếu xuất." };
    if (issue.status !== "Picking") {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: `Chỉ có thể quét soạn hàng khi phiếu xuất ở trạng thái Đang soạn (Picking). Trạng thái hiện tại: ${issue.status}.`,
      };
    }

    const normalized = code.trim().toLowerCase();
    if (!normalized) return { ok: false, message: "Vui lòng quét hoặc nhập mã vạch / SKU." };

    const line = issue.details.find(
      (d) =>
        d.barcode.toLowerCase() === normalized ||
        d.sku.toLowerCase() === normalized ||
        d.locationCode.toLowerCase() === normalized
    );

    if (!line) {
      return {
        ok: false,
        message: `Mã "${code.trim()}" không khớp bất kỳ dòng hàng nào trong phiếu ${issue.issueCode}.`,
      };
    }

    if (line.pickedQuantity >= line.quantity) {
      return {
        ok: false,
        message: `Cảnh báo dư hàng: SKU ${line.sku} tại kệ ${line.locationCode} đã lấy đủ (${line.pickedQuantity}/${line.quantity}).`,
      };
    }

    set((state) => ({
      issues: state.issues.map((i) =>
        i.issueId !== issueId
          ? i
          : {
              ...i,
              details: i.details.map((d) =>
                d.issueDetailId === line.issueDetailId
                  ? { ...d, pickedQuantity: d.pickedQuantity + 1 }
                  : d
              ),
            }
      ),
    }));

    return {
      ok: true,
      matchedSku: line.sku,
      message: `Quét hợp lệ: ${line.sku} (${line.pickedQuantity + 1}/${line.quantity}) tại kệ ${line.locationCode}.`,
    };
  },

  packIssue: (issueId, payload, actorName) => {
    const issue = get().issues.find((i) => i.issueId === issueId);
    if (!issue) return { ok: false, message: "Không tìm thấy phiếu xuất." };
    if (issue.status !== "Picking") {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: "Chỉ có thể đóng gói phiếu đang ở trạng thái Đang soạn (Picking).",
      };
    }

    const allPicked = issue.details.every((d) => d.pickedQuantity >= d.quantity);
    if (!allPicked) {
      return {
        ok: false,
        message: "Chưa lấy đủ số lượng tất cả các dòng hàng — không thể đóng gói.",
      };
    }

    const now = new Date().toISOString();
    set((state) => ({
      issues: state.issues.map((i) =>
        i.issueId !== issueId
          ? i
          : {
              ...i,
              status: "Packed",
              packageBoxType: payload.boxType,
              packageWeightGrams: payload.weightGrams,
              packageSealCode: payload.sealCode,
              statusHistory: [
                ...i.statusHistory,
                {
                  id: `ih-${Date.now()}`,
                  status: "Packed",
                  domain: "issue",
                  actorName,
                  changedAt: now,
                  note: `Đóng gói ${payload.boxType} · ${payload.weightGrams}g · Seal ${payload.sealCode}`,
                },
              ],
            }
      ),
    }));

    return {
      ok: true,
      message: `Đã hoàn tất đóng gói phiếu ${issue.issueCode} (Packed). Có thể thực hiện Xuất kho (Dispatch).`,
    };
  },

  dispatchIssue: (issueId, actorId, actorName) => {
    const issue = get().issues.find((i) => i.issueId === issueId);
    if (!issue) return { ok: false, message: "Không tìm thấy phiếu xuất." };
    if (issue.status !== "Packed") {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: "Phiếu phải ở trạng thái Đã đóng gói (Packed) mới được Xuất kho (Dispatched).",
      };
    }

    const now = new Date().toISOString();
    const updatedInventory = [...get().inventory];
    const newMovements: StockMovementRecordDto[] = [];
    let nextMovId = Math.max(5000, ...get().stockMovements.map((m) => m.stockMovementId)) + 1;

    for (const line of issue.details) {
      const idx = updatedInventory.findIndex(
        (inv) => inv.locationId === line.locationId && inv.variantId === line.variantId
      );
      if (idx >= 0) {
        const curr = updatedInventory[idx];
        const nextOnHand = Math.max(0, curr.quantityOnHand - line.quantity);
        const reservedDelta =
          issue.issueType === "OrderFulfillment"
            ? -Math.min(curr.quantityReserved, line.quantity)
            : 0;
        const nextReserved = Math.max(0, curr.quantityReserved + reservedDelta);

        updatedInventory[idx] = {
          ...curr,
          quantityOnHand: nextOnHand,
          quantityReserved: nextReserved,
          availableQuantity: nextOnHand - nextReserved,
          updatedAt: now,
        };

        newMovements.push({
          stockMovementId: nextMovId++,
          warehouseId: issue.warehouseId,
          warehouseName: issue.warehouseName,
          locationId: line.locationId,
          locationCode: line.locationCode,
          variantId: line.variantId,
          sku: line.sku,
          productName: line.productName,
          movementType: "Issue",
          onHandChange: -line.quantity,
          reservedChange: reservedDelta,
          onHandAfter: nextOnHand,
          reservedAfter: nextReserved,
          referenceType: "Issue",
          referenceId: issue.issueId,
          referenceCode: issue.issueCode,
          createdBy: actorId,
          createdByName: actorName,
          createdAt: now,
          note: `Xuất kho Dispatched phiếu ${issue.issueCode}`,
        });
      }
    }

    set((state) => ({
      inventory: updatedInventory,
      stockMovements: [...newMovements, ...state.stockMovements],
      issues: state.issues.map((i) =>
        i.issueId !== issueId
          ? i
          : {
              ...i,
              status: "Dispatched",
              dispatchedBy: actorId,
              dispatchedByName: actorName,
              dispatchedAt: now,
              statusHistory: [
                ...i.statusHistory,
                {
                  id: `ih-${Date.now()}`,
                  status: "Dispatched",
                  domain: "issue",
                  actorName,
                  changedAt: now,
                  note: "Đã xuất kho, trừ tồn thực và tiêu thụ giữ chỗ.",
                },
              ],
            }
      ),
      sellerOrders: issue.sellerOrderId
        ? state.sellerOrders.map((so) =>
            so.sellerOrderId === issue.sellerOrderId && so.status !== "Shipped" && so.status !== "Delivered"
              ? {
                  ...so,
                  status: "ReadyToShip",
                  updatedAt: now,
                  statusHistory: [
                    ...so.statusHistory,
                    {
                      id: `soh-${Date.now()}`,
                      status: "ReadyToShip",
                      domain: "sellerOrder",
                      actorName,
                      changedAt: now,
                      note: `Kho đã xuất phiếu ${issue.issueCode} — sẵn sàng bàn giao vận chuyển.`,
                    },
                  ],
                }
              : so
          )
        : state.sellerOrders,
    }));

    return {
      ok: true,
      message: `Đã xuất kho ${issue.issueCode} (Dispatched), trừ tồn thực & ghi Thẻ kho (W4).`,
    };
  },

  createShipment: ({ sellerOrderId, carrierId, trackingNumber, codAmount }) => {
    const so = get().sellerOrders.find((o) => o.sellerOrderId === sellerOrderId);
    const carrier = get().carriers.find((c) => c.carrierId === carrierId);
    const tracking = trackingNumber.trim().toUpperCase();

    if (!so || !carrier) return { ok: false, message: "Đơn con hoặc hãng vận chuyển không hợp lệ." };
    if (!tracking) return { ok: false, message: "Vui lòng nhập mã vận đơn." };

    const dup = get().shipments.some(
      (s) => s.carrierId === carrierId && s.trackingNumber.toUpperCase() === tracking
    );
    if (dup) {
      return { ok: false, message: `Mã vận đơn ${tracking} đã tồn tại cho hãng ${carrier.carrierCode}.` };
    }

    const now = new Date().toISOString();
    const nextId = Math.max(400, ...get().shipments.map((s) => s.shipmentId)) + 1;
    const created: ShipmentRecordDto = {
      shipmentId: nextId,
      sellerOrderId: so.sellerOrderId,
      sellerOrderCode: so.sellerOrderCode,
      orderCode: so.orderCode,
      carrierId: carrier.carrierId,
      carrierCode: carrier.carrierCode,
      carrierName: carrier.carrierName,
      trackingNumber: tracking,
      shippingStatus: "Preparing",
      codAmount: Math.max(0, codAmount),
      recipientName: so.recipientName,
      destinationProvince: so.shippingAddress.split(",").pop()?.trim() || "TP. Hà Nội",
      failedReason: null,
      shippedAt: null,
      deliveredAt: null,
      createdAt: now,
    };

    set((state) => ({
      shipments: [created, ...state.shipments],
      sellerOrders: state.sellerOrders.map((o) =>
        o.sellerOrderId === sellerOrderId ? { ...o, shipment: created } : o
      ),
    }));

    return { ok: true, message: `Đã tạo vận đơn ${tracking} (${carrier.carrierName}) cho ${so.sellerOrderCode}.` };
  },

  updateShipmentStatus: (shipmentId, nextStatus, failedReason) => {
    const target = get().shipments.find((s) => s.shipmentId === shipmentId);
    if (!target) return { ok: false, message: "Không tìm thấy vận đơn." };

    const now = new Date().toISOString();
    const updatedShipment: ShipmentRecordDto = {
      ...target,
      shippingStatus: nextStatus,
      shippedAt:
        nextStatus === "PickedUp" || nextStatus === "InTransit"
          ? target.shippedAt ?? now
          : target.shippedAt,
      deliveredAt: nextStatus === "Delivered" ? now : target.deliveredAt,
      failedReason: nextStatus === "Failed" ? failedReason?.trim() || "Khách không nghe máy" : target.failedReason,
    };

    set((state) => ({
      shipments: state.shipments.map((s) => (s.shipmentId === shipmentId ? updatedShipment : s)),
      sellerOrders: state.sellerOrders.map((so) => {
        if (so.sellerOrderId !== target.sellerOrderId) return so;
        let nextSoStatus = so.status;
        if (nextStatus === "PickedUp" || nextStatus === "InTransit") nextSoStatus = "Shipped";
        if (nextStatus === "Delivered") nextSoStatus = "Delivered";
        if (nextStatus === "Failed") nextSoStatus = "DeliveryFailed";
        return {
          ...so,
          status: nextSoStatus,
          shipment: updatedShipment,
          updatedAt: now,
        };
      }),
    }));

    return { ok: true, message: `Đã cập nhật vận đơn ${target.trackingNumber} sang trạng thái ${nextStatus}.` };
  },

  receiveReturnAtWarehouse: (returnRequestId, actorName) => {
    const target = get().returns.find((r) => r.returnRequestId === returnRequestId);
    if (!target) return { ok: false, message: "Không tìm thấy phiếu hàng trả về." };
    if (target.status !== "Approved") {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: "Chỉ nhận hàng trả với yêu cầu đã được duyệt (Approved).",
      };
    }

    const now = new Date().toISOString();
    set((state) => ({
      returns: state.returns.map((r) =>
        r.returnRequestId === returnRequestId
          ? { ...r, status: "ItemsReceived", updatedAt: now }
          : r
      ),
    }));

    return {
      ok: true,
      message: `${actorName} đã xác nhận nhận kiện ${target.requestCode} tại khu RETURNS-01. Vui lòng kiểm tra từng dòng hàng.`,
    };
  },

  inspectReturnItem: ({
    returnRequestId,
    returnItemId,
    result,
    restockLocationId,
    note,
    actorId,
    actorName,
  }) => {
    const target = get().returns.find((r) => r.returnRequestId === returnRequestId);
    if (!target) return { ok: false, message: "Không tìm thấy phiếu hàng trả về." };
    if (target.status !== "ItemsReceived") {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: "Phải xác nhận Đã nhận hàng (ItemsReceived) trước khi kiểm tra từng dòng.",
      };
    }

    const item = target.items.find((it) => it.returnItemId === returnItemId);
    const loc = get().locations.find((l) => l.locationId === restockLocationId);
    if (!item || !loc) return { ok: false, message: "Dòng hàng hoặc vị trí nhập lại không hợp lệ." };

    if (result === "Damaged" && loc.storageType !== "Damaged") {
      return {
        ok: false,
        message: "Hàng hỏng (Damaged) bắt buộc phải chuyển vào khu DAMAGED (Không bán được).",
      };
    }
    if (result === "Good" && !loc.isSellable) {
      return {
        ok: false,
        message: "Hàng tốt (Good) cần chọn vị trí kệ bán được (IsSellable = true).",
      };
    }

    const now = new Date().toISOString();
    const updatedItems = target.items.map((it) =>
      it.returnItemId !== returnItemId
        ? it
        : {
            ...it,
            inspectionResult: result,
            inspectionNote: note.trim() || null,
            inspectedBy: actorId,
            inspectedByName: actorName,
            inspectedAt: now,
            restockLocationId: loc.locationId,
            restockLocationCode: loc.locationCode,
          }
    );

    const allInspected = updatedItems.every((it) => it.inspectionResult !== "Pending");

    // Cộng tồn vào vị trí đích & ghi sổ cái ReturnIn
    const updatedInventory = [...get().inventory];
    const existingIdx = updatedInventory.findIndex(
      (inv) => inv.locationId === loc.locationId && inv.variantId === item.variantId
    );
    let onHandAfter = item.quantity;
    let reservedAfter = 0;

    if (existingIdx >= 0) {
      const curr = updatedInventory[existingIdx];
      onHandAfter = curr.quantityOnHand + item.quantity;
      reservedAfter = curr.quantityReserved;
      updatedInventory[existingIdx] = {
        ...curr,
        quantityOnHand: onHandAfter,
        availableQuantity: onHandAfter - reservedAfter,
        updatedAt: now,
      };
    } else {
      updatedInventory.push({
        inventoryId: Math.max(0, ...updatedInventory.map((i) => i.inventoryId)) + 1,
        warehouseId: loc.warehouseId,
        warehouseName: loc.warehouseName,
        locationId: loc.locationId,
        locationCode: loc.locationCode,
        storageType: loc.storageType,
        isSellable: loc.isSellable,
        variantId: item.variantId,
        sku: item.sku,
        barcode: CATALOG_VARIANTS_REFERENCE.find((v) => v.variantId === item.variantId)?.barcode ?? "",
        productName: item.productName,
        variantName: "Hàng hoàn kiểm định",
        sellerId: target.sellerId,
        shopId: target.sellerId,
        shopName: target.shopName,
        quantityOnHand: onHandAfter,
        quantityReserved: 0,
        availableQuantity: onHandAfter,
        lowStockThreshold: 5,
        updatedAt: now,
      });
    }

    const nextMovId = Math.max(5000, ...get().stockMovements.map((m) => m.stockMovementId)) + 1;
    const movement: StockMovementRecordDto = {
      stockMovementId: nextMovId,
      warehouseId: loc.warehouseId,
      warehouseName: loc.warehouseName,
      locationId: loc.locationId,
      locationCode: loc.locationCode,
      variantId: item.variantId,
      sku: item.sku,
      productName: item.productName,
      movementType: "ReturnIn",
      onHandChange: item.quantity,
      reservedChange: 0,
      onHandAfter,
      reservedAfter,
      referenceType: "ReturnRequest",
      referenceId: target.returnRequestId,
      referenceCode: target.requestCode,
      createdBy: actorId,
      createdByName: actorName,
      createdAt: now,
      note: `Kiểm hàng trả (${result}) → nhập vào kệ ${loc.locationCode}`,
    };

    set((state) => ({
      inventory: updatedInventory,
      stockMovements: [movement, ...state.stockMovements],
      returns: state.returns.map((r) =>
        r.returnRequestId !== returnRequestId
          ? r
          : {
              ...r,
              status: allInspected ? "Inspected" : "ItemsReceived",
              updatedAt: now,
              items: updatedItems,
            }
      ),
    }));

    return {
      ok: true,
      message: `Đã kiểm định SKU ${item.sku} (${result}) → chuyển về kệ ${loc.locationCode} và ghi Thẻ kho (W4).`,
    };
  },

  approveRefund: (refundId, actorId, actorName) => {
    const rf = get().refunds.find((r) => r.refundId === refundId);
    if (!rf) return { ok: false, message: "Không tìm thấy yêu cầu hoàn tiền." };
    if (rf.refundStatus !== "Pending") {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: "Chỉ có thể duyệt hoàn tiền ở trạng thái Chờ xử lý (Pending).",
      };
    }

    const maxRefundable = rf.paidAmount - rf.previouslyRefundedAmount;
    if (rf.amount > maxRefundable) {
      return {
        ok: false,
        code: "REFUND_EXCEEDS_PAID",
        message: "Số tiền hoàn vượt quá số tiền đã thanh toán còn lại (REFUND_EXCEEDS_PAID).",
      };
    }

    set((state) => ({
      refunds: state.refunds.map((r) =>
        r.refundId === refundId
          ? { ...r, refundStatus: "Approved", approvedBy: actorId, approvedByName: actorName }
          : r
      ),
    }));

    return { ok: true, message: `Đã duyệt lệnh hoàn tiền ${rf.refundCode}. Có thể tiến hành chuyển tiền & Hoàn thành.` };
  },

  rejectRefund: (refundId, reason, actorId, actorName) => {
    const rf = get().refunds.find((r) => r.refundId === refundId);
    if (!rf) return { ok: false, message: "Không tìm thấy yêu cầu hoàn tiền." };
    if (rf.refundStatus !== "Pending") {
      return { ok: false, code: "INVALID_STATUS_TRANSITION", message: "Chỉ từ chối được lệnh đang Pending." };
    }

    set((state) => ({
      refunds: state.refunds.map((r) =>
        r.refundId === refundId
          ? {
              ...r,
              refundStatus: "Rejected",
              approvedBy: actorId,
              approvedByName: actorName,
              rejectReason: reason,
            }
          : r
      ),
    }));

    return { ok: true, message: `Đã từ chối lệnh hoàn tiền ${rf.refundCode}.` };
  },

  completeRefund: (refundId, actorName) => {
    const rf = get().refunds.find((r) => r.refundId === refundId);
    if (!rf) return { ok: false, message: "Không tìm thấy yêu cầu hoàn tiền." };
    if (rf.refundStatus !== "Approved") {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: "Chỉ có thể hoàn thành lệnh hoàn tiền đã được duyệt (Approved).",
      };
    }

    const now = new Date().toISOString();
    set((state) => ({
      refunds: state.refunds.map((r) =>
        r.refundId === refundId
          ? { ...r, refundStatus: "Completed", processedAt: now }
          : r
      ),
    }));

    return { ok: true, message: `${actorName} đã đánh dấu hoàn thành chuyển hoàn ${rf.refundCode}.` };
  },

  toggleUserActive: (userId, reason) => {
    const user = get().adminUsers.find((u) => u.userId === userId);
    if (!user) return { ok: false, message: "Không tìm thấy người dùng." };

    const now = new Date().toISOString();
    const nextActive = !user.isActive;
    set((state) => ({
      adminUsers: state.adminUsers.map((u) =>
        u.userId === userId
          ? {
              ...u,
              isActive: nextActive,
              updatedAt: now,
              lockReason: nextActive ? null : reason?.trim() || "Khóa theo yêu cầu quản trị",
            }
          : u
      ),
    }));

    return {
      ok: true,
      message: nextActive
        ? `Đã mở khóa tài khoản ${user.fullName}.`
        : `Đã khóa tài khoản ${user.fullName}.`,
    };
  },

  updateUserRoles: (userId, roles) => {
    if (roles.length === 0) {
      return { ok: false, message: "Mỗi tài khoản cần có ít nhất 1 vai trò." };
    }
    const now = new Date().toISOString();
    set((state) => ({
      adminUsers: state.adminUsers.map((u) =>
        u.userId === userId ? { ...u, roles, updatedAt: now } : u
      ),
    }));
    return { ok: true, message: "Đã cập nhật vai trò người dùng." };
  },
    }),
    {
      name: "ew-ops-session-v1",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        warehouses: state.warehouses,
        locations: state.locations,
        inventory: state.inventory,
        stockMovements: state.stockMovements,
        receipts: state.receipts,
        issues: state.issues,
        carriers: state.carriers,
        shipments: state.shipments,
        masterOrders: state.masterOrders,
        sellerOrders: state.sellerOrders,
        returns: state.returns,
        refunds: state.refunds,
        adminUsers: state.adminUsers,
      }),
    }
  )
);
