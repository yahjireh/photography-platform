/**
 * React Query Provider
 * Configures React Query for the entire application
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

/**
 * React Query configuration
 */
const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Cache time: Cached data is kept for 10 minutes
      gcTime: 10 * 60 * 1000,

      // Retry failed requests 2 times
      retry: 2,

      // Retry delay increases exponentially
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus in production only
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,

      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
};

/**
 * Providers component
 * Wraps the app with React Query provider
 */
export function Providers({ children }: { children: ReactNode }) {
  // Create a client instance
  // Using useState ensures it's only created once per session
  const [queryClient] = useState(() => new QueryClient(queryClientConfig));

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f1f5f9',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f1f5f9',
            },
          },
        }}
      />

      {/* React Query Devtools (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

/**
 * TEACHING MOMENT: Why use useState for QueryClient?
 *
 * We create the QueryClient inside useState to ensure it's:
 * 1. Only created once per session (not on every render)
 * 2. Persists across component re-renders
 * 3. Maintains cache between navigations
 *
 * Without useState:
 * const queryClient = new QueryClient(); // ❌ Creates new client on every render
 *
 * With useState:
 * const [queryClient] = useState(() => new QueryClient()); // ✅ Creates once
 */

/**
 * TEACHING MOMENT: React Query Configuration
 *
 * staleTime:
 * - How long data is considered "fresh"
 * - Fresh data won't trigger a refetch
 * - Example: If staleTime is 5 minutes, and you navigate back to a page
 *   within 5 minutes, it will show cached data without refetching
 *
 * gcTime (formerly cacheTime):
 * - How long unused data stays in cache
 * - After this time, data is garbage collected
 * - Example: If you navigate away from a page and don't return within 10 minutes,
 *   the data is cleared from cache
 *
 * retry:
 * - How many times to retry a failed request
 * - Useful for temporary network issues
 *
 * refetchOnWindowFocus:
 * - Whether to refetch when user returns to the tab
 * - Good for keeping data up-to-date
 * - Can be disabled in development to avoid unnecessary requests
 *
 * refetchOnMount:
 * - Whether to refetch when component mounts
 * - false means it only refetches if data is stale
 */
