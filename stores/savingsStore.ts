// Purpose: Zustand store tracking food savings, waste log, and weekly trends

import { create } from 'zustand';
import type { WasteLogEntry, WeeklyTrend } from '../types';
import { MOCK_WASTE_LOG, MOCK_WEEKLY_TRENDS } from '../lib/mockData';

// Average item value estimate by category
const ESTIMATED_VALUES: Record<string, number> = {
  produce: 2.5,
  proteins: 5.0,
  dairy: 3.5,
  grains: 2.0,
  pantry: 1.5,
  frozen: 4.0,
  beverages: 3.0,
  condiments: 2.0,
  spices: 1.0,
  bakery: 3.0,
};

interface SavingsStore {
  totalSavedThisMonth: number;
  totalSavedAllTime: number;
  totalWastedThisMonth: number;
  wasteLog: WasteLogEntry[];
  weeklyTrends: WeeklyTrend[];
  lastMonthSaved: number;

  logUsed: (itemName: string, category: string) => number;
  logTossed: (itemName: string, category: string) => void;
  getEstimatedValue: (category: string) => number;
}

export const useSavingsStore = create<SavingsStore>((set, get) => ({
  totalSavedThisMonth: 47.5,
  totalSavedAllTime: 312.0,
  totalWastedThisMonth: 8.5,
  wasteLog: MOCK_WASTE_LOG,
  weeklyTrends: MOCK_WEEKLY_TRENDS,
  lastMonthSaved: 38.0,

  getEstimatedValue: (category: string) => ESTIMATED_VALUES[category] ?? 2.0,

  logUsed: (itemName, category) => {
    const value = get().getEstimatedValue(category);
    const entry: WasteLogEntry = {
      id: `log-${Date.now()}`,
      itemName,
      action: 'used',
      estimatedValue: value,
      date: new Date().toISOString(),
    };

    set((state) => ({
      wasteLog: [entry, ...state.wasteLog],
      totalSavedThisMonth: state.totalSavedThisMonth + value,
      totalSavedAllTime: state.totalSavedAllTime + value,
    }));

    return value;
  },

  logTossed: (itemName, category) => {
    const value = get().getEstimatedValue(category);
    const entry: WasteLogEntry = {
      id: `log-${Date.now()}`,
      itemName,
      action: 'tossed',
      estimatedValue: value,
      date: new Date().toISOString(),
    };

    set((state) => ({
      wasteLog: [entry, ...state.wasteLog],
      totalWastedThisMonth: state.totalWastedThisMonth + value,
    }));
  },
}));
