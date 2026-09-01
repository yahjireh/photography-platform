"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { AlertTriangle, Trash2, Ban, XCircle } from "lucide-react";

type ConfirmVariant = "danger" | "warning" | "default";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconClass: "text-destructive",
    buttonVariant: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-500",
    buttonVariant: "default" as const,
  },
  default: {
    icon: XCircle,
    iconClass: "text-muted-foreground",
    buttonVariant: "default" as const,
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-muted ${config.iconClass}`}>
              <Icon className="size-5" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// useConfirm Hook
// ============================================

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  isLoading: boolean;
  resolve: ((value: boolean) => void) | null;
}

const initialState: ConfirmState = {
  isOpen: false,
  isLoading: false,
  title: "",
  description: "",
  resolve: null,
};

export function useConfirm() {
  const [state, setState] = React.useState<ConfirmState>(initialState);

  const confirm = React.useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          ...options,
          isOpen: true,
          isLoading: false,
          resolve,
        });
      });
    },
    []
  );

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      setState((prev) => {
        prev.resolve?.(false);
        return initialState;
      });
    }
  }, []);

  const handleConfirm = React.useCallback(() => {
    setState((prev) => {
      prev.resolve?.(true);
      return initialState;
    });
  }, []);

  const ConfirmDialogComponent = React.useCallback(
    () => (
      <ConfirmDialog
        open={state.isOpen}
        onOpenChange={handleOpenChange}
        title={state.title}
        description={state.description}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        variant={state.variant}
        onConfirm={handleConfirm}
        isLoading={state.isLoading}
      />
    ),
    [state, handleOpenChange, handleConfirm]
  );

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}

// Convenience methods for common confirmations
export function useConfirmDelete() {
  const { confirm, ConfirmDialog } = useConfirm();

  const confirmDelete = React.useCallback(
    (itemName: string) =>
      confirm({
        title: "Delete " + itemName + "?",
        description: `This action cannot be undone. Are you sure you want to permanently delete this ${itemName.toLowerCase()}?`,
        confirmLabel: "Delete",
        variant: "danger",
      }),
    [confirm]
  );

  return { confirmDelete, ConfirmDialog };
}

export function useConfirmSuspend() {
  const { confirm, ConfirmDialog } = useConfirm();

  const confirmSuspend = React.useCallback(
    (userName: string) =>
      confirm({
        title: "Suspend User?",
        description: `Are you sure you want to suspend ${userName}? They will no longer be able to access the platform.`,
        confirmLabel: "Suspend",
        variant: "danger",
      }),
    [confirm]
  );

  return { confirmSuspend, ConfirmDialog };
}

export function useConfirmReject() {
  const { confirm, ConfirmDialog } = useConfirm();

  const confirmReject = React.useCallback(
    (itemName: string) =>
      confirm({
        title: "Reject " + itemName + "?",
        description: `Are you sure you want to reject this ${itemName.toLowerCase()}? This action may require manual review to undo.`,
        confirmLabel: "Reject",
        variant: "warning",
      }),
    [confirm]
  );

  return { confirmReject, ConfirmDialog };
}
