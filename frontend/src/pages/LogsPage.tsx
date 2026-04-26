import type { SVGProps } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/db/supabase';

type EmailLog = {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  created_at: string;
};

const MOCK_EMAILS: EmailLog[] = [
  { id: 'evt-1', recipient: 'James Wilson', subject: 'Update on condition', body: 'Patient is stable and recovering well', created_at: '2026-04-25T14:30:00Z' },
  { id: 'evt-2', recipient: 'Maria', subject: 'Medication change', body: 'New medication schedule for the next 24 hours', created_at: '2026-04-25T13:15:00Z' },
  { id: 'evt-3', recipient: 'Emily Rodriguez', subject: 'Discharge plan', body: 'Preparing for discharge tomorrow morning', created_at: '2026-04-25T10:00:00Z' },
];

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

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>(MOCK_EMAILS);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const { data: emailsRes } = await supabase
          .from('emails')
          .select('id, subject, body, created_at, patients(name)')
          .order('created_at', { ascending: false })
          .limit(100);

        const unifiedLogs: EmailLog[] = [];

        if (emailsRes) {
          emailsRes.forEach((em: any) => {
            unifiedLogs.push({
              id: em.id,
              recipient: em.patients?.name ?? 'Unknown Patient',
              subject: em.subject,
              body: em.body,
              created_at: em.created_at
            });
          });
        }

        if (unifiedLogs.length > 0) {
          unifiedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setLogs(unifiedLogs);
        }
      } catch {
        // Fallback to mock data if error
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const stats = useMemo(() => {
    const total = logs.length;
    const sent = logs.length;
    return { total, sent };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [log.recipient, log.subject, log.body]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesQuery;
    });
  }, [logs, query]);

  const statCards = [
    { label: 'Total Logs', value: stats.total, tone: 'blue' as const, Icon: MessageIcon },
    { label: 'Sent', value: stats.sent, tone: 'green' as const, Icon: ArrowUpIcon },
    { label: 'Delivered', value: stats.sent, tone: 'amber' as const, Icon: CheckIcon },
  ];

  const toneStyles = {
    blue: { value: 'text-blue-600', iconBg: 'bg-blue-500' },
    green: { value: 'text-green-600', iconBg: 'bg-green-500' },
    amber: { value: 'text-amber-600', iconBg: 'bg-amber-500' },
  };

  return (
    <>
    <main className="flex flex-col gap-4 p-5 flex-1 overflow-hidden min-h-0">
          {/* Header */}
          <section className="shrink-0">
            <h1 className="m-0 text-[clamp(1.75rem,2vw,2.25rem)] leading-[1.15] tracking-[-0.03em] text-slate-900">
              Communication Logs
            </h1>
            <p className="mt-1 mb-0 text-slate-500 text-[1rem]">
              Track all email communications
            </p>
          </section>

          {/* Stat Cards */}
          <section className="grid grid-cols-3 gap-4 shrink-0" aria-label="Message summary">
            {statCards.map((card) => {
              const styles = toneStyles[card.tone];
              return (
                <Card key={card.label} className="flex items-center justify-between gap-4 min-h-[90px] p-4 rounded-2xl border-border/50 shadow-sm bg-white/50 backdrop-blur-sm">
                  <div>
                    <span className="block text-slate-500 text-[0.85rem] font-medium">{card.label}</span>
                    <strong className={cn('block mt-1 text-[2.25rem] leading-none tracking-tight', styles.value)}>
                      {card.value}
                    </strong>
                  </div>
                  <div className={cn('grid place-items-center w-12 h-12 rounded-xl text-white shadow-sm', styles.iconBg)}>
                    <card.Icon className="w-5 h-5" />
                  </div>
                </Card>
              );
            })}
          </section>

          {/* Toolbar */}
          <section className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center shrink-0" aria-label="Log controls">
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
          </section>

          {/* Table */}
          <Card className="flex-1 flex flex-col min-h-0 rounded-3xl border-border/40 shadow-xl overflow-hidden p-0 bg-white/50 backdrop-blur-sm">
            <div className="flex-1 overflow-auto">
              <Table className="min-w-[980px]">
                <TableHeader className="bg-slate-50/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                  <TableRow className="border-b-slate-200 hover:bg-transparent">
                    <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Timestamp</TableHead>
                    <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Name</TableHead>
                    <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Subject</TableHead>
                    <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Body</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        No logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow 
                        key={log.id} 
                        className="cursor-pointer border-b-slate-100/60 hover:bg-blue-50/30 transition-colors"
                        onClick={() => setSelectedLog(log)}
                      >
                        <TableCell className="px-6 py-4 text-slate-600 whitespace-nowrap">
                          {formatTimestamp(log.created_at)}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-slate-600 font-medium">
                          {log.recipient}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-slate-600 max-w-[200px] truncate">
                          {log.subject}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-slate-500 max-w-[320px] truncate">
                          {log.body}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </main>

      <Dialog open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Message Details</DialogTitle>
            <DialogDescription className="text-base mt-2">
              <span className="font-semibold text-slate-700">Recipient:</span> {selectedLog?.recipient}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm font-semibold text-slate-900 mb-1">Subject</p>
              <p className="text-[0.95rem] text-slate-700">{selectedLog?.subject}</p>
            </div>
            <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm font-semibold text-slate-900 mb-1">Body</p>
              <p className="text-[0.95rem] text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                {selectedLog?.body}
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {selectedLog && formatTimestamp(selectedLog.created_at)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
