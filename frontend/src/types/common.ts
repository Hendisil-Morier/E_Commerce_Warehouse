export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

export type StatusDomain =
  | "order"
  | "sellerOrder"
  | "issue"
  | "receipt"
  | "return"
  | "product"
  | "seller"
  | "refund"
  | "shipment"
  | "stock"
  | "inspection";

export interface StatusTimelineItem {
  id?: string | number;
  status: string;
  domain?: StatusDomain;
  actorName?: string | null;
  changedAt: string;
  reason?: string | null;
  note?: string | null;
}

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastInput {
  type?: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs: number;
}

