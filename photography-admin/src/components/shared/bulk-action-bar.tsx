'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BulkActionBarProps } from '@/hooks/use-bulk-actions';

const variantStyles = {
  default: 'bg-blue-600 hover:bg-blue-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
};

/**
 * Floating bulk action bar that appears when items are selected
 */
export function BulkActionBar({
  selectedCount,
  onDeselectAll,
  actions,
  onAction,
  isPending,
}: BulkActionBarProps) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const handleAction = (action: typeof actions[0]) => {
    if (action.requireConfirmation && confirmAction !== action.action) {
      setConfirmAction(action.action);
      return;
    }
    setConfirmAction(null);
    onAction(action.action);
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-[400px]">
            {/* Selection count */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
                {selectedCount}
              </div>
              <span className="text-sm text-gray-300">
                {selectedCount === 1 ? 'item' : 'items'} selected
              </span>
            </div>

            <div className="w-px h-8 bg-gray-700" />

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {actions.map((action) => (
                <div key={action.action} className="relative">
                  <button
                    onClick={() => handleAction(action)}
                    disabled={isPending}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
                      confirmAction === action.action
                        ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400'
                        : variantStyles[action.variant]
                    )}
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : confirmAction === action.action ? (
                      'Click again to confirm'
                    ) : (
                      action.label
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="w-px h-8 bg-gray-700" />

            {/* Deselect */}
            <button
              onClick={() => {
                setConfirmAction(null);
                onDeselectAll();
              }}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Confirmation warning */}
          <AnimatePresence>
            {confirmAction && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
              >
                <div className="bg-yellow-500 text-yellow-900 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 shadow-lg">
                  <AlertTriangle className="w-4 h-4" />
                  {actions.find((a) => a.action === confirmAction)?.confirmMessage ||
                    'Click again to confirm this action'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
