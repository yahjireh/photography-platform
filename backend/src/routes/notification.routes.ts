/**
 * Notification Routes
 * Endpoints for managing in-app notifications
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as NotificationController from '../controllers/notification.controller';

const router = express.Router();

/**
 * TEACHING MOMENT: Route Organization
 * 
 * All notification routes require authentication.
 * Users can only see/manage their own notifications.
 * 
 * No admin-only routes here - notifications are personal.
 */

/**
 * Get all notifications for current user
 * GET /api/notifications
 * 
 * Query params:
 * - limit: Number to return (default 50)
 * - unreadOnly: true/false
 * 
 * Example: GET /api/notifications?limit=20&unreadOnly=true
 */
router.get(
  '/',
  authenticate,
  NotificationController.getNotifications
);

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 * 
 * Returns: { unreadCount: 5 }
 * 
 * Use this for badge counts in the app
 */
router.get(
  '/unread-count',
  authenticate,
  NotificationController.getUnreadCount
);

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 * 
 * Bulk operation - marks all unread as read
 */
router.patch(
  '/read-all',
  authenticate,
  NotificationController.markAllAsRead
);

/**
 * Delete all read notifications
 * DELETE /api/notifications/read
 * 
 * Cleanup operation - removes all read notifications
 */
router.delete(
  '/read',
  authenticate,
  NotificationController.deleteAllRead
);

/**
 * Mark specific notification as read
 * PATCH /api/notifications/:id/read
 * 
 * Called when user taps a notification
 */
router.patch(
  '/:id/read',
  authenticate,
  NotificationController.markAsRead
);

/**
 * Delete specific notification
 * DELETE /api/notifications/:id
 * 
 * Called when user swipes to delete
 */
router.delete(
  '/:id',
  authenticate,
  NotificationController.deleteNotification
);

/**
 * TEACHING MOMENT: Route Order Matters!
 * 
 * Notice the order of routes:
 * 
 * 1. /unread-count       ← Specific route FIRST
 * 2. /read-all           ← Specific route FIRST
 * 3. /read               ← Specific route FIRST
 * 4. /:id/read           ← Then parameterized routes
 * 5. /:id                ← Then parameterized routes
 * 
 * Why?
 * 
 * If /:id was first, a request to /unread-count would match /:id
 * with id="unread-count" instead of going to the correct handler!
 * 
 * Rule: Specific routes before parameterized routes!
 */

/**
 * COMPLETE NOTIFICATION FLOW:
 * 
 * 1. USER OPENS APP
 *    GET /notifications/unread-count
 *    Returns: { unreadCount: 3 }
 *    App shows badge: 🔔 3
 * 
 * 2. USER TAPS NOTIFICATION ICON
 *    GET /notifications?limit=50
 *    Returns: Array of 50 most recent notifications
 *    App displays list with unread indicators
 * 
 * 3. USER TAPS ONE NOTIFICATION
 *    PATCH /notifications/{id}/read
 *    Marks as read, removes blue dot
 *    Navigate to related screen (booking details, etc.)
 * 
 * 4. USER TAPS "MARK ALL AS READ"
 *    PATCH /notifications/read-all
 *    All notifications marked as read
 *    Badge count goes to 0
 * 
 * 5. USER SWIPES TO DELETE
 *    DELETE /notifications/{id}
 *    Notification removed from list
 * 
 * 6. USER TAPS "CLEAR READ"
 *    DELETE /notifications/read
 *    All read notifications deleted
 *    Only unread remain
 */

export default router;