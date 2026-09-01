"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  X,
  ChevronDown,
  Calendar,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: "select" | "multi-select" | "date-range";
  options?: FilterOption[];
  value?: string | string[] | { from: string; to: string };
}

export interface FilterPanelProps {
  filters: FilterGroup[];
  onChange: (filterId: string, value: any) => void;
  onReset?: () => void;
  className?: string;
  compact?: boolean;
}

// ============================================
// FILTER BADGE (Active Filter Count)
// ============================================

function FilterBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className="ml-2 px-2 py-0.5 text-xs font-semibold bg-teal-600 text-white rounded-full"
    >
      {count}
    </motion.span>
  );
}

// ============================================
// SELECT FILTER
// ============================================

interface SelectFilterProps {
  filter: FilterGroup;
  onChange: (value: string) => void;
  compact?: boolean;
}

function SelectFilter({ filter, onChange, compact }: SelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentValue = filter.value as string;
  const selectedOption = filter.options?.find((opt) => opt.value === currentValue);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border-2 transition-all",
          compact ? "h-10 px-3 text-sm" : "h-12 px-4",
          isOpen
            ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
          "bg-white dark:bg-gray-900",
          "text-gray-900 dark:text-gray-100"
        )}
      >
        <span className={cn("font-medium", !compact && "text-sm")}>
          {filter.label}: {selectedOption?.label || "All"}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute top-full left-0 mt-2 w-64 z-20",
                "bg-white dark:bg-gray-900",
                "border border-gray-200 dark:border-gray-700",
                "rounded-lg shadow-xl overflow-hidden"
              )}
            >
              <div className="max-h-80 overflow-y-auto">
                {/* "All" Option */}
                <button
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 text-left transition-colors",
                    currentValue === ""
                      ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  )}
                >
                  <span className="text-sm font-medium">All</span>
                  {currentValue === "" && <Check className="w-4 h-4" />}
                </button>

                {/* Options */}
                {filter.options?.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 text-left transition-colors",
                      currentValue === option.value
                        ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <div className="flex items-center gap-2">
                      {option.count !== undefined && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {option.count}
                        </span>
                      )}
                      {currentValue === option.value && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MULTI-SELECT FILTER
// ============================================

interface MultiSelectFilterProps {
  filter: FilterGroup;
  onChange: (value: string[]) => void;
  compact?: boolean;
}

function MultiSelectFilter({ filter, onChange, compact }: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentValues = (filter.value as string[]) || [];

  const toggleValue = (value: string) => {
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    onChange(newValues);
  };

  const selectedCount = currentValues.length;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border-2 transition-all",
          compact ? "h-10 px-3 text-sm" : "h-12 px-4",
          isOpen
            ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
          "bg-white dark:bg-gray-900",
          "text-gray-900 dark:text-gray-100"
        )}
      >
        <span className={cn("font-medium flex items-center", !compact && "text-sm")}>
          {filter.label}
          <FilterBadge count={selectedCount} />
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute top-full left-0 mt-2 w-64 z-20",
                "bg-white dark:bg-gray-900",
                "border border-gray-200 dark:border-gray-700",
                "rounded-lg shadow-xl overflow-hidden"
              )}
            >
              <div className="max-h-80 overflow-y-auto p-2">
                {filter.options?.map((option) => {
                  const isSelected = currentValues.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleValue(option.value)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                        isSelected
                          ? "bg-teal-50 dark:bg-teal-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      {/* Checkbox */}
                      <div
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-teal-600 border-teal-600"
                            : "border-gray-300 dark:border-gray-600"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* Label */}
                      <span
                        className={cn(
                          "text-sm font-medium flex-1",
                          isSelected
                            ? "text-teal-700 dark:text-teal-400"
                            : "text-gray-700 dark:text-gray-300"
                        )}
                      >
                        {option.label}
                      </span>

                      {/* Count */}
                      {option.count !== undefined && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {option.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Clear Button */}
              {selectedCount > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                  <button
                    onClick={() => {
                      onChange([]);
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN FILTER PANEL COMPONENT
// ============================================

export function FilterPanel({
  filters,
  onChange,
  onReset,
  className,
  compact = false,
}: FilterPanelProps) {
  // Count active filters
  const activeFiltersCount = filters.reduce((count, filter) => {
    if (Array.isArray(filter.value)) {
      return count + filter.value.length;
    }
    if (filter.value && filter.value !== "") {
      return count + 1;
    }
    return count;
  }, 0);

  return (
    <div className={cn("flex items-center flex-wrap gap-3", className)}>
      {/* Filter Icon + Label */}
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <Filter className="w-5 h-5" />
        <span className={cn("font-semibold", compact ? "text-sm" : "text-base")}>
          Filters
        </span>
        <AnimatePresence>
          {activeFiltersCount > 0 && <FilterBadge count={activeFiltersCount} />}
        </AnimatePresence>
      </div>

      {/* Filter Groups */}
      {filters.map((filter) => (
        <div key={filter.id}>
          {filter.type === "select" && (
            <SelectFilter
              filter={filter}
              onChange={(value) => onChange(filter.id, value)}
              compact={compact}
            />
          )}
          {filter.type === "multi-select" && (
            <MultiSelectFilter
              filter={filter}
              onChange={(value) => onChange(filter.id, value)}
              compact={compact}
            />
          )}
        </div>
      ))}

      {/* Reset Button */}
      {activeFiltersCount > 0 && onReset && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={onReset}
          className={cn(
            "flex items-center gap-2 rounded-lg border-2 border-red-200 dark:border-red-800 transition-colors",
            compact ? "h-10 px-3 text-sm" : "h-12 px-4",
            "bg-red-50 dark:bg-red-900/20",
            "text-red-600 dark:text-red-400",
            "hover:bg-red-100 dark:hover:bg-red-900/30",
            "font-medium"
          )}
        >
          <X className="w-4 h-4" />
          <span>Reset Filters</span>
        </motion.button>
      )}
    </div>
  );
}
