import { useEffect, useRef, useState } from 'react';

type WebSocketEvent = {
  event: string;
  [key: string]: any;
};

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketEvent[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!url) return;

    // Basic implementation - in prod use a robust library or context
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [data, ...prev].slice(0, 50)); // Keep last 50
      } catch (e) {
        console.error('WebSocket parse error', e);
      }
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const sendMessage = (msg: object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  };

  return { isConnected, messages, sendMessage };
}
