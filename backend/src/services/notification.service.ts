/**
 * Notification Service
 * Handles creating, reading, and managing in-app notifications
 */

import prisma from '../config/database';

/**
 * TEACHING MOMENT: Notification Types
 * 
 * Each notification type represents a different event in the booking lifecycle.
 * These are defined in your Prisma schema as an enum.
 * 
 * Types include:
 * - BOOKING_REQUEST - Client created a booking
 * - BOOKING_ACCEPTED - Photographer accepted
 * - BOOKING_REJECTED - Photographer rejected
 * - BOOKING_CONFIRMED - Deposit paid, booking confirmed
 * - PAYMENT_RECEIVED - Payment successful
 * - SHOOT_STARTED - Photographer checked in
 * - SHOOT_COMPLETED - Shoot finished
 * - PHOTOS_UPLOADED - Photos uploaded (not delivered yet)
 * - PHOTOS_DELIVERED - Photos marked as delivered
 * - REVIEW_RECEIVED - Got a review
 * - SUBSCRIPTION_EXPIRING - Subscription ending soon
 * - KYC_VERIFIED - Identity verified
 * - KYC_REJECTED - Identity verification failed
 */

/**
 * Create a notification
 * 
 * @param data - Notification data
 * @returns Created notification
 */
export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}) {
  console.log(`📬 Creating notification for user ${data.userId}`);
  console.log(`   Type: ${data.type}`);
  console.log(`   Title: ${data.title}`);
  
  const notification = await prisma.notifications.create({
    data: {
      user_id: data.userId,
      type: data.type as any,
      title: data.title,
      message: data.message,
      data: data.data || {},
      is_read: false
    }
  });
  
  console.log(`✅ Notification created: ${notification.id}`);
  
  return notification;
}

/**
 * Get all notifications for a user
 * 
 * @param userId - User ID
 * @param options - Query options (limit, unread only, etc.)
 * @returns Array of notifications
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number;
    unreadOnly?: boolean;
  }
) {
  const where: any = { user_id: userId };

  if (options?.unreadOnly) {
    where.is_read = false;
  }

  const notifications = await prisma.notifications.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: options?.limit || 50
  });
  
  return notifications;
}

/**
 * Get unread notification count
 * 
 * @param userId - User ID
 * @returns Count of unread notifications
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const count = await prisma.notifications.count({
    where: {
      user_id: userId,
      is_read: false
    }
  });
  
  return count;
}

/**
 * Mark notification as read
 * 
 * @param notificationId - Notification ID
 * @param userId - User ID (for permission check)
 * @returns Updated notification
 */
export async function markAsRead(
  notificationId: string,
  userId: string
) {
  // Verify ownership
  const notification = await prisma.notifications.findUnique({
    where: { id: notificationId }
  });
  
  if (!notification) {
    throw new Error('Notification not found');
  }
  
  if (notification.user_id !== userId) {
    throw new Error('Cannot mark other user\'s notifications as read');
  }

  if (notification.is_read) {
    return notification; // Already read
  }

  const updated = await prisma.notifications.update({
    where: { id: notificationId },
    data: {
      is_read: true,
      read_at: new Date()
    }
  });
  
  console.log(`✅ Notification marked as read: ${notificationId}`);
  
  return updated;
}

/**
 * Mark all notifications as read
 * 
 * @param userId - User ID
 * @returns Count of updated notifications
 */
export async function markAllAsRead(userId: string) {
  const result = await prisma.notifications.updateMany({
    where: {
      user_id: userId,
      is_read: false
    },
    data: {
      is_read: true,
      read_at: new Date()
    }
  });
  
  console.log(`✅ Marked ${result.count} notifications as read`);
  
  return result.count;
}

