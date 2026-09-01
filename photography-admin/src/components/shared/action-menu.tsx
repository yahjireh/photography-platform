/**
 * Action Menu Component
 * Reusable dropdown menu for action buttons
 */

"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "danger" | "success";
  disabled?: boolean;
  hidden?: boolean;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  className?: string;
  buttonClassName?: string;
  align?: "left" | "right";
}

// ============================================
// ACTION MENU COMPONENT
// ============================================

export function ActionMenu({ items, className, buttonClassName, align = "right" }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter out hidden items
  const visibleItems = items.filter((item) => !item.hidden);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleItemClick = (item: ActionMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      {/* Menu Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "p-2 rounded-lg transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
          isOpen && "bg-gray-100 dark:bg-gray-800",
          buttonClassName
        )}
      >
        <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && visibleItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.1 }}
            className={cn(
              "absolute z-50 mt-2 w-56 rounded-lg shadow-lg",
              "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
              "py-1 overflow-hidden",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {visibleItems.map((item, index) => {
              const Icon = item.icon;
              const variantStyles = {
                default: "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                danger: "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
                success: "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20",
              };

              return (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}
                  disabled={item.disabled}
                  className={cn(
                    "w-full px-4 py-2.5 text-left text-sm font-medium transition-colors",
                    "flex items-center gap-3",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    !item.disabled && variantStyles[item.variant || "default"]
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
