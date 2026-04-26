import { create } from 'zustand';
import type { Room } from '@/components/dashboard/data';

type AssistantState = {
  selectedRoom: Room | null;
  sidebarWidth: number;
  setSelectedRoom: (room: Room | null) => void;
  setSidebarWidth: (width: number) => void;
};

export const useAssistantStore = create<AssistantState>((set) => ({
  selectedRoom: null,
  sidebarWidth: 300,
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
}));