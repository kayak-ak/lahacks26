import type { SVGProps } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Sidebar } from '../components/dashboard/Sidebar';
import { supabase } from '@/db/supabase';

type RoundingLog = {
  entered_at: string;
  sanitized: boolean;
  duration_sec: number;
  notes: string;
};

type Alert = {
  type: string;
  priority: string;
  message: string;
  created_at: string;
};

type PatientAssignment = {
  patient: { id: string; name: string; acuity_level: number; family_phone: string };
  room: { id: string; number: string; status: string };
  vitals: Record<string, string>;
  rounding_logs: RoundingLog[];
  alerts: Alert[];
  tasks: string[];
};

type Shift = {
  id: string;
  nurse: { id: string; name: string; role: string; phone: string };
  time_slot: string;
  status: string;
  patients: PatientAssignment[];
};

type HandoffData = {
  shifts: Shift[];
};

type EventType = 'neutral' | 'alert' | 'critical' | 'observation' | 'medication';

type HandoffEvent = {
  id: string;
  patient_id: string;
  patient_name: string;
  event_type: EventType;
  occurred_at: string;
  notes: string;
  logged_at: string;
};

const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
  { value: 'neutral', label: 'Neutral', color: 'bg-slate-50 text-slate-600' },
  { value: 'observation', label: 'Observation', color: 'bg-blue-50 text-blue-600' },
  { value: 'medication', label: 'Medication', color: 'bg-green-50 text-green-600' },
  { value: 'alert', label: 'Alert', color: 'bg-amber-50 text-amber-600' },
  { value: 'critical', label: 'Critical', color: 'bg-red-50 text-red-600' },
];

function eventTypeColor(type: EventType): string {
  return EVENT_TYPES.find((t) => t.value === type)?.color ?? 'bg-slate-50 text-slate-600';
}

// TODO: Remove mock data after database has been fully implemented and seeded
const MOCK_HANDOFF: HandoffData = {
  shifts: [
    {
      id: 'shift-1',
      nurse: { id: 'n1', name: 'Sarah Chen', role: 'head_nurse', phone: '+15551001' },
      time_slot: '07:00-15:00',
      status: 'confirmed',
      patients: [
        {
          patient: { id: 'p1', name: 'James Wilson', acuity_level: 3, family_phone: '+15552001' },
          room: { id: 'r1', number: '101', status: 'occupied' },
          vitals: { heartRate: '76 bpm', bloodPressure: '118/78 mmHg', temperature: '98.4\u00b0F', oxygen: '98%' },
          rounding_logs: [
            { entered_at: '2026-04-25T14:00:00Z', sanitized: true, duration_sec: 420, notes: 'Patient resting comfortably. Pain level 2/10.' },
            { entered_at: '2026-04-25T13:00:00Z', sanitized: true, duration_sec: 300, notes: 'Administered medication. Vitals stable.' },
            { entered_at: '2026-04-25T12:00:00Z', sanitized: true, duration_sec: 360, notes: 'Lunch served. Patient ate 75% of meal.' },
          ],
          alerts: [],
          tasks: ['Follow-up labs at 16:00', 'Family update call pending'],
        },
        {
          patient: { id: 'p2', name: 'Maria Garcia', acuity_level: 2, family_phone: '+15552002' },
          room: { id: 'r2', number: '102', status: 'occupied' },
          vitals: { heartRate: '82 bpm', bloodPressure: '121/80 mmHg', temperature: '98.8\u00b0F', oxygen: '97%' },
          rounding_logs: [
            { entered_at: '2026-04-25T14:15:00Z', sanitized: true, duration_sec: 480, notes: 'Wound dressing changed. Healing well.' },
            { entered_at: '2026-04-25T13:10:00Z', sanitized: true, duration_sec: 240, notes: 'Physical therapy session completed.' },
          ],
          alerts: [],
          tasks: ['Discharge paperwork review', 'Medication reconciliation'],
        },
      ],
    },
    {
      id: 'shift-2',
      nurse: { id: 'n2', name: 'Marcus Johnson', role: 'nurse', phone: '+15551002' },
      time_slot: '07:00-15:00',
      status: 'confirmed',
      patients: [
        {
          patient: { id: 'p3', name: 'Robert Thompson', acuity_level: 4, family_phone: '+15552003' },
          room: { id: 'r4', number: '104', status: 'occupied' },
          vitals: { heartRate: '115 bpm', bloodPressure: '145/95 mmHg', temperature: '101.2\u00b0F', oxygen: '92%' },
          rounding_logs: [
            { entered_at: '2026-04-25T14:30:00Z', sanitized: true, duration_sec: 600, notes: 'Elevated HR and temp. Notified physician. Awaiting orders.' },
            { entered_at: '2026-04-25T13:30:00Z', sanitized: true, duration_sec: 540, notes: 'Blood cultures drawn. IV antibiotics started.' },
          ],
          alerts: [
            { type: 'vitals_warning', priority: 'high', message: 'Heart rate elevated >110 bpm for 2 hours', created_at: '2026-04-25T14:00:00Z' },
            { type: 'temperature', priority: 'medium', message: 'Temperature 101.2\u00b0F \u2014 monitor for sepsis protocol', created_at: '2026-04-25T13:45:00Z' },
          ],
          tasks: ['Repeat vitals q30min', 'Physician callback pending', 'Blood culture results due'],
        },
        {
          patient: { id: 'p4', name: 'Linda Patel', acuity_level: 1, family_phone: '+15552004' },
          room: { id: 'r5', number: '201', status: 'occupied' },
          vitals: { heartRate: '72 bpm', bloodPressure: '116/74 mmHg', temperature: '98.3\u00b0F', oxygen: '99%' },
          rounding_logs: [
            { entered_at: '2026-04-25T14:10:00Z', sanitized: true, duration_sec: 300, notes: 'Patient ambulating independently. Ready for discharge assessment.' },
          ],
          alerts: [],
          tasks: ['Discharge assessment at 16:00', 'Transport arranged for 17:00'],
        },
      ],
    },
  ],
};

