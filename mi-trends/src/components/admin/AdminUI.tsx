"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks";
import { Pagination } from "@/components/ui/Pagination";
import { EASE_TACTILE } from "@/lib/motion";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl text-ink">{title}</h1>
        {description && <p className="mt-2 text-body-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  format?: (value: number) => string;
  change?: number | null;
  icon?: React.ReactNode;
}

/** KPI card with an animated count-up and a period-over-period delta. */
export function StatCard({ label, value, format, change, icon }: StatCardProps) {
  const animated = useCountUp(value);
  const display = format ? format(animated) : Math.round(animated).toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_TACTILE }}
      className="card-surface p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="label-caps">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>

      <p className="mt-4 font-serif text-3xl text-ink tabular-nums">{display}</p>

      {change !== null && change !== undefined && Number.isFinite(change) && (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-caption normal-case tracking-normal",
            change >= 0 ? "text-success" : "text-danger",
          )}
        >
          {change >= 0 ? (
            <ArrowUp className="h-3 w-3" aria-hidden />
          ) : (
            <ArrowDown className="h-3 w-3" aria-hidden />
          )}
          {Math.abs(change).toFixed(1)}% vs previous period
        </p>
      )}
    </motion.div>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  /** Omit to make the column unsortable. */
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  searchValue?: (row: T) => string;
  perPage?: number;
  emptyMessage?: string;
  rowHref?: (row: T) => string;
  toolbar?: React.ReactNode;
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
}

/**
 * Sortable, searchable, paginated table. All three happen client-side —
 * admin lists are bounded in size, and it keeps interactions instant.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  searchPlaceholder = "Search…",
  searchValue,
  perPage = 20,
  emptyMessage = "Nothing to show yet.",
  rowHref,
  toolbar,
  selectable = false,
  selected = [],
  onSelectedChange,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim() || !searchValue) return rows;
    const term = query.trim().toLowerCase();
    return rows.filter((row) => searchValue(row).toLowerCase().includes(term));
  }, [rows, query, searchValue]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const column = columns.find((c) => c.key === sortKey);
    if (!column?.sortValue) return filtered;

    return [...filtered].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      const result =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? result : -result;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, pageCount);
  const visible = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  const visibleIds = visible.map(rowKey);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div>
      {(searchValue || toolbar) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {searchValue && (
            <div className="relative max-w-sm flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <label htmlFor="table-search" className="sr-only">
                {searchPlaceholder}
              </label>
              <input
                id="table-search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-sm border border-ink/12 bg-white pl-9 pr-3 text-body-sm outline-none transition-colors focus:border-accent"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline bg-cream/50">
                {selectable && (
                  <th scope="col" className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all rows on this page"
                      checked={allVisibleSelected}
                      onChange={(e) => {
                        if (!onSelectedChange) return;
                        onSelectedChange(
                          e.target.checked
                            ? [...new Set([...selected, ...visibleIds])]
                            : selected.filter((id) => !visibleIds.includes(id)),
                        );
                      }}
                      className="h-4 w-4 cursor-pointer accent-accent"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-caption uppercase tracking-[0.1em] text-muted",
                      column.className,
                    )}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-ink"
                      >
                        {column.header}
                        {sortKey === column.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="h-3 w-3" aria-hidden />
                          ) : (
                            <ArrowDown className="h-3 w-3" aria-hidden />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-4 py-16 text-center text-body-sm text-muted"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                visible.map((row) => {
                  const id = rowKey(row);
                  const href = rowHref?.(row);

                  return (
                    <tr
                      key={id}
                      className="border-b border-hairline transition-colors last:border-0 hover:bg-cream/40"
                    >
                      {selectable && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label="Select row"
                            checked={selected.includes(id)}
                            onChange={(e) => {
                              if (!onSelectedChange) return;
                              onSelectedChange(
                                e.target.checked
                                  ? [...selected, id]
                                  : selected.filter((x) => x !== id),
                              );
                            }}
                            className="h-4 w-4 cursor-pointer accent-accent"
                          />
                        </td>
                      )}
                      {columns.map((column, i) => (
                        <td
                          key={column.key}
                          className={cn("px-4 py-3 text-body-sm", column.className)}
                        >
                          {href && i === 0 ? (
                            <Link
                              href={href}
                              className="block transition-colors hover:text-accent"
                            >
                              {column.render(row)}
                            </Link>
                          ) : (
                            column.render(row)
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-caption normal-case tracking-normal text-muted">
          {sorted.length} result{sorted.length === 1 ? "" : "s"}
        </p>
        <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
      </div>
    </div>
  );
}
