import { useMemo, useState } from 'react';
import { AdvancedImage, lazyload, placeholder } from '@cloudinary/react';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';
import { auto } from '@cloudinary/url-gen/qualifiers/format';
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { cld, cloudName, isUsingFallbackCloud, uploadPreset } from '../cloudinary/config';
import { UploadWidget } from '../cloudinary/UploadWidget';
import type { CloudinaryUploadResult } from '../cloudinary/UploadWidget';
import { coverageNeeds, floorMarkers, metrics, rooms, toneLabels } from '../mockDashboardData';

export function DashboardPage() {
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[2].id);
  const [uploadedImage, setUploadedImage] = useState<CloudinaryUploadResult | null>(null);
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? rooms[0];
  const hasUploadPreset = Boolean(uploadPreset);

  const floorSnapshot = useMemo(() => {
    const imageId = uploadedImage?.public_id ?? 'samples/people/bicycle';

    return cld
      .image(imageId)
      .resize(fill().width(960).height(680).gravity(autoGravity()))
      .delivery(format(auto()))
      .delivery(quality(autoQuality()));
  }, [uploadedImage]);

  return (
    <main className="dashboard">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">NurseFlow AI</p>
          <h1>See the floor status at a glance.</h1>
          <p className="hero-text">
            New users should be able to open the app and immediately understand what needs attention,
            who owns it, and what action to take next.
          </p>

          <div className="hero-actions">
            <button className="primary-action" type="button">Review priority rooms</button>
            <button className="secondary-action" type="button">Open layout view</button>
          </div>

          <div className="status-strip">
            <span className="status-pill live">Live room tracking</span>
            <span className="status-pill">Simple action-first workflow</span>
          </div>
        </div>

        <div className="hero-visual card">
          <div className="visual-header">
            <div>
              <p className="panel-label">Top-down hospital layout</p>
              <h2>West tower floor map</h2>
            </div>
            <span className="signal">6 rooms tracked</span>
          </div>

          <div className="topdown-layout" aria-label="Top-down room layout overview">
            <div className="layout-corridor" />
            <div className="layout-station">
              <span className="panel-label">Central station</span>
              <strong>Charge RN desk</strong>
              <span>Mock telemetry and call routing</span>
            </div>

            {floorMarkers.map((marker) => (
              <div
                key={marker.label}
                className="layout-marker"
                style={{ top: marker.top, left: marker.left }}
              >
                {marker.label}
              </div>
            ))}

            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className={`layout-room tone-${room.tone} ${selectedRoom.id === room.id ? 'selected' : ''}`}
                onClick={() => setSelectedRoomId(room.id)}
                style={{ top: room.layout.top, left: room.layout.left }}
              >
                <span className="room-number">Room {room.number}</span>
                <strong>{room.patient}</strong>
                <span>{room.statusLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card card">
            <p className="panel-label">{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.delta}</span>
          </article>
        ))}
      </section>

      <section className="content-grid">
          <article className="card room-board">
          <div className="section-heading">
            <div>
              <p className="panel-label">Room status board</p>
              <h2>Priority rooms</h2>
            </div>
            <div className="legend">
              {Object.entries(toneLabels).map(([tone, label]) => (
                <span key={tone} className={`legend-item tone-${tone}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="room-list">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className={`room-row ${selectedRoom.id === room.id ? 'active' : ''}`}
                onClick={() => setSelectedRoomId(room.id)}
              >
                <span className={`room-dot tone-${room.tone}`} />
                <div className="room-row-main">
                  <strong>Room {room.number}</strong>
                  <span>{room.patient}</span>
                </div>
                <div className="room-row-meta">
                  <span>{room.statusLabel}</span>
                  <span>{room.assignedRn}</span>
                </div>
              </button>
            ))}
          </div>
        </article>

        <article className="card detail-panel">
          <div className="section-heading">
            <div>
              <p className="panel-label">Selected room</p>
              <h2>Room {selectedRoom.number} summary</h2>
            </div>
            <span className={`severity-badge tone-${selectedRoom.tone}`}>{selectedRoom.statusLabel}</span>
          </div>

          <div className="detail-grid">
            <div>
              <p className="detail-label">Patient</p>
              <strong>{selectedRoom.patient}</strong>
            </div>
            <div>
              <p className="detail-label">Assigned RN</p>
              <strong>{selectedRoom.assignedRn}</strong>
            </div>
            <div>
              <p className="detail-label">Acuity</p>
              <strong>{selectedRoom.acuity}</strong>
            </div>
            <div>
              <p className="detail-label">Last rounded</p>
              <strong>{selectedRoom.lastRounded}</strong>
            </div>
            <div>
              <p className="detail-label">Hand hygiene</p>
              <strong>{selectedRoom.hygiene}</strong>
            </div>
            <div>
              <p className="detail-label">Next action</p>
              <strong>{selectedRoom.nextAction}</strong>
            </div>
          </div>

          <div className="detail-note">
            <p className="detail-label">Care summary</p>
            <p>{selectedRoom.notes}</p>
          </div>

          <div className="detail-note">
            <p className="detail-label">Family communication</p>
            <p>{selectedRoom.familyStatus}</p>
          </div>

          <div className="detail-actions">
            <button className="primary-action" type="button">Page RN</button>
            <button className="secondary-action" type="button">Mark resolved</button>
          </div>
        </article>

        <article className="card coverage-panel">
          <div className="section-heading">
            <div>
              <p className="panel-label">Shift management</p>
              <h2>Coverage queue</h2>
            </div>
          </div>

          <div className="coverage-list">
            {coverageNeeds.map((item) => (
              <article key={`${item.team}-${item.shift}`} className="coverage-item">
                <div>
                  <strong>{item.team}</strong>
                  <p>{item.shift}</p>
                </div>
                <span className="coverage-status">{item.status}</span>
                <p className="coverage-progress">{item.progress}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="card media-panel">
          <div className="section-heading">
            <div>
              <p className="panel-label">Cloudinary media</p>
              <h2>Room snapshot upload</h2>
            </div>
            <span className="signal">
              {isUsingFallbackCloud ? `Using fallback cloud: ${cloudName}` : `Cloud: ${cloudName}`}
            </span>
          </div>

          <div className="media-preview">
            <AdvancedImage
              cldImg={floorSnapshot}
              plugins={[placeholder({ mode: 'blur' }), lazyload()]}
              alt="Ward snapshot for dashboard media panel"
              className="snapshot-image"
            />
          </div>

          <p className="media-copy">
            Upload a room photo when staff needs quick visual context for a task, handoff, or follow-up.
          </p>

          {hasUploadPreset ? (
            <UploadWidget
              onUploadSuccess={setUploadedImage}
              onUploadError={(error) => window.alert(`Upload failed: ${error.message}`)}
              buttonText="Upload room snapshot"
              className="upload-button"
            />
          ) : (
            <div className="config-callout">
              Add `VITE_CLOUDINARY_UPLOAD_PRESET` to enable live uploads from this panel.
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
