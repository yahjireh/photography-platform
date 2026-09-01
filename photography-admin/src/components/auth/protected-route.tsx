/**
 * Protected Route Component
 * Ensures user is authenticated and has admin privileges before accessing protected pages
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokenManager, adminAPI } from '@/lib/api-client';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      const token = tokenManager.getToken();

      // No token - redirect to login immediately
      if (!token) {
        router.push('/login');
        return;
      }

      // Token exists - verify it's valid by making an API call
      try {
        // Try to fetch admin profile - this verifies:
        // 1. Token is valid
        // 2. User is authenticated
        // 3. User has ADMIN role
        await adminAPI.get('/profile');

        // Success - user is authenticated and is admin
        setIsAuthenticated(true);
      } catch (error) {
        // Token is invalid or user is not admin
        console.error('Authentication validation failed:', error);
        tokenManager.removeToken();
        router.push('/login');
      } finally {
        setIsValidating(false);
      }
    };

    validateAuth();
  }, [router]);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show nothing (already redirecting)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated and authorized - show protected content
  return <>{children}</>;
}
