import { Outlet } from 'react-router-dom';
import { Sidebar } from './dashboard/Sidebar';
import { AssistantSidebar } from './dashboard/AssistantSidebar';
import { useAssistantStore } from '@/store/assistantStore';

export function AppLayout() {
  const selectedRoom = useAssistantStore((s) => s.selectedRoom);
  const sidebarWidth = useAssistantStore((s) => s.sidebarWidth);
  const setSidebarWidth = useAssistantStore((s) => s.setSidebarWidth);
  const setSelectedRoom = useAssistantStore((s) => s.setSelectedRoom);

  return (
    <div className="flex h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent_40%),#ffffff] text-slate-900 p-3 gap-3 overflow-hidden">
      <Sidebar />
      <div className="flex-1 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm h-full flex flex-col min-w-0">
        <div className="grid flex-1 min-h-0" style={{ gridTemplateColumns: `minmax(0,1fr) ${sidebarWidth}px` }}>
          <div className="flex flex-col min-h-0 overflow-hidden">
            <Outlet />
          </div>
          <AssistantSidebar
            selectedRoom={selectedRoom}
            onWidthChange={setSidebarWidth}
            onDeselectRoom={() => setSelectedRoom(null)}
          />
        </div>
      </div>
    </div>
  );
}