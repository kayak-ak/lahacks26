import { useState } from 'react';
import { AssistantSidebar } from '../components/dashboard/AssistantSidebar';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { HospitalFloor } from '../components/dashboard/HospitalFloor';
import { RoomDetailModal } from '../components/dashboard/RoomDetailModal';
import { initialMessages, rooms } from '../components/dashboard/data';

export function DashboardPage() {
  const [selectedRoomId, setSelectedRoomId] = useState('Room 102');
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);

  const selectedRoom =
    rooms.find((room) => room.id === selectedRoomId) ?? rooms[0];
  const openRoom =
    rooms.find((room) => room.id === openRoomId) ?? null;

  return (
    <div className="dashboard-shell">
      <DashboardHeader activeItem="dashboard" />

      <main className="dashboard-layout">
        <div className="dashboard-layout__main">
          <HospitalFloor
            rooms={rooms}
            selectedRoomId={selectedRoom.id}
            onSelectRoom={setSelectedRoomId}
            onOpenRoom={setOpenRoomId}
          />
        </div>

        <AssistantSidebar messages={initialMessages} selectedRoom={selectedRoom} />
      </main>

      {openRoom ? (
        <RoomDetailModal room={openRoom} onClose={() => setOpenRoomId(null)} />
      ) : null}
    </div>
  );
}
