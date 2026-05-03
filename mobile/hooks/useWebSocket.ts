/**
 * useWebSocket — Real-time connection to backend
 */

import { useEffect, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000/ws';

type MessageHandler = (data: object) => void;

export function useWebSocket(onMessage?: MessageHandler) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const isConnected = useRef(false);

  const connect = useCallback(async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) return;

    const url = `${WS_URL}?token=${token}`;

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        isConnected.current = true;
        console.log('WebSocket connected');
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (_) {}
      };

      ws.current.onclose = () => {
        isConnected.current = false;
        // Reconnect after 3 seconds
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = (err) => {
        console.warn('WebSocket error:', err);
      };
    } catch (err) {
      console.warn('WebSocket connection failed:', err);
    }
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, []);

  const send = useCallback((data: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  return { send, isConnected: isConnected.current };
}
