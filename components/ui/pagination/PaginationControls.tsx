"use client";

import React from "react";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalItems: number;
  filteredItems: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  isSearchActive?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  rowsPerPage,
  totalItems,
  filteredItems,
  onPageChange,
  onRowsPerPageChange,
  isSearchActive = false,
}: PaginationControlsProps) {
  const startIndex = (currentPage - 1) * rowsPerPage + 1;
  const endIndex = Math.min(currentPage * rowsPerPage, filteredItems);

  return (
    <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
      <div className="flex flex-col gap-4 sm:items-center sm:justify-between sm:flex-row">
        {/* Left: Rows per page dropdown */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="rowsPerPage"
            className="text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            Rows per page:
          </label>
          <select
            id="rowsPerPage"
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className="h-8 rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-brand-800"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Center: Info Display */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Showing {startIndex}–{endIndex} of {filteredItems}{" "}
          {filteredItems === 1 ? "item" : "items"}
          {isSearchActive && ` (filtered from ${totalItems})`}
        </div>

        {/* Right: Pagination buttons and page indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Page {currentPage} of {Math.max(1, totalPages)}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
