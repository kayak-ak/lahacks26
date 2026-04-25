import { CubeIcon, MicrophoneIcon, PulseIcon } from './icons';

const navItems = [
  { label: 'Dashboard', icon: PulseIcon, href: '/dashboard', key: 'dashboard' },
  { label: 'Voice', icon: MicrophoneIcon, href: '/voice', key: 'voice' },
  { label: 'Inventory', icon: CubeIcon, href: '/inventory', key: 'inventory' },
];

type DashboardHeaderProps = {
  activeItem?: 'dashboard' | 'voice' | 'inventory';
};

export function DashboardHeader({
  activeItem = 'dashboard',
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          <PulseIcon className="brand-mark__icon" />
        </div>
        <span className="brand-name">NurseFlow</span>
      </div>

      <nav className="dashboard-nav" aria-label="Primary">
        {navItems.map(({ label, icon: Icon, href, key }) => (
          <a
            key={label}
            className={`dashboard-nav__item${activeItem === key ? ' dashboard-nav__item--active' : ''}`}
            href={href}
            aria-current={activeItem === key ? 'page' : undefined}
          >
            <Icon className="dashboard-nav__icon" />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </header>
  );
}
