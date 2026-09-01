"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, RefreshCw } from "lucide-react";

interface SessionTimeoutWarningProps {
  /** Session timeout in milliseconds (default: 30 minutes) */
  sessionTimeout?: number;
  /** Warning time before timeout in milliseconds (default: 5 minutes) */
  warningTime?: number;
  /** Callback when session extends */
  onExtendSession?: () => void;
  /** Callback when session expires */
  onSessionExpire?: () => void;
  /** Whether the component is enabled */
  enabled?: boolean;
}

/**
 * Session timeout warning component
 * Shows a warning dialog before the session expires
 */
export function SessionTimeoutWarning({
  sessionTimeout = 30 * 60 * 1000, // 30 minutes
  warningTime = 5 * 60 * 1000, // 5 minutes
  onExtendSession,
  onSessionExpire,
  enabled = true,
}: SessionTimeoutWarningProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const lastActivityRef = useRef<number>(Date.now());
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset activity timestamp
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setCountdown(0);

    // Clear existing timers
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Set new warning timer
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(Math.floor(warningTime / 1000));

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Session expired
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            onSessionExpire?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, sessionTimeout - warningTime);
  }, [sessionTimeout, warningTime, onSessionExpire]);

  // Track user activity
  useEffect(() => {
    if (!enabled) return;

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

    const handleActivity = () => {
      // Only reset if not showing warning
      if (!showWarning) {
        resetActivity();
      }
    };

    // Initial setup
    resetActivity();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [enabled, showWarning, resetActivity]);

  // Handle extend session
  const handleExtendSession = () => {
    setShowWarning(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    resetActivity();
    onExtendSession?.();
  };

  // Handle logout
  const handleLogout = () => {
    setShowWarning(false);
    onSessionExpire?.();
  };

  // Format countdown
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!enabled) return null;

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Clock className="size-5" />
            </div>
            <DialogTitle>Session Expiring Soon</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Your session will expire in{" "}
            <span className="font-bold text-amber-600 dark:text-amber-400 text-lg">
              {formatCountdown(countdown)}
            </span>
            . Would you like to continue your session?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${(countdown / (warningTime / 1000)) * 100}%`,
              }}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="size-4 mr-2" />
            Log Out
          </Button>
          <Button onClick={handleExtendSession}>
            <RefreshCw className="size-4 mr-2" />
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for managing session timeout
 */
export function useSessionTimeout(options?: {
  timeout?: number;
  warningTime?: number;
  onExpire?: () => void;
}) {
  const {
    timeout = 30 * 60 * 1000,
    warningTime = 5 * 60 * 1000,
    onExpire,
  } = options || {};

  const [isWarning, setIsWarning] = useState(false);

  const handleExtend = useCallback(() => {
    setIsWarning(false);
    // Typically you would refresh the auth token here
  }, []);

  const handleExpire = useCallback(() => {
    setIsWarning(false);
    onExpire?.();
    // Typically you would redirect to login here
    window.location.href = "/login";
  }, [onExpire]);

  return {
    isWarning,
    SessionTimeoutWarning: () => (
      <SessionTimeoutWarning
        sessionTimeout={timeout}
        warningTime={warningTime}
        onExtendSession={handleExtend}
        onSessionExpire={handleExpire}
        enabled={true}
      />
    ),
  };
}
