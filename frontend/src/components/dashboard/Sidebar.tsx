import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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

export function Sidebar() {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = (open: boolean) => {
    setIsOpen(open);
    localStorage.setItem('sidebar-open', String(open));
  };

  return (
    <aside
      className={cn(
        "flex flex-col gap-6 bg-white/80 backdrop-blur-sm border border-border/30 shadow-lg rounded-2xl py-4 transition-all duration-300 ease-in-out shrink-0",
        isOpen ? "w-56 px-3" : "w-[68px] px-2"
      )}
    >
      <div className={cn("flex items-center gap-3 px-2 min-h-[40px]", !isOpen && "justify-center")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "relative grid place-items-center w-10 h-10 shrink-0 rounded-full text-white bg-gradient-to-br from-blue-500 to-blue-600 transition-all duration-200",
                !isOpen && "cursor-pointer group"
              )}
              onClick={() => { if (!isOpen) toggleSidebar(true); }}
            >
              <PulseIcon className={cn("w-5 h-5 shrink-0 transition-opacity", !isOpen && "group-hover:opacity-0")} />
              {!isOpen && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="absolute w-5 h-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rotate-180"
                >
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </TooltipTrigger>
          {!isOpen && (
            <TooltipContent side="right">
              <p>Expand sidebar</p>
            </TooltipContent>
          )}
        </Tooltip>
        {isOpen && (
          <span className="text-xl font-semibold tracking-[0.02em] text-blue-900 whitespace-nowrap">
            NurseFlow
          </span>
        )}
        {isOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={() => toggleSidebar(false)}
                className="ml-auto shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-600 h-8 w-8 p-0"
                aria-label="Collapse Sidebar"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-5 h-5 shrink-0"
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
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Collapse sidebar</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <nav className="flex flex-col gap-2 mt-4" aria-label="Primary">
        {navItems.map(({ label, icon: Icon, href }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button
                variant={pathname === href ? 'secondary' : 'ghost'}
                asChild
                className={cn(
                  'gap-3 py-3 rounded-xl text-[0.95rem] font-medium h-auto justify-start overflow-hidden',
                  pathname === href
                    ? 'bg-blue-50 text-blue-700 shadow-sm hover:bg-blue-100'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50',
                  !isOpen && 'justify-center px-0'
                )}
              >
                <Link to={href} aria-current={pathname === href ? 'page' : undefined}>
                  <Icon className="w-5 h-5 shrink-0" />
                  {isOpen && <span>{label}</span>}
                </Link>
              </Button>
            </TooltipTrigger>
            {!isOpen && (
              <TooltipContent side="right">
                <p>{label}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </nav>

      <div className="mt-auto px-2">
        <div className={cn("flex items-center gap-3 rounded-xl px-2 py-2", !isOpen && "justify-center px-0")}>
          <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 grid place-items-center text-white text-sm font-bold">
            AW
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-800 truncate">Atticus Wong</span>
              <span className="text-xs text-slate-500 truncate">RN · Night Shift</span>
            </div>
          )}
        </div>
      </div>

    </aside>
  );
}
