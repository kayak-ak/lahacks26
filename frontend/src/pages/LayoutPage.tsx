import { useMemo, useState } from 'react';
import { cvLayoutMarkers, layoutLegendItems } from '../mockDashboardData';

interface LayoutPageProps {
  onOpenCamera: (roomNumber: string) => void;
}

export function LayoutPage({ onOpenCamera }: LayoutPageProps) {
  const [selectedMarkerId, setSelectedMarkerId] = useState(cvLayoutMarkers[0]?.id ?? '');

  const selectedMarker = useMemo(
    () => cvLayoutMarkers.find((marker) => marker.id === selectedMarkerId) ?? cvLayoutMarkers[0],
    [selectedMarkerId]
  );
  const selectedCameraRoom = selectedMarker?.roomNumber;

  const handleMapMarkerClick = (markerId: string) => {
    const marker = cvLayoutMarkers.find((entry) => entry.id === markerId);

    if (!marker) {
      return;
    }

    if (marker.roomNumber) {
      onOpenCamera(marker.roomNumber);
      return;
    }

    setSelectedMarkerId(marker.id);
  };

  return (
    <main className="dashboard">
      <section className="layout-page-grid">
        <article className="card layout-canvas-panel">
          <div className="section-heading">
            <div>
              <p className="panel-label">2D layout reference</p>
              <h2>Hospital floor SVG with overlay points</h2>
            </div>
            <span className="signal">Mock detections active</span>
          </div>

          <p className="layout-page-copy">
            The marker model uses normalized coordinates, so later CV outputs can map directly into this SVG
            view without changing the rendering layer.
          </p>
          <p className="layout-page-copy">
            Click any room marker on the map to open that room&apos;s camera view.
          </p>

          <div className="layout-image-stage">
            <img
              src="/layout-placeholder.svg"
              alt="2D hospital floor SVG reference"
              className="layout-reference-image"
            />

            {cvLayoutMarkers.map((marker) => (
              <button
                key={marker.id}
                type="button"
                className={`cv-marker ${selectedMarker?.id === marker.id ? 'active' : ''}`}
                onClick={() => handleMapMarkerClick(marker.id)}
                style={{
                  left: `${marker.normalizedX * 100}%`,
                  top: `${marker.normalizedY * 100}%`,
                }}
                aria-label={`${marker.label} at ${marker.normalizedX.toFixed(2)}, ${marker.normalizedY.toFixed(2)}`}
              >
                <span className={`cv-marker-dot tone-${marker.tone}`} />
                <span className="cv-marker-label">{marker.label}</span>
              </button>
            ))}
          </div>

          <div className="integration-card">
            <p className="panel-label">CV integration shape</p>
            <p className="integration-copy">
              Feed detections into this page as normalized positions between `0` and `1` for `x` and `y`.
            </p>
            <code className="integration-code">
              {'{ id, label, tone, normalizedX, normalizedY, confidence, source, entityType }'}
            </code>
          </div>
        </article>

        <aside className="card layout-sidebar">
          <div className="section-heading">
            <div>
              <p className="panel-label">Legend and detections</p>
              <h2>Color-coded reference</h2>
            </div>
          </div>

          <div className="legend-list">
            {layoutLegendItems.map((item) => (
              <article key={item.tone} className="legend-row">
                <span className={`legend-swatch tone-${item.tone}`} />
                <div>
                  <strong>{item.colorName}</strong>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>

          {selectedMarker && (
            <div className="detection-detail">
              <p className="panel-label">Selected detection</p>
              <strong>{selectedMarker.label}</strong>
              <p>
                Source: {selectedMarker.source} | Type: {selectedMarker.entityType}
              </p>
              <p>
                Coordinates: ({selectedMarker.normalizedX.toFixed(2)}, {selectedMarker.normalizedY.toFixed(2)})
              </p>
              <p>Confidence: {(selectedMarker.confidence * 100).toFixed(0)}%</p>
              {selectedCameraRoom ? (
                <button
                  type="button"
                  className="secondary-action camera-launch-button"
                  onClick={() => onOpenCamera(selectedCameraRoom)}
                >
                  Open room camera
                </button>
              ) : null}
            </div>
          )}

          <div className="detection-list">
            {cvLayoutMarkers.map((marker) => (
              <button
                key={marker.id}
                type="button"
                className={`detection-row ${selectedMarker?.id === marker.id ? 'active' : ''}`}
                onClick={() => setSelectedMarkerId(marker.id)}
              >
                <span className={`legend-swatch tone-${marker.tone}`} />
                <div>
                  <strong>{marker.label}</strong>
                  <p>
                    ({marker.normalizedX.toFixed(2)}, {marker.normalizedY.toFixed(2)}) | {marker.source}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
