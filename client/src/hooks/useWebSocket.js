import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useWebSocket() {
  const socketRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    socketRef.current = io(import.meta.env.VITE_WS_URL || '', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));

    const reviewEvents = ['review:queued', 'review:processing', 'review:completed', 'review:failed'];
    reviewEvents.forEach(evt => {
      socketRef.current.on(evt, data => {
        setEvents(prev => [{ type: evt, data, ts: Date.now() }, ...prev.slice(0, 49)]);
      });
    });

    return () => socketRef.current?.disconnect();
  }, []);

  return { socket: socketRef.current, events, connected };
}
