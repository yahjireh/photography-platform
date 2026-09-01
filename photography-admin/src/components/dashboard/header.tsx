/**
 * Header Component - Fixed Sidebar Version
 * 
 * SIMPLIFIED VERSION:
 * - Always uses 280px left margin on desktop
 * - No collapse/expand logic
 * - Cleaner, simpler code
 * - Mobile menu toggle button kept for mobile overlay
 * 
 * Features:
 * - Animated greeting with sun/moon icon + digital clock (far left)
 * - Breadcrumbs (middle-left)
 * - Search bar (right)
 * - Notifications with badge (right)
 * - Dark mode toggle (right)
 * - User menu dropdown (far right)
 * - Fully responsive
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDashboardStore } from '@/store/dashboard-store';
import { cn } from '@/lib/utils';
import { useNotifications, useUnreadCount, useMarkNotificationAsRead } from '@/hooks/use-notifications';
import { useAdminProfile, useAdminFullName, useAdminInitials } from '@/hooks/use-admin-profile';
import { useLogout } from '@/hooks/use-auth';
import { useWebSocketStatus } from '@/hooks/use-websocket';
import { toast } from 'sonner';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    openMobileMenu,
    theme,
    toggleTheme
  } = useDashboardStore();

  // Fetch real data from API
  const { data: notificationsData } = useNotifications();
  const unreadNotifications = useUnreadCount();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { data: adminProfile } = useAdminProfile();
  const adminFullName = useAdminFullName();
  const adminInitials = useAdminInitials();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const wsStatus = useWebSocketStatus();

  // Track previous unread count for toast notifications
  const previousUnreadCount = useRef(unreadNotifications);

  // Time-based greeting state
  const [greeting, setGreeting] = useState('Good Morning');
  const [currentTime, setCurrentTime] = useState('');
  const [isDaytime, setIsDaytime] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Update time and greeting every second
  useEffect(() => {
    const updateTimeAndGreeting = () => {
      const now = new Date();
      const hours = now.getHours();

      // Format time as HH:MM:SS
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setCurrentTime(timeString);

      // Set greeting based on time
      if (hours >= 5 && hours < 12) {
        setGreeting('Good Morning');
        setIsDaytime(true);
      } else if (hours >= 12 && hours < 17) {
        setGreeting('Good Afternoon');
        setIsDaytime(true);
      } else {
        setGreeting('Good Evening');
        setIsDaytime(false);
      }
    };

    updateTimeAndGreeting();
    const interval = setInterval(updateTimeAndGreeting, 1000);

    return () => clearInterval(interval);
  }, []);

  // Show toast notification when new notifications arrive
  useEffect(() => {
    if (unreadNotifications > previousUnreadCount.current && previousUnreadCount.current >= 0) {
      toast.success('You have new notifications!', {
        description: `${unreadNotifications - previousUnreadCount.current} new notification(s)`,
      });
    }
    previousUnreadCount.current = unreadNotifications;
  }, [unreadNotifications]);

  // Handler for notification click
  const handleNotificationClick = (notificationId: string, link?: string) => {
    markAsRead(notificationId);
    if (link) {
      router.push(link);
    }
  };

  // Handler for logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    
    if (paths.length === 0) {
      return [{ label: 'Dashboard', href: '/' }];
    }

    const breadcrumbs = [{ label: 'Dashboard', href: '/' }];
    
    let currentPath = '';
    paths.forEach((path) => {
      currentPath += `/${path}`;
      const label = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbs.push({ label, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-white border-b border-gray-200',
        'transition-all duration-300',
        /**
         * FIXED MARGIN - No more conditional logic!
         * 
         * OLD WAY:
         * 'lg:ml-[80px]'
         * !isSidebarCollapsed && 'lg:ml-[280px]'
         * 
         * NEW WAY:
         * Always 280px on desktop, full width on mobile
         */
        'lg:ml-[280px]', // Fixed 280px margin on desktop to start after sidebar
        theme === 'dark' && 'bg-gray-900 border-gray-700',
        className
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-6 gap-4">
        {/* LEFT SECTION: Mobile Menu + Greeting + Clock + Breadcrumbs */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          <button
            onClick={openMobileMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>

          {/* Greeting with Animated Icon */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden xl:flex items-center gap-3 mr-4"
          >
            {/* Animated Sun/Moon Icon */}
            <motion.div
              animate={{
                rotate: isDaytime ? 360 : 0,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                scale: { duration: 2, repeat: Infinity },
              }}
              className={cn(
                'p-2 rounded-full',
                isDaytime ? 'bg-amber-100' : 'bg-indigo-100'
              )}
            >
              {isDaytime ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-500" />
              )}
            </motion.div>

            {/* Greeting Text */}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">
                {greeting}
              </span>
              <span className="text-xs text-gray-500 font-mono tabular-nums">
                {currentTime}
              </span>
            </div>
          </motion.div>

          {/* Breadcrumbs */}
          <nav className="hidden md:flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronDown className="h-4 w-4 text-gray-400 rotate-[-90deg]" />
                )}
                <a
                  href={crumb.href}
                  className={cn(
                    'font-medium transition-colors hover:text-accent-teal',
                    index === breadcrumbs.length - 1
                      ? 'text-gray-900'
                      : 'text-gray-500'
                  )}
                >
                  {crumb.label}
                </a>
              </div>
            ))}
          </nav>
        </div>

        {/* RIGHT SECTION: Search + Notifications + Dark Mode + User Menu */}
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <motion.div
            animate={{
              width: isSearchFocused ? 320 : 240,
            }}
            className="hidden md:block relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={cn(
                'w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200',
                'text-sm placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-accent-teal focus:border-transparent',
                'transition-all duration-200'
              )}
            />
          </motion.div>

          {/* Mobile Search Button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Search className="h-5 w-5 text-gray-600" />
          </button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadNotifications > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Badge className="h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </Badge>
                  </motion.div>
                )}
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="font-semibold">
                Notifications
                {unreadNotifications > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    ({unreadNotifications} unread)
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Real Notifications from API */}
              <div className="max-h-96 overflow-y-auto">
                {notificationsData?.notifications && notificationsData.notifications.length > 0 ? (
                  notificationsData.notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification.id, notification.link)}
                    />
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No notifications yet
                  </div>
                )}
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="justify-center text-accent-teal cursor-pointer"
                onClick={() => router.push('/notifications')}
              >
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Live System Status Indicator */}
          <div
            className={cn(
              "hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all",
              wsStatus.isConnected
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            )}
            title={wsStatus.isConnected ? `Backend Online (Port 3000) • ${(wsStatus as any).latency || 20}ms latency` : 'Backend Disconnected'}
          >
            <span className="relative flex h-2 w-2">
              {wsStatus.isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={cn('relative inline-flex rounded-full h-2 w-2', wsStatus.statusColor)}></span>
            </span>
            <span>{wsStatus.statusText}</span>
          </div>

          {/* Dark Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className={cn(
              'p-2 rounded-lg transition-colors',
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'hover:bg-gray-100'
            )}
          >
            <AnimatePresence mode="wait">
              {theme === 'dark' ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-5 w-5 text-indigo-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-5 w-5 text-amber-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Avatar className="h-9 w-9 ring-2 ring-accent-gold/30">
                  <AvatarImage src={adminProfile?.profile_image_url || undefined} alt={adminFullName} />
                  <AvatarFallback className="bg-accent-gold text-sidebar text-sm font-bold">
                    {adminInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:block text-sm font-medium text-gray-700">
                  {adminFullName}
                </span>
                <ChevronDown className="hidden lg:block h-4 w-4 text-gray-400" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">{adminFullName}</p>
                  <p className="text-xs text-gray-500">{adminProfile?.email || 'Loading...'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push('/profile')}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push('/settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

/**
 * Notification Item Component
 */
interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    link?: string;
  };
  onClick: () => void;
}

function NotificationItem({ notification, onClick }: NotificationItemProps) {
  // Calculate relative time
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - notificationTime.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return notificationTime.toLocaleDateString();
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors',
        !notification.read && 'bg-blue-50/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {notification.title}
            </p>
            {!notification.read && (
              <div className="h-2 w-2 rounded-full bg-accent-teal flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {getRelativeTime(notification.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * TEACHING MOMENT: Simplification Benefits
 * 
 * REMOVED:
 * - isSidebarCollapsed state
 * - Conditional margin logic
 * - toggleSidebar function
 * 
 * KEPT:
 * - openMobileMenu (still needed for mobile overlay)
 * - All visual features (greeting, search, notifications)
 * - All animations
 * 
 * RESULT:
 * - Simpler code
 * - No layout synchronization issues
 * - Easier to maintain
 * - More predictable behavior
 */