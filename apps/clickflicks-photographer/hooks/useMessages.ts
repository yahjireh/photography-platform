import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/api-client';
import { Conversation, ChatMessage } from '../types';
import { cacheGet, cacheSet, swrFetch } from '../lib/cache';

const mapBackendToConversation = (c: any): Conversation => {
  const otherUser = c.otherUser || c.other_participant || c.client || {};
  const participantName = otherUser.name || (otherUser.first_name 
    ? `${otherUser.first_name} ${otherUser.last_name || ''}`.trim() 
    : (c.name || 'Client'));

  const lastMsgText = typeof c.lastMessage === 'string'
    ? c.lastMessage
    : (c.lastMessage?.text || c.lastMessage?.message_text || c.last_message?.message_text || 'Active session discussion');

  const rawDate = c.lastMessage?.createdAt || c.lastMessage?.created_at || c.last_message?.created_at || c.updated_at;
  const timeFormatted = rawDate
    ? new Date(rawDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Recently';

  return {
    id: c.bookingId || c.booking_id || c.id,
    photographerId: otherUser.id || c.participant_id || c.participantId || c.clientId || 'client-id',
    photographerName: participantName,
    photographerAvatar: otherUser.profileImageUrl || otherUser.profile_image_url || null,
    lastMessage: lastMsgText,
    lastMessageTime: timeFormatted,
    unreadCount: c.unreadCount || c.unread_count || 0,
    online: true,
    bookingDetails: {
      service: c.occasion_type ? c.occasion_type.replace('_', ' ') : (c.service || 'Portrait Shoot'),
      date: c.eventDate || c.event_date ? new Date(c.eventDate || c.event_date).toLocaleDateString() : 'Upcoming',
      status: c.status || 'Confirmed'
    }
  };
};

export const useMessages = (initialBookingId?: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    return cacheGet<Conversation[]>('photographer_conversations_list') || [];
  });
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialBookingId) {
      return cacheGet<ChatMessage[]>(`photographer_chat_${initialBookingId}`) || [];
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return (cacheGet<Conversation[]>('photographer_conversations_list') || []).length === 0;
  });
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setError(null);
    try {
      const fetcher = async () => {
        const res = await apiClient.get('/messages/conversations');
        if (res.data?.success && Array.isArray(res.data?.data)) {
          return res.data.data.map(mapBackendToConversation);
        }
        return [];
      };

      const data = await swrFetch<Conversation[]>(
        'photographer_conversations_list',
        fetcher,
        (freshConvs) => {
          setConversations(freshConvs);
          setIsLoading(false);
        }
      );

      setConversations(data);
    } catch (err: any) {
      console.warn('Could not fetch photographer conversations from API:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMessagesForBooking = useCallback(async (bookingId: string) => {
    try {
      const fetcher = async () => {
        const res = await apiClient.get(`/messages/conversation/${bookingId}`);
        if (res.data?.success && Array.isArray(res.data?.data)) {
          return res.data.data.map((m: any) => {
            let parsedAttachments: string[] = [];
            if (Array.isArray(m.attachments)) {
              parsedAttachments = m.attachments;
            } else if (typeof m.attachments === 'string') {
              try { parsedAttachments = JSON.parse(m.attachments); } catch (_) {}
            }

            return {
              id: m.id,
              sender: m.is_sender ? 'photographer' : 'user',
              text: m.message_text,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: m.is_read ? 'read' : 'delivered',
              type: parsedAttachments.length > 0 ? 'image' : 'text',
              mediaUrl: parsedAttachments[0]
            };
          });
        }
        return [];
      };

      const data = await swrFetch<ChatMessage[]>(
        `photographer_chat_${bookingId}`,
        fetcher,
        (freshMessages) => {
          setMessages(freshMessages);
        }
      );

      setMessages(data);

      // Mark messages as read
      apiClient.patch(`/messages/conversation/${bookingId}/read`).catch(() => {});
    } catch (err: any) {
      console.warn(`Could not load messages for ${bookingId}:`, err.message);
    }
  }, []);

  const sendMessage = async (bookingId: string, receiverId: string, text: string, attachments?: string[]) => {
    const optimisticMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'photographer',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };
    
    setMessages(prev => {
      const updated = [...prev, optimisticMessage];
      cacheSet(`photographer_chat_${bookingId}`, updated);
      return updated;
    });

    try {
      const res = await apiClient.post('/messages', {
        bookingId: bookingId,
        receiverId: receiverId,
        messageText: text,
        attachments: attachments || []
      });
      const resolvedBookingId = res.data?.data?.bookingId || res.data?.data?.booking_id || bookingId;
      await fetchMessagesForBooking(resolvedBookingId);
      fetchConversations();
    } catch (err: any) {
      console.warn('Message send error:', err.message);
    }
  };

  // Poll conversations every 6s to keep unread counts and conversation list updated
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // When active in a conversation, poll every 2.5s for incoming messages in real-time
  useEffect(() => {
    if (!initialBookingId) return;
    fetchMessagesForBooking(initialBookingId);
    const interval = setInterval(() => {
      fetchMessagesForBooking(initialBookingId);
    }, 2500);
    return () => clearInterval(interval);
  }, [initialBookingId, fetchMessagesForBooking]);

  return {
    conversations,
    messages,
    isLoading,
    error,
    fetchConversations,
    fetchMessagesForBooking,
    sendMessage
  };
};

export default useMessages;
