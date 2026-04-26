import { create } from 'zustand';

export type DemoAlert = {
  id: string;
  roomId: string;
  roomLabel: string;
  patientName: string;
  status: 'ALERT' | 'NORMAL' | 'VACANT';
  timestamp: number;
  dismissed: boolean;
};

type DemoAlertState = {
  alerts: DemoAlert[];
  activeAlert: DemoAlert | null;
  openRoomId: string | null;
  latestFrameUrl: string | null;
  addAlert: (alert: DemoAlert) => void;
  dismissAlert: (id: string) => void;
  setOpenRoomId: (id: string | null) => void;
  setLatestFrameUrl: (url: string | null) => void;
};

export const useDemoAlertStore = create<DemoAlertState>((set) => ({
  alerts: [],
  activeAlert: null,
  openRoomId: null,
  latestFrameUrl: null,

  addAlert: (alert) =>
    set((state) => {
      const alerts = [alert, ...state.alerts];
      return {
        alerts,
        activeAlert: alert,
      };
    }),

  dismissAlert: (id) =>
    set((state) => {
      const alerts = state.alerts.map((a) =>
        a.id === id ? { ...a, dismissed: true } : a
      );
      const activeAlert =
        state.activeAlert?.id === id
          ? alerts.find((a) => !a.dismissed) ?? null
          : state.activeAlert;
      return { alerts, activeAlert };
    }),

  setOpenRoomId: (id) => set({ openRoomId: id }),

  setLatestFrameUrl: (url) =>
    set((state) => {
      if (state.latestFrameUrl && state.latestFrameUrl !== url) {
        URL.revokeObjectURL(state.latestFrameUrl);
      }
      return { latestFrameUrl: url };
    }),
}));
