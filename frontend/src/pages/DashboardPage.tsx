import { useState } from 'react';
import { AssistantSidebar } from '../components/dashboard/AssistantSidebar';
import { Sidebar } from '../components/dashboard/Sidebar';
import { HospitalFloor } from '../components/dashboard/HospitalFloor';
import { RoomDetailModal } from '../components/dashboard/RoomDetailModal';
import { AdmitPatientModal } from '../components/dashboard/AdmitPatientModal';
import { useRoomData } from '../hooks/useRoomData';
import type { Room } from '../components/dashboard/data';

export function DashboardPage() {
  const { rooms: roomsData, setRooms: setRoomsData } = useRoomData();
  const [selectedRoomId, setSelectedRoomId] = useState('Room 102');
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);
  const [admittingRoomId, setAdmittingRoomId] = useState<string | null>(null);

  const selectedRoom =
    roomsData.find((room) => room.id === selectedRoomId) ?? roomsData[0];
  const openRoom =
    roomsData.find((room) => room.id === openRoomId) ?? null;
  const admittingRoom =
    roomsData.find((room) => room.id === admittingRoomId) ?? null;

  const handleOpenRoom = (roomId: string) => {
    const room = roomsData.find((r) => r.id === roomId);
    if (room?.status === 'vacant') {
      setAdmittingRoomId(roomId);
    } else {
      setOpenRoomId(roomId);
    }
  };

  const handleAdmitPatient = (roomId: string, patientData: { patient: string; age: number; reason: string; status: Room['status'] }) => {
    setRoomsData((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              patient: patientData.patient,
              age: patientData.age,
              reason: patientData.reason,
              status: patientData.status,
              cameraLabel: 'Patient admitted, starting monitoring',
              streamLabel: 'Live Camera Feed',
            }
          : r
      )
    );
    setAdmittingRoomId(null);
  };

  const handleSimulateVacancy = (roomId: string, delayMs: number) => {
    setTimeout(() => {
      setRoomsData((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? {
                ...r,
                status: 'vacant',
                patient: undefined,
                age: undefined,
                reason: undefined,
                cameraLabel: 'No active patient assignment',
                streamLabel: 'Room feed idle',
                vitals: {
                  heartRate: '--',
                  bloodPressure: '--',
                  temperature: '--',
                  oxygen: '--',
                },
              }
            : r
        )
      );
    }, delayMs);
  };

  return (
    <div className="flex h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent_40%),#ffffff] text-slate-900 p-3 gap-3 overflow-hidden">
      <Sidebar activeItem="dashboard" />
      <div className="flex-1 rounded-2xl overflow-hidden border border-border/30 shadow-lg bg-white/80 backdrop-blur-sm h-full flex flex-col min-w-0">
        <main className="grid grid-cols-[minmax(0,1fr)_300px] flex-1 min-h-0">
          <div className="p-4 flex flex-col min-h-0">
            <HospitalFloor
              rooms={roomsData}
              selectedRoomId={selectedRoom.id}
              onSelectRoom={setSelectedRoomId}
              onOpenRoom={handleOpenRoom}
            />
          </div>

          <AssistantSidebar selectedRoom={selectedRoom} />
        </main>

        {openRoom ? (
          <RoomDetailModal 
            room={openRoom} 
            onClose={() => setOpenRoomId(null)} 
            onSimulateVacancy={handleSimulateVacancy} 
          />
        ) : null}

        {admittingRoom ? (
          <AdmitPatientModal 
            room={admittingRoom} 
            onClose={() => setAdmittingRoomId(null)} 
            onAdmit={handleAdmitPatient} 
          />
        ) : null}
      </div>
    </div>
  );
}
