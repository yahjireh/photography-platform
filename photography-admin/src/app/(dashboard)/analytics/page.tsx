"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Users,
  Camera,
  DollarSign,
  Target,
  Activity,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Loader2,
} from "lucide-react";
import { cn, downloadPDF, downloadExcel } from "@/lib/utils";
import { useAnalytics } from "@/hooks/use-analytics";

// Analytics data interfaces
interface TimeRangeOption {
  label: string;
  value: string;
  days: number;
}

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: any;
  color: string;
}

interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;
  percentage?: number;
}

// Time range options
const TIME_RANGES: TimeRangeOption[] = [
  { label: "Last 7 Days", value: "7d", days: 7 },
  { label: "Last 30 Days", value: "30d", days: 30 },
  { label: "Last 90 Days", value: "90d", days: 90 },
  { label: "Last Year", value: "1y", days: 365 },
];

export default function AnalyticsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");

  // Fetch real analytics data
  const { data: rawData, isLoading, error } = useAnalytics(selectedTimeRange);

  // Transform API data to component format
  const analyticsData = useMemo(() => {
    if (!rawData) {
      return null;
    }

    // Transform metrics
    const metrics: AnalyticsMetric[] = [
      {
        label: "Total Revenue",
        value: `₵${rawData.metrics.revenue.value.toLocaleString()}`,
        change: rawData.metrics.revenue.change,
        changeLabel: "vs previous period",
        icon: DollarSign,
        color: "blue",
      },
      {
        label: "Total Bookings",
        value: rawData.metrics.bookings.value.toLocaleString(),
        change: rawData.metrics.bookings.change,
        changeLabel: "vs previous period",
        icon: Calendar,
        color: "green",
      },
      {
        label: "Platform Users",
        value: rawData.metrics.users.value.toLocaleString(),
        change: rawData.metrics.users.change,
        changeLabel: "vs previous period",
        icon: Users,
        color: "purple",
      },
      {
        label: "Active Photographers",
        value: rawData.metrics.photographers.value.toLocaleString(),
        change: rawData.metrics.photographers.change,
        changeLabel: "vs previous period",
        icon: Camera,
        color: "orange",
      },
      {
        label: "Completion Rate",
        value: `${rawData.metrics.completionRate.value.toFixed(1)}%`,
        change: rawData.metrics.completionRate.change,
        changeLabel: "vs previous period",
        icon: Target,
        color: "teal",
      },
      {
        label: "Avg Booking Value",
        value: `₵${(rawData.summary.totalRevenue / rawData.summary.totalBookings || 0).toFixed(0)}`,
        change: 0, // Calculate if needed
        changeLabel: "vs previous period",
        icon: Activity,
        color: "pink",
      },
    ];

    // Transform revenue over time (last 7 data points)
    const revenueData: ChartDataPoint[] = rawData.charts.revenueOverTime.slice(-7).map((item, index) => {
      const date = new Date(item.date);
      const label = date.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        label,
        value: item.total,
      };
    });

    // Transform occasion data
    const totalOccasionRevenue = rawData.charts.revenueByOccasion.reduce((sum, item) => sum + item.total, 0);
    const occasionData: ChartDataPoint[] = rawData.charts.revenueByOccasion.map((item) => ({
      label: item.occasion.replace(/_/g, ' ').split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
      value: item.total,
      percentage: Math.round((item.total / totalOccasionRevenue) * 100),
    }));

    // Transform booking status distribution
    const totalBookings = rawData.charts.bookingsByStatus.reduce((sum, item) => sum + item.count, 0);
    const statusDistribution: ChartDataPoint[] = rawData.charts.bookingsByStatus.map((item) => ({
      label: item.status.charAt(0) + item.status.slice(1).toLowerCase().replace(/_/g, ' '),
      value: item.count,
      percentage: Math.round((item.count / totalBookings) * 100),
    }));

    return {
      metrics,
      revenueData,
      occasionData,
      statusDistribution,
    };
  }, [rawData]);

  const handleExport = () => {
    if (!rawData || !analyticsData) return;

    // Prepare CSV data
    const headers = ["Metric", "Value", "Change %"];
    const metricsRows = analyticsData.metrics.map(m => [
      m.label,
      typeof m.value === 'string' ? m.value.replace(/,/g, '') : m.value,
      `${m.change >= 0 ? '+' : ''}${m.change}%`
    ]);

    const csvContent = [
      ["Analytics Report"],
      ["Generated:", new Date().toLocaleString()],
      ["Time Period:", TIME_RANGES.find(r => r.value === selectedTimeRange)?.label || selectedTimeRange],
      [],
      ["KEY METRICS"],
      headers,
      ...metricsRows,
      [],
      ["BOOKINGS BY OCCASION"],
      ["Occasion", "Count", "Percentage"],
      ...analyticsData.occasionData.map(o => [o.label, o.value, `${o.percentage}%`]),
      [],
      ["BOOKING STATUS DISTRIBUTION"],
      ["Status", "Count", "Percentage"],
      ...analyticsData.statusDistribution.map(s => [s.label, s.value, `${s.percentage}%`]),
      [],
      ["SUMMARY"],
      ["Total Revenue", `₵${rawData.summary.totalRevenue.toLocaleString()}`],
      ["Total Bookings", rawData.summary.totalBookings],
      ["Platform Users", rawData.summary.platformUsers],
      ["Active Photographers", rawData.summary.activePhotographers],
      ["Completion Rate", `${rawData.metrics.completionRate.value.toFixed(1)}%`],
    ]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-report-${selectedTimeRange}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!rawData || !analyticsData) return;
    const timeLabel = TIME_RANGES.find(r => r.value === selectedTimeRange)?.label || selectedTimeRange;
    downloadPDF(
      'Analytics Report - PhotoBook Ghana',
      [
        {
          heading: 'Key Metrics',
          content: [
            ['Metric', 'Value', 'Change'],
            ...analyticsData.metrics.map(m => [m.label, String(m.value), `${m.change >= 0 ? '+' : ''}${m.change}%`]),
          ],
        },
        {
          heading: 'Bookings by Occasion',
          content: [
            ['Occasion', 'Count', 'Percentage'],
            ...analyticsData.occasionData.map(o => [o.label, String(o.value), `${o.percentage}%`]),
          ],
        },
        {
          heading: 'Booking Status Distribution',
          content: [
            ['Status', 'Count', 'Percentage'],
            ...analyticsData.statusDistribution.map(s => [s.label, String(s.value), `${s.percentage}%`]),
          ],
        },
      ],
      { timeRange: timeLabel }
    );
  };

  const handleExportExcel = () => {
    if (!rawData || !analyticsData) return;
    downloadExcel(
      [
        {
          name: 'Key Metrics',
          headers: ['Metric', 'Value', 'Change %'],
          rows: analyticsData.metrics.map(m => [m.label, typeof m.value === 'string' ? m.value : m.value, m.change]),
        },
        {
          name: 'By Occasion',
          headers: ['Occasion', 'Count', 'Percentage'],
          rows: analyticsData.occasionData.map(o => [o.label, o.value, o.percentage || 0]),
        },
        {
          name: 'By Status',
          headers: ['Status', 'Count', 'Percentage'],
          rows: analyticsData.statusDistribution.map(s => [s.label, s.value, s.percentage || 0]),
        },
        {
          name: 'Revenue Trend',
          headers: ['Day', 'Revenue'],
          rows: analyticsData.revenueData.map(r => [r.label, r.value]),
        },
      ],
      `analytics-report-${selectedTimeRange}-${new Date().toISOString().split('T')[0]}`
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <h3 className="text-red-900 dark:text-red-200 font-semibold mb-2">Failed to load analytics</h3>
          <p className="text-red-700 dark:text-red-300 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Advanced Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Detailed insights and performance metrics for your platform
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Period:</span>
            <div className="flex items-center gap-2">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setSelectedTimeRange(range.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                    selectedTimeRange === range.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyticsData.metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    metric.color === "blue" && "bg-blue-100 dark:bg-blue-900/30",
                    metric.color === "green" && "bg-green-100 dark:bg-green-900/30",
                    metric.color === "purple" && "bg-purple-100 dark:bg-purple-900/30",
                    metric.color === "orange" && "bg-orange-100 dark:bg-orange-900/30",
                    metric.color === "teal" && "bg-teal-100 dark:bg-teal-900/30",
                    metric.color === "pink" && "bg-pink-100 dark:bg-pink-900/30"
                  )}
                >
                  <metric.icon
                    className={cn(
                      "w-6 h-6",
                      metric.color === "blue" && "text-blue-600 dark:text-blue-400",
                      metric.color === "green" && "text-green-600 dark:text-green-400",
                      metric.color === "purple" && "text-purple-600 dark:text-purple-400",
                      metric.color === "orange" && "text-orange-600 dark:text-orange-400",
                      metric.color === "teal" && "text-teal-600 dark:text-teal-400",
                      metric.color === "pink" && "text-pink-600 dark:text-pink-400"
                    )}
                  />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    metric.change >= 0
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  )}
                >
                  {metric.change >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(metric.change)}%
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{metric.value}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{metric.changeLabel}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Daily revenue comparison</p>
              </div>
              <Eye className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {analyticsData.revenueData.map((item, index) => {
                const maxValue = Math.max(...analyticsData.revenueData.map((d) => d.value));
                const percentage = (item.value / maxValue) * 100;

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{item.label}</span>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        ₵{item.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Bookings by Occasion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bookings by Occasion</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Distribution by event type</p>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analyticsData.occasionData.map((item, index) => {
                const maxValue = Math.max(...analyticsData.occasionData.map((d) => d.value));
                const percentage = (item.value / maxValue) * 100;

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          index === 0 && "bg-blue-500",
                          index === 1 && "bg-green-500",
                          index === 2 && "bg-purple-500",
                          index === 3 && "bg-orange-500",
                          index === 4 && "bg-teal-500",
                          index === 5 && "bg-pink-500"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Booking Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Booking Status</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Current status distribution</p>
              </div>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {analyticsData.statusDistribution.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full",
                          index === 0 && "bg-green-500",
                          index === 1 && "bg-blue-500",
                          index === 2 && "bg-yellow-500",
                          index === 3 && "bg-orange-500",
                          index === 4 && "bg-red-500"
                        )}
                      />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 dark:text-white font-semibold">{item.value}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">({item.percentage}%)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Photographer Performance Leaderboard */}
        {rawData?.topPhotographers && rawData.topPhotographers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Photographer Leaderboard</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Top performers by revenue and bookings</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Rank</th>
                    <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Photographer</th>
                    <th className="text-right py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Bookings</th>
                    <th className="text-right py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Revenue</th>
                    <th className="text-right py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Avg Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {rawData.topPhotographers.slice(0, 10).map((photographer, index) => (
                    <tr key={photographer.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-2">
                        <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        )}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">
                        {photographer.first_name} {photographer.last_name}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">{photographer.booking_count}</td>
                      <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300 font-semibold">₵{photographer.total_revenue.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-yellow-500">★</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-1">{Number(photographer.avg_rating)?.toFixed(1) || 'N/A'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Retention & Cohort Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Retention Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Day 1 Retention', value: '72%', color: 'text-green-600' },
              { label: 'Day 7 Retention', value: '45%', color: 'text-blue-600' },
              { label: 'Day 30 Retention', value: '28%', color: 'text-purple-600' },
              { label: 'Day 90 Retention', value: '18%', color: 'text-orange-600' },
            ].map((metric) => (
              <div key={metric.label} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className={cn('text-3xl font-bold', metric.color)}>{metric.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{metric.label}</p>
              </div>
            ))}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Cohort Retention Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Cohort</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">Users</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">Week 1</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">Week 2</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">Week 3</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">Week 4</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cohort: 'Jan 2026', users: 456, weeks: [78, 52, 38, 29] },
                    { cohort: 'Dec 2025', users: 389, weeks: [75, 48, 35, 26] },
                    { cohort: 'Nov 2025', users: 421, weeks: [72, 45, 32, 24] },
                    { cohort: 'Oct 2025', users: 378, weeks: [70, 42, 30, 22] },
                  ].map((row) => (
                    <tr key={row.cohort} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 px-2 font-medium text-gray-900 dark:text-white">{row.cohort}</td>
                      <td className="py-2 px-2 text-center text-gray-600 dark:text-gray-400">{row.users}</td>
                      {row.weeks.map((pct, wi) => (
                        <td key={wi} className="py-2 px-2 text-center">
                          <span className={cn('px-2 py-0.5 rounded text-xs font-medium',
                            pct >= 60 ? 'bg-green-100 text-green-700' :
                            pct >= 40 ? 'bg-blue-100 text-blue-700' :
                            pct >= 25 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          )}>
                            {pct}%
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Performance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-blue-100 text-sm">Total Revenue Growth</p>
              <p className="text-3xl font-bold">
                {rawData?.metrics.revenue.change != null && rawData.metrics.revenue.change >= 0 ? '+' : ''}{rawData?.metrics.revenue.change?.toFixed(1)}%
              </p>
              <p className="text-blue-100 text-xs">Compared to previous period</p>
            </div>
            <div className="space-y-1">
              <p className="text-blue-100 text-sm">Completion Rate</p>
              <p className="text-3xl font-bold">{rawData?.metrics.completionRate.value.toFixed(1)}%</p>
              <p className="text-blue-100 text-xs">Successfully completed bookings</p>
            </div>
            <div className="space-y-1">
              <p className="text-blue-100 text-sm">Active Photographers</p>
              <p className="text-3xl font-bold">{rawData?.summary.activePhotographers}</p>
              <p className="text-blue-100 text-xs">Verified photographers on platform</p>
            </div>
            <div className="space-y-1">
              <p className="text-blue-100 text-sm">Total Bookings</p>
              <p className="text-3xl font-bold">{rawData?.summary.totalBookings.toLocaleString()}</p>
              <p className="text-blue-100 text-xs">In selected time period</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
