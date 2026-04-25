import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
    <header className="flex items-center justify-between gap-6 min-h-[73px] px-8 py-4 bg-white/[0.92] border-b border-border/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-10 h-10 rounded-[18px] text-white bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_10px_15px_rgba(59,130,246,0.24)]">
          <PulseIcon className="w-5 h-5" />
        </div>
        <span className="text-[1.75rem] font-semibold tracking-[0.02em] text-blue-900">NurseFlow</span>
      </div>

      <nav className="flex items-center gap-2" aria-label="Primary">
        {navItems.map(({ label, icon: Icon, href, key }) => (
          <Button
            key={label}
            variant={activeItem === key ? 'secondary' : 'ghost'}
            asChild
            className={cn(
              'gap-2 px-5 py-2.5 rounded-full text-[0.95rem] font-medium h-auto',
              activeItem === key
                ? 'bg-blue-50 text-blue-700 shadow-sm hover:bg-blue-100'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
            )}
          >
            <a
              href={href}
              aria-current={activeItem === key ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </a>
          </Button>
        ))}
      </nav>
    </header>
  );
}
