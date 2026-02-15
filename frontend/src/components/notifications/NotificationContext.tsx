import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '../ui/Toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  const playSound = useCallback(() => {
    try {
      // Very short "pop" sound
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"); // Short beep
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play failed (user interaction needed first)", e));
    } catch (e) {
      console.error("Audio error", e);
    }
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...n,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    playSound();

    // Also trigger a toast for immediate feedback
    switch (n.type) {
      case 'success':
        toast.success(n.message);
        break;
      case 'error':
        toast.error(n.message);
        break;
      case 'warning':
        toast.warning(n.message);
        break;
      case 'info':
      default:
        toast.info(n.message);
        break;
    }
  }, [toast, playSound]);

  // Real WebSocket connection
  useEffect(() => {
    const wsUrl = typeof window !== 'undefined' ? (process.env.VITE_WS_URL || `ws://${window.location.host}/ws/notifications`) : 'ws://localhost/ws/notifications';
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            addNotification({
              title: data.title || 'Notification',
              message: data.message || '',
              type: data.type || 'info'
            });
          } catch (e) {
            console.error("Failed to parse WS message", e);
          }
        };

        ws.onclose = () => {
          console.log("WS connection closed");
          if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
            reconnectTimeout = setTimeout(connect, 5000);
          }
        };

        ws.onerror = (err) => {
          console.error("WS error", err);
          ws?.close();
        };
      } catch (e) {
        console.error("WS connection error", e);
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.onclose = null; // Prevent reconnect on unmount
        ws.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [addNotification]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
