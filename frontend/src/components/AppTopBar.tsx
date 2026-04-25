interface AppTopBarProps {
  currentPath: '/' | '/layout' | '/camera';
  onNavigate: (path: '/' | '/layout' | '/camera') => void;
}

const navigationItems: Array<{ path: '/' | '/layout' | '/camera'; label: string }> = [
  { path: '/', label: 'Dashboard' },
  { path: '/layout', label: '2D Layout' },
  { path: '/camera', label: 'Camera' },
];

export function AppTopBar({ currentPath, onNavigate }: AppTopBarProps) {
  return (
    <header className="topbar card">
      <div className="topbar-brand">
        <button type="button" className="brand-link" onClick={() => onNavigate('/')}>
          NurseFlow AI
        </button>
        <p className="brand-copy">Operational visibility for rounding, staffing, and family communication.</p>
      </div>

      <nav className="topbar-nav" aria-label="Primary">
        {navigationItems.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`topbar-nav-item ${currentPath === item.path ? 'active' : ''}`}
            onClick={() => onNavigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
