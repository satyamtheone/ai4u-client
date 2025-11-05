import React from "react";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import DynamicButton from "./DynamicButton";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";

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
            <span className="max-md:hidden">
              <span className="mx-2">•</span>
              Showing {start}-{end} of {pagination.total}
            </span>
          </p>

          <div className="flex items-center gap-2">
            <DynamicButton
              label={<span className="max-md:hidden">Prev</span>}
              variant="pill"
              onClick={pagination.onPrev}
              disabled={pagination.page <= 1}
              icon={<ArrowBigLeft size={20} className="md:hidden" />}
            />
            <DynamicButton
              label={<span className="max-md:hidden">Next</span>}
              variant="pill"
              onClick={pagination.onNext}
              disabled={pagination.page >= pagination.total_pages}
              className="py-0"
              icon={<ArrowBigRight size={20} className="md:hidden" />}
              iconPosition="flex-row-reverse"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
