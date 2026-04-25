import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { MicrophoneIcon } from '../components/dashboard/icons';

const visualizerDots = Array.from({ length: 41 }, (_, index) => index);

export function VoicePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent_40%),#ffffff] text-slate-900">
      <DashboardHeader activeItem="voice" />

      <main className="flex flex-col gap-8 p-8">
        {/* Intro */}
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
            disabled
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

        {/* Voice Recorder Card */}
        <Card className="flex flex-col items-center justify-center min-h-[414px] p-12 rounded-3xl border-border/50 shadow-xl bg-white/50 backdrop-blur-sm">
          {/* Visualizer */}
          <div className="grid grid-cols-[repeat(41,8px)] gap-1.5 justify-center w-full max-w-3xl mb-16" aria-hidden="true">
            {visualizerDots.map((dot) => (
              <span
                key={dot}
                className="w-2 h-2 rounded-full bg-blue-500"
                style={{
                  opacity: dot < 12 ? 0.2 : Math.min(1, 0.3 + (dot - 11) * 0.05),
                }}
              />
            ))}
          </div>

          {/* Record Button */}
          <Button
            type="button"
            className="w-24 h-24 p-0 rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105"
            aria-label="Start recording"
          >
            <MicrophoneIcon className="w-10 h-10" />
          </Button>

          <p className="mt-8 mb-0 text-slate-400 text-2xl font-light tracking-tight">
            Click to start recording
          </p>
        </Card>
      </main>
    </div>
  );
}
