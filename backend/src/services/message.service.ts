/**
 * Message Service
 * Business logic for messaging system
 */

import prisma from '../config/database';
import * as NotificationTrigger from './notification-trigger.service';
import { generateBookingNumber } from '../config/constants';
import { isUserOnline } from '../middleware/auth.middleware';

/**
 * TEACHING MOMENT: Messaging Architecture
 * 
 * Our messaging system is BOOKING-SCOPED:
 * - Every message belongs to a specific booking or inquiry thread
 * - Client and photographer can message each other seamlessly
 * - If chatting before booking, an inquiry thread is automatically initialized
 * - Natural access control and consistent conversation history
 */

/**
 * Send a message
 * 
 * @param data - Message data
 * @returns Created message
 */
export async function sendMessage(data: {
  bookingId?: string;
  senderId: string;
  receiverId?: string;
  messageText: string;
  attachments?: string[];  // Array of file URLs
}) {
  console.log(`💬 Sending message from ${data.senderId} (bookingId: ${data.bookingId || 'none'}, receiverId: ${data.receiverId || 'none'})`);
  
  let targetReceiverId = data.receiverId;

  // If receiverId is provided, resolve in case it's a photographer table ID rather than user ID
  if (targetReceiverId) {
    const userExists = await prisma.users.findUnique({ where: { id: targetReceiverId } });
    if (!userExists) {
      const photog = await prisma.photographers.findUnique({ where: { id: targetReceiverId } });
      if (photog) {
        targetReceiverId = photog.user_id;
      }
    }
  }

  // 1. Try finding booking by ID if provided
  let booking = data.bookingId ? await prisma.bookings.findUnique({
    where: { id: data.bookingId },
    include: {
      users_bookings_client_idTousers: true,
      users_bookings_photographer_idTousers: true
    }
  }) : null;

  // 2. If booking not found by ID, maybe bookingId was actually the receiver's userId or photographerId
  if (!booking && data.bookingId) {
    let altUserId = data.bookingId;
    const photog = await prisma.photographers.findUnique({ where: { id: data.bookingId } });
    if (photog) altUserId = photog.user_id;

    if (!targetReceiverId) {
      targetReceiverId = altUserId;
    }

    booking = await prisma.bookings.findFirst({
      where: {
        OR: [
          { client_id: data.senderId, photographer_id: altUserId },
          { client_id: altUserId, photographer_id: data.senderId }
        ]
      },
      include: {
        users_bookings_client_idTousers: true,
        users_bookings_photographer_idTousers: true
      },
      orderBy: { updated_at: 'desc' }
    });
  }

  // 3. If still no booking and targetReceiverId is known, check between senderId and targetReceiverId
  if (!booking && targetReceiverId) {
    booking = await prisma.bookings.findFirst({
      where: {
        OR: [
          { client_id: data.senderId, photographer_id: targetReceiverId },
          { client_id: targetReceiverId, photographer_id: data.senderId }
        ]
      },
      include: {
        users_bookings_client_idTousers: true,
        users_bookings_photographer_idTousers: true
      },
      orderBy: { updated_at: 'desc' }
    });
  }

  // 4. If still no booking exists between them, automatically initialize an inquiry conversation thread!
  if (!booking) {
    if (!targetReceiverId) {
      throw new Error('Cannot determine message recipient');
    }

    const senderUser = await prisma.users.findUnique({ where: { id: data.senderId } });
    const receiverUser = await prisma.users.findUnique({ where: { id: targetReceiverId } });

    if (!receiverUser) {
      throw new Error('Message recipient not found');
    }

    const isSenderPhotographer = senderUser?.user_type === 'PHOTOGRAPHER';
    const clientId = isSenderPhotographer ? targetReceiverId : data.senderId;
    const photographerId = isSenderPhotographer ? data.senderId : targetReceiverId;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    booking = await prisma.bookings.create({
      data: {
        booking_number: generateBookingNumber(),
        client_id: clientId,
        photographer_id: photographerId,
        occasion_type: 'PORTRAIT',
        event_location: 'Studio Inquiry & Direct Message',
        event_date: futureDate,
        event_start_time: new Date('1970-01-01T10:00:00.000Z'),
        total_amount: 0,
        deposit_amount: 0,
        balance_amount: 0,
        platform_commission: 0,
        status: 'PENDING'
      },
      include: {
        users_bookings_client_idTousers: true,
        users_bookings_photographer_idTousers: true
      }
    });
    console.log(`✨ Created new inquiry booking thread: ${booking.booking_number} (${booking.id})`);
  }

  // Determine final receiver ID from the booking
  const finalReceiverId = targetReceiverId || (booking.client_id === data.senderId ? booking.photographer_id : booking.client_id);

  // Create message
  const message = await prisma.messages.create({
    data: {
      booking_id: booking.id,
      sender_id: data.senderId,
      receiver_id: finalReceiverId,
      message_text: data.messageText,
      attachments: data.attachments ? JSON.stringify(data.attachments) : undefined,
      is_read: false
    },
    include: {
      users_messages_sender_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true,
          email: true
        }
      },
      users_messages_receiver_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true,
          email: true
        }
      }
    }
  });

  // Touch booking updated_at so conversation sorts to top
  await prisma.bookings.update({
    where: { id: booking.id },
    data: { updated_at: new Date() }
  }).catch(() => {});

  console.log(`✅ Message sent: ${message.id} (booking: ${booking.id})`);

  // Trigger notification (non-blocking)
  NotificationTrigger.onMessageReceived({
    receiverId: message.receiver_id,
    receiverEmail: message.users_messages_receiver_idTousers.email,
    receiverName: `${message.users_messages_receiver_idTousers.first_name} ${message.users_messages_receiver_idTousers.last_name}`,
    senderName: `${message.users_messages_sender_idTousers.first_name} ${message.users_messages_sender_idTousers.last_name}`,
    messageText: message.message_text,
    bookingNumber: booking.booking_number,
    bookingId: booking.id
  }).catch(err => console.error('Notification error:', err));

  return {
    ...message,
    bookingId: booking.id,
    booking_id: booking.id
  };
}

