import type { ReactNode, SVGProps } from 'react';
import { useMemo, useState } from 'react';
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
import { CubeIcon } from '../components/dashboard/icons';

type InventoryStatus = 'adequate' | 'low' | 'critical';

type InventoryItem = {
  name: string;
  category: string;
  quantity: number;
  minimum: number;
  location: string;
  lastRestocked: string;
  status: InventoryStatus;
};

const inventoryItems: InventoryItem[] = [
  {
    name: 'Surgical Masks',
    category: 'PPE',
    quantity: 450,
    minimum: 200,
    location: 'Storage Room A',
    lastRestocked: '2026-04-20',
    status: 'adequate',
  },
  {
    name: 'Nitrile Gloves (Box)',
    category: 'PPE',
    quantity: 85,
    minimum: 100,
    location: 'Storage Room A',
    lastRestocked: '2026-04-18',
    status: 'low',
  },
  {
    name: 'IV Bags (1000mL)',
    category: 'Medical Supplies',
    quantity: 25,
    minimum: 50,
    location: 'Pharmacy',
    lastRestocked: '2026-04-15',
    status: 'critical',
  },
  {
    name: 'Syringes (5mL)',
    category: 'Medical Supplies',
    quantity: 320,
    minimum: 150,
    location: 'Supply Cabinet 2',
    lastRestocked: '2026-04-22',
    status: 'adequate',
  },
  {
    name: 'Bandages (Sterile)',
    category: 'Wound Care',
    quantity: 180,
    minimum: 100,
    location: 'Storage Room B',
    lastRestocked: '2026-04-21',
    status: 'adequate',
  },
  {
    name: 'Antiseptic Solution',
    category: 'Wound Care',
    quantity: 35,
    minimum: 40,
    location: 'Storage Room B',
    lastRestocked: '2026-04-10',
    status: 'low',
  },
  {
    name: 'Oxygen Masks',
    category: 'Respiratory',
    quantity: 15,
    minimum: 30,
    location: 'Emergency Supply',
    lastRestocked: '2026-04-12',
    status: 'critical',
  },
  {
    name: 'ECG Electrodes',
    category: 'Monitoring',
    quantity: 210,
    minimum: 100,
    location: 'Equipment Room',
    lastRestocked: '2026-04-23',
    status: 'adequate',
  },
];

const filters: Array<{ key: 'all' | InventoryStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'adequate', label: 'Adequate' },
  { key: 'low', label: 'Low' },
  { key: 'critical', label: 'Critical' },
];

const statCards = [
  { key: 'critical', label: 'Critical Items', tone: 'critical' },
  { key: 'low', label: 'Low Stock', tone: 'low' },
  { key: 'adequate', label: 'Adequate Stock', tone: 'adequate' },
] as const;

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

function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3 3 20h18L12 3Zm0 6v4m0 4h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.5 12 2.4 2.4 4.6-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const statusIconMap = {
  adequate: CheckCircleIcon,
  low: ClockIcon,
  critical: AlertIcon,
} satisfies Record<InventoryStatus, (props: SVGProps<SVGSVGElement>) => ReactNode>;

const toneStyles = {
  critical: {
    value: 'text-red-600',
    iconBg: 'bg-red-500',
    badge: 'bg-red-50 text-red-600',
  },
  low: {
    value: 'text-amber-600',
    iconBg: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-600',
  },
  adequate: {
    value: 'text-blue-600',
    iconBg: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-600',
  },
};

export function InventoryPage() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | InventoryStatus>('all');

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return inventoryItems.filter((item) => {
      const matchesFilter = activeFilter === 'all' || item.status === activeFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [item.name, item.category, item.location, item.status]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  const stats = useMemo(
    () => ({
      critical: inventoryItems.filter((item) => item.status === 'critical').length,
      low: inventoryItems.filter((item) => item.status === 'low').length,
      adequate: inventoryItems.filter((item) => item.status === 'adequate').length,
    }),
    [],
  );

  return (
    <main className="flex flex-col gap-7 p-8 flex-1 overflow-auto min-h-0">
        {/* Intro */}
        <section>
          <h1 className="m-0 text-[clamp(2rem,2.4vw,2.875rem)] leading-[1.15] tracking-[-0.03em] text-slate-900">
            Medical Inventory
          </h1>
          <p className="mt-2.5 mb-0 text-slate-500 text-[1.15rem]">
            Monitor and manage medical supplies and equipment
          </p>
        </section>

        {/* Stat Cards */}
        <section className="grid grid-cols-3 gap-6" aria-label="Inventory summary">
          {statCards.map((card) => {
            const Icon = statusIconMap[card.key];
            const styles = toneStyles[card.tone];

            return (
              <Card key={card.key} className="flex items-center justify-between gap-4 min-h-[118px] p-6 rounded-2xl border-border/50 shadow-lg bg-white/50 backdrop-blur-sm">
                <div>
                  <span className="block text-slate-500 text-[0.95rem] font-medium">{card.label}</span>
                  <strong className={cn('block mt-2 text-[3rem] leading-none tracking-tight', styles.value)}>
                    {stats[card.key]}
                  </strong>
                </div>
                <div className={cn('grid place-items-center w-14 h-14 rounded-2xl text-white shadow-md', styles.iconBg)}>
                  <Icon className="w-5 h-5" />
                </div>
              </Card>
            );
          })}
        </section>

        {/* Toolbar */}
        <section className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center" aria-label="Inventory controls">
          <div className="flex items-center gap-3 min-h-[48px] px-4 bg-white border border-slate-200 rounded-full shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
            <SearchIcon className="w-5 h-5 text-slate-400 shrink-0" />
            <span className="sr-only">Search inventory</span>
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search inventory..."
              className="border-0 bg-transparent shadow-none h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400 text-slate-900"
            />
          </div>

          <div className="flex gap-2 items-center" role="tablist" aria-label="Inventory filters">
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

        {/* Inventory Table */}
        <Card className="rounded-3xl border-border/40 shadow-xl overflow-hidden p-0 bg-white/50 backdrop-blur-sm">
          <Table className="min-w-[980px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b-slate-200 hover:bg-transparent">
                <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Item Name</TableHead>
                <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Category</TableHead>
                <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Quantity</TableHead>
                <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Location</TableHead>
                <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Last Restocked</TableHead>
                <TableHead className="px-6 py-[18px] text-slate-900 text-[0.85rem] font-bold uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const StatusIcon = statusIconMap[item.status];
                const styles = toneStyles[item.status];

                return (
                  <TableRow key={item.name} className="border-b-slate-100/60 hover:bg-blue-50/30 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid place-items-center w-10 h-10 text-blue-500 bg-blue-50 rounded-xl">
                          <CubeIcon className="w-5 h-5" />
                        </div>
                        <span className="text-slate-900 font-semibold">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-slate-600">{item.category}</TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-baseline gap-2">
                        <strong className="text-slate-900 font-semibold">{item.quantity}</strong>
                        <span className="text-slate-500 text-[0.78rem] leading-[1.1]">/ {item.minimum} min</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-slate-600">{item.location}</TableCell>
                    <TableCell className="px-6 py-4 text-slate-600">{item.lastRestocked}</TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          'gap-2 min-h-[32px] px-3 rounded-full border-0 text-[0.8rem] font-bold uppercase tracking-wider',
                          styles.badge
                        )}
                      >
                        <StatusIcon className="w-4 h-4" />
                        <span>
                          {item.status === 'low'
                            ? 'Low Stock'
                            : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
        </main>
  );
}
