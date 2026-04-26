import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Room } from './data';
import {
  PulseIcon,
} from './icons';

const WS_URL = 'ws://localhost:8765';

type RoomDetailModalProps = {
  room: Room;
  onClose: () => void;
  onSimulateVacancy?: (roomId: string, delayMs: number) => void;
};

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 19.5 4.7 12.3a4.5 4.5 0 0 1 6.4-6.4L12 6.8l.9-.9a4.5 4.5 0 0 1 6.4 6.4L12 19.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PressureIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 13h4l2-5 4 10 2-6h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ThermometerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 14.5V6a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 11.5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function OxygenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 4c3 3.5 5.5 6 5.5 9.2A5.5 5.5 0 0 1 6.5 13.2C6.5 10 9 7.5 12 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const metricCards = [
  {
    key: 'heartRate',
    label: 'Heart Rate',
    icon: HeartIcon,
    tone: 'critical',
    bg: 'bg-[rgba(239,68,68,0.1)]',
    iconBg: 'bg-[rgba(239,68,68,0.13)]',
    iconColor: 'text-[#ef4444]',
  },
  {
    key: 'bloodPressure',
    label: 'Blood Pressure',
    icon: PressureIcon,
    tone: 'warning',
    bg: 'bg-[rgba(245,158,11,0.1)]',
    iconBg: 'bg-[rgba(245,158,11,0.13)]',
    iconColor: 'text-[#f59e0b]',
  },
  {
    key: 'temperature',
    label: 'Temperature',
    icon: ThermometerIcon,
    tone: 'cool',
    bg: 'bg-[rgba(245,158,11,0.1)]',
    iconBg: 'bg-[rgba(59,130,246,0.13)]',
    iconColor: 'text-[#3b82f6]',
  },
  {
    key: 'oxygen',
    label: 'O₂ Saturation',
    icon: OxygenIcon,
    tone: 'success',
    bg: 'bg-[rgba(245,158,11,0.1)]',
    iconBg: 'bg-[rgba(16,185,129,0.13)]',
    iconColor: 'text-[#10b981]',
  },
] as const;




