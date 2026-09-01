"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flag, AlertTriangle } from "lucide-react";

interface FlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: (reason: string) => void | Promise<void>;
  isLoading?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  confirmLabel?: string;
}

export function FlagDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isLoading = false,
  inputLabel = "Reason",
  inputPlaceholder = "Please describe the reason...",
  confirmLabel = "Flag",
}: FlagDialogProps) {
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState("");

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason");
      return;
    }
    setError("");
    await onConfirm(reason.trim());
    setReason("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Flag className="size-5" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label
            htmlFor="flag-reason"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {inputLabel}
          </label>
          <Input
            id="flag-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            placeholder={inputPlaceholder}
            className={error ? "border-destructive" : ""}
            autoFocus
          />
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="size-3" />
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for using the flag dialog
export function useFlagDialog() {
  const [isOpen, setIsOpen] = React.useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    setIsOpen,
  };
}
