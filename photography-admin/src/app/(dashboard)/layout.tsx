/**
 * Dashboard Layout - Fixed Sidebar Version
 * 
 * File location: src/app/(dashboard)/layout.tsx
 * 
 * SIMPLIFIED VERSION:
 * - Sidebar always 280px on desktop
 * - Fixed margins throughout
 * - No collapse/expand logic
 * - Mobile overlay behavior kept
 * 
 * This layout automatically wraps ALL pages inside the (dashboard) folder
 * No need to manually wrap each page!
 */

'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { CommandPalette, useCommandPalette } from '@/components/shared/command-palette';
import { AnnouncementBanner } from '@/components/shared/announcement-banner';
import { RouteProgressBar } from '@/components/shared/route-progress-bar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Command palette state and keyboard shortcuts
  const commandPalette = useCommandPalette();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Progress Feedback */}
        <RouteProgressBar />

        {/* Announcement Banner - Platform-wide */}
        <AnnouncementBanner />

        {/**
         * SIDEBAR
         * Desktop: Always visible, fixed at 280px
         * Mobile: Overlay (controlled by mobile menu state)
         */}
        <Sidebar />

        {/**
         * HEADER
         * Desktop: Fixed 280px left margin
         * Mobile: Full width
         */}
        <Header />

        {/**
         * MAIN CONTENT AREA
         *
         * THE FIX: Always use 280px margin on desktop!
         * No more conditional logic or state checking
         */}
        <main
          className={cn(
            // Base styles
            'min-h-screen transition-all duration-300',
            // Padding for content breathing room
            'p-4 lg:p-6',

            /**
             * FIXED MARGIN - This fixes the gap!
             *
             * Desktop (≥1024px): 280px left margin
             * Mobile (<1024px): No margin (full width)
             *
             * This matches the sidebar width perfectly!
             */
            'lg:ml-[280px]', // Fixed 280px margin

            // Account for header height (h-16 = 64px)
            'pt-20' // Header height (64px) + spacing
          )}
        >
          {/**
           * Content container with max width
           * Prevents content from being too wide on large screens
           */}
          <div className="max-w-[1600px] mx-auto">
            {/**
             * {children} = Your page content
             *
             * Any page inside (dashboard) folder appears here:
             * - page.tsx → Dashboard home
             * - users/page.tsx → Users page
             * - bookings/page.tsx → Bookings page
             */}
            {children}
          </div>
        </main>

        {/* Command Palette - Cmd+K / Ctrl+K to open */}
        <CommandPalette
          open={commandPalette.isOpen}
          onOpenChange={commandPalette.setIsOpen}
        />
      </div>
    </ProtectedRoute>
  );
}

/**
 * TEACHING MOMENT: Layout Structure
 * 
 * ┌──────────┬───────────────────────┐
 * │          │                       │
 * │ Sidebar  │      Header           │
 * │ (280px)  │    (lg:ml-[280px])   │
 * │          ├───────────────────────┤
 * │  Always  │                       │
 * │  Visible │      Content          │
 * │          │    (lg:ml-[280px])   │
 * └──────────┴───────────────────────┘
 * 
 * All three align perfectly with 280px!
 */

/**
 * MOBILE BEHAVIOR:
 * 
 * ┌────────────────────┐
 * │                    │
 * │   Full Width       │
 * │   Header           │
 * ├────────────────────┤
 * │                    │
 * │   Full Width       │
 * │   Content          │
 * └────────────────────┘
 * 
 * [Sidebar appears as overlay when menu button clicked]
 */

/**
 * File Structure:
 * 
 * src/app/
 * ├── (dashboard)/
 * │   ├── layout.tsx           ← This file
 * │   ├── page.tsx             ← Dashboard home (/)
 * │   ├── users/
 * │   │   └── page.tsx         ← /users
 * │   ├── photographers/
 * │   │   └── page.tsx         ← /photographers
 * │   └── bookings/
 * │       └── page.tsx         ← /bookings
 * │
 * └── layout.tsx               ← Root layout
 */

/**
 * Benefits of This Approach:
 * 
 * 1. ✅ No gap between sidebar and content
 * 2. ✅ Simple, predictable layout
 * 3. ✅ No state synchronization issues
 * 4. ✅ Easy to maintain
 * 5. ✅ Standard admin dashboard pattern
 * 6. ✅ Works on all screen sizes
 */