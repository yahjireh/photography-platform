'use client';

import { createContext, useContext } from 'react';

// Admin role types
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';

// Permission categories
export type Permission =
  | 'users.view' | 'users.edit' | 'users.delete' | 'users.suspend'
  | 'photographers.view' | 'photographers.edit' | 'photographers.verify' | 'photographers.delete'
  | 'bookings.view' | 'bookings.edit' | 'bookings.flag' | 'bookings.cancel'
  | 'payments.view' | 'payments.refund' | 'payments.export'
  | 'disputes.view' | 'disputes.resolve' | 'disputes.close'
  | 'reviews.view' | 'reviews.moderate' | 'reviews.delete'
  | 'analytics.view' | 'analytics.export'
  | 'settings.view' | 'settings.edit'
  | 'system.view' | 'system.manage' | 'system.backup'
  | 'messages.view' | 'messages.send' | 'messages.bulk'
  | 'audit.view' | 'audit.export';

// Role-permission mapping
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [
    'users.view', 'users.edit', 'users.delete', 'users.suspend',
    'photographers.view', 'photographers.edit', 'photographers.verify', 'photographers.delete',
    'bookings.view', 'bookings.edit', 'bookings.flag', 'bookings.cancel',
    'payments.view', 'payments.refund', 'payments.export',
    'disputes.view', 'disputes.resolve', 'disputes.close',
    'reviews.view', 'reviews.moderate', 'reviews.delete',
    'analytics.view', 'analytics.export',
    'settings.view', 'settings.edit',
    'system.view', 'system.manage', 'system.backup',
    'messages.view', 'messages.send', 'messages.bulk',
    'audit.view', 'audit.export',
  ],
  ADMIN: [
    'users.view', 'users.edit', 'users.suspend',
    'photographers.view', 'photographers.edit', 'photographers.verify',
    'bookings.view', 'bookings.edit', 'bookings.flag', 'bookings.cancel',
    'payments.view', 'payments.refund', 'payments.export',
    'disputes.view', 'disputes.resolve', 'disputes.close',
    'reviews.view', 'reviews.moderate',
    'analytics.view', 'analytics.export',
    'settings.view',
    'system.view',
    'messages.view', 'messages.send',
    'audit.view',
  ],
  MODERATOR: [
    'users.view',
    'photographers.view',
    'bookings.view', 'bookings.flag',
    'payments.view',
    'disputes.view',
    'reviews.view', 'reviews.moderate',
    'analytics.view',
    'messages.view',
  ],
};

interface RoleContextType {
  role: AdminRole;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

export const RoleContext = createContext<RoleContextType>({
  role: 'ADMIN',
  permissions: ROLE_PERMISSIONS.ADMIN,
  hasPermission: () => true,
  hasAnyPermission: () => true,
  hasAllPermissions: () => true,
  isSuperAdmin: false,
  isAdmin: true,
  isModerator: false,
});

/**
 * Get permissions for a given role
 */
export function getPermissionsForRole(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Hook to access role-based permissions
 */
export function useRoles(): RoleContextType {
  return useContext(RoleContext);
}

/**
 * Hook to check a specific permission
 */
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useRoles();
  return hasPermission(permission);
}

/**
 * Create role context value from an admin role string
 */
export function createRoleContext(role: AdminRole): RoleContextType {
  const permissions = getPermissionsForRole(role);
  return {
    role,
    permissions,
    hasPermission: (p: Permission) => permissions.includes(p),
    hasAnyPermission: (ps: Permission[]) => ps.some((p) => permissions.includes(p)),
    hasAllPermissions: (ps: Permission[]) => ps.every((p) => permissions.includes(p)),
    isSuperAdmin: role === 'SUPER_ADMIN',
    isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
    isModerator: role === 'MODERATOR',
  };
}

// Role display info
export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MODERATOR: 'Moderator',
};

export const ROLE_COLORS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
  MODERATOR: 'bg-green-100 text-green-800 border-green-200',
};
