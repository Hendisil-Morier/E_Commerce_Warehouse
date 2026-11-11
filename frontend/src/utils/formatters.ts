const VND_NUMBER_FORMAT = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

const DATE_ONLY_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Định dạng tiền tệ VND theo quy ước UI: `349.000₫`.
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return "0₫";
  }

  return `${VND_NUMBER_FORMAT.format(Math.round(amount))}₫`;
}

function parseUtcDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Chuẩn hóa chuỗi ISO thiếu hậu tố múi giờ về UTC trước khi chuyển sang giờ địa phương
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(trimmed);
  const normalized = !hasTimezone && /^\d{4}-\d{2}-\d{2}T/.test(trimmed)
    ? `${trimmed}Z`
    : trimmed;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Chuyển thời gian UTC từ API sang giờ địa phương định dạng Việt Nam.
 */
export function formatDate(
  utcDate: string | Date | null | undefined,
  options?: { includeTime?: boolean }
): string {
  const date = parseUtcDate(utcDate);
  if (!date) return "—";

  const includeTime = options?.includeTime ?? true;
  return includeTime ? DATE_TIME_FORMAT.format(date) : DATE_ONLY_FORMAT.format(date);
}

