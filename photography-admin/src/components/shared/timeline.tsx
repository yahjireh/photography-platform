"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon, Clock } from "lucide-react";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "error" | "info";
  metadata?: Array<{ label: string; value: string }>;
  children?: ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  showRelativeTime?: boolean;
  className?: string;
}

// ============================================
// TIMELINE ITEM COMPONENT
// ============================================

interface TimelineItemComponentProps {
  item: TimelineItem;
  isLast: boolean;
  showRelativeTime: boolean;
}

function TimelineItemComponent({ item, isLast, showRelativeTime }: TimelineItemComponentProps) {
  const Icon = item.icon || Clock;

  // Variant colors
  const variantStyles = {
    default: {
      iconBg: "bg-gray-100 dark:bg-gray-800",
      iconColor: "text-gray-600 dark:text-gray-400",
      line: "bg-gray-200 dark:bg-gray-700",
    },
    success: {
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      line: "bg-green-200 dark:bg-green-800/50",
    },
    warning: {
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      line: "bg-yellow-200 dark:bg-yellow-800/50",
    },
    error: {
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      line: "bg-red-200 dark:bg-red-800/50",
    },
    info: {
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      line: "bg-blue-200 dark:bg-blue-800/50",
    },
  };

  const variant = variantStyles[item.variant || "default"];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex gap-4 pb-8 last:pb-0"
    >
      {/* Timeline Line (Vertical Connector) */}
      {!isLast && (
        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      )}

      {/* Icon Circle */}
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            variant.iconBg
          )}
        >
          <Icon className={cn("w-5 h-5", variant.iconColor)} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pt-1">
        {/* Title and Timestamp */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {item.title}
          </h4>
          <time className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {showRelativeTime ? formatRelativeTime(item.timestamp) : formatDate(item.timestamp)}
          </time>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{item.description}</p>
        )}

        {/* Metadata */}
        {item.metadata && item.metadata.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-3">
            {item.metadata.map((meta, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {meta.label}:
                </span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {meta.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Custom Children Content */}
        {item.children && <div className="mt-3">{item.children}</div>}
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN TIMELINE COMPONENT
// ============================================

export function Timeline({ items, showRelativeTime = true, className }: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className={cn("py-12 text-center", className)}>
        <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {items.map((item, index) => (
        <TimelineItemComponent
          key={item.id}
          item={item}
          isLast={index === items.length - 1}
          showRelativeTime={showRelativeTime}
        />
      ))}
    </div>
  );
}

// ============================================
// COMPACT TIMELINE (Smaller Version)
// ============================================

export function CompactTimeline({ items, showRelativeTime = true, className }: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className={cn("py-8 text-center", className)}>
        <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-xs text-gray-500 dark:text-gray-400">No activity</p>
      </div>
    );
  }

  return (
    <div className={cn("relative space-y-3", className)}>
      {items.map((item, index) => {
        const Icon = item.icon || Clock;
        const isLast = index === items.length - 1;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative flex items-start gap-3"
          >
            {/* Timeline Line */}
            {!isLast && (
              <div className="absolute left-3 top-7 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
            )}

            {/* Icon */}
            <div className="relative flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Icon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.title}
                </p>
                <time className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {showRelativeTime
                    ? formatRelativeTime(item.timestamp)
                    : formatDate(item.timestamp)}
                </time>
              </div>
              {item.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================
// TIMELINE GROUP (Grouped by Date)
// ============================================

interface TimelineGroupProps {
  title: string;
  items: TimelineItem[];
  showRelativeTime?: boolean;
  className?: string;
}

export function TimelineGroup({ title, items, showRelativeTime = true, className }: TimelineGroupProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Group Header */}
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
          {title}
        </h3>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Timeline Items */}
      <Timeline items={items} showRelativeTime={showRelativeTime} />
    </div>
  );
}

// ============================================
// HELPER: Group Timeline Items by Date
// ============================================

export function groupTimelineByDate(items: TimelineItem[]): Array<{ title: string; items: TimelineItem[] }> {
  const groups = items.reduce((acc, item) => {
    const date = new Date(item.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupTitle: string;

    if (date.toDateString() === today.toDateString()) {
      groupTitle = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupTitle = "Yesterday";
    } else {
      groupTitle = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }

    if (!acc[groupTitle]) {
      acc[groupTitle] = [];
    }

    acc[groupTitle].push(item);

    return acc;
  }, {} as Record<string, TimelineItem[]>);

  return Object.entries(groups).map(([title, items]) => ({ title, items }));
}
