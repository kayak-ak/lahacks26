export type RoomTone = 'stable' | 'watch' | 'critical' | 'open' | 'cleaning';
export type AlertLevel = 'critical' | 'high' | 'medium';

export interface Room {
  id: string;
  number: string;
  patient: string;
  acuity: 'Low' | 'Moderate' | 'High';
  assignedRn: string;
  statusLabel: string;
  tone: RoomTone;
  lastRounded: string;
  hygiene: string;
  familyStatus: string;
  notes: string;
  nextAction: string;
  layout: {
    top: string;
    left: string;
  };
}

export interface FeedEvent {
  time: string;
  title: string;
  detail: string;
  type: 'rounding' | 'staffing' | 'family' | 'supply';
}

export interface CoverageNeed {
  team: string;
  shift: string;
  progress: string;
  status: string;
}

export interface Metric {
  label: string;
  value: string;
  delta: string;
}

export interface LegendItem {
  tone: RoomTone;
  colorName: string;
  description: string;
}

export interface CvLayoutMarker {
  id: string;
  label: string;
  tone: RoomTone;
  normalizedX: number;
  normalizedY: number;
  confidence: number;
  source: 'mock' | 'cv';
  entityType: 'room' | 'nurse' | 'equipment' | 'cleaning';
  roomNumber?: string;
}

export const rooms: Room[] = [
  {
    id: 'room-201',
    number: '201',
    patient: 'Maya Patel',
    acuity: 'Moderate',
    assignedRn: 'RN Alvarez',
    statusLabel: 'Rounded 12 min ago',
    tone: 'stable',
    lastRounded: '12 minutes ago',
    hygiene: 'Compliant',
    familyStatus: 'Voice update sent at 9:10 AM',
    notes: 'Post-op recovery remains stable with pain trending down.',
    nextAction: 'Prepare noon mobility check',
    layout: { top: '8%', left: '7%' },
  },
  {
    id: 'room-202',
    number: '202',
    patient: 'Open Bed',
    acuity: 'Low',
    assignedRn: 'RN Intake',
    statusLabel: 'Open / available',
    tone: 'open',
    lastRounded: 'Not required',
    hygiene: 'Sanitized at turnover',
    familyStatus: 'No family contact attached',
    notes: 'Bed reset and held for incoming admission from the ED.',
    nextAction: 'Keep room prepped for intake',
    layout: { top: '8%', left: '38%' },
  },
  {
    id: 'room-203',
    number: '203',
    patient: 'Jordan Kim',
    acuity: 'High',
    assignedRn: 'RN Freeman',
    statusLabel: 'Rounding due in 8 min',
    tone: 'watch',
    lastRounded: '52 minutes ago',
    hygiene: 'Pending confirm',
    familyStatus: 'SMS digest queued for 10:30 AM',
    notes: 'Respiratory watchlist room with family callback requested before lunch.',
    nextAction: 'Send RN check-in before threshold breach',
    layout: { top: '8%', left: '69%' },
  },
  {
    id: 'room-204',
    number: '204',
    patient: 'Luis Romero',
    acuity: 'High',
    assignedRn: 'RN Okafor',
    statusLabel: 'Overdue rounding alert',
    tone: 'critical',
    lastRounded: '67 minutes ago',
    hygiene: 'Missed sanitizer event',
    familyStatus: 'Awaiting callback confirmation',
    notes: 'Escalated after no confirmed entry in the last hour.',
    nextAction: 'Page backup RN and resolve alert',
    layout: { top: '61%', left: '69%' },
  },
  {
    id: 'room-205',
    number: '205',
    patient: 'Discharge Pending',
    acuity: 'Low',
    assignedRn: 'RN Chen',
    statusLabel: 'Needs cleaning',
    tone: 'cleaning',
    lastRounded: 'Completed at discharge',
    hygiene: 'Terminal clean requested',
    familyStatus: 'Discharge summary text delivered',
    notes: 'Environmental services request open after transfer at 8:48 AM.',
    nextAction: 'Mark ready after turnover',
    layout: { top: '61%', left: '38%' },
  },
  {
    id: 'room-206',
    number: '206',
    patient: 'Avery Brooks',
    acuity: 'Moderate',
    assignedRn: 'RN Gupta',
    statusLabel: 'Rounded 21 min ago',
    tone: 'stable',
    lastRounded: '21 minutes ago',
    hygiene: 'Compliant',
    familyStatus: 'Family portal synced',
    notes: 'Hydration request closed after SMS triage and supply handoff.',
    nextAction: 'Restock IV supplies',
    layout: { top: '61%', left: '7%' },
  },
];

export const feed: FeedEvent[] = [
  {
    time: '10:14',
    title: 'RN coverage accepted',
    detail: 'Per diem RN T. Nguyen replied YES for the 3 PM to 11 PM open shift.',
    type: 'staffing',
  },
  {
    time: '10:08',
    title: 'Room 204 escalation triggered',
    detail: 'No CV-confirmed rounding event for 67 minutes. High priority alert sent to charge RN.',
    type: 'rounding',
  },
  {
    time: '09:57',
    title: 'Family update completed',
    detail: 'Automated bilingual voice update delivered for Maya Patel without SMS fallback.',
    type: 'family',
  },
  {
    time: '09:41',
    title: 'Supply request routed',
    detail: 'RN support request for hydration supplies was dispatched and closed in 4 minutes.',
    type: 'supply',
  },
  {
    time: '09:23',
    title: 'Room 203 watchlist raised',
    detail: 'Dashboard flagged a nearing rounding deadline based on mock CV events.',
    type: 'rounding',
  },
];

