import { useEffect } from 'react';
import type { Room } from './data';
import {
  PulseIcon,
  SendIcon,
} from './icons';

type RoomDetailModalProps = {
  room: Room;
  onClose: () => void;
};

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m7 7 10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
  },
  {
    key: 'bloodPressure',
    label: 'Blood Pressure',
    icon: PressureIcon,
    tone: 'warning',
  },
  {
    key: 'temperature',
    label: 'Temperature',
    icon: ThermometerIcon,
    tone: 'cool',
  },
  {
    key: 'oxygen',
    label: 'O₂ Saturation',
    icon: OxygenIcon,
    tone: 'success',
  },
] as const;

export function RoomDetailModal({ room, onClose }: RoomDetailModalProps) {
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
    <div
      className="room-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="room-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="room-modal__header">
          <div>
            <h2 id="room-modal-title">{room.id}</h2>
            <p>Patient: {room.patient ?? 'Unassigned'}</p>
          </div>

          <button
            type="button"
            className="room-modal__close"
            aria-label="Close room details"
            onClick={onClose}
          >
            <CloseIcon className="room-modal__close-icon" />
          </button>
        </header>

        <div className="room-modal__content">
          <section className="room-modal__stream">
            <span className="room-modal__live-badge">
              <span className="room-modal__live-dot" aria-hidden="true" />
              LIVE
            </span>

            <div className="room-modal__stream-placeholder">
              <PulseIcon className="room-modal__stream-icon" />
              <strong>{room.streamLabel}</strong>
              <span>{room.cameraLabel}</span>
            </div>
          </section>

          <section className="room-modal__metrics">
            <h3>Vital Signs</h3>
            <div className="room-modal__metric-grid">
              {metricCards.map((metric) => {
                const Icon = metric.icon;
                const value = room.vitals[metric.key];

                return (
                  <article
                    key={metric.key}
                    className={`metric-card metric-card--${metric.tone}`}
                  >
                    <div className={`metric-card__icon metric-card__icon--${metric.tone}`}>
                      <Icon className="metric-card__svg" />
                    </div>
                    <div>
                      <span className="metric-card__label">{metric.label}</span>
                      <strong className="metric-card__value">{value}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="room-modal__actions">
          <button type="button" className="room-modal__action room-modal__action--records">
            View Full Records
          </button>
          <button type="button" className="room-modal__action room-modal__action--analysis">
            <SendIcon className="room-modal__action-icon" />
            Request AI Analysis
          </button>
        </footer>
      </section>
    </div>
  );
}