/**
 * Delete notification
 * 
 * @param notificationId - Notification ID
 * @param userId - User ID (for permission check)
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
) {
  // Verify ownership
  const notification = await prisma.notifications.findUnique({
    where: { id: notificationId }
  });
  
  if (!notification) {
    throw new Error('Notification not found');
  }
  
  if (notification.user_id !== userId) {
    throw new Error('Cannot delete other user\'s notifications');
  }
  
  await prisma.notifications.delete({
    where: { id: notificationId }
  });
  
  console.log(`🗑️  Notification deleted: ${notificationId}`);
}

/**
 * Delete all read notifications
 * 
 * @param userId - User ID
 * @returns Count of deleted notifications
 */
export async function deleteAllRead(userId: string) {
  const result = await prisma.notifications.deleteMany({
    where: {
      user_id: userId,
      is_read: true
    }
  });
  
  console.log(`🗑️  Deleted ${result.count} read notifications`);
  
  return result.count;
}

/**
 * HELPER: Create booking-related notification
 * This is a convenience function for the most common notification type
 * 
 * @param data - Booking notification data
 */
export async function notifyBookingEvent(data: {
  userId: string;
  type: 'BOOKING_REQUEST' | 'BOOKING_ACCEPTED' | 'BOOKING_REJECTED' | 'BOOKING_CONFIRMED' | 
        'SHOOT_STARTED' | 'SHOOT_COMPLETED' | 'PHOTOS_UPLOADED' | 'PHOTOS_DELIVERED';
  bookingNumber: string;
  bookingId: string;
  message?: string;
}) {
  const titles: Record<string, string> = {
    BOOKING_REQUEST: 'New Booking Request',
    BOOKING_ACCEPTED: 'Booking Accepted',
    BOOKING_REJECTED: 'Booking Rejected',
    BOOKING_CONFIRMED: 'Booking Confirmed',
    SHOOT_STARTED: 'Shoot Started',
    SHOOT_COMPLETED: 'Shoot Completed',
    PHOTOS_UPLOADED: 'Photos Uploaded',
    PHOTOS_DELIVERED: 'Photos Ready for Download'
  };
  
  const defaultMessages: Record<string, string> = {
    BOOKING_REQUEST: `You have a new booking request ${data.bookingNumber}`,
    BOOKING_ACCEPTED: `Your booking ${data.bookingNumber} has been accepted`,
    BOOKING_REJECTED: `Your booking ${data.bookingNumber} was rejected`,
    BOOKING_CONFIRMED: `Your booking ${data.bookingNumber} is confirmed`,
    SHOOT_STARTED: `The photographer has started your shoot`,
    SHOOT_COMPLETED: `Your shoot is complete! Photos coming soon`,
    PHOTOS_UPLOADED: `The photographer uploaded photos for ${data.bookingNumber}`,
    PHOTOS_DELIVERED: `Your photos are ready! Download them now`
  };
  
  await createNotification({
    userId: data.userId,
    type: data.type,
    title: titles[data.type],
    message: data.message || defaultMessages[data.type],
    data: {
      bookingId: data.bookingId,
      bookingNumber: data.bookingNumber
    }
  });
}

/**
 * TEACHING MOMENT: Why In-App Notifications?
 * 
 * In-app notifications keep users informed without leaving the app.
 * They're perfect for:
 * 
 * 1. REAL-TIME UPDATES
 *    - Booking accepted immediately
 *    - Photos delivered notification
 *    - Payment received confirmation
 * 
 * 2. NON-URGENT COMMUNICATION
 *    - Review received
 *    - Subscription expiring
 *    - New feature announcements
 * 
 * 3. ENGAGEMENT
 *    - Badge counts (unread notifications)
 *    - Bring users back to app
 *    - Improve retention
 * 
 * Flow:
 * 1. Event happens (booking created)
 * 2. Create notification in database
 * 3. User opens app
 * 4. App shows badge count (unread)
 * 5. User views notifications
 * 6. Mark as read
 * 
 * Later with push notifications:
 * 1. Event happens
 * 2. Create notification in database
 * 3. Send push notification to device
 * 4. User taps notification
 * 5. Opens app to relevant screen
 */