"use client";

import { useEffect, useCallback, useRef } from "react";

type ModifierKey = "ctrl" | "meta" | "alt" | "shift";
type KeyCombo = {
  key: string;
  modifiers?: ModifierKey[];
};

interface ShortcutConfig {
  combo: KeyCombo;
  handler: () => void;
  description?: string;
  preventDefault?: boolean;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

/**
 * Parse a shortcut string like "cmd+k" or "ctrl+shift+s" into a KeyCombo
 */
export function parseShortcut(shortcut: string): KeyCombo {
  const parts = shortcut.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const modifiers: ModifierKey[] = [];

  for (let i = 0; i < parts.length - 1; i++) {
    const mod = parts[i];
    if (mod === "cmd" || mod === "meta") {
      modifiers.push("meta");
    } else if (mod === "ctrl" || mod === "control") {
      modifiers.push("ctrl");
    } else if (mod === "alt" || mod === "option") {
      modifiers.push("alt");
    } else if (mod === "shift") {
      modifiers.push("shift");
    }
  }

  return { key, modifiers };
}

/**
 * Format a KeyCombo back to a display string
 */
export function formatShortcut(combo: KeyCombo): string {
  const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac");
  const parts: string[] = [];

  if (combo.modifiers?.includes("meta")) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (combo.modifiers?.includes("ctrl")) {
    parts.push(isMac ? "⌃" : "Ctrl");
  }
  if (combo.modifiers?.includes("alt")) {
    parts.push(isMac ? "⌥" : "Alt");
  }
  if (combo.modifiers?.includes("shift")) {
    parts.push(isMac ? "⇧" : "Shift");
  }

  // Capitalize single letter keys
  const displayKey = combo.key.length === 1 ? combo.key.toUpperCase() : combo.key;
  parts.push(displayKey);

  return parts.join(isMac ? "" : "+");
}

/**
 * Check if a keyboard event matches a KeyCombo
 */
function matchesCombo(event: KeyboardEvent, combo: KeyCombo): boolean {
  const key = event.key.toLowerCase();

  // Check key match
  if (key !== combo.key.toLowerCase()) {
    return false;
  }

  // Check modifiers
  const hasCtrl = event.ctrlKey;
  const hasMeta = event.metaKey;
  const hasAlt = event.altKey;
  const hasShift = event.shiftKey;

  const wantsCtrl = combo.modifiers?.includes("ctrl") ?? false;
  const wantsMeta = combo.modifiers?.includes("meta") ?? false;
  const wantsAlt = combo.modifiers?.includes("alt") ?? false;
  const wantsShift = combo.modifiers?.includes("shift") ?? false;

  return (
    hasCtrl === wantsCtrl &&
    hasMeta === wantsMeta &&
    hasAlt === hasAlt &&
    hasShift === wantsShift
  );
}

/**
 * Hook for registering keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options;
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Skip if user is typing in an input/textarea/contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Only allow certain shortcuts in input fields (like Escape)
        const inInputShortcuts = shortcutsRef.current.filter(
          (s) => s.combo.key === "escape"
        );

        for (const shortcut of inInputShortcuts) {
          if (shortcut.enabled !== false && matchesCombo(event, shortcut.combo)) {
            if (shortcut.preventDefault !== false) {
              event.preventDefault();
            }
            shortcut.handler();
            return;
          }
        }
        return;
      }

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled !== false && matchesCombo(event, shortcut.combo)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler();
          return;
        }
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Common keyboard shortcuts hook for the admin dashboard
 */
export function useGlobalShortcuts(handlers: {
  onCommandPalette?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
  onSave?: () => void;
}) {
  const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac");

  const shortcuts: ShortcutConfig[] = [];

  // Command palette: Cmd+K (Mac) or Ctrl+K (Windows)
  if (handlers.onCommandPalette) {
    shortcuts.push({
      combo: { key: "k", modifiers: isMac ? ["meta"] : ["ctrl"] },
      handler: handlers.onCommandPalette,
      description: "Open command palette",
    });
  }

  // Search: Cmd+/ or Ctrl+/
  if (handlers.onSearch) {
    shortcuts.push({
      combo: { key: "/", modifiers: isMac ? ["meta"] : ["ctrl"] },
      handler: handlers.onSearch,
      description: "Focus search",
    });
  }

  // Escape
  if (handlers.onEscape) {
    shortcuts.push({
      combo: { key: "escape" },
      handler: handlers.onEscape,
      description: "Close/Cancel",
    });
  }

  // Save: Cmd+S (Mac) or Ctrl+S (Windows)
  if (handlers.onSave) {
    shortcuts.push({
      combo: { key: "s", modifiers: isMac ? ["meta"] : ["ctrl"] },
      handler: handlers.onSave,
      description: "Save",
    });
  }

  useKeyboardShortcuts(shortcuts);
}

/**
 * Get display string for common shortcuts
 */
export function getShortcutDisplay(shortcut: "commandPalette" | "search" | "save" | "escape"): string {
  const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac");

  switch (shortcut) {
    case "commandPalette":
      return isMac ? "⌘K" : "Ctrl+K";
    case "search":
      return isMac ? "⌘/" : "Ctrl+/";
    case "save":
      return isMac ? "⌘S" : "Ctrl+S";
    case "escape":
      return "Esc";
    default:
      return "";
  }
}
