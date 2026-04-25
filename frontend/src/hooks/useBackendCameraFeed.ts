import { useEffect, useRef, useState } from 'react';

export type Detection = {
  personDetected: boolean;
  status: 'NORMAL' | 'ALERT' | 'NONE';
  landmarks: { x: number; y: number; z: number; visibility: number }[];
};

type UseBackendCameraFeedReturn = {
  streamUrl: string | null;
  connected: boolean;
  detection: Detection | null;
  error: string | null;
};

const API_BASE = import.meta.env.VITE_CV_SOCKET_URL ?? '';
const DETECTION_POLL_INTERVAL = 500;

export function useBackendCameraFeed(
  enabled: boolean
): UseBackendCameraFeedReturn {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [detection, setDetection] = useState<Detection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStreamUrl(null);
      setConnected(false);
      setDetection(null);
      setError(null);
      return;
    }

    const url = `${API_BASE}/api/video_feed`;
    setStreamUrl(url);
    setConnected(true);
    setError(null);

    const pollDetection = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/detection_status`);
        if (res.ok) {
          const data: Detection = await res.json();
          setDetection(data);
          setError(null);
          setConnected(true);
        } else {
          setError('Camera stream unavailable');
          setConnected(false);
        }
      } catch {
        setError('Unable to connect to camera stream');
        setConnected(false);
      }
    };

    pollDetection();
    intervalRef.current = window.setInterval(pollDetection, DETECTION_POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setStreamUrl(null);
      setConnected(false);
      setDetection(null);
      setError(null);
    };
  }, [enabled]);

  return { streamUrl, connected, detection, error };
}