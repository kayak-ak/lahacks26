import { useEffect, useRef } from 'react';
import { useDemoAlertStore } from '@/store/demoAlertStore';

const WS_URL = 'ws://localhost:8765';
const ALERT_DEBOUNCE_MS = 10_000;
const DEMO_ROOM_ID = 'Room 102';
const DEMO_PATIENT = 'Michael Chen';

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30_000;

export function useDemoCVMonitor(enabled: boolean) {
  const addAlert = useDemoAlertStore((s) => s.addAlert);
  const setLatestFrameUrl = useDemoAlertStore((s) => s.setLatestFrameUrl);

  const prevStatusRef = useRef<string | null>(null);
  const lastAlertTimeRef = useRef(0);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!enabled) return;

    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current) return;

      const ws = new WebSocket(WS_URL);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
      };

      ws.onmessage = (event: MessageEvent) => {
        if (typeof event.data === 'string') {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.status) {
              const status = parsed.status as 'NORMAL' | 'ALERT' | 'VACANT';
              const prev = prevStatusRef.current;

              if (
                status === 'ALERT' &&
                prev !== 'ALERT' &&
                Date.now() - lastAlertTimeRef.current > ALERT_DEBOUNCE_MS
              ) {
                lastAlertTimeRef.current = Date.now();
                addAlert({
                  id: crypto.randomUUID(),
                  roomId: DEMO_ROOM_ID,
                  roomLabel: DEMO_ROOM_ID,
                  patientName: DEMO_PATIENT,
                  status: 'ALERT',
                  timestamp: Date.now(),
                  dismissed: false,
                });
              }

              prevStatusRef.current = status;
            }
          } catch {
            /* ignore malformed JSON */
          }
          return;
        }

        if (event.data instanceof ArrayBuffer) {
          const blob = new Blob([event.data], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          setLatestFrameUrl(url);
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!mountedRef.current) return;
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
        setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, addAlert, setLatestFrameUrl]);
}