/**
 * Get conversation messages for a booking
 *
 * @param bookingId - Booking ID
 * @param userId - Current user ID (for access control)
 * @param options - Pagination options
 * @returns Array of messages
 */
export async function getConversationMessages(
  bookingId: string,
  userId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
) {
  console.log(`📖 Getting conversation for booking ${bookingId}`);
  
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  
  // Verify user is participant of this booking or conversation
  let booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      client_id: true,
      photographer_id: true
    }
  });

  if (!booking) {
    // Check if bookingId might be another user's ID or photographer's record ID
    let otherUserId = bookingId;
    const photog = await prisma.photographers.findUnique({ where: { id: bookingId } });
    if (photog) otherUserId = photog.user_id;

    booking = await prisma.bookings.findFirst({
      where: {
        OR: [
          { client_id: userId, photographer_id: otherUserId },
          { client_id: otherUserId, photographer_id: userId }
        ]
      },
      select: {
        id: true,
        client_id: true,
        photographer_id: true
      },
      orderBy: { updated_at: 'desc' }
    });
  }

  if (!booking) {
    // No active conversation thread yet: return clean empty state without crashing
    return {
      messages: [],
      totalCount: 0,
      hasMore: false
    };
  }

  if (booking.client_id !== userId && booking.photographer_id !== userId) {
    throw new Error('You are not a participant of this booking');
  }

  const effectiveBookingId = booking.id;
  
  // Get messages
  const messages = await prisma.messages.findMany({
    where: {
      booking_id: effectiveBookingId
    },
    include: {
      users_messages_sender_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true
        }
      },
      users_messages_receiver_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true
        }
      }
    },
    orderBy: {
      created_at: 'asc'  // Oldest first (chronological order)
    },
    skip: offset,
    take: limit
  });

  // Get total count
  const totalCount = await prisma.messages.count({
    where: { booking_id: effectiveBookingId }
  });
  
  console.log(`✅ Retrieved ${messages.length} messages (total: ${totalCount})`);
  
  const partnerId = booking.client_id === userId ? booking.photographer_id : booking.client_id;
  const isOnline = isUserOnline(partnerId);

  return {
    messages,
    totalCount,
    hasMore: offset + messages.length < totalCount,
    partnerId,
    isOnline
  };
}

/**
 * Mark messages as read
 * 
 * @param messageIds - Array of message IDs to mark as read
 * @param userId - Current user ID (must be receiver)
 * @returns Number of messages marked as read
 */
export async function markMessagesAsRead(
  messageIds: string[],
  userId: string
) {
  console.log(`✓ Marking ${messageIds.length} messages as read`);
  
  // Update messages where user is the receiver
  const result = await prisma.messages.updateMany({
    where: {
      id: { in: messageIds },
      receiver_id: userId,  // Only mark as read if user is receiver
      is_read: false        // Only update unread messages
    },
    data: {
      is_read: true,
      read_at: new Date()
    }
  });
  
  console.log(`✅ Marked ${result.count} messages as read`);
  
  return result.count;
}

/**
 * Mark all messages in a conversation as read
 * 
 * @param bookingId - Booking ID
 * @param userId - Current user ID (receiver)
 * @returns Number of messages marked as read
 */
export async function markConversationAsRead(
  bookingId: string,
  userId: string
) {
  console.log(`✓ Marking conversation ${bookingId} as read for user ${userId}`);
  
  let effectiveBookingId = bookingId;
  const existing = await prisma.bookings.findUnique({
    where: { id: bookingId },
    select: { id: true }
  });

  if (!existing) {
    let otherUserId = bookingId;
    const photog = await prisma.photographers.findUnique({ where: { id: bookingId } });
    if (photog) otherUserId = photog.user_id;

    const matched = await prisma.bookings.findFirst({
      where: {
        OR: [
          { client_id: userId, photographer_id: otherUserId },
          { client_id: otherUserId, photographer_id: userId }
        ]
      },
      select: { id: true }
    });
    if (matched) {
      effectiveBookingId = matched.id;
    }
  }

  const result = await prisma.messages.updateMany({
    where: {
      booking_id: effectiveBookingId,
      receiver_id: userId,
      is_read: false
    },
    data: {
      is_read: true,
      read_at: new Date()
    }
  });
  
  console.log(`✅ Marked ${result.count} messages as read`);
  
  return result.count;
}