type ShiftTab = 'day' | 'night';

function acuityColor(level: number): string {
  if (level >= 4) return 'bg-red-50 text-red-600';
  if (level === 3) return 'bg-amber-50 text-amber-600';
  if (level === 2) return 'bg-blue-50 text-blue-600';
  return 'bg-green-50 text-green-600';
}

function priorityColor(priority: string): string {
  if (priority === 'high') return 'bg-red-50 text-red-600';
  if (priority === 'medium') return 'bg-amber-50 text-amber-600';
  return 'bg-blue-50 text-blue-600';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function localDateTimeValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isNightShift(timeSlot: string): boolean {
  const start = parseInt(timeSlot.split('-')[0].replace(':', ''), 10);
  return start >= 1900 || start < 700;
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HeartPulseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 12h4l2-5 4 10 3-6h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertTriangleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 3 3 20h18L12 3Zm0 6v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4l2.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function HandoffPage() {
  const [handoffData, setHandoffData] = useState<HandoffData>(MOCK_HANDOFF);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeShiftTab, setActiveShiftTab] = useState<ShiftTab>('day');
  const [expandedShift, setExpandedShift] = useState<string | null>(null);

  // Event logging state
  const [loggedEvents, setLoggedEvents] = useState<HandoffEvent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    patient_id: '',
    event_type: 'neutral' as EventType,
    occurred_at: localDateTimeValue(),
    notes: '',
  });

  useEffect(() => {
    async function fetchHandoff() {
      try {
        const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
        const res = await fetch(`${API_BASE}/handoff?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          if (data.shifts && data.shifts.length > 0) {
            setHandoffData(data);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Backend unavailable
      }

      try {
        const { data: shifts } = await supabase
          .from('shifts')
          .select('*, nurses(*)')
          .eq('date', selectedDate);

        if (shifts && shifts.length > 0) {
          const assembled: HandoffData = { shifts: [] };
          for (const shift of shifts) {
            assembled.shifts.push({
              id: shift.id,
              nurse: shift.nurses ?? { id: '', name: 'Unknown', role: '', phone: '' },
              time_slot: shift.time_slot ?? '',
              status: shift.status ?? 'unknown',
              patients: [],
            });
          }
          if (assembled.shifts.length > 0) {
            setHandoffData(assembled);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Supabase unavailable
      }

      // TODO: Remove fallback to mock data once Supabase is reliably seeded
      setLoading(false);
    }
    fetchHandoff();
  }, [selectedDate]);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('type', ['neutral', 'alert', 'critical', 'observation', 'medication'])
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to fetch events:', error);
        return;
      }
      const mapped: HandoffEvent[] = (data ?? []).map((row: { id: string; type: string; payload: Record<string, string> | null; created_at: string }) => ({
        id: row.id,
        patient_id: row.payload?.patient_id ?? '',
        patient_name: row.payload?.patient_name ?? '',
        event_type: row.type as EventType,
        occurred_at: row.payload?.occurred_at ?? '',
        notes: row.payload?.notes ?? '',
        logged_at: row.created_at,
      }));
      setLoggedEvents(mapped);
    }
    fetchEvents();
  }, []);

  const allPatients = useMemo(() => {
    const patients: { id: string; name: string }[] = [];
    for (const shift of handoffData.shifts) {
      for (const pa of shift.patients) {
        if (!patients.some((p) => p.id === pa.patient.id)) {
          patients.push({ id: pa.patient.id, name: pa.patient.name });
        }
      }
    }
    return patients;
  }, [handoffData]);

  const filteredShifts = useMemo(() => {
    return handoffData.shifts.filter((shift) => {
      const night = isNightShift(shift.time_slot);
      return activeShiftTab === 'night' ? night : !night;
    });
  }, [handoffData, activeShiftTab]);

  const toggleShift = (shiftId: string) => {
    setExpandedShift((prev) => (prev === shiftId ? null : shiftId));
  };

  const openEventDialog = () => {
    setEventForm({
      patient_id: allPatients[0]?.id ?? '',
      event_type: 'neutral',
      occurred_at: localDateTimeValue(),
      notes: '',
    });
    setIsEventDialogOpen(true);
  };

  const handleSubmitEvent = async () => {
    const patient = allPatients.find((p) => p.id === eventForm.patient_id);
    if (!patient || !eventForm.notes.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          type: eventForm.event_type,
          payload: {
            patient_id: eventForm.patient_id,
            patient_name: patient.name,
            notes: eventForm.notes.trim(),
            occurred_at: new Date(eventForm.occurred_at).toISOString(),
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to insert event:', error);
        return;
      }

      const newEvent: HandoffEvent = {
        id: data.id,
        patient_id: eventForm.patient_id,
        patient_name: patient.name,
        event_type: eventForm.event_type,
        occurred_at: new Date(eventForm.occurred_at).toISOString(),
        notes: eventForm.notes.trim(),
        logged_at: data.created_at,
      };

      setLoggedEvents((prev) => [newEvent, ...prev]);
      setIsEventDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) {
      console.error('Failed to delete event:', error);
      return;
    }
    setLoggedEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  return (
    <div className="flex h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent_40%),#ffffff] text-slate-900 p-3 gap-3 overflow-hidden">
      <Sidebar activeItem="handoff" />
      <div className="flex-1 rounded-2xl overflow-hidden border border-border/30 shadow-lg bg-white/80 backdrop-blur-sm h-full flex flex-col min-w-0">
        <main className="flex flex-col gap-7 p-8 flex-1 overflow-auto min-h-0">
          {/* Header */}
          <section>
            <h1 className="m-0 text-[clamp(2rem,2.4vw,2.875rem)] leading-[1.15] tracking-[-0.03em] text-slate-900">
              Shift Handoff Board
            </h1>
            <p className="mt-2.5 mb-0 text-slate-500 text-[1.15rem]">
              Review and accept patient handoffs between shifts
            </p>
          </section>

          {/* Toolbar */}
          <section className="flex items-center gap-4 flex-wrap" aria-label="Handoff controls">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={activeShiftTab === 'day' ? 'default' : 'outline'}
                className="min-h-[48px] px-6 text-sm font-semibold rounded-full shadow-sm"
                onClick={() => setActiveShiftTab('day')}
              >
                Day Shift 7a-7p
              </Button>
              <Button
                type="button"
                variant={activeShiftTab === 'night' ? 'default' : 'outline'}
                className="min-h-[48px] px-6 text-sm font-semibold rounded-full shadow-sm"
                onClick={() => setActiveShiftTab('night')}
              >
                Night Shift 7p-7a
              </Button>
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto min-h-[48px] px-4 rounded-full border-slate-200 shadow-sm"
            />
            <div className="ml-auto">
              <Button
                type="button"
                onClick={openEventDialog}
                className="min-h-[48px] px-6 text-sm font-semibold rounded-full shadow-sm gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <PlusIcon className="w-4 h-4" />
                Log Event
              </Button>
            </div>
          </section>

          {/* Logged Events */}
          {loggedEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Logged Events
                  <Badge variant="outline" className="ml-2 rounded-full border-0 bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-wider px-2.5 py-0.5">
                    {loggedEvents.length}
                  </Badge>
                </h2>
              </div>
              <Card className="rounded-2xl border-border/50 shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden divide-y divide-slate-100">
                {loggedEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 hover:bg-blue-50/20 transition-colors">
                    <div className={cn('grid place-items-center w-10 h-10 rounded-xl shrink-0', eventTypeColor(event.event_type))}>
                      {event.event_type === 'critical' || event.event_type === 'alert' ? (
                        <AlertTriangleIcon className="w-4.5 h-4.5" />
                      ) : (
                        <ClockIcon className="w-4.5 h-4.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">{event.patient_name}</span>
                        <Badge variant="outline" className={cn('rounded-full border-0 font-bold text-[0.7rem] uppercase tracking-wider px-2 py-0.5', eventTypeColor(event.event_type))}>
                          {event.event_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">{event.notes}</p>
                      <span className="text-xs text-slate-400">
                        Occurred: {formatDateTime(event.occurred_at)} &middot; Logged: {formatDateTime(event.logged_at)}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="shrink-0 w-8 h-8 p-0 text-slate-400 hover:text-red-500 rounded-lg"
                      onClick={() => handleDeleteEvent(event.id)}
                      aria-label="Delete event"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                        <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </Card>
            </section>
          )}

          {/* Shifts */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">Loading...</div>
          ) : (
            <div className="flex flex-col gap-6">
              {filteredShifts.map((shift) => (
                <Card
                  key={shift.id}
                  className="rounded-2xl border-border/50 shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden"
                >
                  {/* Shift header */}
                  <button
                    type="button"
                    onClick={() => toggleShift(shift.id)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="grid place-items-center w-12 h-12 rounded-2xl text-white bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{shift.nurse.name}</h3>
                        <p className="text-sm text-slate-500">
                          {shift.nurse.role === 'head_nurse' ? 'Head Nurse' : 'Nurse'} &middot; {shift.time_slot}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="rounded-full border-0 bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-wider px-3 py-1">
                        {shift.patients.length} patient{shift.patients.length !== 1 ? 's' : ''}
                      </Badge>
                      <Badge variant="outline" className={cn(
                        'rounded-full border-0 font-bold text-xs uppercase tracking-wider px-3 py-1',
                        shift.status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                      )}>
                        {shift.status}
                      </Badge>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className={cn('w-5 h-5 text-slate-400 transition-transform', expandedShift === shift.id && 'rotate-180')}
                      >
                        <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded patients */}
                  {expandedShift === shift.id && (
                    <div className="border-t border-slate-100 divide-y divide-slate-100">
                      {shift.patients.map((pa) => (
                        <div key={pa.patient.id} className="p-6 hover:bg-blue-50/20 transition-colors">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold text-slate-900">{pa.patient.name}</span>
                              <Badge variant="outline" className={cn('rounded-full border-0 font-bold text-xs uppercase tracking-wider px-2.5 py-0.5', acuityColor(pa.patient.acuity_level))}>
                                Acuity {pa.patient.acuity_level}
                              </Badge>
                              <span className="text-sm text-slate-500">Room {pa.room.number}</span>
                            </div>
                            {pa.alerts.length > 0 && (
                              <Badge variant="outline" className="rounded-full border-0 bg-red-50 text-red-600 font-bold text-xs uppercase tracking-wider px-3 py-1 gap-1">
                                <AlertTriangleIcon className="w-3.5 h-3.5" />
                                {pa.alerts.length} alert{pa.alerts.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>

                          {/* Vitals */}
                          {Object.keys(pa.vitals).length > 0 && (
                            <div className="flex items-center gap-2 mb-4">
                              <HeartPulseIcon className="w-4 h-4 text-blue-500" />
                              <div className="flex gap-4 text-sm text-slate-600">
                                {Object.entries(pa.vitals).map(([key, val]) => (
                                  <span key={key}>
                                    <span className="font-medium text-slate-700">{key}: </span>
                                    {val}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Alerts */}
                          {pa.alerts.length > 0 && (
                            <div className="flex flex-col gap-2 mb-4">
                              {pa.alerts.map((alert, i) => (
                                <div key={i} className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-sm', priorityColor(alert.priority))}>
                                  <AlertTriangleIcon className="w-4 h-4 shrink-0" />
                                  <span>{alert.message}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Recent rounding */}
                          {pa.rounding_logs.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Recent Rounding</h4>
                              <div className="flex flex-col gap-1.5">
                                {pa.rounding_logs.map((log, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm">
                                    <span className="text-slate-400 shrink-0 w-16">{formatTime(log.entered_at)}</span>
                                    <span className="text-slate-600">{log.notes}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tasks */}
                          {pa.tasks.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pending Tasks</h4>
                              <div className="flex flex-wrap gap-2">
                                {pa.tasks.map((task, i) => (
                                  <Badge key={i} variant="outline" className="rounded-full border-slate-200 text-slate-600 font-medium text-xs px-3 py-1">
                                    {task}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Log Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Log Patient Event</DialogTitle>
            <DialogDescription>
              Record a manual event for a patient. This will be included in handoff reports.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-2">
            {/* Patient select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-patient" className="text-sm font-medium text-slate-700">
                Patient
              </label>
              <select
                id="event-patient"
                value={eventForm.patient_id}
                onChange={(e) => setEventForm((prev) => ({ ...prev, patient_id: e.target.value }))}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              >
                {allPatients.length === 0 && <option value="">No patients available</option>}
                {allPatients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Event type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Event Type</label>
              <div className="flex gap-2 flex-wrap">
                {EVENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setEventForm((prev) => ({ ...prev, event_type: type.value }))}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-semibold border transition-all',
                      eventForm.event_type === type.value
                        ? cn(type.color, 'border-current ring-2 ring-current/20')
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time occurred */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-time" className="text-sm font-medium text-slate-700">
                Time Occurred
              </label>
              <Input
                id="event-time"
                type="datetime-local"
                value={eventForm.occurred_at}
                onChange={(e) => setEventForm((prev) => ({ ...prev, occurred_at: e.target.value }))}
                className="rounded-xl border-slate-200 shadow-sm"
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-notes" className="text-sm font-medium text-slate-700">
                Notes
              </label>
              <textarea
                id="event-notes"
                value={eventForm.notes}
                onChange={(e) => setEventForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Describe what happened..."
                rows={3}
                className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEventDialogOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitEvent}
              disabled={isSubmitting || !eventForm.patient_id || !eventForm.notes.trim()}
              className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              Log Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
