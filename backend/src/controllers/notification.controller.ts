/**
 * Notification Controller
 * HTTP handlers for notification endpoints
 */

import { Request, Response } from 'express';
import * as NotificationService from '../services/notification.service';

/**
 * Get all notifications for current user
 * GET /api/notifications
 * 
 * Query params:
 * - limit: Number of notifications to return (default 50)
 * - unreadOnly: true/false - only unread notifications
 */
export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const unreadOnly = req.query.unreadOnly === 'true';
    
    const notifications = await NotificationService.getUserNotifications(
      userId,
      { limit, unreadOnly }
    );
    
    return res.status(200).json({
      success: true,
      notifications,
      total: notifications.length
    });
    
  } catch (error: any) {
    console.error('❌ Get notifications error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get notifications'
    });
  }
}

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 * 
 * Returns the badge count for the app
 */
export async function getUnreadCount(req: Request, res: Response) {
  try {
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const count = await NotificationService.getUnreadCount(userId);
    
    return res.status(200).json({
      success: true,
      unreadCount: count
    });
    
  } catch (error: any) {
    console.error('❌ Get unread count error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get unread count'
    });
  }
}

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
export async function markAsRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const notification = await NotificationService.markAsRead(id, userId);
    
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
    
  } catch (error: any) {
    console.error('❌ Mark as read error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to mark notification as read'
    });
  }
}

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
export async function markAllAsRead(req: Request, res: Response) {
  try {
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const count = await NotificationService.markAllAsRead(userId);
    
    return res.status(200).json({
      success: true,
      message: `Marked ${count} notifications as read`,
      count
    });
    
  } catch (error: any) {
    console.error('❌ Mark all as read error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark all as read'
    });
  }
}

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
export async function deleteNotification(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    await NotificationService.deleteNotification(id, userId);
    
    return res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
    
  } catch (error: any) {
    console.error('❌ Delete notification error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete notification'
    });
  }
}

/**
 * Delete all read notifications
 * DELETE /api/notifications/read
 */
export async function deleteAllRead(req: Request, res: Response) {
  try {
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const count = await NotificationService.deleteAllRead(userId);
    
    return res.status(200).json({
      success: true,
      message: `Deleted ${count} read notifications`,
      count
    });
    
  } catch (error: any) {
    console.error('❌ Delete all read error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete notifications'
    });
  }
}

/**
 * TEACHING MOMENT: Notification API Design
 * 
 * Our notification endpoints follow REST conventions:
 * 
 * GET    /notifications           - List all
 * GET    /notifications/unread-count - Get badge count
 * PATCH  /notifications/:id/read  - Mark one as read
 * PATCH  /notifications/read-all  - Mark all as read
 * DELETE /notifications/:id       - Delete one
 * DELETE /notifications/read      - Delete all read
 * 
 * This gives the mobile app everything it needs:
 * 
 * 1. NOTIFICATION CENTER
 *    - Fetch all notifications
 *    - Show unread with blue dot
 *    - Tap to mark as read
 *    - Swipe to delete
 * 
 * 2. BADGE COUNT
 *    - App icon shows number
 *    - Tab bar shows number
 *    - Updates in real-time
 * 
 * 3. CLEANUP
 *    - Delete old notifications
 *    - Clear all read
 *    - Keep inbox manageable
 * 
 * Mobile app flow:
 * 1. App opens → GET /notifications/unread-count
 * 2. Show badge on notification icon
 * 3. User taps notifications → GET /notifications
 * 4. Show list of notifications
 * 5. User taps one → PATCH /notifications/:id/read
 * 6. Mark as read, remove blue dot, decrease badge
 * 7. User swipes to delete → DELETE /notifications/:id
 */