/**
 * Get unread message count for a user
 * 
 * @param userId - User ID
 * @returns Unread message count
 */
export async function getUnreadCount(userId: string) {
  const count = await prisma.messages.count({
    where: {
      receiver_id: userId,
      is_read: false
    }
  });

  return count;
}

/**
 * Get unread count per booking
 * 
 * @param userId - User ID
 * @returns Array of bookings with unread counts
 */
export async function getUnreadCountsByBooking(userId: string) {
  const messages = await prisma.messages.groupBy({
    by: ['booking_id'],
    where: {
      receiver_id: userId,
      is_read: false
    },
    _count: {
      id: true
    }
  });

  return messages.map(m => ({
    bookingId: m.booking_id,
    unreadCount: m._count.id
  }));
}

/**
 * Get all conversations for a user
 * Returns list of bookings with message info
 * 
 * @param userId - User ID
 * @returns Array of conversations
 */
export async function getUserConversations(userId: string) {
  console.log(`📋 Getting conversations for user ${userId}`);
  
  // Get all bookings where user is participant
  const bookings = await prisma.bookings.findMany({
    where: {
      OR: [
        { client_id: userId },
        { photographer_id: userId }
      ]
    },
    include: {
      users_bookings_client_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true
        }
      },
      users_bookings_photographer_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true
        }
      },
      messages: {
        orderBy: {
          created_at: 'desc'
        },
        take: 1  // Get last message only
      }
    },
    orderBy: {
      updated_at: 'desc'  // Most recently updated bookings first
    }
  });
  
  // Get unread counts
  const unreadCounts = await getUnreadCountsByBooking(userId);
  const unreadMap = new Map(unreadCounts.map(u => [u.bookingId, u.unreadCount]));
  
  // Format conversations
  const conversations = bookings
    .filter(booking => booking.messages.length > 0)  // Only bookings with messages
    .map(booking => {
      const lastMessage = booking.messages[0];
      const otherUser = booking.client_id === userId ? booking.users_bookings_photographer_idTousers : booking.users_bookings_client_idTousers;

      return {
        bookingId: booking.id,
        bookingNumber: booking.booking_number,
        status: booking.status,
        eventDate: booking.event_date,
        otherUser: {
          id: otherUser.id,
          name: `${otherUser.first_name} ${otherUser.last_name}`,
          profileImageUrl: otherUser.profile_image_url,
          isOnline: isUserOnline(otherUser.id)
        },
        isOnline: isUserOnline(otherUser.id),
        lastMessage: {
          id: lastMessage.id,
          text: lastMessage.message_text,
          senderId: lastMessage.sender_id,
          createdAt: lastMessage.created_at,
          isRead: lastMessage.is_read
        },
        unreadCount: unreadMap.get(booking.id) || 0
      };
    });
  
  console.log(`✅ Retrieved ${conversations.length} conversations`);
  
  return conversations;
}

/**
 * Delete a message
 * Only sender can delete their own message within 5 minutes
 * 
 * @param messageId - Message ID
 * @param userId - User ID (must be sender)
 */
export async function deleteMessage(
  messageId: string,
  userId: string
) {
  console.log(`🗑️  Deleting message ${messageId}`);
  
  const message = await prisma.messages.findUnique({
    where: { id: messageId }
  });
  
  if (!message) {
    throw new Error('Message not found');
  }
  
  if (message.sender_id !== userId) {
    throw new Error('You can only delete your own messages');
  }

  // Check if message is within 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (message.created_at < fiveMinutesAgo) {
    throw new Error('Messages can only be deleted within 5 minutes of sending');
  }
  
  await prisma.messages.delete({
    where: { id: messageId }
  });
  
  console.log(`✅ Message deleted: ${messageId}`);
}

/**
 * Search messages
 * 
 * @param userId - User ID
 * @param searchQuery - Search term
 * @param bookingId - Optional: search within specific booking
 * @returns Array of matching messages
 */
export async function searchMessages(
  userId: string,
  searchQuery: string,
  bookingId?: string
) {
  console.log(`🔍 Searching messages: "${searchQuery}"`);
  
  // Build where clause
  const where: any = {
    message_text: {
      contains: searchQuery,
      mode: 'insensitive'  // Case-insensitive search
    },
    bookings: {
      OR: [
        { client_id: userId },
        { photographer_id: userId }
      ]
    }
  };

  // Filter by booking if specified
  if (bookingId) {
    where.booking_id = bookingId;
  }

  const messages = await prisma.messages.findMany({
    where,
    include: {
      users_messages_sender_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true
        }
      },
      bookings: {
        select: {
          id: true,
          booking_number: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 50  // Limit results
  });
  
  console.log(`✅ Found ${messages.length} matching messages`);
  
  return messages;
}