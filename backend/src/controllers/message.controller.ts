/**
 * Message Controller
 * HTTP request handlers for messaging endpoints
 */

import { Request, Response } from 'express';
import * as MessageService from '../services/message.service';

/**
 * Send a message
 * POST /api/messages
 * 
 * Body: {
 *   "bookingId": "booking-uuid",
 *   "receiverId": "user-uuid",
 *   "messageText": "Hello!",
 *   "attachments": ["https://url1.com", "https://url2.com"]  // Optional
 * }
 */
export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const senderId = req.user!.user_id;
    const bookingId = req.body.bookingId || req.body.booking_id;
    const receiverId = req.body.receiverId || req.body.receiver_id;
    const messageText = req.body.messageText || req.body.message_text;
    const attachments = req.body.attachments;
    
    // Validation
    if ((!bookingId && !receiverId) || !messageText) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: messageText and either receiverId or bookingId'
      });
      return;
    }
    
    if (String(messageText).trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Message text cannot be empty'
      });
      return;
    }
    
    if (String(messageText).length > 5000) {
      res.status(400).json({
        success: false,
        message: 'Message text too long (max 5000 characters)'
      });
      return;
    }
    
    const message = await MessageService.sendMessage({
      bookingId,
      senderId,
      receiverId,
      messageText: String(messageText).trim(),
      attachments
    });
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
}

/**
 * Get conversation messages
 * GET /api/messages/conversation/:bookingId?limit=50&offset=0
 */
export async function getConversation(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { bookingId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    const result = await MessageService.getConversationMessages(
      bookingId,
      userId,
      { limit, offset }
    );
    
    res.status(200).json({
      success: true,
      data: result.messages,
      isOnline: result.isOnline,
      partnerId: result.partnerId,
      pagination: {
        total: result.totalCount,
        limit,
        offset,
        hasMore: result.hasMore
      }
    });
  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get conversation'
    });
  }
}

/**
 * Mark messages as read
 * PATCH /api/messages/read
 * 
 * Body: {
 *   "messageIds": ["msg-uuid-1", "msg-uuid-2"]
 * }
 */
export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'messageIds must be a non-empty array'
      });
      return;
    }
    
    const count = await MessageService.markMessagesAsRead(messageIds, userId);
    
    res.status(200).json({
      success: true,
      message: `Marked ${count} messages as read`,
      data: { count }
    });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to mark messages as read'
    });
  }
}

/**
 * Mark entire conversation as read
 * PATCH /api/messages/conversation/:bookingId/read
 */
export async function markConversationAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { bookingId } = req.params;
    
    const count = await MessageService.markConversationAsRead(bookingId, userId);
    
    res.status(200).json({
      success: true,
      message: `Marked ${count} messages as read`,
      data: { count }
    });
  } catch (error: any) {
    console.error('Mark conversation as read error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to mark conversation as read'
    });
  }
}

/**
 * Get unread message count
 * GET /api/messages/unread-count
 */
export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    
    const count = await MessageService.getUnreadCount(userId);
    
    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
}

/**
 * Get all conversations for user
 * GET /api/messages/conversations
 * 
 * Returns list of bookings with last message and unread count
 */
export async function getConversations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    
    const conversations = await MessageService.getUserConversations(userId);
    
    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations'
    });
  }
}

/**
 * Delete a message
 * DELETE /api/messages/:id
 * 
 * Can only delete own messages within 5 minutes
 */
export async function deleteMessage(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;
    
    await MessageService.deleteMessage(id, userId);
    
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete message error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete message'
    });
  }
}

/**
 * Search messages
 * GET /api/messages/search?q=hello&bookingId=booking-uuid
 */
export async function searchMessages(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const query = req.query.q as string;
    const bookingId = req.query.bookingId as string | undefined;
    
    if (!query || query.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Search query (q) is required'
      });
      return;
    }
    
    if (query.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
      return;
    }
    
    const messages = await MessageService.searchMessages(
      userId,
      query.trim(),
      bookingId
    );
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error: any) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages'
    });
  }
}