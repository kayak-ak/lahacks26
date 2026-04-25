import type { Room, RoomStatus } from './data';

type HospitalFloorProps = {
  rooms: Room[];
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onOpenRoom: (roomId: string) => void;
};

const statusMeta: Record<
  RoomStatus,
  { labelClass: string; dotClass: string; borderClass: string }
> = {
  stable: {
    labelClass: 'room-card__status room-card__status--stable',
    dotClass: 'room-card__dot room-card__dot--stable',
    borderClass: 'room-card--stable',
  },
  critical: {
    labelClass: 'room-card__status room-card__status--critical',
    dotClass: 'room-card__dot room-card__dot--critical',
    borderClass: 'room-card--critical',
  },
  vacant: {
    labelClass: 'room-card__status room-card__status--vacant',
    dotClass: 'room-card__dot room-card__dot--vacant',
    borderClass: 'room-card--vacant',
  },
  observation: {
    labelClass: 'room-card__status room-card__status--observation',
    dotClass: 'room-card__dot room-card__dot--observation',
    borderClass: 'room-card--observation',
  },
};

function RoomCard({
  room,
  isSelected,
  onSelect,
}: {
  room: Room;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const status = statusMeta[room.status];

  return (
    <button
      type="button"
      className={`room-card ${status.borderClass}${isSelected ? ' room-card--selected' : ''}`}
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      <span className="room-card__title">{room.id}</span>
      <span className="room-card__patient">{room.patient ?? 'Unassigned'}</span>
      <span className={status.labelClass}>{room.status}</span>
      <span className={status.dotClass} aria-hidden="true" />
    </button>
  );
}

export function HospitalFloor({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onOpenRoom,
}: HospitalFloorProps) {
  const topRow = rooms.slice(0, 4);
  const bottomRow = rooms.slice(4);

  return (
    <section className="floor-plan-card">
      <div className="floor-plan-card__copy">
        <h1>Hospital Digital Twin</h1>
        <p>Click on any room to view live camera feed and patient data</p>
      </div>

      <div className="floor-plan">
        <div className="floor-plan__row">
          {topRow.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              isSelected={room.id === selectedRoomId}
              onSelect={() => {
                onSelectRoom(room.id);
                onOpenRoom(room.id);
              }}
            />
          ))}
        </div>

        <div className="corridor">
          <div className="corridor__station">
            <span className="corridor__station-title">Nurses Station</span>
            <span className="corridor__station-copy">Main Corridor</span>
          </div>
        </div>

        <div className="floor-plan__row">
          {bottomRow.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              isSelected={room.id === selectedRoomId}
              onSelect={() => {
                onSelectRoom(room.id);
                onOpenRoom(room.id);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
