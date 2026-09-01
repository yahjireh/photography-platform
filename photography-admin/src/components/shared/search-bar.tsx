"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  isLoading?: boolean;
  className?: string;
  autoFocus?: boolean;
}

// ============================================
// SEARCH BAR COMPONENT
// ============================================

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  debounceMs = 300,
  isLoading = false,
  className,
  autoFocus = false,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Auto focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle input change with debouncing
  const handleChange = (newValue: string) => {
    setLocalValue(newValue);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
      onSearch?.(newValue);
    }, debounceMs);
  };

  // Handle clear button
  const handleClear = () => {
    setLocalValue("");
    onChange("");
    onSearch?.("");
    inputRef.current?.focus();
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Cancel debounce and trigger search immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onChange(localValue);
      onSearch?.(localValue);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const hasValue = localValue.length > 0;

  return (
    <div
      className={cn(
        "relative group transition-all duration-200",
        isFocused && "scale-[1.01]",
        className
      )}
    >
      {/* Search Icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <Search
          className={cn(
            "w-5 h-5 transition-colors duration-200",
            isFocused ? "text-teal-600 dark:text-teal-400" : "text-gray-400 dark:text-gray-500"
          )}
        />
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          "w-full h-12 pl-12 pr-12 rounded-xl",
          "bg-white dark:bg-gray-900",
          "border-2 transition-all duration-200",
          isFocused
            ? "border-teal-500 dark:border-teal-600 shadow-lg shadow-teal-500/10"
            : "border-gray-200 dark:border-gray-700",
          "text-gray-900 dark:text-gray-100",
          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
          "focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        disabled={isLoading}
      />

      {/* Right Side Icons (Loading / Clear) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Loader2 className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-spin" />
            </motion.div>
          ) : hasValue ? (
            <motion.button
              key="clear"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={handleClear}
              className={cn(
                "p-1 rounded-full transition-colors",
                "text-gray-400 hover:text-gray-600",
                "dark:text-gray-500 dark:hover:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              title="Clear search"
              type="button"
            >
              <X className="w-4 h-4" />
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Focus Ring Animation */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 rounded-xl border-2 border-teal-500 dark:border-teal-600 pointer-events-none"
            style={{ boxShadow: "0 0 0 3px rgba(20, 184, 166, 0.1)" }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// COMPACT SEARCH BAR (For headers/toolbars)
// ============================================

export function CompactSearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  debounceMs = 300,
  isLoading = false,
  className,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
      onSearch?.(newValue);
    }, debounceMs);
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    onSearch?.("");
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors",
          isFocused ? "text-teal-600" : "text-gray-400"
        )}
      />
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          "h-10 pl-10 pr-10 rounded-lg",
          "bg-white dark:bg-gray-900",
          "border border-gray-200 dark:border-gray-700",
          "text-sm text-gray-900 dark:text-gray-100",
          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
          "focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500",
          "transition-all"
        )}
      />
      {(isLoading || localValue) && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
          ) : (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
