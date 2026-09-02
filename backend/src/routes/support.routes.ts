/**
 * Support Routes & Controller
 * Direct communication between Client/Photographer and Admin
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();

/**
 * POST /api/support/contact
 * Submit an in-app support message/ticket to the platform admin
 */
router.post('/contact', authenticate, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const senderId = req.user.user_id;
    const { subject, category = 'General', message } = req.body;

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    const sender = await prisma.users.findUnique({
      where: { id: senderId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone_number: true,
        user_type: true
      }
    });

    if (!sender) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find platform admin to deliver the ticket
    const admin = await prisma.users.findFirst({
      where: { user_type: 'ADMIN' },
      select: { id: true, email: true }
    });

    if (!admin) {
      return res.status(500).json({ success: false, message: 'Admin account not configured' });
    }

    const fullName = `${sender.first_name} ${sender.last_name}`.trim();
    const formattedTitle = `[Support: ${category}] ${subject.trim()}`;

    // Create notification entry for the admin
    const ticket = await prisma.notifications.create({
      data: {
        user_id: admin.id,
        type: 'MESSAGE_RECEIVED',
        title: formattedTitle,
        message: message.trim(),
        data: {
          isSupportTicket: true,
          category,
          senderId: sender.id,
          senderName: fullName,
          senderEmail: sender.email,
          senderPhone: sender.phone_number,
          senderType: sender.user_type,
          replies: []
        }
      }
    });

    return res.json({
      success: true,
      message: 'Your message has been sent to our support team. We will reply shortly.',
      data: {
        id: ticket.id,
        subject: formattedTitle,
        status: 'OPEN',
        createdAt: ticket.created_at
      }
    });
  } catch (error: any) {
    console.error('Error submitting support message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit support message',
      error: error.message
    });
  }
});

/**
 * GET /api/support/my-tickets
 * Get current user's submitted support inquiries and admin replies
 */
router.get('/my-tickets', authenticate, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.user_id;

    // Find all tickets originated by this user
    const tickets = await prisma.notifications.findMany({
      where: {
        type: 'MESSAGE_RECEIVED',
      },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    // Filter tickets where data.senderId === userId
    const userTickets = tickets
      .filter(t => (t.data as any)?.isSupportTicket && (t.data as any)?.senderId === userId)
      .map(t => {
        const data = (t.data as any) || {};
        return {
          id: t.id,
          title: t.title,
          message: t.message,
          category: data.category || 'General',
          replies: data.replies || [],
          hasReply: Array.isArray(data.replies) && data.replies.length > 0,
          createdAt: t.created_at,
          lastReplyAt: data.lastReplyAt || null
        };
      });

    return res.json({
      success: true,
      data: userTickets
    });
  } catch (error: any) {
    console.error('Error fetching user support tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load support inquiries',
      error: error.message
    });
  }
});

export default router;
