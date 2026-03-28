"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";

// ─── Shared styles (matching existing Input/Select design tokens) ───

const INPUT_BASE =
  "h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

const INPUT_IDLE =
  "border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800";

const DROPDOWN_PANEL =
  "absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900";

const OPTION_BASE =
  "flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm transition-colors";

const OPTION_IDLE =
  "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800";

const OPTION_ACTIVE =
  "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400";

// ═══════════════════════════════════════════════════════════════════
//  SINGLE-SELECT SEARCHABLE DROPDOWN
// ═══════════════════════════════════════════════════════════════════

export type ComboboxOption = {
  value: string;
  label: string;
  sublabel?: string; // secondary text (e.g. NIM for anggota)
};

interface SearchableSelectProps {
  options: ComboboxOption[];
  value: string; // selected option value
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search...",
  disabled = false,
  className = "",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filter options
  const filtered = options.filter((opt) => {
    const q = query.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  });

  // Display value
  const selected = options.find((opt) => opt.value === value);

  function handleSelect(optValue: string) {
    onChange(optValue);
    setQuery("");
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setQuery("");
  }

  function handleTriggerClick() {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      {!open ? (
        <button
          type="button"
          onClick={handleTriggerClick}
          disabled={disabled}
          className={`${INPUT_BASE} ${INPUT_IDLE} flex items-center justify-between gap-2 text-left ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        >
          {selected ? (
            <span className="flex-1 truncate text-gray-800 dark:text-white/90">
              {selected.label}
              {selected.sublabel && (
                <span className="ml-1 text-gray-400 dark:text-gray-500">
                  ({selected.sublabel})
                </span>
              )}
            </span>
          ) : (
            <span className="flex-1 text-gray-400 dark:text-white/30">
              {placeholder}
            </span>
          )}
          <div className="flex items-center gap-1">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="rounded p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </button>
      ) : (
        /* Search input (shown when open) */
        <div className={`${INPUT_BASE} ${INPUT_IDLE} flex items-center gap-2`}>
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none dark:text-white/90 dark:placeholder:text-white/30"
          />
          <button
            type="button"
            onClick={() => { setOpen(false); setQuery(""); }}
            className="rounded p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>
      )}

      {/* Dropdown panel */}
      {open && (
        <div className={DROPDOWN_PANEL}>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                No results found
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`${OPTION_BASE} w-full text-left ${
                      isSelected ? OPTION_ACTIVE : OPTION_IDLE
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="block truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="block truncate text-xs text-gray-400 dark:text-gray-500">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-brand-500" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  MULTI-SELECT SEARCHABLE DROPDOWN
// ═══════════════════════════════════════════════════════════════════

interface MultiSearchableSelectProps {
  options: ComboboxOption[];
  value: string[]; // array of selected option values
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search...",
  disabled = false,
  className = "",
}: MultiSearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter((opt) => {
    const q = query.toLowerCase();
    return opt.label.toLowerCase().includes(q);
  });

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  const toggleOption = useCallback(
    (optValue: string) => {
      if (value.includes(optValue)) {
        onChange(value.filter((v) => v !== optValue));
      } else {
        onChange([...value, optValue]);
      }
    },
    [value, onChange],
  );

  function removeChip(e: React.MouseEvent, optValue: string) {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optValue));
  }

  function handleContainerClick() {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger / chip area */}
      <div
        onClick={handleContainerClick}
        className={`${INPUT_BASE} ${INPUT_IDLE} flex min-h-[2.75rem] flex-wrap items-center gap-1.5 ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${selectedOptions.length > 0 ? "h-auto py-1.5" : ""}`}
      >
        {selectedOptions.map((opt) => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
          >
            {opt.label}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => removeChip(e, opt.value)}
                className="rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-500/20"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {selectedOptions.length === 0 && (
          <span className="text-gray-400 dark:text-white/30">{placeholder}</span>
        )}
        <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-gray-400" />
      </div>

      {/* Dropdown panel */}
      {open && (
        <div className={DROPDOWN_PANEL}>
          {/* Search input inside dropdown */}
          <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                No results found
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleOption(opt.value)}
                    className={`${OPTION_BASE} w-full text-left ${
                      isSelected ? OPTION_ACTIVE : OPTION_IDLE
                    }`}
                  >
                    {/* Checkbox indicator */}
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        isSelected
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="flex-1 truncate">{opt.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
