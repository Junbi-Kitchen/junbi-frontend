import { api } from '../api';
import type { WasteLogEntry, WeeklyTrend } from '../../types';

interface SavingsSummary {
  totalSavedThisMonth: number;
  totalSavedAllTime: number;
  totalWastedThisMonth: number;
  lastMonthSaved: number;
  weeklyTrends: WeeklyTrend[];
}

interface SavingsLogResponse {
  entries: WasteLogEntry[];
  next_cursor: string | null;
}

export const savingsApi = {
  getSummary: () => api.get<SavingsSummary>('/savings'),
  getLog: (params?: { cursor?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<SavingsLogResponse>(`/savings/log${qs ? `?${qs}` : ''}`);
  },
};
