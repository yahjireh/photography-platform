"use client";

import { cn } from "@/lib/utils";

interface ChartSkeletonProps {
  className?: string;
  /** Height of the chart area */
  height?: number | string;
}

/**
 * Skeleton for bar charts
 */
export function BarChartSkeleton({ className, height = 300 }: ChartSkeletonProps) {
  return (
    <div className={cn("w-full animate-pulse", className)} style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2 px-4 pb-8">
        {[40, 70, 55, 85, 60, 75, 45, 90, 65, 80, 50, 70].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between px-4 -mt-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-3 w-6 bg-gray-200 dark:bg-gray-700 rounded"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for line/area charts
 */
export function LineChartSkeleton({ className, height = 300 }: ChartSkeletonProps) {
  return (
    <div className={cn("w-full animate-pulse", className)} style={{ height }}>
      <div className="relative h-full px-4 pb-8">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((_, i) => (
            <div
              key={i}
              className="h-3 w-6 bg-gray-200 dark:bg-gray-700 rounded"
            />
          ))}
        </div>
        {/* Grid lines */}
        <div className="ml-10 h-full flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((_, i) => (
            <div
              key={i}
              className="h-px bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
        {/* Animated line path simulation */}
        <div className="absolute inset-0 ml-10 mb-8 overflow-hidden">
          <svg className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M 0 70 Q 50 40, 100 60 T 200 50 T 300 70 T 400 40 T 500 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-gray-200 dark:text-gray-700"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between px-14 -mt-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for donut/pie charts
 */
export function DonutChartSkeleton({ className, height = 300 }: ChartSkeletonProps) {
  return (
    <div className={cn("w-full animate-pulse flex items-center justify-center", className)} style={{ height }}>
      <div className="relative">
        {/* Outer ring */}
        <div className="w-48 h-48 rounded-full bg-gray-200 dark:bg-gray-700" />
        {/* Inner hole */}
        <div className="absolute inset-0 m-auto w-28 h-28 rounded-full bg-white dark:bg-gray-800" />
        {/* Center text placeholder */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      {/* Legend */}
      <div className="ml-8 space-y-3">
        {[1, 2, 3, 4].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for stat cards
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

/**
 * Skeleton for multiple stat cards in a row
 */
export function StatsRowSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4", className)} style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for a table/list
 */
export function TableSkeleton({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg shadow-sm animate-pulse", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
            style={{ width: i === 0 ? "30%" : `${70 / (columns - 1)}%` }}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
              style={{ width: colIndex === 0 ? "30%" : `${70 / (columns - 1)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Generic chart card skeleton with title
 */
export function ChartCardSkeleton({
  title,
  chartType = "bar",
  height = 300,
  className,
}: {
  title?: string;
  chartType?: "bar" | "line" | "donut";
  height?: number;
  className?: string;
}) {
  const ChartComponent = {
    bar: BarChartSkeleton,
    line: LineChartSkeleton,
    donut: DonutChartSkeleton,
  }[chartType];

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {title ? (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        ) : (
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        )}
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <ChartComponent height={height} />
    </div>
  );
}
