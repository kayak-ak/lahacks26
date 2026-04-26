import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CubeIcon, MicrophoneIcon, PulseIcon, DocumentTextIcon, ClipboardListIcon } from './icons';

const navItems = [
  { label: 'Dashboard', icon: PulseIcon, href: '/dashboard', key: 'dashboard' },
  { label: 'Voice', icon: MicrophoneIcon, href: '/voice', key: 'voice' },
  { label: 'Inventory', icon: CubeIcon, href: '/inventory', key: 'inventory' },
  { label: 'Logs', icon: DocumentTextIcon, href: '/logs', key: 'logs' },
  { label: 'Handoff', icon: ClipboardListIcon, href: '/handoff', key: 'handoff' },
];

type SidebarProps = {
  activeItem?: 'dashboard' | 'voice' | 'inventory' | 'logs' | 'handoff';
};

export function Sidebar({ activeItem = 'dashboard' }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={cn(
        "flex flex-col gap-6 bg-white/80 backdrop-blur-sm border border-border/30 shadow-lg rounded-2xl py-4 transition-all duration-300 ease-in-out shrink-0",
        isOpen ? "w-56 px-3" : "w-[68px] px-2"
      )}
    >
      <div className={cn("flex items-center gap-3 px-2 min-h-[40px]", !isOpen && "justify-center")}>
        <div className="grid place-items-center w-10 h-10 shrink-0 rounded-[18px] text-white bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_10px_15px_rgba(59,130,246,0.24)]">
          <PulseIcon className="w-5 h-5 shrink-0" />
        </div>
        {isOpen && (
          <span className="text-[1.75rem] font-semibold tracking-[0.02em] text-blue-900 whitespace-nowrap">
            NurseFlow
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-2 mt-4" aria-label="Primary">
        {navItems.map(({ label, icon: Icon, href, key }) => (
          <Button
            key={label}
            variant={activeItem === key ? 'secondary' : 'ghost'}
            asChild
            className={cn(
              'gap-3 py-3 rounded-xl text-[0.95rem] font-medium h-auto justify-start overflow-hidden',
              activeItem === key
                ? 'bg-blue-50 text-blue-700 shadow-sm hover:bg-blue-100'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50',
              !isOpen && 'justify-center px-0'
            )}
          >
            <a href={href} aria-current={activeItem === key ? 'page' : undefined}>
              <Icon className="w-5 h-5 shrink-0" />
              {isOpen && <span>{label}</span>}
            </a>
          </Button>
        ))}
      </nav>

      <div className="mt-auto px-2">
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-center text-slate-500 hover:text-slate-700 h-10"
          aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={cn("w-5 h-5 shrink-0 transition-transform", !isOpen && "rotate-180")}
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>
    </aside>
  );
}