export const coverageNeeds: CoverageNeed[] = [
  { team: 'Registered Nurse', shift: 'Today, 3 PM to 11 PM', progress: '4 of 7 RNs contacted', status: 'Offer accepted' },
  { team: 'Registered Nurse', shift: 'Today, 7 PM to 7 AM', progress: '2 of 6 RNs contacted', status: 'Awaiting replies' },
  { team: 'Registered Nurse', shift: 'Tomorrow, 7 AM to 3 PM', progress: 'Blast scheduled for 11:00 AM', status: 'Queued' },
];

export const alerts: { room: string; message: string; level: AlertLevel }[] = [
  { room: '204', message: 'Overdue rounding and sanitizer compliance miss', level: 'critical' },
  { room: '203', message: 'Room nearing rounding SLA threshold', level: 'high' },
  { room: '205', message: 'Turnover cleaning request still unresolved', level: 'medium' },
];

export const metrics: Metric[] = [
  { label: 'Active alerts', value: '3', delta: '1 critical in the last 15 min' },
  { label: 'Rooms in compliance', value: '83%', delta: '5 of 6 rooms on cadence' },
  { label: 'RN coverage tasks', value: '3', delta: '1 shift already accepted' },
  { label: 'Family updates sent', value: '14', delta: '92% delivered by voice first' },
];

export const toneLabels: Record<RoomTone, string> = {
  stable: 'Green',
  watch: 'Yellow',
  critical: 'Red',
  open: 'Blue',
  cleaning: 'Gray',
};

export const layoutLegendItems: LegendItem[] = [
  { tone: 'stable', colorName: 'Green', description: 'Recently rounded, low acuity' },
  { tone: 'watch', colorName: 'Yellow', description: 'Approaching 60-min rounding deadline' },
  { tone: 'critical', colorName: 'Red', description: 'Overdue rounding or high acuity' },
  { tone: 'open', colorName: 'Blue', description: 'Open / available' },
  { tone: 'cleaning', colorName: 'Gray', description: 'Needs cleaning' },
];

export const cvLayoutMarkers: CvLayoutMarker[] = [
  {
    id: 'marker-room-201',
    label: 'Room 201 stable',
    tone: 'stable',
    normalizedX: 0.18,
    normalizedY: 0.21,
    confidence: 0.94,
    source: 'mock',
    entityType: 'room',
    roomNumber: '201',
  },
  {
    id: 'marker-room-203',
    label: 'Room 203 watchlist',
    tone: 'watch',
    normalizedX: 0.72,
    normalizedY: 0.18,
    confidence: 0.88,
    source: 'mock',
    entityType: 'room',
    roomNumber: '203',
  },
  {
    id: 'marker-room-204',
    label: 'Room 204 overdue',
    tone: 'critical',
    normalizedX: 0.79,
    normalizedY: 0.59,
    confidence: 0.97,
    source: 'mock',
    entityType: 'room',
    roomNumber: '204',
  },
  {
    id: 'marker-room-202',
    label: 'Room 202 open',
    tone: 'open',
    normalizedX: 0.44,
    normalizedY: 0.24,
    confidence: 0.92,
    source: 'mock',
    entityType: 'room',
    roomNumber: '202',
  },
  {
    id: 'marker-room-205',
    label: 'Room 205 cleaning',
    tone: 'cleaning',
    normalizedX: 0.41,
    normalizedY: 0.71,
    confidence: 0.9,
    source: 'mock',
    entityType: 'cleaning',
    roomNumber: '205',
  },
  {
    id: 'marker-room-206',
    label: 'Room 206 stable',
    tone: 'stable',
    normalizedX: 0.16,
    normalizedY: 0.66,
    confidence: 0.91,
    source: 'mock',
    entityType: 'room',
    roomNumber: '206',
  },
  {
    id: 'marker-rounding-risk',
    label: 'Rounding risk cluster',
    tone: 'watch',
    normalizedX: 0.59,
    normalizedY: 0.52,
    confidence: 0.81,
    source: 'mock',
    entityType: 'nurse',
  },
  {
    id: 'marker-intake-bay',
    label: 'Open intake bay',
    tone: 'open',
    normalizedX: 0.56,
    normalizedY: 0.83,
    confidence: 0.79,
    source: 'mock',
    entityType: 'equipment',
  },
];

export const floorMarkers = [
  { label: 'Charge RN station', top: '35%', left: '37%' },
  { label: 'Med supply', top: '48%', left: '59%' },
  { label: 'Family call desk', top: '48%', left: '20%' },
];

export const topBarFeatures = [
  'SMS Triage',
  'Voice Agent',
  'Rounding Sentinel',
  'Shift Management',
  'Family Updates',
  'Realtime Alerts',
];
