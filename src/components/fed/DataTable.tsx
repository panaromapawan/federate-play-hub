import { useState, type ReactNode, useMemo } from "react";
import { ChevronLeft, ChevronRight, Download, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export type ColumnDef<T> = {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => ReactNode;
  className?: string;
};

export type FilterDef = {
  id: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
};

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  total,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filters = [],
  onRowClick,
  exportFilename = "federation-records.csv",
  emptyMessage = "No records found matching current criteria.",
}: {
  columns: ColumnDef<T>[];
  data: T[];
  total: number;
  isLoading?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newSize: number) => void;
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  onRowClick?: (row: T) => void;
  exportFilename?: string;
  emptyMessage?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Export to CSV
  function handleExportCsv() {
    if (!data.length) return;
    const headers = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(",");
    const rows = data.map((row) =>
      columns
        .map((c) => {
          let val = c.accessorKey ? row[c.accessorKey] : "";
          if (val === null || val === undefined) val = "";
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csvContent = [headers, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", exportFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {onSearchChange && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={search ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8 pr-8 h-9 text-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          )}

          {filters.map((f) => (
            <div key={f.id} className="min-w-[130px]">
              <Select value={f.value} onValueChange={f.onChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={f.label} />
                </SelectTrigger>
                <SelectContent>
                  {f.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={!data.length || isLoading}
            className="h-9 text-xs gap-1.5"
            title="Download current table rows as CSV"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Desktop Table View (>= sm) */}
      <div className="hidden sm:block rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx} className={`text-xs font-semibold uppercase tracking-wider ${col.className ?? ""}`}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={`skel-${rIdx}`}>
                  {columns.map((_, cIdx) => (
                    <TableCell key={`skel-c-${cIdx}`}>
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-10 text-muted-foreground text-xs">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rIdx) => (
                <TableRow
                  key={row.id ?? rIdx}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${
                    onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
                  }`}
                >
                  {columns.map((col, cIdx) => (
                    <TableCell key={cIdx} className={`text-xs py-3 ${col.className ?? ""}`}>
                      {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] ?? "—") : "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card Stack View (< sm) */}
      <div className="sm:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse p-4 space-y-2">
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </Card>
          ))
        ) : data.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          data.map((row, rIdx) => (
            <Card
              key={row.id ?? rIdx}
              onClick={() => onRowClick?.(row)}
              className={`p-4 border-border bg-card space-y-2 ${
                onRowClick ? "cursor-pointer active:bg-muted/50" : ""
              }`}
            >
              {columns.map((col, cIdx) => (
                <div key={cIdx} className="flex justify-between items-start text-xs gap-2">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                    {col.header}:
                  </span>
                  <div className="text-right">
                    {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] ?? "—") : "—"}
                  </div>
                </div>
              ))}
            </Card>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground pt-1">
        <div>
          Showing {total === 0 ? 0 : page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total} records
        </div>

        <div className="flex items-center gap-2">
          {onPageSizeChange && (
            <div className="flex items-center gap-1.5 mr-2">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-8 rounded border border-border bg-background px-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0 || isLoading}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <span className="px-2 font-mono">
            Page {page + 1} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1 || isLoading}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
