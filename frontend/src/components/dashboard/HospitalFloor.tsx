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

/**
 * Each room is mapped to its bounding rectangle in the SVG (viewBox 1600×1000).
 * The overlay buttons are positioned using percentage-based coordinates
 * so they scale with the image.
 */
const roomPositions: Record<
  string,
  { left: number; top: number; width: number; height: number }
> = {
  // Right-side patient rooms — first column (945–1130)
  'Room 101': { left: 945, top: 375, width: 185, height: 107 },
  'Room 102': { left: 945, top: 482, width: 185, height: 118 },
  'Room 103': { left: 945, top: 600, width: 185, height: 115 },
  'Room 104': { left: 945, top: 715, width: 185, height: 115 },
  // Right-side patient rooms — second column (1185–1382)
  'Room 105': { left: 1185, top: 375, width: 197, height: 107 },
  'Room 106': { left: 1185, top: 482, width: 197, height: 118 },
  'Room 107': { left: 1185, top: 600, width: 197, height: 115 },
  'Room 108': { left: 1185, top: 715, width: 197, height: 115 },
  // Left-side exam rooms
  'Exam Room 1': { left: 110, top: 375, width: 155, height: 107 },
  'Exam Room 2': { left: 110, top: 482, width: 155, height: 118 },
  'Exam Room 3': { left: 110, top: 600, width: 155, height: 112 },
  'Exam Room 4': { left: 110, top: 712, width: 155, height: 118 },
  // Bottom emergency/triage
  'Triage Room': { left: 535, top: 730, width: 190, height: 100 },
  'Emergency Room': { left: 725, top: 730, width: 220, height: 155 },
};

const SVG_WIDTH = 1600;
const SVG_HEIGHT = 1000;

const statusStyles: Record<
  RoomStatus,
  { bg: string; ring: string; dot: string; badge: string; glow: string }
> = {
  stable: {
    bg: 'bg-blue-400/15 hover:bg-blue-400/25',
    ring: 'ring-blue-400/40',
    dot: 'bg-blue-500',
    badge: 'bg-blue-600 text-white',
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.35)]',
  },
  critical: {
    bg: 'bg-red-400/20 hover:bg-red-400/30',
    ring: 'ring-red-400/50',
    dot: 'bg-red-500',
    badge: 'bg-red-600 text-white',
    glow: 'shadow-[0_0_14px_rgba(239,68,68,0.4)]',
  },
  vacant: {
    bg: 'bg-slate-300/15 hover:bg-slate-300/25',
    ring: 'ring-slate-300/40',
    dot: 'bg-slate-400',
    badge: 'bg-slate-500 text-white',
    glow: '',
  },
  observation: {
    bg: 'bg-amber-400/18 hover:bg-amber-400/28',
    ring: 'ring-amber-400/45',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500 text-white',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
  },
};


export function HospitalFloor({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onOpenRoom,
}: HospitalFloorProps) {
  return (
    <Card className="flex flex-col gap-4 h-full min-h-0 p-5 rounded-3xl border-border/40 shadow-xl bg-white/50 backdrop-blur-sm">
      <div className="px-2">
        <h1 className="m-0 text-[clamp(1.6rem,2.3vw,2.4rem)] leading-[1.15] tracking-[-0.03em] text-slate-900">
          Hospital Digital Twin
        </h1>
        <p className="mt-2 mb-0 text-slate-500 text-[1rem]">
          Click any room camera to view live feed and patient data
        </p>
      </div>

      {/* Floor Plan with overlaid room buttons */}
      <div className="relative w-full flex-1 min-h-0 flex items-center justify-center">
        <div 
          className="relative aspect-[16/10]"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        >
          {/* The SVG background */}
          <img
            src="/hospital_floor_plan.svg"
            alt="Hospital floor plan"
            className="w-full h-full object-contain select-none pointer-events-none"
            draggable={false}
          />

        {/* Transparent overlay buttons for each patient room */}
        {rooms.map((room) => {
          const pos = roomPositions[room.id];
          if (!pos) return null;

          const isSelected = room.id === selectedRoomId;
          const styles = statusStyles[room.status];

          // Convert SVG coordinates to percentages
          const left = (pos.left / SVG_WIDTH) * 100;
          const top = (pos.top / SVG_HEIGHT) * 100;
          const width = (pos.width / SVG_WIDTH) * 100;
          const height = (pos.height / SVG_HEIGHT) * 100;

          return (
            <button
              key={room.id}
              type="button"
              className={cn(
                'group absolute flex flex-col items-center justify-center gap-0.5 rounded-md cursor-pointer transition-all duration-200 ease-out',
                'ring-2 ring-inset',
                styles.bg,
                styles.ring,
                isSelected && [styles.glow, 'ring-[3px] scale-[1.02] z-10'],
                'hover:scale-[1.02] hover:z-10',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1'
              )}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`,
              }}
              onClick={() => {
                onSelectRoom(room.id);
                onOpenRoom(room.id);
              }}
              aria-label={`${room.id} — ${room.patient ?? 'Unassigned'} — ${room.status}`}
              aria-pressed={isSelected}
            >


              {/* Tooltip-style badge (visible on hover / selected) */}
              <Badge
                className={cn(
                  'absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full z-20',
                  'px-2 py-0.5 text-[0.6rem] font-bold rounded-md border-0 shadow-md whitespace-nowrap',
                  'opacity-0 scale-90 pointer-events-none transition-all duration-150',
                  'group-hover:opacity-100 group-hover:scale-100',
                  isSelected && 'opacity-100 scale-100',
                  styles.badge
                )}
              >
                {room.patient ?? room.status}
              </Badge>
            </button>
          );
        })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 px-2">
        {(
          [
            { status: 'stable', label: 'Stable' },
            { status: 'critical', label: 'Critical' },
            { status: 'observation', label: 'Observation' },
            { status: 'vacant', label: 'Vacant' },
          ] as const
        ).map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span
              className={cn(
                'w-3 h-3 rounded-[3px] border',
                statusStyles[status].bg,
                statusStyles[status].ring
              )}
            />
            {label}
          </div>
        ))}
      </div>
    </Card>
  );
}
