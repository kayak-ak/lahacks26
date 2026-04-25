import type { ReactNode, SVGProps } from 'react';
import { useMemo, useState } from 'react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
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
    <div className="dashboard-shell">
      <DashboardHeader activeItem="inventory" />

      <main className="inventory-page">
        <section className="inventory-page__intro">
          <h1>Medical Inventory</h1>
          <p>Monitor and manage medical supplies and equipment</p>
        </section>

        <section className="inventory-stats" aria-label="Inventory summary">
          {statCards.map((card) => {
            const Icon = statusIconMap[card.key];

            return (
              <article key={card.key} className="inventory-stat-card">
                <div>
                  <span className="inventory-stat-card__label">{card.label}</span>
                  <strong className={`inventory-stat-card__value inventory-stat-card__value--${card.tone}`}>
                    {stats[card.key]}
                  </strong>
                </div>
                <div className={`inventory-stat-card__icon inventory-stat-card__icon--${card.tone}`}>
                  <Icon className="inventory-stat-card__icon-svg" />
                </div>
              </article>
            );
          })}
        </section>

        <section className="inventory-toolbar" aria-label="Inventory controls">
          <label className="inventory-search">
            <SearchIcon className="inventory-search__icon" />
            <span className="sr-only">Search inventory</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search inventory..."
            />
          </label>

          <div className="inventory-filters" role="tablist" aria-label="Inventory filters">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`inventory-filter${activeFilter === filter.key ? ' inventory-filter--active' : ''}`}
                onClick={() => setActiveFilter(filter.key)}
                aria-pressed={activeFilter === filter.key}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section className="inventory-table-card">
          <div className="inventory-table-scroll">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Location</th>
                  <th>Last Restocked</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const StatusIcon = statusIconMap[item.status];

                  return (
                    <tr key={item.name}>
                      <td>
                        <div className="inventory-item">
                          <div className="inventory-item__icon">
                            <CubeIcon className="inventory-item__icon-svg" />
                          </div>
                          <span className="inventory-item__name">{item.name}</span>
                        </div>
                      </td>
                      <td>{item.category}</td>
                      <td>
                        <div className="inventory-quantity">
                          <strong>{item.quantity}</strong>
                          <span>/ {item.minimum} min</span>
                        </div>
                      </td>
                      <td>{item.location}</td>
                      <td>{item.lastRestocked}</td>
                      <td>
                        <span className={`inventory-status inventory-status--${item.status}`}>
                          <StatusIcon className="inventory-status__icon" />
                          <span>
                            {item.status === 'low'
                              ? 'Low Stock'
                              : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
