import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { rooms as fallbackRooms, type Room, type RoomStatus } from '@/components/dashboard/data';

type DbRoom = {
  id: string;
  number: string;
  status: string;
  room_type: string;
  last_rounded_at: string | null;
  last_sanitized_at: string | null;
  camera_feed_url: string | null;
};

type DbPatient = {
  id: string;
  name: string;
  acuity_level: number;
  room_id: string;
  age: number | null;
  reason: string | null;
  admitted_at: string;
  family_phone: string | null;
};

type DbVital = {
  id: string;
  patient_id: string;
  heart_rate: number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  temperature_f: string | null;
  oxygen_saturation: number | null;
  recorded_at: string;
};

type DbAlert = {
  id: string;
  type: string;
  room_id: string;
  priority: string;
  message: string | null;
  created_at: string;
  resolved_at: string | null;
};

function mapDbStatusToRoomStatus(dbStatus: string, acuityLevel?: number): RoomStatus {
  if (dbStatus === 'vacant') return 'vacant';
  if (dbStatus === 'needs_cleaning') return 'observation';
  if (acuityLevel !== undefined) {
    if (acuityLevel >= 4) return 'critical';
    if (acuityLevel >= 2) return 'observation';
  }
  return 'stable';
}

function buildRoomId(number: string, roomType: string): string {
  if (roomType === 'exam') return `Exam Room ${number.replace('Exam Room ', '')}`;
  if (roomType === 'triage') return 'Triage Room';
  if (roomType === 'emergency') return 'Emergency Room';
  return `Room ${number}`;
}

function formatVitals(vital: DbVital | undefined): Room['vitals'] {
  if (!vital) {
    return { heartRate: '--', bloodPressure: '--', temperature: '--', oxygen: '--' };
  }
  return {
    heartRate: vital.heart_rate != null ? `${vital.heart_rate} bpm` : '--',
    bloodPressure:
      vital.bp_systolic != null && vital.bp_diastolic != null
        ? `${vital.bp_systolic}/${vital.bp_diastolic} mmHg`
        : '--',
    temperature: vital.temperature_f != null ? `${vital.temperature_f}°F` : '--',
    oxygen: vital.oxygen_saturation != null ? `${vital.oxygen_saturation}%` : '--',
  };
}

function mapRoomsFromDb(
  dbRooms: DbRoom[],
  dbPatients: DbPatient[],
  dbVitals: DbVital[],
  dbAlerts: DbAlert[],
): Room[] {
  const patientByRoom = new Map<string, DbPatient>();
  for (const p of dbPatients) {
    if (p.room_id) patientByRoom.set(p.room_id, p);
  }

  const latestVitalByPatient = new Map<string, DbVital>();
  for (const v of dbVitals) {
    const existing = latestVitalByPatient.get(v.patient_id);
    if (!existing || new Date(v.recorded_at) > new Date(existing.recorded_at)) {
      latestVitalByPatient.set(v.patient_id, v);
    }
  }

  const alertsByRoom = new Map<string, DbAlert[]>();
  for (const a of dbAlerts) {
    if (!a.resolved_at) {
      const existing = alertsByRoom.get(a.room_id) ?? [];
      existing.push(a);
      alertsByRoom.set(a.room_id, existing);
    }
  }

  return dbRooms.map((dbRoom) => {
    const patient = patientByRoom.get(dbRoom.id);
    const vital = patient ? latestVitalByPatient.get(patient.id) : undefined;
    const roomAlerts = alertsByRoom.get(dbRoom.id) ?? [];
    const status = mapDbStatusToRoomStatus(
      dbRoom.status,
      patient?.acuity_level,
    );

    let cameraLabel = 'Camera feed synced';
    if (status === 'vacant') cameraLabel = 'No active patient assignment';
    else if (status === 'critical') cameraLabel = 'Heart rate anomaly detected';
    else if (status === 'observation') cameraLabel = 'Monitoring in progress';
    if (roomAlerts.length > 0) {
      cameraLabel = roomAlerts[0].message ?? cameraLabel;
    }

    const roomId = buildRoomId(dbRoom.number, dbRoom.room_type);

    return {
      id: roomId,
      roomId: dbRoom.id,
      patient: patient?.name,
      age: patient?.age ?? undefined,
      reason: patient?.reason ?? undefined,
      status,
      cameraLabel,
      streamLabel: status === 'vacant' ? 'Room feed idle' : 'Live Camera Feed',
      vitals: formatVitals(vital),
    };
  });
}

export function useRoomData() {
  const [roomsData, setRoomsData] = useState<Room[]>(fallbackRooms);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [roomsResult, patientsResult, vitalsResult, alertsResult] = await Promise.all([
        supabase.from('rooms').select('*').order('number'),
        supabase.from('patients').select('*'),
        supabase.from('vitals').select('*').order('recorded_at', { ascending: false }),
        supabase.from('alerts').select('*').is('resolved_at', null).order('created_at', { ascending: false }),
      ]);

      if (roomsResult.error) throw roomsResult.error;
      if (patientsResult.error) throw patientsResult.error;
      if (vitalsResult.error) throw vitalsResult.error;
      if (alertsResult.error) throw alertsResult.error;

      const dbRooms: DbRoom[] = roomsResult.data ?? [];
      const dbPatients: DbPatient[] = patientsResult.data ?? [];
      const dbVitals: DbVital[] = vitalsResult.data ?? [];
      const dbAlerts: DbAlert[] = alertsResult.data ?? [];

      if (dbRooms.length > 0) {
        const mapped = mapRoomsFromDb(dbRooms, dbPatients, dbVitals, dbAlerts);
        setRoomsData(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch rooms from Supabase, using fallback data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();

    let roomsChannel: ReturnType<typeof supabase.channel> | null = null;
    try {
      roomsChannel = supabase
        .channel('rooms-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
          fetchRooms();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
          fetchRooms();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
          fetchRooms();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vitals' }, () => {
          fetchRooms();
        })
        .subscribe();
    } catch (err) {
      console.warn('Failed to subscribe to Supabase realtime, polling disabled:', err);
    }

    return () => {
      if (roomsChannel) {
        try {
          supabase.removeChannel(roomsChannel);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [fetchRooms]);

  return { rooms: roomsData, setRooms: setRoomsData, loading, error, refetch: fetchRooms };
}