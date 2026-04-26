import { useCallback, useRef, useState } from 'react';
import { useVoiceAgent } from '../hooks/useVoiceAgent';
import { MicrophoneIcon } from './dashboard/icons';

const SNAP_MARGIN = 24;

type SnapZone = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

function getSnapPosition(zone: SnapZone, w: number, h: number): { x: number; y: number } {
  const m = SNAP_MARGIN;
  switch (zone) {
    case 'top-left': return { x: m, y: m };
    case 'top-right': return { x: window.innerWidth - w - m, y: m };
    case 'bottom-left': return { x: m, y: window.innerHeight - h - m };
    case 'bottom-right': return { x: window.innerWidth - w - m, y: window.innerHeight - h - m };
  }
}

function findNearestSnap(cx: number, cy: number): SnapZone {
  const left = cx < window.innerWidth / 2;
  const top = cy < window.innerHeight / 2;
  if (top && left) return 'top-left';
  if (top && !left) return 'top-right';
  if (!top && left) return 'bottom-left';
  return 'bottom-right';
}

export function VoiceBubble() {
  const {
    status,
    isSpeaking,
    toggleSession,
  } = useVoiceAgent();

  const bubbleRef = useRef<HTMLDivElement>(null);
  const [snapZone, setSnapZone] = useState<SnapZone>('bottom-right');
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  const stateClass = !isConnected && !isConnecting
    ? 'voice-bubble-static'
    : isSpeaking
      ? 'voice-bubble-speaking'
      : '';

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    hasMoved.current = false;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    hasMoved.current = true;
    const x = e.clientX - dragOffset.current.x;
    const y = e.clientY - dragOffset.current.y;
    setPos({ x, y });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (hasMoved.current && pos) {
      const w = bubbleRef.current?.offsetWidth ?? 56;
      const h = bubbleRef.current?.offsetHeight ?? 56;
      const cx = pos.x + w / 2;
      const cy = pos.y + h / 2;
      setSnapZone(findNearestSnap(cx, cy));
    }
    setPos(null);
  }, [isDragging, pos]);

  const handleClick = useCallback((_e: React.MouseEvent) => {
    if (!hasMoved.current) {
      toggleSession();
    }
  }, [toggleSession]);

  const w = 56;
  const h = 56;
  const snapped = getSnapPosition(snapZone, w, h);
  const style: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, position: 'fixed', width: w, height: h, transition: 'none' }
    : { left: snapped.x, top: snapped.y, position: 'fixed', width: w, height: h, transition: 'left 0.3s cubic-bezier(0.25,1,0.5,1), top 0.3s cubic-bezier(0.25,1,0.5,1)' };

  return (
    <div
      ref={bubbleRef}
      style={{ ...style, zIndex: 50 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className={`relative w-full h-full rounded-full overflow-hidden bg-blue-600 ${isDragging ? 'scale-110 shadow-2xl' : ''} transition-transform duration-150 ${stateClass}`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="voice-bubble-bg absolute inset-0" />
        <div className="voice-bubble-overlay absolute inset-0" />

        <div
          className="absolute inset-0 z-10 rounded-full grid place-items-center bg-black/30 transition-all hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-[#2792dc] focus:ring-offset-2"
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label={isConnected ? 'Stop voice assistant' : 'Start voice assistant — drag to reposition'}
        >
          {isConnecting ? (
            <svg className="w-6 h-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <MicrophoneIcon className="w-6 h-6 text-white" />
          )}
        </div>
      </div>
    </div>
  );
}