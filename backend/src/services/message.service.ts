/**
 * Message Service
 * Business logic for messaging system
 */

import prisma from '../config/database';
import * as NotificationTrigger from './notification-trigger.service';

/**
 * TEACHING MOMENT: Messaging Architecture
 * 
 * Our messaging system is BOOKING-SCOPED:
 * - Every message belongs to a specific booking
 * - Only client and photographer of that booking can message
 * - This provides natural context and security
 * 
 * Benefits:
 * - Messages are organized by project/booking
 * - Easy to find conversation about specific shoot
 * - Natural access control (booking participants only)
 * - Clear conversation boundaries
 */

/**
 * Send a message
 * 
 * @param data - Message data
 * @returns Created message
 */
export async function sendMessage(data: {
  bookingId: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  attachments?: string[];  // Array of file URLs
}) {
  console.log(`💬 Sending message in booking ${data.bookingId}`);
  
  // Verify booking exists and sender is participant
  const booking = await prisma.bookings.findUnique({
    where: { id: data.bookingId },
    include: {
      users_bookings_client_idTousers: true,
      users_bookings_photographer_idTousers: true
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Verify sender is part of this booking
  if (booking.client_id !== data.senderId && booking.photographer_id !== data.senderId) {
    throw new Error('You are not a participant of this booking');
  }

  // Verify receiver is the other participant
  const expectedReceiverId = booking.client_id === data.senderId
    ? booking.photographer_id
    : booking.client_id;
    
  if (data.receiverId !== expectedReceiverId) {
    throw new Error('Invalid receiver for this booking');
  }
  
  // Create message
  const message = await prisma.messages.create({
    data: {
      booking_id: data.bookingId,
      sender_id: data.senderId,
      receiver_id: data.receiverId,
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
  
  console.log(`✅ Message sent: ${message.id}`);

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
  
  return message;
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
  
  // Verify user is participant of this booking
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    select: {
      client_id: true,
      photographer_id: true
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.client_id !== userId && booking.photographer_id !== userId) {
    throw new Error('You are not a participant of this booking');
  }
  
  // Get messages
  const messages = await prisma.messages.findMany({
    where: {
      booking_id: bookingId
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
    where: { booking_id: bookingId }
  });
  
  console.log(`✅ Retrieved ${messages.length} messages (total: ${totalCount})`);
  
  return {
    messages,
    totalCount,
    hasMore: offset + messages.length < totalCount
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
  
  const result = await prisma.messages.updateMany({
    where: {
      booking_id: bookingId,
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
          profileImageUrl: otherUser.profile_image_url
        },
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