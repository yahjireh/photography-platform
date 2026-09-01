/**
 * Widget Grid System
 * Drag & drop reorderable grid for dashboard widgets
 *
 * Features:
 * - Drag and drop reordering using @dnd-kit
 * - Responsive grid layout
 * - Widget visibility toggle
 * - Animated transitions
 * - Persisted widget order via Zustand
 */

'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripVertical,
  Eye,
  EyeOff,
  Settings,
  RotateCcw,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/store/dashboard-store';
import type { Widget, WidgetType } from '@/types/dashboard';

// ============================================
// TYPES
// ============================================

interface WidgetGridProps {
  children: React.ReactNode;
  className?: string;
}

interface SortableWidgetProps {
  widget: Widget;
  children: React.ReactNode;
  onToggleVisibility?: (id: string) => void;
}

interface WidgetWrapperProps {
  id: string;
  title: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  children: React.ReactNode;
  className?: string;
  showControls?: boolean;
  onToggleVisibility?: () => void;
  isVisible?: boolean;
}

// ============================================
// SIZE CLASSES
// ============================================

const sizeClasses = {
  small: 'col-span-12 sm:col-span-6 lg:col-span-3',
  medium: 'col-span-12 sm:col-span-6 lg:col-span-6',
  large: 'col-span-12 lg:col-span-8',
  full: 'col-span-12',
};

// ============================================
// SORTABLE WIDGET ITEM
// ============================================

function SortableWidgetItem({
  widget,
  children,
  onToggleVisibility,
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  if (!widget.isVisible) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        sizeClasses[widget.size],
        'relative group'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute -top-2 left-1/2 -translate-x-1/2 z-10',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'cursor-grab active:cursor-grabbing'
        )}
      >
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-sidebar text-white text-xs shadow-lg">
          <GripVertical className="h-3 w-3" />
          <span>Drag</span>
        </div>
      </div>

      {/* Widget Content */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ============================================
// WIDGET WRAPPER (for individual widgets)
// ============================================

export function WidgetWrapper({
  id,
  title,
  size = 'medium',
  children,
  className,
  showControls = true,
  onToggleVisibility,
  isVisible = true,
}: WidgetWrapperProps) {
  return (
    <div
      className={cn(
        sizeClasses[size],
        'relative group',
        className
      )}
    >
      {/* Widget Controls */}
      {showControls && (
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm shadow-sm"
              >
                <Settings className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{title}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onToggleVisibility}
                className="cursor-pointer"
              >
                {isVisible ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide Widget
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Show Widget
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Widget Content */}
      {children}
    </div>
  );
}

// ============================================
// WIDGET GRID (DnD Container)
// ============================================

export function WidgetGrid({ children, className }: WidgetGridProps) {
  const { widgets, reorderWidgets, resetWidgets } = useDashboardStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderWidgets(active.id as string, newIndex);
      }
    }

    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          'grid grid-cols-12 gap-4 lg:gap-6',
          className
        )}
      >
        {children}
      </div>
    </DndContext>
  );
}

// ============================================
// WIDGET VISIBILITY PANEL
// ============================================

interface WidgetVisibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WidgetVisibilityPanel({
  isOpen,
  onClose,
}: WidgetVisibilityPanelProps) {
  const { widgets, toggleWidgetVisibility, resetWidgets } = useDashboardStore();

  const widgetLabels: Record<WidgetType, string> = {
    'stats-card': 'Stats Cards',
    'recent-bookings': 'Recent Bookings',
    'revenue-chart': 'Revenue Chart',
    'booking-trends': 'Booking Trends',
    'top-photographers': 'Top Photographers',
    'geographic-distribution': 'Geographic Map',
    'quick-actions': 'Quick Actions',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-bold text-gray-900">Customize Widgets</h3>
                <p className="text-sm text-gray-500">Show or hide widgets</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Widget List */}
            <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-140px)]">
              {widgets.map((widget) => (
                <motion.div
                  key={widget.id}
                  layout
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-colors',
                    widget.isVisible
                      ? 'bg-accent-teal/5 border-accent-teal/20'
                      : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {widgetLabels[widget.type] || widget.title}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleWidgetVisibility(widget.id)}
                    className={cn(
                      'h-8 w-8 p-0',
                      widget.isVisible ? 'text-accent-teal' : 'text-gray-400'
                    )}
                  >
                    {widget.isVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
              <Button
                variant="outline"
                className="w-full"
                onClick={resetWidgets}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// CUSTOMIZE BUTTON
// ============================================

interface CustomizeButtonProps {
  onClick: () => void;
}

export function CustomizeButton({ onClick }: CustomizeButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      <Settings className="h-4 w-4" />
      Customize
    </Button>
  );
}

// ============================================
// EXPORT SORTABLE CONTEXT FOR USE IN PAGES
// ============================================

export { SortableContext, rectSortingStrategy, SortableWidgetItem };
