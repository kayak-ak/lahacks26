import { rooms } from '../mockDashboardData';

interface CameraPageProps {
  selectedRoomNumber?: string;
  onSelectRoom: (roomNumber: string) => void;
}

export function CameraPage({ selectedRoomNumber, onSelectRoom }: CameraPageProps) {
  const selectedRoom = rooms.find((room) => room.number === selectedRoomNumber) ?? rooms[0];

  return (
    <main className="dashboard">
      <section className="camera-page-grid">
        <article className="card camera-view-panel">
          <div className="section-heading">
            <div>
              <p className="panel-label">Camera view</p>
              <h2>Room {selectedRoom.number}</h2>
            </div>
            <span className={`severity-badge tone-${selectedRoom.tone}`}>{selectedRoom.statusLabel}</span>
          </div>

          <p className="layout-page-copy">
            This page opens from the layout map so staff can jump straight from a room marker to that room&apos;s
            camera context.
          </p>

          <div className={`camera-feed-stage tone-${selectedRoom.tone}`}>
            <div className="camera-feed-header">
              <span className="camera-feed-badge">Live camera</span>
              <span className="camera-feed-timestamp">Updated 5 sec ago</span>
            </div>

            <div className="camera-feed-grid" aria-hidden="true" />

            <div className="camera-feed-overlay">
              <div className="camera-feed-card">
                <p className="detail-label">Patient</p>
                <strong>{selectedRoom.patient}</strong>
              </div>
              <div className="camera-feed-card">
                <p className="detail-label">Assigned RN</p>
                <strong>{selectedRoom.assignedRn}</strong>
              </div>
              <div className="camera-feed-card">
                <p className="detail-label">Next action</p>
                <strong>{selectedRoom.nextAction}</strong>
              </div>
            </div>
          </div>

          <div className="camera-meta-grid">
            <div className="detail-note">
              <p className="detail-label">Care summary</p>
              <p>{selectedRoom.notes}</p>
            </div>
            <div className="detail-note">
              <p className="detail-label">Family communication</p>
              <p>{selectedRoom.familyStatus}</p>
            </div>
            <div className="detail-note">
              <p className="detail-label">Hand hygiene</p>
              <p>{selectedRoom.hygiene}</p>
            </div>
            <div className="detail-note">
              <p className="detail-label">Last rounded</p>
              <p>{selectedRoom.lastRounded}</p>
            </div>
          </div>
        </article>

        <aside className="card camera-sidebar">
          <div className="section-heading">
            <div>
              <p className="panel-label">Room cameras</p>
              <h2>Switch feeds</h2>
            </div>
          </div>

          <div className="camera-room-list">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className={`camera-room-button ${selectedRoom.number === room.number ? 'active' : ''}`}
                onClick={() => onSelectRoom(room.number)}
              >
                <span className={`room-dot tone-${room.tone}`} />
                <div>
                  <strong>Room {room.number}</strong>
                  <p>{room.statusLabel}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="detection-detail">
            <p className="panel-label">Quick details</p>
            <strong>{selectedRoom.patient}</strong>
            <p>
              Acuity: {selectedRoom.acuity} | RN: {selectedRoom.assignedRn}
            </p>
            <p>{selectedRoom.nextAction}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
