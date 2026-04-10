import { api } from '../api';
import type { Store } from '../../types';

export const storesApi = {
  getAll: () => api.get<Store[]>('/stores'),
};
