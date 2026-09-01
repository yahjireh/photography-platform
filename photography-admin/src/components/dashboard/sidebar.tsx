/**
 * Sidebar Component - Fixed Width (No Collapse)
 * 
 * SIMPLIFIED VERSION:
 * - Always 280px wide on desktop
 * - Mobile: Overlay that can be toggled
 * - No collapse/expand animations
 * - Cleaner, simpler code
 * - No state synchronization issues
 * 
 * Features:
 * - Column layout for user profile (avatar, name, email stacked)
 * - Centered navigation items
 * - Curved "concave" active state design
 * - Active users section
 * - World map visualization
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Camera,
  Calendar,
  Wallet,
  Scale,
  Star,
  BarChart3,
  Settings,
  X,
  Globe,
  ShieldCheck,
  Server,
  MessageSquare,
  Smartphone,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDashboardStore } from '@/store/dashboard-store';
import { cn } from '@/lib/utils';
import { useAdminProfile, useAdminFullName, useAdminInitials } from '@/hooks/use-admin-profile';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { useActiveUsers } from '@/hooks/use-active-users';

const icons = {
  LayoutDashboard,
  Users,
  Camera,
  Calendar,
  Wallet,
  Scale,
  Star,
  BarChart3,
  Settings,
  ShieldCheck,
  Server,
  MessageSquare,
  Smartphone,
};

const navigation = [
  { name: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { name: 'Users', href: '/users', icon: 'Users' },
  { name: 'Photographers', href: '/photographers', icon: 'Camera' },
  { name: 'KYC Verification', href: '/photographers/pending', icon: 'ShieldCheck' },
  { name: 'Bookings', href: '/bookings', icon: 'Calendar' },
  { name: 'Payments', href: '/payments', icon: 'Wallet' },
  { name: 'Disputes', href: '/disputes', icon: 'Scale' },
  { name: 'Reviews', href: '/reviews', icon: 'Star' },
  { name: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { name: 'Communication', href: '/communication', icon: 'MessageSquare' },
  { name: 'System', href: '/system', icon: 'Server' },
  { name: 'Mobile App', href: '/mobile', icon: 'Smartphone' },
  { name: 'Settings', href: '/settings', icon: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileMenuOpen, closeMobileMenu } = useDashboardStore();
  const { data: adminProfile } = useAdminProfile();
  const adminFullName = useAdminFullName();
  const adminInitials = useAdminInitials();
  const { data: stats } = useDashboardStats();
  const { data: activeUsersData } = useActiveUsers();

  // Get dynamic badge counts
  const badges = {
    photographers: stats?.pendingVerifications || 0,
    disputes: stats?.openDisputes || 0,
  };

  /**
   * TEACHING MOMENT: Fixed Sidebar vs Collapsible
   * 
   * OLD WAY (Collapsible):
   * - Width changes: 80px ↔ 280px
   * - Complex state synchronization
   * - Margin adjustments needed everywhere
   * - Can cause layout issues
   * 
   * NEW WAY (Fixed):
   * - Always 280px on desktop
   * - Simple, predictable layout
   * - No synchronization needed
   * - Standard admin dashboard pattern
   * 
   * Mobile still uses overlay pattern (best practice)
   */

  return (
    <>
      {/**
       * BACKDROP (Mobile Only)
       * Dark overlay behind sidebar on mobile
       * Click to close the mobile menu
       */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileMenu}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/**
       * SIDEBAR
       * Desktop: Always visible, fixed at 280px
       * Mobile: Overlay that slides in from left
       */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{
          x: isMobileMenuOpen ? 0 : -300, // Mobile: slide in/out
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className={cn(
          'fixed left-0 top-0 h-screen w-[280px]',
          'bg-sidebar flex flex-col z-50 rounded-r-[32px] shadow-xl',
          'transition-transform duration-300',
          // Mobile: hidden by default
          '-translate-x-full',
          // Mobile: show when menu open
          isMobileMenuOpen && 'translate-x-0',
          // Desktop: always visible (overrides mobile)
          'lg:!translate-x-0' // ! forces it to override
        )}
      >
        {/**
         * CLOSE BUTTON (Mobile Only)
         * Shows X button in top-right on mobile
         */}
        <button
          onClick={closeMobileMenu}
          className="absolute top-4 right-4 lg:hidden p-2 rounded-lg hover:bg-sidebar-hover transition-colors"
        >
          <X className="h-5 w-5 text-gray-400 hover:text-white" />
        </button>

        {/* Header - Admin Profile (Column Layout) */}
        <div className="p-6 border-b border-sidebar-hover">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-16 w-16 ring-4 ring-accent-gold/30 mb-3">
              <AvatarImage src={adminProfile?.profile_image_url || undefined} alt={adminFullName} />
              <AvatarFallback className="bg-accent-gold text-sidebar text-xl font-bold">
                {adminInitials}
              </AvatarFallback>
            </Avatar>

            <div className="w-full">
              <p className="text-base font-bold text-white mb-1">
                {adminFullName.toUpperCase()}
              </p>
              <p className="text-xs text-gray-400">
                {adminProfile?.email || 'Loading...'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - Centered */}
        <ScrollArea className="flex-1 px-4 py-8">
          <nav className="space-y-2">
            {navigation.map((item, index) => {
              const Icon = icons[item.icon as keyof typeof icons];
              const isActive = pathname === item.href;

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <Link href={item.href} onClick={closeMobileMenu}>
                    <motion.div
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative',
                        'group',
                        isActive
                          ? 'bg-sidebar-active text-white'
                          : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
                      )}
                    >
                      {/* Curved Active Indicator (Reference Design) */}
                      {isActive && (
                        <>
                          {/* Left concave curve */}
                          <motion.div
                            layoutId="active-curve"
                            className="absolute -left-4 top-0 w-4 h-full"
                            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                          >
                            <div className="absolute top-0 right-0 w-4 h-6 bg-sidebar rounded-br-full" />
                            <div className="absolute bottom-0 right-0 w-4 h-6 bg-sidebar rounded-tr-full" />
                          </motion.div>
                          
                          {/* Right rounded edge */}
                          <motion.div
                            className="absolute -right-4 top-0 bottom-0 w-4 bg-sidebar-active rounded-l-2xl"
                          />
                        </>
                      )}

                      <Icon className={cn(
                        'h-5 w-5 shrink-0',
                        isActive ? 'text-accent-gold' : 'text-gray-400 group-hover:text-accent-gold'
                      )} />

                      <span className="flex-1 text-sm font-medium">
                        {item.name}
                      </span>

                      {/* Badge */}
                      {item.name === 'Photographers' && badges.photographers > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-accent-gold text-sidebar text-xs font-bold px-2"
                        >
                          {badges.photographers}
                        </Badge>
                      )}
                      {item.name === 'KYC Verification' && badges.photographers > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-red-500 text-white text-xs font-bold px-2"
                        >
                          {badges.photographers}
                        </Badge>
                      )}
                      {item.name === 'Disputes' && badges.disputes > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-accent-gold text-sidebar text-xs font-bold px-2"
                        >
                          {badges.disputes}
                        </Badge>
                      )}
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Active Users Section */}
        <div className="p-4 border-t border-sidebar-hover">
          <p className="text-xs font-semibold text-accent-gold mb-3 uppercase tracking-wider">
            Active Users
          </p>

          <div className="flex items-center -space-x-3 mb-4">
            {activeUsersData?.users.slice(0, 4).map((user) => {
              const userName = `${user.firstName} ${user.lastName}`;
              const userInitials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
              return (
                <Avatar
                  key={user.id}
                  className="h-9 w-9 ring-2 ring-sidebar border-2 border-sidebar hover:z-10 transition-all cursor-pointer"
                >
                  <AvatarImage src={user.profileImageUrl || undefined} alt={userName} />
                  <AvatarFallback className="text-xs bg-accent-teal text-white font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              );
            })}
            {activeUsersData && activeUsersData.totalActive > 4 && (
              <div className="h-9 w-9 rounded-full bg-sidebar-hover ring-2 ring-sidebar flex items-center justify-center text-xs font-bold text-accent-gold cursor-pointer hover:bg-sidebar-active transition-colors">
                +{activeUsersData.totalActive - 4}
              </div>
            )}
          </div>

          {/* World Map Illustration */}
          <div className="relative h-24 bg-sidebar-hover/30 rounded-xl p-3 overflow-hidden">
            <Globe className="absolute inset-0 m-auto h-20 w-20 text-accent-teal/20" />

            {/* Connection lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Line from top-right to center */}
              <line
                x1="calc(100% - 12px)"
                y1="12px"
                x2="50%"
                y2="50%"
                stroke="rgb(20 184 166 / 0.3)"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              {/* Line from center to bottom-left */}
              <line
                x1="50%"
                y1="50%"
                x2="12px"
                y2="calc(100% - 12px)"
                stroke="rgb(251 191 36 / 0.3)"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="animate-pulse"
                style={{ animationDelay: '0.5s' }}
              />
              {/* Line from bottom-left to top-right */}
              <line
                x1="12px"
                y1="calc(100% - 12px)"
                x2="calc(100% - 12px)"
                y2="12px"
                stroke="rgb(20 184 166 / 0.3)"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="animate-pulse"
                style={{ animationDelay: '1s' }}
              />
            </svg>

            {/* Animated connection dots */}
            <div className="absolute top-3 right-3 z-10">
              <div className="h-2 w-2 rounded-full bg-accent-gold animate-pulse" />
            </div>
            <div className="absolute bottom-3 left-3 z-10">
              <div className="h-2 w-2 rounded-full bg-accent-teal animate-pulse"
                   style={{ animationDelay: '0.5s' }} />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="h-2 w-2 rounded-full bg-accent-gold animate-pulse"
                   style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

/**
 * TEACHING MOMENT: Benefits of Fixed Sidebar
 * 
 * 1. SIMPLER CODE:
 *    - No width animations
 *    - No conditional rendering of text/icons
 *    - No tooltips needed
 * 
 * 2. BETTER UX:
 *    - Navigation always visible
 *    - Consistent layout
 *    - Standard admin dashboard pattern
 * 
 * 3. EASIER MAINTENANCE:
 *    - No state synchronization bugs
 *    - No margin calculation issues
 *    - Fixed values throughout
 * 
 * 4. BETTER PERFORMANCE:
 *    - No AnimatePresence on every item
 *    - Fewer re-renders
 *    - Simpler CSS
 */

/**
 * MOBILE BEHAVIOR:
 * 
 * - Sidebar slides in from left as overlay
 * - Backdrop (dark overlay) behind it
 * - Click backdrop or X button to close
 * - Clicking nav item also closes menu
 * 
 * This is the standard mobile menu pattern used by:
 * - Tailwind UI
 * - Material UI
 * - Bootstrap
 * - Most admin dashboards
 */