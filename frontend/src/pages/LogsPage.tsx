import type { SVGProps } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Sidebar } from '../components/dashboard/Sidebar';
import { supabase } from '@/db/supabase';

type EventLog = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

// TODO: Remove mock data after events table is populated in Supabase
const MOCK_EVENTS: EventLog[] = [
  { id: 'evt-1', type: 'sms_outbound', payload: { to: '+15552001', message: 'Your family member James Wilson is stable. Vitals normal.', sid: 'SM001' }, created_at: '2026-04-25T14:30:00Z' },
  { id: 'evt-2', type: 'sms_inbound', payload: { from: '+15552002', body: 'How is Maria doing?', intent: 'family_inquiry', action_taken: 'auto_reply' }, created_at: '2026-04-25T13:15:00Z' },
  { id: 'evt-3', type: 'call_out_initiated', payload: { nurse_name: 'Emily Rodriguez', date: '2026-04-25', reason: 'sick' }, created_at: '2026-04-25T10:00:00Z' },
  { id: 'evt-4', type: 'sms_outbound', payload: { to: '+15551002', message: 'SHIFT AVAILABLE: 2026-04-25 15:00-23:00. Reply YES to confirm.', sid: 'SM002' }, created_at: '2026-04-25T10:05:00Z' },
  { id: 'evt-5', type: 'call_out_processed', payload: { nurse_name: 'Emily Rodriguez', date: '2026-04-25', replacement: 'Marcus Johnson', status: 'filled' }, created_at: '2026-04-25T10:20:00Z' },
  { id: 'evt-6', type: 'sms_outbound', payload: { to: '+15552003', message: 'Update: Robert Thompson moved to observation.', sid: 'SM003' }, created_at: '2026-04-25T09:45:00Z' },
  { id: 'evt-7', type: 'sms_inbound', payload: { from: '+15551003', body: 'call out Emily Rodriguez 2026-04-25 sick', intent: 'call_out', action_taken: 'initiated_coverage' }, created_at: '2026-04-25T09:55:00Z' },
  { id: 'evt-8', type: 'shift_blast', payload: { to: 'all_floor_1', message: 'Reminder: Mandatory huddle at 15:00 in break room.', recipients: 4 }, created_at: '2026-04-25T08:00:00Z' },
  { id: 'evt-9', type: 'sms_outbound', payload: { to: '+15552004', message: 'Linda Patel is resting comfortably. No changes.', sid: 'SM004' }, created_at: '2026-04-24T20:30:00Z' },
  { id: 'evt-10', type: 'call_out_initiated', payload: { nurse_name: 'David Kim', date: '2026-04-24', reason: 'family emergency' }, created_at: '2026-04-24T06:00:00Z' },
];

type FilterKey = 'all' | 'sms_inbound' | 'sms_outbound' | 'call_out' | 'shift_blast';

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'sms_inbound', label: 'SMS Inbound' },
  { key: 'sms_outbound', label: 'SMS Outbound' },
  { key: 'call_out', label: 'Call Out' },
  { key: 'shift_blast', label: 'Shift Blast' },
];

const typeBadgeStyles: Record<string, string> = {
  sms_inbound: 'bg-blue-50 text-blue-600',
  sms_outbound: 'bg-green-50 text-green-600',
  call_out_initiated: 'bg-amber-50 text-amber-600',
  call_out_processed: 'bg-purple-50 text-purple-600',
  shift_blast: 'bg-indigo-50 text-indigo-600',
};