export function RoomDetailModal({ room, onClose, onSimulateVacancy }: RoomDetailModalProps) {
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [vacancyTimer, setVacancyTimer] = useState(5000);
  const [cvFrameStatus, setCvFrameStatus] = useState<'normal' | 'alert' | 'vacant' | null>(null);
  const [vacancyConfirmed, setVacancyConfirmed] = useState(false);
  const lastOccupiedStatus = useRef<'normal' | 'alert'>('normal');
  const wsRef = useRef<WebSocket | null>(null);

  // Derive the displayed status: hold last occupied status until vacancy is confirmed
  const displayStatus: 'normal' | 'alert' | 'vacant' | null =
    vacancyConfirmed ? 'vacant' :
    cvFrameStatus === 'vacant' ? lastOccupiedStatus.current :
    cvFrameStatus;

  console.log('[RoomDetailModal] cvFrameStatus:', cvFrameStatus, 'vacancyConfirmed:', vacancyConfirmed, 'lastOccupied:', lastOccupiedStatus.current, '→ displayStatus:', displayStatus);

  // Auto-vacancy effect
  useEffect(() => {
    if (cvFrameStatus === 'vacant') {
      setVacancyConfirmed(false);
      const timer = setTimeout(() => {
        setVacancyConfirmed(true);
        if (onSimulateVacancy) {
          onSimulateVacancy(room.id, 0);
        }
      }, vacancyTimer);
      return () => clearTimeout(timer);
    } else {
      setVacancyConfirmed(false);
    }
  }, [cvFrameStatus, vacancyTimer, onSimulateVacancy, room.id]);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        console.log('[RoomDetailModal] WS string message:', event.data);
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.status) {
            const s = parsed.status.toLowerCase() as 'normal' | 'alert' | 'vacant';
            console.log('[RoomDetailModal] Parsed status:', s);
            if (s === 'normal' || s === 'alert') {
              lastOccupiedStatus.current = s;
            }
            setCvFrameStatus(s);
          }
        } catch { /* ignore malformed JSON */ }
        return;
      }
      if (!(event.data instanceof ArrayBuffer)) return;
      const blob = new Blob([event.data], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setFrameSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });

    };

    return () => {
      ws.close();
      wsRef.current = null;
      setConnected(false);
      setFrameSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-w-[872px] max-h-[calc(100vh-48px)] flex flex-col p-0 gap-0 rounded-2xl border-border shadow-2xl overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="flex-row shrink-0 items-center justify-between gap-4 p-3 border-b border-border bg-gradient-to-b from-blue-50/50 to-transparent space-y-0">
          <div>
            <DialogTitle className="text-2xl text-slate-900">{room.id}</DialogTitle>
            <DialogDescription className="mt-1.5 text-[1.08rem] text-slate-500 flex flex-col gap-0.5">
              <span>Patient: {room.patient ?? 'Unassigned'} {room.age ? `(${room.age} yrs)` : ''}</span>
              {room.reason && <span className="text-[0.95rem] text-slate-400">Reason: {room.reason}</span>}
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Close room details"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
              <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </Button>
        </DialogHeader>

        {/* Content */}
        <div className="flex flex-col flex-1 gap-2 p-3 overflow-y-auto bg-white min-h-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 w-[200px]">
                <span className="text-sm font-semibold text-slate-700">Room Status:</span>
                {cvFrameStatus === null ? (
                  <span className="text-sm text-slate-400 italic px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50">
                    Scanning...
                  </span>
                ) : cvFrameStatus === 'vacant' ? (
                  <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full border transition-all duration-300 bg-slate-50 text-slate-500 border-slate-200">
                    Vacant
                  </span>
                ) : (
                  <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full border transition-all duration-300 bg-green-50 text-green-700 border-green-200">
                    Occupied
                  </span>
                )}
              </div>

              {cvFrameStatus !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">Patient Status:</span>
                  {cvFrameStatus === 'vacant' ? (
                    <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full border transition-all duration-300 bg-slate-50 text-slate-500 border-slate-200">
                      Unavailable
                    </span>
                  ) : cvFrameStatus === 'alert' ? (
                    <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full border transition-all duration-300 bg-red-50 text-red-700 border-red-200">
                      ⚠ Abnormal body position detected
                    </span>
                  ) : (
                    <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full border transition-all duration-300 bg-green-50 text-green-700 border-green-200">
                      Patient resting normally
                    </span>
                  )}
                </div>
              )}
            </div>
            {/* Live Stream Placeholder */}
            <section className="relative shrink-0 flex flex-col items-center justify-center min-h-[160px] sm:min-h-[200px] p-3 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
            

            {frameSrc ? (
              <img
                className="w-full h-auto object-contain rounded-xl"
                src={frameSrc}
                alt="Live camera feed"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 text-slate-400 text-center w-full py-6">
                <PulseIcon className="w-12 h-12 text-slate-300" />
                <strong className="text-[1.15rem] font-medium text-slate-600">
                  {connected ? 'Connecting to camera...' : room.streamLabel}
                </strong>
                <span className="text-[0.92rem] text-slate-400">
                  {connected ? 'Please wait' : room.cameraLabel}
                </span>
              </div>
            )}
            </section>
          </div>

          {/* Vital Signs */}
          <section className="flex flex-col gap-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {metricCards.map((metric) => {
                const Icon = metric.icon;
                const value = room.vitals[metric.key];

                return (
                  <Card
                    key={metric.key}
                    className={cn(
                      'flex items-center gap-3 min-h-[72px] p-3 border-[rgba(0,0,0,0.02)] rounded-[18px] shadow-none',
                      metric.bg
                    )}
                  >
                    <div className={cn('grid place-items-center w-9 h-9 rounded-[12px]', metric.iconBg, metric.iconColor)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-[#6b7280] text-[0.78rem] leading-[1.2]">{metric.label}</span>
                      <strong className="block mt-0.5 text-[1.05rem] leading-[1.2]">{value}</strong>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col shrink-0 gap-2 p-2.5 px-4 pb-3 border-t border-[rgba(44,62,80,0.06)]">

          {onSimulateVacancy && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-slate-800">Auto-Vacancy Delay</span>
                <span className="text-xs text-slate-500">Wait time before marking room as vacant</span>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  className="text-sm border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={vacancyTimer}
                  onChange={(e) => setVacancyTimer(Number(e.target.value))}
                >
                  <option value={5000}>5 seconds</option>
                  <option value={10000}>10 seconds</option>
                  <option value={60000}>1 minute</option>
                  <option value={300000}>5 minutes</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
