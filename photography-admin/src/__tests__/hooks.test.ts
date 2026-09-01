import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useActivityLogStore } from '@/hooks/use-activity-log';
import {
  getPermissionsForRole,
  createRoleContext,
  ROLE_LABELS,
  ROLE_COLORS,
} from '@/hooks/use-roles';

// ============================================
// Activity Log Store (Zustand - testable without React)
// ============================================
describe('useActivityLogStore', () => {
  beforeEach(() => {
    // Reset store between tests
    act(() => {
      useActivityLogStore.getState().clearLogs();
    });
  });

  it('starts with empty logs', () => {
    expect(useActivityLogStore.getState().logs).toEqual([]);
  });

  it('adds a log entry', () => {
    act(() => {
      useActivityLogStore.getState().addLog({
        action: 'view',
        category: 'user',
        description: 'Viewed user profile',
        targetId: 'user_1',
        targetType: 'user',
      });
    });

    const logs = useActivityLogStore.getState().logs;
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('view');
    expect(logs[0].category).toBe('user');
    expect(logs[0].description).toBe('Viewed user profile');
    expect(logs[0].id).toBeDefined();
    expect(logs[0].timestamp).toBeDefined();
  });

  it('prepends new entries (newest first)', () => {
    act(() => {
      useActivityLogStore.getState().addLog({
        action: 'first',
        category: 'user',
        description: 'First action',
      });
      useActivityLogStore.getState().addLog({
        action: 'second',
        category: 'user',
        description: 'Second action',
      });
    });

    const logs = useActivityLogStore.getState().logs;
    expect(logs[0].action).toBe('second');
    expect(logs[1].action).toBe('first');
  });

  it('limits to 500 entries', () => {
    act(() => {
      for (let i = 0; i < 510; i++) {
        useActivityLogStore.getState().addLog({
          action: `action_${i}`,
          category: 'system',
          description: `Action ${i}`,
        });
      }
    });

    expect(useActivityLogStore.getState().logs).toHaveLength(500);
  });

  it('clears all logs', () => {
    act(() => {
      useActivityLogStore.getState().addLog({
        action: 'test',
        category: 'system',
        description: 'Test',
      });
      useActivityLogStore.getState().clearLogs();
    });

    expect(useActivityLogStore.getState().logs).toHaveLength(0);
  });

  it('filters logs by category', () => {
    act(() => {
      useActivityLogStore.getState().addLog({
        action: 'view',
        category: 'user',
        description: 'User action',
      });
      useActivityLogStore.getState().addLog({
        action: 'refund',
        category: 'payment',
        description: 'Payment action',
      });
      useActivityLogStore.getState().addLog({
        action: 'edit',
        category: 'user',
        description: 'Another user action',
      });
    });

    const userLogs = useActivityLogStore.getState().getLogsByCategory('user');
    expect(userLogs).toHaveLength(2);
    expect(userLogs.every((l) => l.category === 'user')).toBe(true);

    const paymentLogs = useActivityLogStore.getState().getLogsByCategory('payment');
    expect(paymentLogs).toHaveLength(1);
  });

  it('filters logs by target', () => {
    act(() => {
      useActivityLogStore.getState().addLog({
        action: 'view',
        category: 'user',
        description: 'Viewed user 1',
        targetType: 'user',
        targetId: 'u1',
      });
      useActivityLogStore.getState().addLog({
        action: 'edit',
        category: 'user',
        description: 'Edited user 2',
        targetType: 'user',
        targetId: 'u2',
      });
    });

    const u1Logs = useActivityLogStore.getState().getLogsByTarget('user', 'u1');
    expect(u1Logs).toHaveLength(1);
    expect(u1Logs[0].targetId).toBe('u1');
  });

  it('returns recent logs with limit', () => {
    act(() => {
      for (let i = 0; i < 10; i++) {
        useActivityLogStore.getState().addLog({
          action: `action_${i}`,
          category: 'system',
          description: `Action ${i}`,
        });
      }
    });

    const recent = useActivityLogStore.getState().getRecentLogs(3);
    expect(recent).toHaveLength(3);
    expect(recent[0].action).toBe('action_9'); // newest first
  });
});

