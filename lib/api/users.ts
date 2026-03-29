import { api } from '../api';
import type { User, UserPreferences, UserAddress } from '../../types';

export const usersApi = {
  getMe: () => api.get<User>('/users/me'),
  patchProfile: (updates: { name?: string; avatar?: string }) =>
    api.patch<User>('/users/me', updates),
  patchPreferences: (prefs: Partial<UserPreferences>) =>
    api.patch<User>('/users/me/preferences', prefs),
  addAddress: (address: Omit<UserAddress, 'id'>) =>
    api.post<User>('/users/me/addresses', address),
  updateAddress: (id: string, address: Omit<UserAddress, 'id'>) =>
    api.patch<User>(`/users/me/addresses/${id}`, address),
  deleteAddress: (id: string) =>
    api.delete<User>(`/users/me/addresses/${id}`),
  setDefaultAddress: (id: string) =>
    api.patch<User>(`/users/me/addresses/${id}/default`),
  connectAccount: (platform: string, handle: string) =>
    api.post<User>('/users/me/connected-accounts', { platform, handle }),
  disconnectAccount: (platform: string) =>
    api.delete<User>(`/users/me/connected-accounts/${platform}`),
};
