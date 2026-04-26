import { useEffect, useRef } from 'react';
import { useDemoAlertStore } from '@/store/demoAlertStore';

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.stop(ctx.currentTime + 0.4);
    setTimeout(() => ctx.close(), 500);
  } catch {
    /* Web Audio not available */
  }
}

export function DemoAlertBanner() {
  const activeAlert = useDemoAlertStore((s) => s.activeAlert);
  const dismissAlert = useDemoAlertStore((s) => s.dismissAlert);
  const setOpenRoomId = useDemoAlertStore((s) => s.setOpenRoomId);
  const lastPlayedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeAlert && activeAlert.id !== lastPlayedIdRef.current) {
      lastPlayedIdRef.current = activeAlert.id;
      playBeep();
    }
  }, [activeAlert]);

  if (!activeAlert) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300 max-w-md">
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-lg">
        <span className="relative mt-0.5 flex h-3 w-3 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-800">
            ⚠ ALERT: Abnormal body position detected in{' '}
            {activeAlert.roomLabel} — {activeAlert.patientName}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => {
                setOpenRoomId(activeAlert.roomId);
                dismissAlert(activeAlert.id);
              }}
              className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors"
            >
              View Camera
            </button>
          </div>
        </div>

        <button
          onClick={() => dismissAlert(activeAlert.id)}
          className="shrink-0 rounded-md p-1 text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
          aria-label="Dismiss alert"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path
              d="m7 7 10 10M17 7 7 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
