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
  SendIcon,
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
  const [cvStatus, setCvStatus] = useState<'normal' | 'alert' | 'vacant' | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Auto-vacancy effect
  useEffect(() => {
    if (cvStatus === 'vacant' && onSimulateVacancy) {
      const timer = setTimeout(() => {
        onSimulateVacancy(room.id, 0);
      }, vacancyTimer);
      return () => clearTimeout(timer);
    }
  }, [cvStatus, vacancyTimer, onSimulateVacancy, room.id]);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.status) {
            const s = parsed.status.toLowerCase() as 'normal' | 'alert' | 'vacant';
            setCvStatus(s);
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
        <DialogHeader className="flex-row shrink-0 items-center justify-between gap-4 p-6 border-b border-border bg-gradient-to-b from-blue-50/50 to-transparent space-y-0">
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
        <div className="flex flex-col flex-1 gap-6 p-6 overflow-y-auto bg-white min-h-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">CV Status:</span>
              {cvStatus === null ? (
                <span className="text-sm text-slate-400 italic">Connecting...</span>
              ) : (
                <span className={cn(
                  "text-sm font-semibold capitalize px-2.5 py-0.5 rounded-full border transition-all duration-300",
                  cvStatus === 'alert' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' :
                  cvStatus === 'normal' ? 'bg-green-50 text-green-700 border-green-200' :
                  'bg-slate-50 text-slate-500 border-slate-200'
                )}>
                  {cvStatus}
                </span>
              )}
              {cvStatus === 'alert' && (
                <span className="text-xs text-red-600 font-medium">
                  ⚠ Abnormal body position detected
                </span>
              )}
              {cvStatus === 'vacant' && (
                <span className="text-xs text-slate-400">
                  No patient detected in frame
                </span>
              )}
              {cvStatus === 'normal' && (
                <span className="text-xs text-green-600">
                  Patient resting normally
                </span>
              )}
            </div>
            {/* Live Stream Placeholder */}
            <section className="relative shrink-0 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[260px] p-4 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
            

            {frameSrc ? (
              <img
                className="w-full h-auto object-contain rounded-xl"
                src={frameSrc}
                alt="Live camera feed"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-400 text-center w-full py-10">
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
          <section className="flex flex-col gap-4">
            <h3 className="m-0 text-[1.75rem]">Vital Signs</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {metricCards.map((metric) => {
                const Icon = metric.icon;
                const value = room.vitals[metric.key];

                return (
                  <Card
                    key={metric.key}
                    className={cn(
                      'flex items-center gap-3 min-h-[86px] p-4 border-[rgba(0,0,0,0.02)] rounded-[18px] shadow-none',
                      metric.bg
                    )}
                  >
                    <div className={cn('grid place-items-center w-10 h-10 rounded-[14px]', metric.iconBg, metric.iconColor)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-[#6b7280] text-[0.84rem] leading-[1.2]">{metric.label}</span>
                      <strong className="block mt-1 text-[1.15rem] leading-[1.2]">{value}</strong>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col shrink-0 gap-4 p-4 px-6 pb-6 border-t border-[rgba(44,62,80,0.06)]">
          <div className="grid grid-cols-2 gap-3 sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              className="min-h-[48px] rounded-full font-medium"
            >
              View Full Records
            </Button>
            <Button
              type="button"
              className="min-h-[48px] gap-2.5 rounded-full font-medium"
            >
              <SendIcon className="w-5 h-5" />
              Request AI Analysis
            </Button>
          </div>

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
