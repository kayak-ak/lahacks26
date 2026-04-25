import { useState } from 'react';
import { AssistantSidebar } from '../components/dashboard/AssistantSidebar';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { HospitalFloor } from '../components/dashboard/HospitalFloor';
import { RoomDetailModal } from '../components/dashboard/RoomDetailModal';
import { rooms } from '../components/dashboard/data';

export function DashboardPage() {
  const [selectedRoomId, setSelectedRoomId] = useState('Room 102');
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);

  const selectedRoom =
    rooms.find((room) => room.id === selectedRoomId) ?? rooms[0];
  const openRoom =
    rooms.find((room) => room.id === openRoomId) ?? null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent_40%),#ffffff] text-slate-900">
      <DashboardHeader activeItem="dashboard" />

      <main className="grid grid-cols-[minmax(0,1fr)_420px] min-h-[calc(100vh-73px)]">
        <div className="p-8">
          <HospitalFloor
            rooms={rooms}
            selectedRoomId={selectedRoom.id}
            onSelectRoom={setSelectedRoomId}
            onOpenRoom={setOpenRoomId}
          />
        </div>

        <AssistantSidebar selectedRoom={selectedRoom} />
      </main>

      {openRoom ? (
        <RoomDetailModal room={openRoom} onClose={() => setOpenRoomId(null)} />
      ) : null}
    </div>
  );
}
