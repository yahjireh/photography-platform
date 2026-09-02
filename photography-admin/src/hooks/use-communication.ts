'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, extractData, handleApiError } from '@/lib/api-client';
import toast from 'react-hot-toast';

export interface CommunicationMessage {
  id: string;
  to: string;
  from?: string;
  email: string;
  phone?: string;
  userType?: string;
  senderId?: string;
  subject: string;
  message: string;
  channel: 'email' | 'sms' | 'in-app' | 'push' | 'bulk';
  status: 'sent' | 'delivered' | 'read' | 'pending';
  date: string;
  isSupportTicket?: boolean;
  replies?: Array<{
    id: string;
    message: string;
    repliedAt: string;
    repliedBy: string;
  }>;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  lastEdited: string;
  active: boolean;
  body?: string;
}

export function useCommunicationMessages() {
  return useQuery<CommunicationMessage[], Error>({
    queryKey: ['admin', 'communication', 'messages'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/communication/messages');
      return extractData(res) || [];
    },
    refetchInterval: 15000,
  });
}

export function useCommunicationTemplates() {
  return useQuery<CommunicationTemplate[], Error>({
    queryKey: ['admin', 'communication', 'templates'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/communication/templates');
      return extractData(res) || [];
    },
  });
}

export function useSendCommunication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      target: 'all' | 'photographers' | 'clients' | 'user';
      userId?: string;
      channels: string[];
      subject: string;
      message: string;
    }) => {
      const res = await api.post<any>('/admin/communication/send', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'communication', 'messages'] });
      toast.success(data?.message || 'Communication broadcast sent successfully!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

export function useUpdateCommunicationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CommunicationTemplate> }) => {
      const res = await api.patch<any>(`/admin/communication/templates/${id}`, updates);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'communication', 'templates'] });
      toast.success('Template updated successfully!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

export function useReplySupportMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, replyMessage }: { ticketId: string; replyMessage: string }) => {
      const res = await api.post<any>('/admin/communication/reply', { ticketId, replyMessage });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'communication', 'messages'] });
      toast.success(data?.message || 'Reply delivered to user!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}
