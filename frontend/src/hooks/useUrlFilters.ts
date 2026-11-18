import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export interface UseUrlFiltersOptions<T extends Record<string, string>> {
  defaults: T;
  defaultPage?: number;
  defaultPageSize?: number;
  defaultSort?: string;
}

export interface UseUrlFiltersResult<T extends Record<string, string>> {
  filters: T;
  page: number;
  pageSize: number;
  sort: string;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  setFilters: (updates: Partial<T>) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSort: (sort: string) => void;
  resetFilters: () => void;
}

function parsePositiveInt(raw: string | null, fallback: number, max?: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

export function useUrlFilters<T extends Record<string, string>>({
  defaults,
  defaultPage = 1,
  defaultPageSize = 20,
  defaultSort = "-createdAt",
}: UseUrlFiltersOptions<T>): UseUrlFiltersResult<T> {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const resolved: Record<string, string> = {};
    for (const key of Object.keys(defaults)) {
      resolved[key] = searchParams.get(key) ?? defaults[key];
    }
    return resolved as T;
  }, [defaults, searchParams]);

  const page = useMemo(
    () => parsePositiveInt(searchParams.get("page"), defaultPage),
    [defaultPage, searchParams]
  );

  const pageSize = useMemo(
    () => parsePositiveInt(searchParams.get("pageSize"), defaultPageSize, 100),
    [defaultPageSize, searchParams]
  );

  const sort = searchParams.get("sort") ?? defaultSort;

  const updateParams = useCallback(
    (mutator: (next: URLSearchParams) => void) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        mutator(next);
        return next;
      });
    },
    [setSearchParams]
  );

  const setFilters = useCallback(
    (updates: Partial<T>) => {
      updateParams((next) => {
        for (const [key, rawValue] of Object.entries(updates)) {
          const val = rawValue ?? "";
          if (!val || val === defaults[key]) {
            next.delete(key);
          } else {
            next.set(key, val);
          }
        }
        next.delete("page");
      });
    },
    [defaults, updateParams]
  );

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFilters({ [key]: value } as unknown as Partial<T>);
    },
    [setFilters]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const normalized = Math.max(1, nextPage);
      updateParams((next) => {
        if (normalized === defaultPage) {
          next.delete("page");
        } else {
          next.set("page", String(normalized));
        }
      });
    },
    [defaultPage, updateParams]
  );

  const setPageSize = useCallback(
    (nextSize: number) => {
      const clamped = Math.min(100, Math.max(1, nextSize));
      updateParams((next) => {
        if (clamped === defaultPageSize) {
          next.delete("pageSize");
        } else {
          next.set("pageSize", String(clamped));
        }
        next.delete("page");
      });
    },
    [defaultPageSize, updateParams]
  );

  const setSort = useCallback(
    (nextSort: string) => {
      updateParams((next) => {
        if (!nextSort || nextSort === defaultSort) {
          next.delete("sort");
        } else {
          next.set("sort", nextSort);
        }
        next.delete("page");
      });
    },
    [defaultSort, updateParams]
  );

  const resetFilters = useCallback(() => {
    updateParams((next) => {
      for (const key of Object.keys(defaults)) {
        next.delete(key);
      }
      next.delete("page");
      next.delete("pageSize");
      next.delete("sort");
    });
  }, [defaults, updateParams]);

  return {
    filters,
    page,
    pageSize,
    sort,
    setFilter,
    setFilters,
    setPage,
    setPageSize,
    setSort,
    resetFilters,
  };
}

