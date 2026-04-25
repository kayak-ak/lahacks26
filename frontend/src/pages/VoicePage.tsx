import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { MicrophoneIcon } from '../components/dashboard/icons';

const visualizerDots = Array.from({ length: 41 }, (_, index) => index);

export function VoicePage() {
  return (
    <div className="dashboard-shell">
      <DashboardHeader activeItem="voice" />

      <main className="voice-page">
        <section className="voice-page__intro">
          <div>
            <h1>Voice Interface</h1>
            <p>Speak naturally to document patient care and generate insights</p>
          </div>

          <button type="button" className="voice-page__export" disabled>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="voice-page__export-icon">
              <path
                d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Export to PDF</span>
          </button>
        </section>

        <section className="voice-recorder-card">
          <div className="voice-visualizer" aria-hidden="true">
            {visualizerDots.map((dot) => (
              <span
                key={dot}
                className="voice-visualizer__dot"
                style={{
                  opacity: dot < 12 ? 0.3 : Math.min(1, 0.32 + (dot - 11) * 0.03),
                }}
              />
            ))}
          </div>

          <button type="button" className="voice-recorder-button" aria-label="Start recording">
            <MicrophoneIcon className="voice-recorder-button__icon" />
          </button>

          <p className="voice-recorder-card__prompt">Click to start recording</p>
        </section>
      </main>
    </div>
  );
}
