import { useEffect, useRef, useState, useCallback } from 'react';

const DEFAULT_WS_URL = import.meta.env.PROD
  ? 'wss://ai-job-automation-platform.onrender.com/ws'
  : 'ws://localhost:8000';

const WS_URL = import.meta.env.VITE_WS_URL || DEFAULT_WS_URL;

export interface WebSocketMessage {
  type: 'notification' | 'activity' | 'status' | 'error' | 'ping' | 'pong';
  data: unknown;
  timestamp: string;
}

export interface Activity {
  id: string;
  type: 'apply' | 'email' | 'error' | 'resume' | 'scraping' | 'success';
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
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

interface WebSocketSubscriber {
  onMessage?: (message: WebSocketMessage) => void;
  onActivity?: (activity: Activity) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  setIsConnected: (value: boolean) => void;
  setLastMessage: (message: WebSocketMessage | null) => void;
}

let sharedWs: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let subscriberCount = 0;
let shouldReconnect = true;
const subscribers = new Set<WebSocketSubscriber>();

function notifyConnected() {
  subscribers.forEach((s) => {
    s.setIsConnected(true);
    s.onConnect?.();
  });
}

function notifyDisconnected() {
  subscribers.forEach((s) => {
    s.setIsConnected(false);
    s.onDisconnect?.();
  });
}

function notifyMessage(message: WebSocketMessage) {
  subscribers.forEach((s) => {
    s.setLastMessage(message);
    s.onMessage?.(message);

    if (message.type === 'activity' && s.onActivity) {
      const payload = (message.data as Record<string, unknown>) || {};
      const activity: Activity = {
        id: Date.now().toString(),
        type: (payload.activityType as Activity['type']) || 'success',
        title: (payload.title as string) || 'Activity',
        description: (payload.description as string) || '',
        metadata: (payload.metadata as Record<string, unknown>) || {},
        time: formatTimeAgo(new Date(message.timestamp)),
        timestamp: new Date(message.timestamp).getTime(),
      };
      s.onActivity(activity);
    }
  });
}

function clearSharedTimers() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

function disconnectShared() {
  clearSharedTimers();
  shouldReconnect = false;
  if (sharedWs) {
    sharedWs.close();
    sharedWs = null;
  }
}

function connectShared(autoReconnect: boolean, reconnectIntervalMs: number) {
  const token = localStorage.getItem('access_token');
  if (!token && import.meta.env.MODE !== 'test') {
    console.warn('No auth token found, skipping WebSocket connection');
    return;
  }

  if (sharedWs?.readyState === WebSocket.OPEN || sharedWs?.readyState === WebSocket.CONNECTING) {
    return;
  }

  shouldReconnect = true;

  const wsUrl = WS_URL.endsWith('/ws') ? WS_URL : `${WS_URL}/ws`;
  const ws = new WebSocket(`${wsUrl}?token=${token || 'test-token'}`);

  ws.onopen = () => {
    console.log('WebSocket connected');
    notifyConnected();

    heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
      }
    }, 30000);
  };

  ws.onmessage = (event) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      if (message.type === 'pong') {
        return;
      }
      notifyMessage(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
      return;
    }
    console.error('WebSocket error:', error);
  };

  ws.onclose = (event: CloseEvent) => {
    clearSharedTimers();
    notifyDisconnected();

    if (event.code === 1008) {
      console.error('WebSocket auth failed (Policy Violation). Stopping reconnect.');
      shouldReconnect = false;
      return;
    }

    if (event.code === 1005) {
      // Normal closure often happens on component unmount/navigation.
      // Reconnect only if there are still active subscribers.
      if (!autoReconnect || !shouldReconnect || subscriberCount === 0) {
        return;
      }
    }

    if (autoReconnect && shouldReconnect && subscriberCount > 0) {
      reconnectTimeout = setTimeout(() => {
        connectShared(autoReconnect, reconnectIntervalMs);
      }, reconnectIntervalMs);
    }
  };

  sharedWs = ws;
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
  // Keep refs for callbacks to avoid resubscribing when they change
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
    connectShared(autoReconnect, reconnectInterval);
  }, [autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    subscriberCount = Math.max(0, subscriberCount - 1);
    if (subscriberCount === 0) {
      disconnectShared();
    }
  }, []);

  const sendMessage = useCallback((message: unknown) => {
    if (sharedWs && sharedWs.readyState === WebSocket.OPEN) {
      sharedWs.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    const subscriber: WebSocketSubscriber = {
      onMessage: (msg) => onMessageRef.current?.(msg),
      onActivity: (activity) => onActivityRef.current?.(activity),
      onConnect: () => onConnectRef.current?.(),
      onDisconnect: () => onDisconnectRef.current?.(),
      setIsConnected,
      setLastMessage,
    };

    subscribers.add(subscriber);
    subscriberCount += 1;

    if (sharedWs?.readyState === WebSocket.OPEN) {
      setIsConnected(true);
    }

    connect();

    return () => {
      subscribers.delete(subscriber);
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