// ============================================
// Role-based permissions (pure functions)
// ============================================
describe('getPermissionsForRole', () => {
  it('returns all permissions for SUPER_ADMIN', () => {
    const perms = getPermissionsForRole('SUPER_ADMIN');
    expect(perms.length).toBeGreaterThan(20);
    expect(perms).toContain('users.delete');
    expect(perms).toContain('system.backup');
    expect(perms).toContain('settings.edit');
  });

  it('returns subset for ADMIN', () => {
    const superPerms = getPermissionsForRole('SUPER_ADMIN');
    const adminPerms = getPermissionsForRole('ADMIN');
    expect(adminPerms.length).toBeLessThan(superPerms.length);
    expect(adminPerms).toContain('users.view');
    expect(adminPerms).not.toContain('users.delete');
  });

  it('returns limited permissions for MODERATOR', () => {
    const perms = getPermissionsForRole('MODERATOR');
    expect(perms).toContain('users.view');
    expect(perms).toContain('reviews.moderate');
    expect(perms).not.toContain('users.edit');
    expect(perms).not.toContain('payments.refund');
    expect(perms).not.toContain('settings.edit');
  });
});

describe('createRoleContext', () => {
  it('creates SUPER_ADMIN context', () => {
    const ctx = createRoleContext('SUPER_ADMIN');
    expect(ctx.role).toBe('SUPER_ADMIN');
    expect(ctx.isSuperAdmin).toBe(true);
    expect(ctx.isAdmin).toBe(true);
    expect(ctx.isModerator).toBe(false);
    expect(ctx.hasPermission('users.delete')).toBe(true);
    expect(ctx.hasPermission('system.backup')).toBe(true);
  });

  it('creates ADMIN context', () => {
    const ctx = createRoleContext('ADMIN');
    expect(ctx.role).toBe('ADMIN');
    expect(ctx.isSuperAdmin).toBe(false);
    expect(ctx.isAdmin).toBe(true);
    expect(ctx.isModerator).toBe(false);
    expect(ctx.hasPermission('users.view')).toBe(true);
    expect(ctx.hasPermission('users.delete')).toBe(false);
  });

  it('creates MODERATOR context', () => {
    const ctx = createRoleContext('MODERATOR');
    expect(ctx.role).toBe('MODERATOR');
    expect(ctx.isSuperAdmin).toBe(false);
    expect(ctx.isAdmin).toBe(false);
    expect(ctx.isModerator).toBe(true);
  });

  it('hasAnyPermission returns true if at least one matches', () => {
    const ctx = createRoleContext('MODERATOR');
    expect(ctx.hasAnyPermission(['users.view', 'users.delete'])).toBe(true);
    expect(ctx.hasAnyPermission(['users.delete', 'system.backup'])).toBe(false);
  });

  it('hasAllPermissions returns true only if all match', () => {
    const ctx = createRoleContext('SUPER_ADMIN');
    expect(ctx.hasAllPermissions(['users.view', 'users.delete'])).toBe(true);

    const modCtx = createRoleContext('MODERATOR');
    expect(modCtx.hasAllPermissions(['users.view', 'users.delete'])).toBe(false);
  });
});

describe('ROLE_LABELS', () => {
  it('has labels for all roles', () => {
    expect(ROLE_LABELS.SUPER_ADMIN).toBe('Super Admin');
    expect(ROLE_LABELS.ADMIN).toBe('Admin');
    expect(ROLE_LABELS.MODERATOR).toBe('Moderator');
  });
});

describe('ROLE_COLORS', () => {
  it('has color classes for all roles', () => {
    expect(ROLE_COLORS.SUPER_ADMIN).toContain('purple');
    expect(ROLE_COLORS.ADMIN).toContain('blue');
    expect(ROLE_COLORS.MODERATOR).toContain('green');
  });
});
