"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Search,
  Home,
  Users,
  Camera,
  Calendar,
  CreditCard,
  Star,
  AlertTriangle,
  Settings,
  Bell,
  BarChart3,
  FileText,
  LogOut,
  Moon,
  Sun,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalShortcuts, getShortcutDisplay } from "@/hooks/use-keyboard-shortcuts";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  category: "navigation" | "actions" | "settings";
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Define all commands
  const commands: CommandItem[] = React.useMemo(
    () => [
      // Navigation
      {
        id: "nav-dashboard",
        label: "Dashboard",
        description: "Go to main dashboard",
        icon: Home,
        category: "navigation",
        action: () => {
          router.push("/");
          onOpenChange(false);
        },
      },
      {
        id: "nav-users",
        label: "Users",
        description: "Manage all users",
        icon: Users,
        category: "navigation",
        action: () => {
          router.push("/users");
          onOpenChange(false);
        },
      },
      {
        id: "nav-photographers",
        label: "Photographers",
        description: "Manage photographers",
        icon: Camera,
        category: "navigation",
        action: () => {
          router.push("/photographers");
          onOpenChange(false);
        },
      },
      {
        id: "nav-bookings",
        label: "Bookings",
        description: "View all bookings",
        icon: Calendar,
        category: "navigation",
        action: () => {
          router.push("/bookings");
          onOpenChange(false);
        },
      },
      {
        id: "nav-payments",
        label: "Payments",
        description: "Manage payments",
        icon: CreditCard,
        category: "navigation",
        action: () => {
          router.push("/payments");
          onOpenChange(false);
        },
      },
      {
        id: "nav-reviews",
        label: "Reviews",
        description: "Moderate reviews",
        icon: Star,
        category: "navigation",
        action: () => {
          router.push("/reviews");
          onOpenChange(false);
        },
      },
      {
        id: "nav-disputes",
        label: "Disputes",
        description: "Manage disputes",
        icon: AlertTriangle,
        category: "navigation",
        action: () => {
          router.push("/disputes");
          onOpenChange(false);
        },
      },
      {
        id: "nav-analytics",
        label: "Analytics",
        description: "View analytics dashboard",
        icon: BarChart3,
        category: "navigation",
        action: () => {
          router.push("/analytics");
          onOpenChange(false);
        },
      },
      {
        id: "nav-notifications",
        label: "Notifications",
        description: "View notifications",
        icon: Bell,
        category: "navigation",
        action: () => {
          router.push("/notifications");
          onOpenChange(false);
        },
      },
      {
        id: "nav-settings",
        label: "Settings",
        description: "Platform settings",
        icon: Settings,
        category: "navigation",
        action: () => {
          router.push("/settings");
          onOpenChange(false);
        },
      },
      // Actions
      {
        id: "action-pending-verifications",
        label: "Pending Verifications",
        description: "View photographers awaiting verification",
        icon: FileText,
        category: "actions",
        action: () => {
          router.push("/photographers/pending");
          onOpenChange(false);
        },
      },
      {
        id: "action-open-disputes",
        label: "Open Disputes",
        description: "View unresolved disputes",
        icon: AlertTriangle,
        category: "actions",
        action: () => {
          router.push("/disputes?status=OPEN");
          onOpenChange(false);
        },
      },
    ],
    [router, onOpenChange]
  );

  // Filter commands based on search
  const filteredCommands = React.useMemo(() => {
    if (!search.trim()) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(searchLower) ||
        cmd.description?.toLowerCase().includes(searchLower)
    );
  }, [commands, search]);

  // Group commands by category
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      actions: [],
      settings: [],
    };

    for (const cmd of filteredCommands) {
      groups[cmd.category].push(cmd);
    }

    return groups;
  }, [filteredCommands]);

  // Reset selection when search changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    },
    [filteredCommands, selectedIndex]
  );

  const categoryLabels = {
    navigation: "Navigation",
    actions: "Quick Actions",
    settings: "Settings",
  };

  let currentItemIndex = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden p-0 sm:max-w-lg"
      >
        {/* Search Input */}
        <div className="flex items-center border-b px-4">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex h-12 w-full rounded-none border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => {
              if (items.length === 0) return null;

              return (
                <div key={category} className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </div>
                  {items.map((item) => {
                    currentItemIndex++;
                    const isSelected = currentItemIndex === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(currentItemIndex)}
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors",
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="mr-3 h-4 w-4 shrink-0 opacity-70" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{item.label}</span>
                          {item.description && (
                            <span className="text-xs text-muted-foreground">
                              {item.description}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">↑</span>
            </kbd>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">↓</span>
            </kbd>
            <span>to navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              ↵
            </kbd>
            <span>to select</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for managing command palette state with global keyboard shortcut
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = React.useState(false);

  useGlobalShortcuts({
    onCommandPalette: () => setIsOpen(true),
    onEscape: () => setIsOpen(false),
  });

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
    setIsOpen,
  };
}
