'use client';

import React from 'react';
import {
  Clock,
  User,
  Edit,
  Trash2,
  Shield,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivityLogStore, ActivityLogEntry } from '@/hooks/use-activity-log';
import { formatRelativeTime } from '@/lib/utils';

const ACTION_ICONS: Record<string, React.ElementType> = {
  view: Eye,
  edit: Edit,
  delete: Trash2,
  suspend: Shield,
  flag: Flag,
  approve: CheckCircle,
  reject: XCircle,
  resolve: CheckCircle,
  warn: AlertTriangle,
  message: MessageSquare,
  create: Edit,
  update: Edit,
};

const ACTION_COLORS: Record<string, string> = {
  view: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  edit: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  delete: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  suspend: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  flag: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  approve: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  reject: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  resolve: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  warn: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  message: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  create: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  update: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
};

function getIconForAction(action: string): React.ElementType {
  const key = Object.keys(ACTION_ICONS).find((k) =>
    action.toLowerCase().includes(k)
  );
  return key ? ACTION_ICONS[key] : Clock;
}

function getColorForAction(action: string): string {
  const key = Object.keys(ACTION_COLORS).find((k) =>
    action.toLowerCase().includes(k)
  );
  return key ? ACTION_COLORS[key] : 'text-gray-500 bg-gray-50 dark:bg-gray-800';
}

interface AuditTrailProps {
  targetType?: string;
  targetId?: string;
  category?: ActivityLogEntry['category'];
  maxItems?: number;
  className?: string;
  title?: string;
}

export function AuditTrail({
  targetType,
  targetId,
  category,
  maxItems = 20,
  className,
  title = 'Activity History',
}: AuditTrailProps) {
  const { logs } = useActivityLogStore();

  let filteredLogs = logs;
  if (targetType && targetId) {
    filteredLogs = logs.filter(
      (log) => log.targetType === targetType && log.targetId === targetId
    );
  } else if (category) {
    filteredLogs = logs.filter((log) => log.category === category);
  }

  const displayLogs = filteredLogs.slice(0, maxItems);

  if (displayLogs.length === 0) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="text-center py-8">
          <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No activity recorded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-0">
        {displayLogs.map((log, index) => {
          const Icon = getIconForAction(log.action);
          const colorClass = getColorForAction(log.action);
          const isLast = index === displayLogs.length - 1;

          return (
            <div key={log.id} className="flex gap-3">
              {/* Timeline line + icon */}
              <div className="flex flex-col items-center">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                {!isLast && (
                  <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 my-1" />
                )}
              </div>

              {/* Content */}
              <div className={cn('pb-4 flex-1 min-w-0', isLast && 'pb-0')}>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {log.action}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {log.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {log.adminName && (
                    <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.adminName}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatRelativeTime(log.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