function typeLabel(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractRecipient(event: EventLog): string {
  const p = event.payload;
  return (p.to as string) ?? (p.from as string) ?? '\u2014';
}

function extractMessage(event: EventLog): string {
  const p = event.payload;
  return (p.message as string) ?? (p.body as string) ?? '\u2014';
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MessageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 19V5m0 0-7 7m7-7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5v14m0 0 7-7m-7 7-7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LogsPage() {
  const [events, setEvents] = useState<EventLog[]>(MOCK_EVENTS);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          setEvents(data);
        }
        // TODO: Remove fallback to mock data once Supabase is reliably seeded
      } catch {
        // Supabase unavailable — keep mock data
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const stats = useMemo(() => {
    const total = events.length;
    const outbound = events.filter((e) => e.type === 'sms_outbound').length;
    const inbound = events.filter((e) => e.type === 'sms_inbound').length;
    return { total, outbound, inbound };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'call_out'
          ? event.type === 'call_out_initiated' || event.type === 'call_out_processed'
          : event.type === activeFilter);

      const matchesQuery =
        normalizedQuery.length === 0 ||
        [event.type, extractRecipient(event), extractMessage(event)]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [events, activeFilter, query]);

  const statCards = [
    { label: 'Total Messages', value: stats.total, tone: 'blue' as const, Icon: MessageIcon },
    { label: 'Outbound', value: stats.outbound, tone: 'green' as const, Icon: ArrowUpIcon },
    { label: 'Inbound', value: stats.inbound, tone: 'amber' as const, Icon: ArrowDownIcon },
  ];

  const toneStyles = {
    blue: { value: 'text-blue-600', iconBg: 'bg-blue-500' },
    green: { value: 'text-green-600', iconBg: 'bg-green-500' },
    amber: { value: 'text-amber-600', iconBg: 'bg-amber-500' },
  };

  return (
    <div className="flex h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent_40%),#ffffff] text-slate-900 p-3 gap-3 overflow-hidden">
      <Sidebar activeItem="logs" />
      <div className="flex-1 rounded-2xl overflow-hidden border border-border/30 shadow-lg bg-white/80 backdrop-blur-sm h-full flex flex-col min-w-0">
        <main className="flex flex-col gap-7 p-8 flex-1 overflow-auto min-h-0">
          {/* Header */}
          <section>
            <h1 className="m-0 text-[clamp(2rem,2.4vw,2.875rem)] leading-[1.15] tracking-[-0.03em] text-slate-900">
              Message Logs
            </h1>
            <p className="mt-2.5 mb-0 text-slate-500 text-[1.15rem]">
              Track all voice agent and SMS communications
            </p>
          </section>

          {/* Stat Cards */}
          <section className="grid grid-cols-3 gap-6" aria-label="Message summary">
            {statCards.map((card) => {
              const styles = toneStyles[card.tone];
              return (
                <Card key={card.label} className="flex items-center justify-between gap-4 min-h-[118px] p-6 rounded-2xl border-border/50 shadow-lg bg-white/50 backdrop-blur-sm">
                  <div>
                    <span className="block text-slate-500 text-[0.95rem] font-medium">{card.label}</span>
                    <strong className={cn('block mt-2 text-[3rem] leading-none tracking-tight', styles.value)}>
                      {card.value}
                    </strong>
                  </div>
                  <div className={cn('grid place-items-center w-14 h-14 rounded-2xl text-white shadow-md', styles.iconBg)}>
                    <card.Icon className="w-5 h-5" />
                  </div>
                </Card>
              );
            })}
          </section>

          {/* Toolbar */}
          <section className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center" aria-label="Log controls">
            <div className="flex items-center gap-3 min-h-[48px] px-4 bg-white border border-slate-200 rounded-full shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
              <SearchIcon className="w-5 h-5 text-slate-400 shrink-0" />
              <span className="sr-only">Search logs</span>
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search logs..."
                className="border-0 bg-transparent shadow-none h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400 text-slate-900"
              />
            </div>

            <div className="flex gap-2 items-center" role="tablist" aria-label="Log filters">
              {filters.map((filter) => (
                <Button
                  key={filter.key}
                  type="button"
                  variant={activeFilter === filter.key ? 'default' : 'outline'}
                  className="min-h-[48px] px-6 text-sm font-semibold rounded-full shadow-sm"
                  onClick={() => setActiveFilter(filter.key)}
                  aria-pressed={activeFilter === filter.key}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </section>

          {/* Table */}
          <Card className="rounded-3xl border-border/40 shadow-xl overflow-hidden p-0 bg-white/50 backdrop-blur-sm">
            <Table className="min-w-[980px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b-slate-200 hover:bg-transparent">
                  <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Timestamp</TableHead>
                  <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Type</TableHead>
                  <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Recipient / Sender</TableHead>
                  <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Message</TableHead>
                  <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No events found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id} className="border-b-slate-100/60 hover:bg-blue-50/30 transition-colors">
                      <TableCell className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {formatTimestamp(event.created_at)}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            'gap-1.5 min-h-[28px] px-3 rounded-full border-0 text-[0.78rem] font-bold uppercase tracking-wider',
                            typeBadgeStyles[event.type] ?? 'bg-slate-50 text-slate-600'
                          )}
                        >
                          {typeLabel(event.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-slate-600">
                        {extractRecipient(event)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-slate-600 max-w-[320px] truncate">
                        {extractMessage(event)}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className="gap-1.5 min-h-[28px] px-3 rounded-full border-0 text-[0.78rem] font-bold uppercase tracking-wider bg-green-50 text-green-600">
                          Delivered
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </main>
      </div>
    </div>
  );
}
