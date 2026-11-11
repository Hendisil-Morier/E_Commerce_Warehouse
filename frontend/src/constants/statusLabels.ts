import type { StatusDomain, StatusMeta } from "@/types/common";

type StatusDictionary = Record<string, StatusMeta>;

const SHARED_STATUSES: StatusDictionary = {
  // Chung / Nháp / Duyệt / Hủy / Hoàn tất
  Draft: { label: "Nháp", tone: "neutral" },
  Pending: { label: "Chờ xử lý", tone: "warning" },
  PendingPayment: { label: "Chờ thanh toán", tone: "warning" },
  PendingReview: { label: "Chờ duyệt", tone: "warning" },
  PendingApproval: { label: "Chờ duyệt", tone: "warning" },
  Confirmed: { label: "Đã xác nhận", tone: "info" },
  Approved: { label: "Đã duyệt", tone: "success" },
  Processing: { label: "Đang xử lý", tone: "info" },
  Preparing: { label: "Đang chuẩn bị", tone: "info" },
  Picking: { label: "Đang soạn hàng", tone: "info" },
  Packed: { label: "Đã đóng gói", tone: "info" },
  ReadyToShip: { label: "Sẵn sàng giao", tone: "info" },
  PickedUp: { label: "Đã lấy hàng", tone: "info" },
  InTransit: { label: "Đang vận chuyển", tone: "info" },
  PartiallyShipped: { label: "Giao một phần", tone: "info" },
  Shipped: { label: "Đã bàn giao vận chuyển", tone: "info" },
  Dispatched: { label: "Đã xuất kho", tone: "success" },
  Delivered: { label: "Đã giao", tone: "success" },
  Completed: { label: "Hoàn thành", tone: "success" },
  Active: { label: "Đang hoạt động", tone: "success" },
  Inactive: { label: "Ngừng bán", tone: "neutral" },
  Requested: { label: "Đã yêu cầu", tone: "warning" },
  ItemsReceived: { label: "Đã nhận hàng trả", tone: "info" },
  Inspected: { label: "Đã kiểm hàng", tone: "info" },
  Rejected: { label: "Bị từ chối", tone: "danger" },
  Suspended: { label: "Bị khóa", tone: "danger" },
  Cancelled: { label: "Đã hủy", tone: "danger" },
  Expired: { label: "Hết hạn", tone: "danger" },
  DeliveryFailed: { label: "Giao thất bại", tone: "danger" },
  Failed: { label: "Thất bại", tone: "danger" },
  Returned: { label: "Đã trả hàng", tone: "warning" },

  // Tình trạng tồn kho & nguồn hàng (ui-guidelines.md mục 3)
  InStock: { label: "Còn hàng", tone: "success" },
  LowStock: { label: "Sắp hết hàng", tone: "warning" },
  OutOfStock: { label: "Hết hàng", tone: "danger" },
  Platform: { label: "Kho sàn", tone: "info" },
  Seller: { label: "Kho người bán", tone: "neutral" },

  // Kết quả kiểm hàng trả
  Good: { label: "Hàng tốt", tone: "success" },
  MinorDefect: { label: "Lỗi nhẹ", tone: "warning" },
  Damaged: { label: "Hỏng", tone: "danger" },
};

const DOMAIN_STATUS_OVERRIDES: Partial<Record<StatusDomain, StatusDictionary>> = {
  order: {
    Confirmed: { label: "Đã xác nhận", tone: "info" },
    Shipped: { label: "Đang giao hàng", tone: "info" },
  },
  sellerOrder: {
    Pending: { label: "Chờ xác nhận", tone: "warning" },
    Confirmed: { label: "Đã xác nhận", tone: "info" },
    Shipped: { label: "Đang giao", tone: "info" },
  },
  receipt: {
    Draft: { label: "Nháp", tone: "neutral" },
    Confirmed: { label: "Đã xác nhận nhập", tone: "success" },
    Cancelled: { label: "Đã hủy", tone: "danger" },
  },
  issue: {
    Draft: { label: "Nháp", tone: "neutral" },
    Approved: { label: "Đã duyệt xuất", tone: "info" },
    Picking: { label: "Đang soạn", tone: "info" },
    Packed: { label: "Đã đóng gói", tone: "info" },
    Dispatched: { label: "Đã xuất kho", tone: "success" },
    Cancelled: { label: "Đã hủy", tone: "danger" },
  },
  return: {
    Requested: { label: "Chờ duyệt trả", tone: "warning" },
    Approved: { label: "Đã duyệt trả", tone: "info" },
    ItemsReceived: { label: "Đã nhận hàng", tone: "info" },
    Inspected: { label: "Đã kiểm tra", tone: "info" },
    Completed: { label: "Hoàn tất", tone: "success" },
  },
  product: {
    Draft: { label: "Bản nháp", tone: "neutral" },
    PendingReview: { label: "Chờ duyệt", tone: "warning" },
    Active: { label: "Đang bán", tone: "success" },
    Rejected: { label: "Bị từ chối", tone: "danger" },
    Inactive: { label: "Tạm ẩn", tone: "neutral" },
  },
  seller: {
    Pending: { label: "Chờ duyệt", tone: "warning" },
    Approved: { label: "Đã duyệt", tone: "success" },
    Rejected: { label: "Bị từ chối", tone: "danger" },
    Suspended: { label: "Bị khóa", tone: "danger" },
  },
  refund: {
    Pending: { label: "Chờ xử lý", tone: "warning" },
    Approved: { label: "Đã duyệt hoàn", tone: "info" },
    Completed: { label: "Đã hoàn tiền", tone: "success" },
    Rejected: { label: "Từ chối hoàn", tone: "danger" },
  },
  shipment: {
    Preparing: { label: "Chờ lấy hàng", tone: "neutral" },
    PickedUp: { label: "Đã lấy hàng", tone: "info" },
    InTransit: { label: "Đang giao", tone: "info" },
    Delivered: { label: "Giao thành công", tone: "success" },
    Failed: { label: "Giao thất bại", tone: "danger" },
    Returned: { label: "Đã hoàn về", tone: "warning" },
  },
};

export const STATUS_LABELS = SHARED_STATUSES;

export function getStatusMeta(status: string, domain?: StatusDomain): StatusMeta {
  if (domain) {
    const domainMeta = DOMAIN_STATUS_OVERRIDES[domain]?.[status];
    if (domainMeta) return domainMeta;
  }

  return SHARED_STATUSES[status] ?? { label: status, tone: "neutral" };
}

