import React from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import type { PaginationProps } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface TableProps<T> {
  columns: readonly TableColumn<T>[];
  data: readonly T[];
  rowKey: (item: T, index: number) => string | number;
  loading?: boolean;
  loadingRows?: number;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (item: T) => void;
  pagination?: PaginationProps;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("button, a, input, select, textarea, label, [data-stop-row-click='true']")
  );
}

export function Table<T>({
  columns,
  data,
  rowKey,
  loading = false,
  loadingRows = 5,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onRowClick,
  pagination,
}: TableProps<T>): React.JSX.Element {
  if (error) {
    return (
      <div className="ew-card">
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className="ew-card" style={{ overflow: "hidden" }}>
      <div className="ew-table-wrap">
        <table className="ew-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ textAlign: col.align ?? "left", width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: loadingRows }, (_, rIdx) => (
                <tr key={`skeleton-${rIdx}`}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      <Skeleton height={16} width={rIdx % 2 === 0 ? "85%" : "65%"} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 0 }}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => {
                const clickable = Boolean(onRowClick);
                return (
                  <tr
                    key={rowKey(item, rowIndex)}
                    tabIndex={clickable ? 0 : undefined}
                    className={clickable ? "ew-table__row--clickable" : undefined}
                    onClick={
                      onRowClick
                        ? (e) => {
                            if (!isInteractiveTarget(e.target)) {
                              onRowClick(item);
                            }
                          }
                        : undefined
                    }
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (
                              (e.key === "Enter" || e.key === " ") &&
                              !isInteractiveTarget(e.target)
                            ) {
                              e.preventDefault();
                              onRowClick(item);
                            }
                          }
                        : undefined
                    }
                  >
                    {columns.map((col) => (
                      <td key={col.key} style={{ textAlign: col.align ?? "left" }}>
                        {col.render(item, rowIndex)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && pagination && <Pagination {...pagination} />}
    </div>
  );
}

