import { useState } from 'react';
import { HospitalFloor } from '../components/dashboard/HospitalFloor';
import { RoomDetailModal } from '../components/dashboard/RoomDetailModal';
import { AdmitPatientModal } from '../components/dashboard/AdmitPatientModal';
import { useRoomData } from '../hooks/useRoomData';
import { useAssistantStore } from '../store/assistantStore';
import type { Room } from '../components/dashboard/data';

export function DashboardPage() {
  const { rooms: roomsData, setRooms: setRoomsData } = useRoomData();
  const selectedRoomId = useAssistantStore((s) => s.selectedRoom?.id) ?? null;
  const setSelectedRoom = useAssistantStore((s) => s.setSelectedRoom);
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);
  const [admittingRoomId, setAdmittingRoomId] = useState<string | null>(null);

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
    <>
      <div className="p-4 flex flex-col min-h-0">
        <HospitalFloor
          rooms={roomsData}
          selectedRoomId={selectedRoomId}
          onSelectRoom={(id) => {
            const room = roomsData.find((r) => r.id === id) ?? null;
            setSelectedRoom(room);
          }}
          onOpenRoom={handleOpenRoom}
        />
      </div>

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
    </>
  );
}
