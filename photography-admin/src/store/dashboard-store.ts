/**
 * Dashboard Store
 * Global state management using Zustand
 * 
 * TEACHING MOMENT: What is Zustand?
 * 
 * Zustand is a lightweight state management library
 * Think of it as a simpler alternative to Redux
 * 
 * Benefits:
 * - No boilerplate code
 * - No providers needed
 * - TypeScript-friendly
 * - Works with React hooks
 * 
 * How it works:
 * 1. Create a store with initial state and actions
 * 2. Use the store in any component with a hook
 * 3. Components automatically re-render when state changes
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Widget } from '@/types/dashboard';

// ============================================
// STORE TYPES
// ============================================

/**
 * Dashboard Store State
 * All state that needs to be shared across components
 */
interface DashboardStore {
  // ============================================
  // MOBILEMENU STATE
  // ============================================
  
   isMobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  
  // ============================================
  // WIDGET CONFIGURATION
  // ============================================
  
  /**
   * Array of widgets with their configuration
   * Includes position, size, visibility
   */
  widgets: Widget[];
  
  /**
   * Add a new widget to the dashboard
   */
  addWidget: (widget: Widget) => void;
  
  /**
   * Remove a widget from the dashboard
   */
  removeWidget: (widgetId: string) => void;
  
  /**
   * Update widget configuration
   */
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void;
  
  /**
   * Reorder widgets (for drag & drop)
   * @param widgetId - ID of widget to move
   * @param newPosition - New position in grid
   */
  reorderWidgets: (widgetId: string, newPosition: number) => void;
  
  /**
   * Toggle widget visibility
   */
  toggleWidgetVisibility: (widgetId: string) => void;
  
  /**
   * Reset widgets to default configuration
   */
  resetWidgets: () => void;
  
  // ============================================
  // USER PREFERENCES
  // ============================================
  
  /**
   * Selected date range for analytics
   */
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  
  /**
   * Set date range for analytics
   */
  setDateRange: (from: Date | null, to: Date | null) => void;
  
  /**
   * Dashboard theme (for future dark mode)
   */
  theme: 'light' | 'dark';
  
  /**
   * Toggle theme
   */
  toggleTheme: () => void;
  
  // ============================================
  // NOTIFICATION STATE
  // ============================================
  
  /**
   * Number of unread notifications
   */
  unreadNotifications: number;
  
  /**
   * Set unread notification count
   */
  setUnreadNotifications: (count: number) => void;
  
  /**
   * Increment unread notifications
   */
  incrementUnreadNotifications: () => void;
  
  /**
   * Clear all unread notifications
   */
  clearUnreadNotifications: () => void;
}

// ============================================
// DEFAULT WIDGET CONFIGURATION
// ============================================

/**
 * Default widgets shown on dashboard
 * This is the initial state when user first visits
 */
const defaultWidgets: Widget[] = [
  // Stats Cards - Always at top
  {
    id: 'stats-revenue',
    type: 'stats-card',
    title: 'Total Revenue',
    position: 0,
    size: 'small',
    isVisible: true,
  },
  {
    id: 'stats-bookings',
    type: 'stats-card',
    title: 'Total Bookings',
    position: 1,
    size: 'small',
    isVisible: true,
  },
  {
    id: 'stats-users',
    type: 'stats-card',
    title: 'Total Users',
    position: 2,
    size: 'small',
    isVisible: true,
  },
  {
    id: 'stats-photographers',
    type: 'stats-card',
    title: 'Total Photographers',
    position: 3,
    size: 'small',
    isVisible: true,
  },
  
  // Chart Widgets
  {
    id: 'revenue-chart',
    type: 'revenue-chart',
    title: 'Monthly Revenue',
    position: 4,
    size: 'large',
    isVisible: true,
  },
  {
    id: 'booking-trends',
    type: 'booking-trends',
    title: 'Booking Trends',
    position: 5,
    size: 'medium',
    isVisible: true,
  },
  
  // List Widgets
  {
    id: 'recent-bookings',
    type: 'recent-bookings',
    title: 'Recent Bookings',
    position: 6,
    size: 'full',
    isVisible: true,
  },
  {
    id: 'top-photographers',
    type: 'top-photographers',
    title: 'Top Photographers',
    position: 7,
    size: 'medium',
    isVisible: true,
  },
  
  // Map Widget
  {
    id: 'geographic-distribution',
    type: 'geographic-distribution',
    title: 'Geographic Distribution',
    position: 8,
    size: 'large',
    isVisible: true,
  },
  
  // Quick Actions
  {
    id: 'quick-actions',
    type: 'quick-actions',
    title: 'Quick Actions',
    position: 9,
    size: 'small',
    isVisible: true,
  },
];

// ============================================
// CREATE STORE
// ============================================

