'use client';

import React, { useState, useEffect } from 'react';
import { X, Megaphone, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { cn } from '@/lib/utils';

export interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  active: boolean;
  expiresAt?: string;
  createdAt: string;
}

interface AnnouncementStore {
  announcements: Announcement[];
  dismissedIds: string[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
  removeAnnouncement: (id: string) => void;
  dismissAnnouncement: (id: string) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  getActiveAnnouncements: () => Announcement[];
}

export const useAnnouncementStore = create<AnnouncementStore>()(
  persist(
    (set, get) => ({
      announcements: [],
      dismissedIds: [],

      addAnnouncement: (announcement) => {
        const newAnnouncement: Announcement = {
          ...announcement,
          id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          announcements: [newAnnouncement, ...state.announcements],
        }));
      },

      removeAnnouncement: (id) => {
        set((state) => ({
          announcements: state.announcements.filter((a) => a.id !== id),
        }));
      },

      dismissAnnouncement: (id) => {
        set((state) => ({
          dismissedIds: [...state.dismissedIds, id],
        }));
      },

      updateAnnouncement: (id, updates) => {
        set((state) => ({
          announcements: state.announcements.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      getActiveAnnouncements: () => {
        const state = get();
        const now = new Date().toISOString();
        return state.announcements.filter(
          (a) =>
            a.active &&
            !state.dismissedIds.includes(a.id) &&
            (!a.expiresAt || a.expiresAt > now)
        );
      },
    }),
    {
      name: 'admin-announcements',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

const TYPE_STYLES = {
  info: {
    bg: 'bg-blue-600',
    icon: Info,
  },
  warning: {
    bg: 'bg-yellow-500',
    icon: AlertTriangle,
  },
  success: {
    bg: 'bg-green-600',
    icon: CheckCircle,
  },
  urgent: {
    bg: 'bg-red-600',
    icon: Megaphone,
  },
};

export function AnnouncementBanner() {
  const { getActiveAnnouncements, dismissAnnouncement } = useAnnouncementStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const active = getActiveAnnouncements();
  if (active.length === 0) return null;

  const announcement = active[0]; // Show most recent
  const style = TYPE_STYLES[announcement.type];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        style.bg,
        'text-white px-4 py-2 flex items-center justify-between text-sm'
      )}
    >
      <div className="flex items-center gap-2 flex-1">
        <Icon className="w-4 h-4 shrink-0" />
        <span>{announcement.message}</span>
        {active.length > 1 && (
          <span className="text-white/70 text-xs ml-2">
            +{active.length - 1} more
          </span>
        )}
      </div>
      <button
        onClick={() => dismissAnnouncement(announcement.id)}
        className="p-1 hover:bg-white/20 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
