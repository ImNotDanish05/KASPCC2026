"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import { SearchBar } from "@/components/ui/search/SearchBar";
import { PaginationControls } from "@/components/ui/pagination/PaginationControls";
import { Modal } from "@/components/ui/modal";
import {
  Plus,
  AlertCircle,
  Download,
  Upload,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { exportToExcel, ExportColumnDef } from "@/lib/utils/excelExport";
import { parseExcelFile } from "@/lib/utils/excelImport";

// ─────────────────────────────────────────────────────────────────

export interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

export interface EnhancedDataTableProps {
  title: string;
  description?: string;
  columns: ColumnDef[];
  data: Record<string, any>[];
  loading?: boolean;
  error?: string;
  onCreateClick?: () => void;
  onImport?: (data: Record<string, any>[]) => Promise<void>;
  importMapping?: Record<string, string>; // Maps import columns to data keys
  exportFilename?: string;
  exportColumns?: ExportColumnDef[]; // Special export column definitions with relationship types
  createButtonLabel?: string;
  showExport?: boolean;
  showImport?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export default function EnhancedDataTable({
  title,
  description,
  columns,
  data,
  loading = false,
  error = "",
  onCreateClick,
  onImport,
  importMapping = {},
  exportFilename = "export",
  exportColumns,
  createButtonLabel = "Add",
  showExport = true,
  showImport = true,
  searchPlaceholder = "Search...",
  emptyMessage = "No data found",
}: EnhancedDataTableProps) {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key];
        return (
          value &&
          String(value).toLowerCase().includes(query)
        );
      })
    );
  }, [data, searchQuery, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [filteredData, sortBy, sortDirection]);

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Reset page on search
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle sort column click
  function handleSort(key: string) {
    if (sortBy === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
  }

  // Handle export
  function handleExport() {
    // Use export-specific columns if provided, otherwise fall back to regular columns
    const cols = exportColumns || columns;
    exportToExcel(exportFilename, sortedData, cols);
  }

  // Handle import
  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError("");
    setImportLoading(true);

    try {
      const result = await parseExcelFile(file, importMapping);

      if (!result.success) {
        setImportError(
          result.errors[0] || "Failed to parse file"
        );
        setImportLoading(false);
        return;
      }

      if (onImport && result.data) {
        await onImport(result.data);
        setShowImportModal(false);
        setImportError("");
      }
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setImportLoading(false);
    }
  }

  // Render sort icon for column header
  function renderSortIcon(key: string, sortable?: boolean) {
    if (!sortable) return null;

    if (sortBy === key) {
      return sortDirection === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5 text-brand-500" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5 text-brand-500" />
      );
    }

    return (
      <ArrowUpDown className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
    );
  }

  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {showExport && (
            <Button
              variant="outline"
              size="sm"
              startIcon={<Download className="h-4 w-4" />}
              onClick={handleExport}
            >
              Export
            </Button>
          )}
          {showImport && (
            <Button
              variant="outline"
              size="sm"
              startIcon={<Upload className="h-4 w-4" />}
              onClick={() => setShowImportModal(true)}
            >
              Import
            </Button>
          )}
          {onCreateClick && (
            <Button
              variant="primary"
              size="sm"
              startIcon={<Plus className="h-4 w-4" />}
              onClick={onCreateClick}
            >
              {createButtonLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={searchPlaceholder}
        disabled={loading}
      />

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100 dark:border-gray-800">
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  No
                </TableCell>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    isHeader
                    className={`px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 ${
                      col.sortable
                        ? "cursor-pointer transition-colors hover:text-gray-700 dark:hover:text-gray-300"
                        : ""
                    }`}
                  >
                    <div
                      className="flex items-center gap-2"
                      onClick={() => col.sortable && handleSort(col.key)}
                      role={col.sortable ? "button" : undefined}
                      tabIndex={col.sortable ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (col.sortable && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          handleSort(col.key);
                        }
                      }}
                    >
                      {col.label}
                      {col.sortable && renderSortIcon(col.key, col.sortable)}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                    colSpan={columns.length + 1}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                    colSpan={columns.length + 1}
                  >
                    {searchQuery ? "No matching records found." : emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                  >
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {startIndex + index + 1}
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && sortedData.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={data.length}
            filteredItems={sortedData.length}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows);
              setCurrentPage(1);
            }}
            isSearchActive={searchQuery.trim().length > 0}
          />
        )}
      </div>

      {/* ── IMPORT MODAL ── */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportError("");
        }}
        className="max-w-md p-6 lg:p-8"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Import Data
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Upload an Excel (.xlsx) or CSV file to import records.
        </p>

        <div className="mb-4 space-y-4">
          {/* File Input */}
          <div>
            <label
              htmlFor="import-file"
              className="relative block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-center transition-colors hover:border-brand-400 dark:border-gray-700 dark:hover:border-brand-400"
            >
              <input
                id="import-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportFile}
                disabled={importLoading}
                className="hidden"
              />
              <Upload className="mx-auto mb-2 h-6 w-6 text-gray-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {importLoading ? "Processing..." : "Click to select file"}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                .xlsx, .xls, or .csv
              </p>
            </label>
          </div>

          {/* Error */}
          {importError && (
            <div className="rounded-lg border border-error-300 bg-error-50 px-3 py-2 text-xs text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {importError}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowImportModal(false);
              setImportError("");
            }}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
