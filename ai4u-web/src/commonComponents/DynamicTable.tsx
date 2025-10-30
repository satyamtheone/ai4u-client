import React from "react";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  thClassName?: string;
  tdClassName?: string;
  align?: "left" | "center" | "right";
};

type PaginationState = {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

type PaginationHandlers = {
  onPrev: () => void;
  onNext: () => void;
};

interface DataTableProps<T> {
  title?: string;
  actionsRight?: React.ReactNode;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  pagination?: PaginationState & PaginationHandlers;
}

export function DynamicTable<T extends object>({
  title = "",
  actionsRight,
  columns,
  data,
  loading = false,
  emptyMessage = "No records found",
  className = "",
  pagination,
}: DataTableProps<T>) {
  const start = pagination
    ? (pagination.page - 1) * pagination.page_size + 1
    : 0;
  const end = pagination
    ? Math.min(pagination.page * pagination.page_size, pagination.total)
    : 0;

  const getAlignment = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  return (
    <Card className={`overflow-auto ${className}`}>
      {/* Header */}
      {(title || actionsRight) && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            {actionsRight}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-6 py-3 text-xs font-semibold  uppercase tracking-wider ${getAlignment(
                    col.align
                  )} ${col.thClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-sm  text-center"
                >
                  Loading…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-sm  text-center"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} className="transition-colors">
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-6 py-4 whitespace-nowrap ${getAlignment(
                        col.align
                      )} ${col.tdClassName || ""}`}
                    >
                      {col.render
                        ? col.render(row, rowIdx)
                        : (row as any)[col.key as keyof T]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.total_pages}{" "}
            <span className="mx-2">•</span>
            Showing {start}-{end} of {pagination.total}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onPrev}
              disabled={pagination.page <= 1}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onNext}
              disabled={pagination.page >= pagination.total_pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
