"use client";

import { useCallback, useRef } from "react";
import toast from "react-hot-toast";

interface UndoableAction<T = unknown> {
  /** The action to perform */
  action: () => Promise<T> | T;
  /** The undo action to call if user clicks undo */
  undo: () => Promise<void> | void;
  /** Success message to show */
  successMessage: string;
  /** Duration to show the toast (default: 5000ms) */
  duration?: number;
  /** Optional: description shown below the message */
  description?: string;
}

interface ToastUndoResult<T> {
  /** The result of the action if successful */
  result?: T;
  /** Whether the action was undone */
  wasUndone: boolean;
}

/**
 * Hook for showing toast notifications with undo functionality
 *
 * Usage:
 * const { executeWithUndo } = useToastUndo();
 *
 * executeWithUndo({
 *   action: () => deleteItem(id),
 *   undo: () => restoreItem(id),
 *   successMessage: "Item deleted",
 * });
 */
export function useToastUndo() {
  const undoTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const executeWithUndo = useCallback(
    async <T = unknown>(options: UndoableAction<T>): Promise<ToastUndoResult<T>> => {
      const {
        action,
        undo,
        successMessage,
        duration = 5000,
        description,
      } = options;

      let wasUndone = false;
      let result: T | undefined;

      try {
        // Execute the action
        result = await action();

        // Generate unique toast ID
        const toastId = `undo-${Date.now()}`;

        // Show success toast with undo button
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <svg
                      className="h-5 w-5 text-green-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {successMessage}
                    </p>
                    {description && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200 dark:border-gray-700">
                <button
                  onClick={async () => {
                    // Clear the timer
                    const timer = undoTimersRef.current.get(toastId);
                    if (timer) {
                      clearTimeout(timer);
                      undoTimersRef.current.delete(toastId);
                    }

                    // Execute undo
                    try {
                      await undo();
                      wasUndone = true;
                      toast.dismiss(t.id);
                      toast.success("Action undone", { duration: 2000 });
                    } catch (error) {
                      toast.error("Failed to undo action");
                    }
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-teal-600 hover:text-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  Undo
                </button>
              </div>
            </div>
          ),
          {
            id: toastId,
            duration,
          }
        );

        // Set a timer to clean up the undo timer map
        const cleanupTimer = setTimeout(() => {
          undoTimersRef.current.delete(toastId);
        }, duration);
        undoTimersRef.current.set(toastId, cleanupTimer);

        return { result, wasUndone };
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Action failed"
        );
        throw error;
      }
    },
    []
  );

  return { executeWithUndo };
}

/**
 * Simple toast helper with common patterns
 */
export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      duration: 3000,
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      duration: 4000,
    });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  promise: async <T = unknown>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> => {
    return toast.promise(promise, messages);
  },

  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
};

/**
 * Hook for confirmation before action with auto-undo on page leave
 */
export function useConfirmableAction() {
  const pendingActionsRef = useRef<Map<string, () => Promise<void>>>(new Map());

  const executeWithConfirmation = useCallback(
    async <T = unknown>(options: {
      action: () => Promise<T> | T;
      confirmMessage?: string;
      successMessage: string;
      errorMessage?: string;
    }): Promise<T | null> => {
      const {
        action,
        confirmMessage,
        successMessage,
        errorMessage = "Action failed",
      } = options;

      if (confirmMessage && !window.confirm(confirmMessage)) {
        return null;
      }

      try {
        const result = await action();
        toast.success(successMessage);
        return result;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : errorMessage
        );
        return null;
      }
    },
    []
  );

  return { executeWithConfirmation };
}
