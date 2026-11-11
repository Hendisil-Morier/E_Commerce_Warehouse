import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
}

function buildPageList(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("ellipsis");
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push("ellipsis");
  pages.push(total);

  return pages;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const fromItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const toItem = Math.min(safePage * pageSize, totalItems);
  const pageList = buildPageList(safePage, safeTotalPages);

  return (
    <nav className="ew-pagination" aria-label="Phân trang">
      <div className="ew-pagination__info">
        Hiển thị <strong>{fromItem}</strong>–<strong>{toItem}</strong> trên tổng{" "}
        <strong>{totalItems}</strong> bản ghi
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        {onPageSizeChange && (
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.84rem",
              color: "var(--color-muted)",
            }}
          >
            <span>Mỗi trang</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Số dòng mỗi trang"
              className="ew-control"
              style={{ width: "auto", minHeight: "38px", padding: "4px 10px" }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="ew-pagination__controls">
          <button
            type="button"
            className="ew-pagination__btn"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            aria-label="Trang trước"
          >
            <ChevronLeft size={16} />
          </button>

          {pageList.map((entry, idx) =>
            entry === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                style={{ padding: "0 4px", color: "var(--color-muted)" }}
                aria-hidden="true"
              >
                ...
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onPageChange(entry)}
                aria-current={entry === safePage ? "page" : undefined}
                aria-label={`Trang ${entry}`}
                className={`ew-pagination__btn ${
                  entry === safePage ? "ew-pagination__btn--active" : ""
                }`.trim()}
              >
                {entry}
              </button>
            )
          )}

          <button
            type="button"
            className="ew-pagination__btn"
            disabled={safePage >= safeTotalPages || totalItems === 0}
            onClick={() => onPageChange(safePage + 1)}
            aria-label="Trang sau"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};