/**
 * TEACHING MOMENT: How Zustand Store Works
 * 
 * create<StoreType>((set, get) => ({...}))
 * 
 * - set: Function to update state
 * - get: Function to read current state
 * 
 * State updates are immutable:
 * set({ count: 5 }) - Replace entire state
 * set((state) => ({ count: state.count + 1 })) - Update part of state
 */

export const useDashboardStore = create<DashboardStore>()(
  /**
   * TEACHING MOMENT: Persist Middleware
   * 
   * persist() saves state to localStorage
   * So when user refreshes page, their preferences persist!
   * 
   * - Sidebar collapsed state
   * - Widget configuration
   * - Theme preference
   * All saved and restored automatically
   */
  persist(
    (set) => ({
      // ============================================
      // INITIAL STATE
      // ============================================
      
      isMobileMenuOpen: false,
      widgets: defaultWidgets,
      dateRange: {
        from: null,
        to: null,
      },
      theme: 'light',
      unreadNotifications: 0,
      
      // ============================================
      // SIDEBAR ACTIONS
      // ============================================
      
      openMobileMenu: () => {
        set({ isMobileMenuOpen: true });
      },

      closeMobileMenu: () => {
        set({ isMobileMenuOpen: false });
      },
      // ============================================
      // WIDGET ACTIONS
      // ============================================
      
      addWidget: (widget: Widget) => {
        set((state) => ({
          widgets: [...state.widgets, widget],
        }));
      },
      
      removeWidget: (widgetId: string) => {
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== widgetId),
        }));
      },
      
      updateWidget: (widgetId: string, updates: Partial<Widget>) => {
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === widgetId
              ? { ...widget, ...updates }
              : widget
          ),
        }));
      },
      
      reorderWidgets: (widgetId: string, newPosition: number) => {
        /**
         * TEACHING MOMENT: Complex State Updates
         * 
         * When reordering, we need to:
         * 1. Find the widget being moved
         * 2. Remove it from its current position
         * 3. Insert it at the new position
         * 4. Update all positions
         */
        set((state) => {
          const widgets = [...state.widgets];
          const widgetIndex = widgets.findIndex((w) => w.id === widgetId);
          
          if (widgetIndex === -1) return state;
          
          // Remove widget from current position
          const [widget] = widgets.splice(widgetIndex, 1);
          
          // Insert at new position
          widgets.splice(newPosition, 0, widget);
          
          // Update all positions
          const reorderedWidgets = widgets.map((w, index) => ({
            ...w,
            position: index,
          }));
          
          return { widgets: reorderedWidgets };
        });
      },
      
      toggleWidgetVisibility: (widgetId: string) => {
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === widgetId
              ? { ...widget, isVisible: !widget.isVisible }
              : widget
          ),
        }));
      },
      
      resetWidgets: () => {
        set({ widgets: defaultWidgets });
      },
      
      // ============================================
      // USER PREFERENCE ACTIONS
      // ============================================
      
      setDateRange: (from: Date | null, to: Date | null) => {
        set({ dateRange: { from, to } });
      },
      
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
      },
      
      // ============================================
      // NOTIFICATION ACTIONS
      // ============================================
      
      setUnreadNotifications: (count: number) => {
        set({ unreadNotifications: count });
      },
      
      incrementUnreadNotifications: () => {
        set((state) => ({
          unreadNotifications: state.unreadNotifications + 1,
        }));
      },
      
      clearUnreadNotifications: () => {
        set({ unreadNotifications: 0 });
      },
    }),
    {
      name: 'dashboard-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      
      /**
       * TEACHING MOMENT: Partial Persistence
       * 
       * We can choose which parts of state to persist
       * For example, we might not want to persist dateRange
       * since it should reset on page reload
       */
      partialize: (state) => ({
        widgets: state.widgets,
        theme: state.theme,
        // Note: dateRange and unreadNotifications are NOT persisted
      }),
    }
  )
);

/**
 * TEACHING MOMENT: How to Use This Store in Components
 * 
 * Example 1: Read state
 * ```tsx
 * const isSidebarCollapsed = useDashboardStore((state) => state.isSidebarCollapsed);
 * ```
 * 
 * Example 2: Call action
 * ```tsx
 * const toggleSidebar = useDashboardStore((state) => state.toggleSidebar);
 * 
 * <button onClick={toggleSidebar}>Toggle</button>
 * ```
 * 
 * Example 3: Read multiple values
 * ```tsx
 * const { widgets, reorderWidgets } = useDashboardStore((state) => ({
 *   widgets: state.widgets,
 *   reorderWidgets: state.reorderWidgets,
 * }));
 * ```
 * 
 * Component automatically re-renders when state changes!
 */

/**
 * TEACHING MOMENT: Why Zustand over Redux?
 * 
 * Redux:
 * - Requires actions, reducers, store setup
 * - Boilerplate code is complex
 * - Need to wrap app in Provider
 * 
 * Zustand:
 * - Single function to create store
 * - No providers needed
 * - Less code, same functionality
 * - Better TypeScript support
 * 
 * For this admin dashboard, Zustand is perfect!
 */