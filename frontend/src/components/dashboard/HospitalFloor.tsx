import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Room, RoomStatus } from './data';

type HospitalFloorProps = {
  rooms: Room[];
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onOpenRoom: (roomId: string) => void;
};

const statusColors: Record<RoomStatus, { border: string; badge: string; dot: string }> = {
  stable: {
    border: 'border-blue-100',
    badge: 'bg-blue-50 text-blue-600',
    dot: 'bg-blue-400',
  },
  critical: {
    border: 'border-red-100',
    badge: 'bg-red-50 text-red-600',
    dot: 'bg-red-500',
  },
  vacant: {
    border: 'border-slate-100',
    badge: 'bg-slate-50 text-slate-400',
    dot: 'bg-slate-300',
  },
  observation: {
    border: 'border-amber-100',
    badge: 'bg-amber-50 text-amber-600',
    dot: 'bg-amber-400',
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
  const colors = statusColors[room.status];

  return (
    <button
      type="button"
      className={cn(
        'flex flex-col items-center gap-2 min-h-[120px] p-3.5 pb-2.5 bg-white border-2 rounded-xl cursor-pointer transition-all duration-[180ms] ease-in-out',
        'hover:-translate-y-1 hover:shadow-lg hover:border-blue-200',
        'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-blue-100 focus-visible:outline-offset-2',
        colors.border,
        isSelected && '-translate-y-1 shadow-md border-blue-400 ring-2 ring-blue-50'
      )}
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      <span className="text-sm font-bold text-slate-900">{room.id}</span>
      <span className="min-h-[1.1em] text-slate-500 text-[0.72rem]">
        {room.patient ?? 'Unassigned'}
      </span>
      <Badge
        variant="outline"
        className={cn(
          'min-w-[64px] justify-center border-0 rounded-full text-[0.68rem] font-bold lowercase',
          colors.badge
        )}
      >
        {room.status}
      </Badge>
      <span className={cn('w-2 h-2 rounded-full', colors.dot)} aria-hidden="true" />
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
    <Card className="flex flex-col gap-8 h-full min-h-[632px] p-8 rounded-3xl border-border/40 shadow-xl bg-white/50 backdrop-blur-sm">
      <div>
        <h1 className="m-0 text-[clamp(2rem,2.3vw,2.625rem)] leading-[1.15] tracking-[-0.03em] text-slate-900">
          Hospital Digital Twin
        </h1>
        <p className="mt-3 mb-0 text-slate-500 text-[1.15rem]">
          Real-time facility monitoring and patient status overview
        </p>
      </div>

      <div className="flex flex-col flex-1 justify-center gap-[22px] px-1.5 pt-2 pb-1">
        <div className="grid grid-cols-4 gap-4 max-w-[690px] mx-auto">
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

        <div className="relative max-w-[690px] min-h-[140px] mx-auto w-full bg-slate-50 border-y border-slate-200/60 flex items-center justify-center">
          <div className="flex flex-col items-center py-3.5 px-6 bg-white border border-slate-200 shadow-sm rounded-xl">
            <span className="text-[0.88rem] font-bold text-slate-900">Nurses Station</span>
            <span className="text-slate-400 text-[0.8rem]">Main Corridor</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 max-w-[690px] mx-auto">
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
    </Card>
  );
}
