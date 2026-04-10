// Purpose: Zustand store tracking food savings, waste log, and weekly trends

import { create } from 'zustand';
import type { WasteLogEntry, WeeklyTrend } from '../types';
import { savingsApi } from '../lib/api/savings';

interface SavingsStore {
  totalSavedThisMonth: number;
  totalSavedAllTime: number;
  totalWastedThisMonth: number;
  wasteLog: WasteLogEntry[];
  weeklyTrends: WeeklyTrend[];
  lastMonthSaved: number;
  isLoading: boolean;

  fetchSummary: () => Promise<void>;
  fetchLog: () => Promise<void>;
  // Optimistic local updates — real write happens in pantryStore.logAction
  logUsed: (itemName: string, estimatedValue: number) => void;
  logTossed: (itemName: string, estimatedValue: number) => void;
}

export const useSavingsStore = create<SavingsStore>((set) => ({
  totalSavedThisMonth: 0,
  totalSavedAllTime: 0,
  totalWastedThisMonth: 0,
  wasteLog: [],
  weeklyTrends: [],
  lastMonthSaved: 0,
  isLoading: false,

  fetchSummary: async () => {
    set({ isLoading: true });
    try {
      const data = await savingsApi.getSummary();
      set({
        totalSavedThisMonth: data.totalSavedThisMonth,
        totalSavedAllTime: data.totalSavedAllTime,
        totalWastedThisMonth: data.totalWastedThisMonth,
        lastMonthSaved: data.lastMonthSaved,
        weeklyTrends: data.weeklyTrends,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLog: async () => {
    const data = await savingsApi.getLog({ limit: 50 });
    set({ wasteLog: data.entries });
  },

  logUsed: (itemName, estimatedValue) => {
    const entry: WasteLogEntry = {
      id: `log-${Date.now()}`,
      itemName,
      action: 'used',
      estimatedValue,
      date: new Date().toISOString(),
    };
    set((state) => ({
      wasteLog: [entry, ...state.wasteLog],
      totalSavedThisMonth: state.totalSavedThisMonth + estimatedValue,
      totalSavedAllTime: state.totalSavedAllTime + estimatedValue,
    }));
  },

  logTossed: (itemName, estimatedValue) => {
    const entry: WasteLogEntry = {
      id: `log-${Date.now()}`,
      itemName,
      action: 'tossed',
      estimatedValue,
      date: new Date().toISOString(),
    };
    set((state) => ({
      wasteLog: [entry, ...state.wasteLog],
      totalWastedThisMonth: state.totalWastedThisMonth + estimatedValue,
    }));
  },
}));
