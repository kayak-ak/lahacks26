export type RoomStatus = 'stable' | 'critical' | 'vacant' | 'observation';

export type Room = {
  id: string;
  roomId?: string;
  patient?: string;
  age?: number;
  reason?: string;
  status: RoomStatus;
  cameraLabel: string;
  streamLabel: string;
  vitals: {
    heartRate: string;
    bloodPressure: string;
    temperature: string;
    oxygen: string;
  };
};

export type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
};

export const rooms: Room[] = [
  {
    id: 'Room 101',
    patient: 'Sarah Johnson',
    status: 'stable',
    cameraLabel: 'Camera feed synced 18s ago',
    streamLabel: 'Live Camera Feed',
    vitals: {
      heartRate: '76 bpm',
      bloodPressure: '118/78 mmHg',
      temperature: '98.4°F',
      oxygen: '98%',
    },
  },
  {
    id: 'Room 102',
    patient: 'Michael Chen',
    status: 'critical',
    cameraLabel: 'Heart rate anomaly detected',
    streamLabel: 'Live Camera Feed',
    vitals: {
      heartRate: '115 bpm',
      bloodPressure: '145/95 mmHg',
      temperature: '101.2°F',
      oxygen: '92%',
    },
  },
  {
    id: 'Room 103',
    patient: 'Emma Davis',
    status: 'stable',
    cameraLabel: 'Vitals within expected range',
    streamLabel: 'Live Camera Feed',
    vitals: {
      heartRate: '82 bpm',
      bloodPressure: '121/80 mmHg',
      temperature: '98.8°F',
      oxygen: '97%',
    },
  },
  {
    id: 'Room 104',
    status: 'vacant',
    cameraLabel: 'No active patient assignment',
    streamLabel: 'Room feed idle',
    vitals: {
      heartRate: '--',
      bloodPressure: '--',
      temperature: '--',
      oxygen: '--',
    },
  },
  {
    id: 'Room 105',
    patient: 'James Wilson',
    status: 'observation',
    cameraLabel: 'Mobility check due in 11 minutes',
    streamLabel: 'Live Camera Feed',
    vitals: {
      heartRate: '91 bpm',
      bloodPressure: '132/84 mmHg',
      temperature: '99.5°F',
      oxygen: '95%',
    },
  },
  {
    id: 'Room 106',
    patient: 'Olivia Martinez',
    status: 'stable',
    cameraLabel: 'Medication cycle completed',
    streamLabel: 'Live Camera Feed',
    vitals: {
      heartRate: '72 bpm',
      bloodPressure: '116/74 mmHg',
      temperature: '98.3°F',
      oxygen: '99%',
    },
  },
  {
    id: 'Room 107',
    status: 'vacant',
    cameraLabel: 'Preparing room for next intake',
    streamLabel: 'Room feed idle',
    vitals: {
      heartRate: '--',
      bloodPressure: '--',
      temperature: '--',
      oxygen: '--',
    },
  },
  {
    id: 'Room 108',
    patient: 'Robert Taylor',
    status: 'critical',
    cameraLabel: 'Escalation routed to floor nurse',
    streamLabel: 'Live Camera Feed',
    vitals: {
      heartRate: '122 bpm',
      bloodPressure: '148/98 mmHg',
      temperature: '100.7°F',
      oxygen: '90%',
    },
  },
  {
    id: 'Exam Room 1',
    status: 'vacant',
    cameraLabel: 'Room clean and ready',
    streamLabel: 'Room feed idle',
    vitals: { heartRate: '--', bloodPressure: '--', temperature: '--', oxygen: '--' },
  },
  {
    id: 'Exam Room 2',
    patient: 'David Smith',
    status: 'stable',
    cameraLabel: 'Consultation in progress',
    streamLabel: 'Live Camera Feed',
    vitals: { heartRate: '78 bpm', bloodPressure: '120/80 mmHg', temperature: '98.6°F', oxygen: '98%' },
  },
  {
    id: 'Exam Room 3',
    status: 'vacant',
    cameraLabel: 'Awaiting cleaning',
    streamLabel: 'Room feed idle',
    vitals: { heartRate: '--', bloodPressure: '--', temperature: '--', oxygen: '--' },
  },
  {
    id: 'Exam Room 4',
    patient: 'Lisa Wong',
    status: 'observation',
    cameraLabel: 'Post-procedure observation',
    streamLabel: 'Live Camera Feed',
    vitals: { heartRate: '85 bpm', bloodPressure: '125/82 mmHg', temperature: '99.1°F', oxygen: '96%' },
  },
  {
    id: 'Triage Room',
    patient: 'Incoming Patient',
    status: 'critical',
    cameraLabel: 'Initial assessment',
    streamLabel: 'Live Camera Feed',
    vitals: { heartRate: '130 bpm', bloodPressure: '150/100 mmHg', temperature: '101.5°F', oxygen: '88%' },
  },
  {
    id: 'Emergency Room',
    status: 'vacant',
    cameraLabel: 'Ready for trauma',
    streamLabel: 'Room feed idle',
    vitals: { heartRate: '--', bloodPressure: '--', temperature: '--', oxygen: '--' },
  },
];

export const initialMessages: AssistantMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: "Hello! I'm your AI clinical assistant. I can help you coordinate patient care, access medical records, and provide clinical insights. How can I assist you today?",
    time: '05:03 AM',
  },
];
