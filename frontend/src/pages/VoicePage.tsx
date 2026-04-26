import { useEffect, useRef, useState } from 'react';
import { ConversationProvider } from '@elevenlabs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sidebar } from '../components/dashboard/Sidebar';
import { MicrophoneIcon } from '../components/dashboard/icons';
import { useVoiceAgent } from '../hooks/useVoiceAgent';

const TOTAL_DOTS = 41;

function VoicePageInner() {
  const {
    status,
    isSpeaking,
    isMuted,
    setMuted,
    toggleSession,
    getOutputByteFrequencyData,
  } = useVoiceAgent();

  const canvasRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const [freqData, setFreqData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (status !== 'connected') {
      setFreqData(null);
      return;
    }

    let running = true;
    const tick = () => {
      if (!running) return;
      const data = getOutputByteFrequencyData();
      if (data.length > 0) setFreqData(data);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [status, getOutputByteFrequencyData]);

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const isError = status === 'error';

  const getDotStyle = (index: number) => {
    if (!isConnected || !freqData || freqData.length === 0) {
      const baseOpacity = index < 12 ? 0.2 : Math.min(1, 0.3 + (index - 11) * 0.05);
      if (isConnected && isSpeaking) {
        return { opacity: 1, transform: 'scaleY(2.5)', transition: 'all 0.15s ease' };
      }
      return { opacity: baseOpacity, transition: 'opacity 0.3s ease' };
    }

    const freqIndex = Math.floor((index / TOTAL_DOTS) * freqData.length);
    const value = freqData[freqIndex] ?? 0;
    const normalized = value / 255;
    const scale = 1 + normalized * 4;
    const opacity = 0.3 + normalized * 0.7;

    return {
      opacity,
      transform: `scaleY(${scale})`,
      transition: 'transform 0.08s ease-out, opacity 0.08s ease-out',
    };
  };

  return (
    <div className="flex h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent_40%),#ffffff] text-slate-900 p-3 gap-3 overflow-hidden">
      <Sidebar activeItem="voice" />
      <div className="flex-1 rounded-2xl overflow-hidden border border-border/30 shadow-lg bg-white/80 backdrop-blur-sm h-full flex flex-col min-w-0">
        <main className="flex flex-col gap-8 p-8 flex-1 overflow-auto min-h-0">
          <section className="flex items-center justify-between gap-6">
            <div>
              <h1 className="m-0 text-[clamp(2rem,2.4vw,2.875rem)] leading-[1.15] tracking-[-0.03em] text-slate-900">
                Voice Interface
              </h1>
              <p className="mt-2.5 mb-0 text-slate-500 text-[1.15rem]">
                Speak naturally to document patient care and generate insights
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="gap-2.5 min-h-[48px] px-6 text-slate-600 text-sm font-semibold bg-white border-slate-200 rounded-full shadow-sm hover:bg-slate-50"
              disabled={!isConnected}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
                <path
                  d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Export to PDF</span>
            </Button>
          </section>

          <Card className="flex flex-col items-center justify-center min-h-[414px] p-12 rounded-3xl border-border/50 shadow-xl bg-white/50 backdrop-blur-sm">
            <div
              ref={canvasRef}
              className="grid grid-cols-[repeat(41,8px)] gap-1.5 justify-center w-full max-w-3xl mb-16 items-center"
              aria-hidden="true"
            >
              {Array.from({ length: TOTAL_DOTS }, (_, i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-500 origin-center"
                  style={getDotStyle(i)}
                />
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Button
                type="button"
                className={`w-24 h-24 p-0 rounded-full shadow-2xl transition-all hover:scale-105 ${
                  isError
                    ? 'bg-slate-400 hover:bg-slate-500 shadow-slate-300'
                    : isConnected
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
                disabled={isConnecting}
                onClick={toggleSession}
                aria-label={isConnected ? 'Stop recording' : 'Start recording'}
              >
                {isConnecting ? (
                  <svg className="w-10 h-10 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : isConnected ? (
                  <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <MicrophoneIcon className="w-10 h-10 text-white" />
                )}
              </Button>

              {isConnected && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={`w-12 h-12 rounded-full ${isMuted ? 'bg-red-50 border-red-300 text-red-500' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                  onClick={() => setMuted(!isMuted)}
                  aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? (
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 15a3 3 0 0 0 3-3V8a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z" />
                      <path d="M6.5 11.5v.5a5.5 5.5 0 0 0 11 0v-.5" />
                      <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.5" />
                    </svg>
                  ) : (
                    <MicrophoneIcon className="w-5 h-5" />
                  )}
                </Button>
              )}
            </div>

            <p className="mt-8 mb-0 text-slate-400 text-2xl font-light tracking-tight">
              {isError
                ? 'Connection error — tap to retry'
                : isConnecting
                  ? 'Connecting...'
                  : isConnected
                    ? isSpeaking
                      ? 'Speaking...'
                      : 'Listening...'
                    : 'Click to start recording'}
            </p>
          </Card>
        </main>
      </div>
    </div>
  );
}

export function VoicePage() {
  return (
    <ConversationProvider>
      <VoicePageInner />
    </ConversationProvider>
  );
}