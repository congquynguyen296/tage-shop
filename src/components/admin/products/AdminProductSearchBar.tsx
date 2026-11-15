"use client";

import {
  ADMIN_LETTER_SIZES,
  ADMIN_NUMERIC_SIZES,
  AdminAvailabilityFilter,
  PRODUCT_CATEGORIES,
} from "@/hooks/useAdminProducts";

interface AdminProductSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  sizeFilter: string;
  onSizeFilterChange: (value: string) => void;
  statusFilter: AdminAvailabilityFilter;
  onStatusFilterChange: (value: AdminAvailabilityFilter) => void;
  onClearAllFilters: () => void;
  totalCount: number;
  filteredCount: number;
  currentPage: number;
  pageSize: number;
}

export function AdminProductSearchBar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  sizeFilter,
  onSizeFilterChange,
  statusFilter,
  onStatusFilterChange,
  onClearAllFilters,
  totalCount,
  filteredCount,
  currentPage,
  pageSize,
}: AdminProductSearchBarProps) {
  const startItem = filteredCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, filteredCount);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    categoryFilter !== "All" ||
    sizeFilter !== "All" ||
    statusFilter !== "all";

  return (
    <div className="space-y-3 pb-4 border-b line">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Search + Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-neutral-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products by name..."
              className="w-full pl-7 pr-7 py-2 text-xs bg-white border line focus:border-black outline-none transition-colors placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute inset-y-0 right-2 flex items-center text-neutral-400 hover:text-black text-xs transition-colors"
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            aria-label="Filter by category"
            className="bg-white border line px-3 py-2 text-xs outline-none focus:border-black transition-colors"
          >
            <option value="All">All Categories</option>
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Size Filter (Letter & Numeric Sizes) */}
          <select
            value={sizeFilter}
            onChange={(e) => onSizeFilterChange(e.target.value)}
            aria-label="Filter by size"
            className="bg-white border line px-3 py-2 text-xs outline-none focus:border-black transition-colors"
          >
            <option value="All">All Sizes</option>
            <optgroup label="Letter Sizes">
              {ADMIN_LETTER_SIZES.map((s) => (
                <option key={s} value={s}>
                  Size {s}
                </option>
              ))}
            </optgroup>
            <optgroup label="Numeric Sizes">
              {ADMIN_NUMERIC_SIZES.map((s) => (
                <option key={s} value={s}>
                  Size {s}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Availability Status Filter (All / Available / Sold Out) */}
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as AdminAvailabilityFilter)
            }
            aria-label="Filter by availability"
            className="bg-white border line px-3 py-2 text-xs outline-none focus:border-black transition-colors"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="sold_out">Sold Out</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearAllFilters}
              className="px-2.5 py-2 text-[11px] uppercase tracking-wider mute hover:text-black underline transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Right: Item Counter */}
        <div className="text-[11px] font-mono mute select-none self-end lg:self-auto">
          {filteredCount === 0 ? (
            <span>No products found</span>
          ) : (
            <span>
              Showing {startItem}–{endItem} of {filteredCount} products
              {filteredCount !== totalCount && ` (filtered from ${totalCount})`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
