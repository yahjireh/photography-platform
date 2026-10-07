import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient, { tokenManager } from '../lib/api-client';
import { Conversation, ChatMessage } from '../types';
import { cacheGet, cacheSet, swrFetch } from '../lib/cache';

const mapBackendToConversation = (c: any): Conversation => {
  const otherUser = c.otherUser || c.other_participant || c.photographer || {};
  const name = otherUser.name || (otherUser.first_name ? `${otherUser.first_name} ${otherUser.last_name || ''}`.trim() : (c.photographerName || 'Photographer'));
  const avatar = otherUser.profileImageUrl || otherUser.profile_image_url || c.photographerAvatar || null;
  const lastMsgText = typeof c.lastMessage === 'string' 
    ? c.lastMessage 
    : (c.lastMessage?.text || c.lastMessage?.message_text || 'Active session brief');
  
  const rawDate = c.lastMessage?.createdAt || c.lastMessage?.created_at || c.updated_at;
  const timeFormatted = rawDate 
    ? new Date(rawDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : 'Recent';

  const isOnline = Boolean(c.isOnline ?? otherUser.isOnline ?? c.online ?? false);

  return {
    id: c.bookingId || c.booking_id || c.id,
    participantId: otherUser.id || c.photographerId || c.photographer_id || c.id,
    photographerId: otherUser.id || c.photographerId || c.photographer_id || c.id,
    participantName: name,
    photographerName: name,
    participantImage: avatar,
    photographerAvatar: avatar,
    lastMessage: lastMsgText,
    timestamp: timeFormatted,
    lastMessageTime: timeFormatted,
    unreadCount: c.unreadCount || c.unread_count || 0,
    online: isOnline,
    bookingDetails: {
      service: c.occasion_type || c.service || 'Photography Session',
      date: c.eventDate || c.event_date ? new Date(c.eventDate || c.event_date).toLocaleDateString() : 'Upcoming',
      status: c.status || 'Confirmed'
    }
  };
};

export const useMessages = (initialBookingId?: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    return cacheGet<Conversation[]>('conversations_list') || [];
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return initialBookingId ? (cacheGet<ChatMessage[]>(`messages_${initialBookingId}`) || []) : [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (initialBookingId) {
      return (cacheGet<ChatMessage[]>(`messages_${initialBookingId}`) || []).length === 0;
    }
    return (cacheGet<Conversation[]>('conversations_list') || []).length === 0;
  });

  const [error, setError] = useState<string | null>(null);
  const currentBookingIdRef = useRef(initialBookingId);

  useEffect(() => {
    currentBookingIdRef.current = initialBookingId;
    if (initialBookingId) {
      const cached = cacheGet<ChatMessage[]>(`messages_${initialBookingId}`);
      if (cached && cached.length > 0) {
        setMessages(cached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
    }
  }, [initialBookingId]);

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
        'conversations_list',
        fetcher,
        (freshData) => {
          setConversations(freshData);
          setIsLoading(false);
        }
      );

      setConversations(data);
    } catch (err: any) {
      console.warn('Could not fetch conversations from API:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMessagesForBooking = useCallback(async (bookingId: string) => {
    const currentUser = tokenManager.getUser();
    const currentUserId = currentUser?.id;

    try {
      const fetcher = async () => {
        const res = await apiClient.get(`/messages/conversation/${bookingId}`);
        if (res.data?.success && Array.isArray(res.data?.data)) {
          if (res.data.isOnline !== undefined) {
            setConversations(prev => prev.map(c => 
              c.id === bookingId ? { ...c, online: res.data.isOnline } : c
            ));
          }

          const mapped: ChatMessage[] = res.data.data.map((m: any) => {
            let parsedAttachments: string[] = [];
            if (Array.isArray(m.attachments)) {
              parsedAttachments = m.attachments;
            } else if (typeof m.attachments === 'string') {
              try { parsedAttachments = JSON.parse(m.attachments); } catch (_) {}
            }

            const senderId = m.sender_id || m.senderId;
            const isSender = (currentUserId && senderId === currentUserId) || m.is_sender === true;

            return {
              id: m.id,
              role: isSender ? 'user' : 'model',
              sender: isSender ? 'user' : 'photographer',
              isSender: isSender,
              text: m.message_text,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date(m.created_at).getTime(),
              status: m.is_read ? 'read' : 'delivered',
              type: parsedAttachments.length > 0 ? 'image' : 'text',
              mediaUrl: parsedAttachments[0]
            };
          });
          return mapped;
        }
        return [];
      };

      const data = await swrFetch<ChatMessage[]>(
        `messages_${bookingId}`,
        fetcher,
        (freshMessages) => {
          if (currentBookingIdRef.current === bookingId) {
            setMessages(freshMessages);
            setIsLoading(false);
          }
        }
      );

      if (currentBookingIdRef.current === bookingId) {
        setMessages(data);
      }

      // Mark conversation as read
      apiClient.patch(`/messages/conversation/${bookingId}/read`)
        .then(() => {
          setConversations(prev => {
            const updated = prev.map(c => c.id === bookingId ? { ...c, unreadCount: 0 } : c);
            cacheSet('conversations_list', updated);
            return updated;
          });
        })
        .catch(() => {});

    } catch (err: any) {
      console.warn(`Could not load messages for ${bookingId}:`, err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = async (bookingId: string, receiverId: string, text: string, attachments?: string[]) => {
    const optimisticMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      sender: 'user',
      isSender: true,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      status: 'sent'
    };
    
    setMessages(prev => {
      const updated = [...prev, optimisticMessage];
      cacheSet(`messages_${bookingId}`, updated);
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
      console.error('Failed to post message:', err.message);
    }
  };

  // Poll conversations every 6s to keep unread badges and chats in continuous sync
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // When active in a conversation, poll for incoming messages every 2.5s for real-time responsiveness
  useEffect(() => {
    if (!initialBookingId) return;
    fetchMessagesForBooking(initialBookingId);
    const interval = setInterval(() => {
      fetchMessagesForBooking(initialBookingId);
    }, 2500);
    return () => clearInterval(interval);
  }, [initialBookingId, fetchMessagesForBooking]);

  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return {
    conversations,
    messages,
    isLoading,
    error,
    totalUnreadCount,
    refetch: fetchConversations,
    fetchMessagesForBooking,
    sendMessage
  };
};

export default useMessages;
