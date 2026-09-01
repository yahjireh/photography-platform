/**
 * Message Routes
 * API endpoints for messaging system
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as MessageController from '../controllers/message.controller';

const router = express.Router();

/**
 * TEACHING MOMENT: Messaging Routes Organization
 * 
 * All messaging routes require authentication
 * Messages are scoped to bookings for context and security
 * 
 * Route structure:
 * - POST   /         → Send message
 * - GET    /conversations → List all conversations
 * - GET    /conversation/:booking_id → Get messages for booking
 * - PATCH  /read → Mark messages as read
 * - GET    /unread-count → Get unread count
 * - DELETE /:id → Delete message
 * - GET    /search → Search messages
 */

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

/**
 * Send a message
 * POST /api/messages
 *
 * Body: {
 *   "booking_id": "booking-uuid",
 *   "receiver_id": "user-uuid",
 *   "message_text": "Hello! When should we discuss the shoot?",
 *   "attachments": ["https://example.com/file1.jpg"]  // Optional
 * }
 * 
 * Security:
 * - Sender must be participant of booking
 * - Receiver must be the other participant
 */
router.post(
  '/',
  authenticate,
  MessageController.sendMessage
);

/**
 * Get all conversations for user
 * GET /api/messages/conversations
 * 
 * Returns list of bookings with:
 * - Last message
 * - Unread count
 * - Other participant info
 * - Booking details
 * 
 * Sorted by most recent activity
 */
router.get(
  '/conversations',
  authenticate,
  MessageController.getConversations
);

/**
 * Get conversation messages for a booking
 * GET /api/messages/conversation/:booking_id?limit=50&offset=0
 *
 * Query params:
 * - limit: Number of messages (default: 50)
 * - offset: Pagination offset (default: 0)
 *
 * Returns messages in chronological order (oldest first)
 */
router.get(
  '/conversation/:bookingId',
  authenticate,
  MessageController.getConversation
);

/**
 * Get unread message count
 * GET /api/messages/unread-count
 * 
 * Returns total unread messages for authenticated user
 */
router.get(
  '/unread-count',
  authenticate,
  MessageController.getUnreadCount
);

/**
 * Search messages
 * GET /api/messages/search?q=hello&booking_id=booking-uuid
 *
 * Query params:
 * - q: Search query (required, min 2 characters)
 * - booking_id: Optional - search within specific booking
 *
 * Returns matching messages with context
 */
router.get(
  '/search',
  authenticate,
  MessageController.searchMessages
);

/**
 * Mark messages as read
 * PATCH /api/messages/read
 * 
 * Body: {
 *   "message_ids": ["msg-uuid-1", "msg-uuid-2", "msg-uuid-3"]
 * }
 * 
 * Marks specific messages as read
 * Only marks messages where user is receiver
 */
router.patch(
  '/read',
  authenticate,
  MessageController.markAsRead
);

/**
 * Mark entire conversation as read
 * PATCH /api/messages/conversation/:booking_id/read
 *
 * Marks all unread messages in conversation as read
 * Useful when opening a conversation
 */
router.patch(
  '/conversation/:bookingId/read',
  authenticate,
  MessageController.markConversationAsRead
);

/**
 * Delete a message
 * DELETE /api/messages/:id
 * 
 * Rules:
 * - Can only delete own messages
 * - Must be within 5 minutes of sending
 * 
 * Use case: Fix typos, remove accidental sends
 */
router.delete(
  '/:id',
  authenticate,
  MessageController.deleteMessage
);

/**
 * TEACHING MOMENT: Route Order
 * 
 * Notice the order:
 * 1. POST /                         → Specific method
 * 2. GET /conversations             → Specific path
 * 3. GET /conversation/:booking_id  → Specific path with param
 * 4. GET /unread-count              → Specific path
 * 5. GET /search                    → Specific path
 * 6. PATCH /read                    → Specific path
 * 7. PATCH /conversation/:booking_id/read → Specific path with param
 * 8. DELETE /:id                    → Generic param (last)
 *
 * Specific routes come before generic parameterized routes!
 */

export default router;