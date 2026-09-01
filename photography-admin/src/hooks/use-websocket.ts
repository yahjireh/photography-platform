'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tokenManager } from '@/lib/api-client';
import { QUERY_KEYS, API_BASE_URL } from '@/lib/constants';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

interface UseWebSocketOptions {
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Reconnect interval in ms (default: 5000) */
  reconnectInterval?: number;
  /** Max reconnect attempts (default: 10) */
  maxReconnectAttempts?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL ||
  (typeof window !== 'undefined'
    ? window.location.origin.replace(/^http/, 'ws') + '/ws'
    : 'ws://localhost:3000/ws');

/**
 * Hook for real-time WebSocket connection
 * Auto-invalidates React Query caches on relevant events
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    debug = false,
  } = options;

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
  const [eventLog, setEventLog] = useState<WebSocketEvent[]>([]);

  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) console.log('[WebSocket]', ...args);
    },
    [debug]
  );

  /**
   * Map incoming WebSocket events to React Query invalidations
   */
  const handleEvent = useCallback(
    (event: WebSocketEvent) => {
      setLastEvent(event);
      setEventLog((prev) => [event, ...prev].slice(0, 50));
      log('Event received:', event.type, event.payload);

      // Invalidate relevant caches based on event type
      switch (event.type) {
        case 'booking.created':
        case 'booking.updated':
        case 'booking.cancelled':
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKINGS });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
          break;

        case 'payment.completed':
        case 'payment.refunded':
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYMENTS });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_REVENUE });
          break;

        case 'user.registered':
        case 'user.suspended':
        case 'user.updated':
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
          break;

        case 'photographer.verified':
        case 'photographer.rejected':
        case 'photographer.registered':
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PHOTOGRAPHERS });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PENDING_VERIFICATIONS });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
          break;

        case 'dispute.opened':
        case 'dispute.resolved':
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DISPUTES });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
          break;

        case 'review.created':
        case 'review.moderated':
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVIEWS });
          break;

        case 'notification':
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
          break;

        case 'stats.updated':
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_REVENUE });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ACTIVE_USERS });
          break;

        default:
          log('Unhandled event type:', event.type);
      }
    },
    [queryClient, log]
  );

  const connect = useCallback(() => {
    const token = tokenManager.getToken();
    if (!token) {
      log('No auth token, skipping WebSocket connection');
      return;
    }

    try {
      setStatus('connecting');
      const socket = new WebSocket(`${WS_BASE_URL}?token=${encodeURIComponent(token)}`);

      socket.onopen = () => {
        log('Connected');
        setStatus('connected');
        reconnectAttempts.current = 0;
      };

      socket.onmessage = (msg) => {
        try {
          const event: WebSocketEvent = JSON.parse(msg.data);
          handleEvent(event);
        } catch (e) {
          log('Failed to parse message:', msg.data);
        }
      };

      socket.onerror = () => {
        log('Connection error');
        setStatus('error');
      };

      socket.onclose = (e) => {
        log('Disconnected', e.code, e.reason);
        setStatus('disconnected');
        ws.current = null;

        // Auto-reconnect
        if (autoReconnect && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          log(`Reconnecting (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          reconnectTimer.current = setTimeout(connect, reconnectInterval);
        }
      };

      ws.current = socket;
    } catch (e) {
      log('Failed to create WebSocket:', e);
      setStatus('error');
    }
  }, [autoReconnect, reconnectInterval, maxReconnectAttempts, handleEvent, log]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    reconnectAttempts.current = maxReconnectAttempts; // prevent auto-reconnect
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
      ws.current = null;
    }
    setStatus('disconnected');
  }, [maxReconnectAttempts]);

  const send = useCallback(
    (type: string, payload: Record<string, unknown> = {}) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }));
      } else {
        log('Cannot send — WebSocket not connected');
      }
    },
    [log]
  );

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (ws.current) {
        ws.current.close(1000, 'Component unmount');
        ws.current = null;
      }
    };
  }, [connect]);

  return {
    status,
    lastEvent,
    eventLog,
    send,
    connect,
    disconnect,
    isConnected: status === 'connected',
  };
}

/**
 * Hook that provides only the WebSocket connection status indicator
 * Lightweight version for header/status bar with live backend health check
 */
export function useWebSocketStatus() {
  const [isLive, setIsLive] = useState(true);
  const [latency, setLatency] = useState<number>(24);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      const start = Date.now();
      try {
        const res = await fetch(`${API_BASE_URL}/admin/system/health`, {
          headers: {
            'Authorization': `Bearer ${tokenManager.getToken() || ''}`
          }
        });
        if (isMounted) {
          if (res.ok || res.status === 401 || res.status === 403) {
            setIsLive(true);
            setLatency(Date.now() - start);
          } else {
            setIsLive(false);
          }
        }
      } catch (_) {
        // Fallback check on base API
        try {
          const fallbackRes = await fetch(`${API_BASE_URL}/photographers/search?limit=1`);
          if (isMounted && fallbackRes.ok) {
            setIsLive(true);
            setLatency(Date.now() - start);
          } else if (isMounted) {
            setIsLive(false);
          }
        } catch {
          if (isMounted) setIsLive(false);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return {
    status: isLive ? ('connected' as WebSocketStatus) : ('disconnected' as WebSocketStatus),
    isConnected: isLive,
    statusColor: isLive ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-red-500',
    statusText: isLive ? 'Live System' : 'Offline',
    latency
  };
}
