import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export interface WebSocketMessage {
  type: 'notification' | 'activity' | 'status' | 'error';
  data: any;
  timestamp: string;
}

export interface Activity {
  id: string;
  type: 'apply' | 'email' | 'error' | 'resume' | 'scraping' | 'success';
  title: string;
  description: string;
  time: string;
  timestamp: number;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onActivity?: (activity: Activity) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onActivity,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectInterval = 3000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  // Keep refs for callbacks to avoid reconnecting when they change
  const onMessageRef = useRef(onMessage);
  const onActivityRef = useRef(onActivity);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  // Update refs when props change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onActivityRef.current = onActivity;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
  }, [onMessage, onActivity, onConnect, onDisconnect]);

  const connect = useCallback(() => {
    try {
      // Get auth token
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No auth token found, skipping WebSocket connection');
        return;
      }

      // Prevent duplicate connections
      if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
        console.log("WebSocket already connected or connecting, skipping.");
        return;
      }

      // Create WebSocket connection
      // VITE_WS_URL already includes /ws, so we don't need to append it again
      // ensuring we don't end up with /ws/ws
      const wsUrl = WS_URL.endsWith('/ws') ? WS_URL : `${WS_URL}/ws`;
      const ws = new WebSocket(`${wsUrl}?token=${token}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        onConnectRef.current?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessageRef.current?.(message);

          // Handle activity messages
          if (message.type === 'activity' && onActivityRef.current) {
            const activity: Activity = {
              id: Date.now().toString(),
              type: message.data.activityType || 'success',
              title: message.data.title || 'Activity',
              description: message.data.description || '',
              time: formatTimeAgo(new Date(message.timestamp)),
              timestamp: new Date(message.timestamp).getTime(),
            };
            onActivityRef.current(activity);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        // Ignore errors if we are closing (common in React StrictMode dev)
        if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) return;
        console.error('WebSocket error:', error);
      };

      ws.onclose = (event: CloseEvent) => {
        // Ignore 1005 (No Status) if we initiated the close or it's a dev-mode flicker
        if (event.code === 1005) {
          console.log("WebSocket closed normally (1005).");
          setIsConnected(false);
          onDisconnectRef.current?.();
          return;
        }

        console.log('WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        onDisconnectRef.current?.();

        // Stop reconnecting if policy violation (auth failed)
        if (event.code === 1008) {
          console.error("WebSocket auth failed (Policy Violation). Stopping reconnect.");
          shouldReconnectRef.current = false;
          return;
        }

        // Auto-reconnect
        if (autoReconnect && shouldReconnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
