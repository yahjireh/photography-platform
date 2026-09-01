'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangePreset {
  label: string;
  getValue: () => { from: string; to: string };
}

const PRESETS: DateRangePreset[] = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date().toISOString().split('T')[0];
      return { from: today, to: today };
    },
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterday = d.toISOString().split('T')[0];
      return { from: yesterday, to: yesterday };
    },
  },
  {
    label: 'Last 7 Days',
    getValue: () => {
      const to = new Date().toISOString().split('T')[0];
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().split('T')[0], to };
    },
  },
  {
    label: 'Last 30 Days',
    getValue: () => {
      const to = new Date().toISOString().split('T')[0];
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return { from: d.toISOString().split('T')[0], to };
    },
  },
  {
    label: 'This Month',
    getValue: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const to = now.toISOString().split('T')[0];
      return { from, to };
    },
  },
  {
    label: 'Last Month',
    getValue: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      return { from, to };
    },
  },
  {
    label: 'This Quarter',
    getValue: () => {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const from = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
      const to = now.toISOString().split('T')[0];
      return { from, to };
    },
  },
  {
    label: 'This Year',
    getValue: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      const to = now.toISOString().split('T')[0];
      return { from, to };
    },
  },
];

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  className?: string;
}

export function DateRangePicker({ from, to, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activePreset = PRESETS.find((p) => {
    const v = p.getValue();
    return v.from === from && v.to === to;
  });

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-gray-700 dark:text-gray-300">
          {activePreset?.label || `${from} - ${to}`}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-80">
            {/* Presets */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Quick Select
              </p>
              <div className="grid grid-cols-2 gap-1">
                {PRESETS.map((preset) => {
                  const v = preset.getValue();
                  const isActive = v.from === from && v.to === to;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => {
                        onChange(v.from, v.to);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'text-left px-3 py-2 text-sm rounded-md transition-colors',
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Range */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Custom Range
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => onChange(e.target.value, to)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => onChange(from, e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full mt-3 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
