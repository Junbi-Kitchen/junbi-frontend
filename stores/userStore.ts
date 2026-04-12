// Purpose: Zustand store managing user profile, preferences, addresses, and onboarding state

import { create } from 'zustand';
import type { User, UserPreferences, UserAddress, DietaryTag } from '../types';
import { usersApi } from '../lib/api/users';
import { auth } from '../lib/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';

interface UserStore {
  user: User | null;
  onboardingComplete: boolean;
  pendingPreferences: { dietaryTags: DietaryTag[]; householdSize: number } | null;
  setUser: (user: User | null) => void;
  fetchProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatar?: string }) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  setPendingPreferences: (prefs: { dietaryTags: DietaryTag[]; householdSize: number } | null) => void;
  completeOnboarding: () => void;
  connectAccount: (platform: string, handle: string) => Promise<void>;
  disconnectAccount: (platform: string) => Promise<void>;
  toggleDietaryTag: (tag: DietaryTag) => Promise<void>;
  addAddress: (address: Omit<UserAddress, 'id'>) => Promise<void>;
  updateAddress: (id: string, address: Omit<UserAddress, 'id'>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  getDefaultAddress: () => UserAddress | null;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  onboardingComplete: false,
  pendingPreferences: null,

  setUser: (user) => {
    set({ user });
  },

  fetchProfile: async () => {
    const data = await usersApi.getMe();
    set({ user: data, onboardingComplete: true });
  },

  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null, onboardingComplete: false });
  },

  updateProfile: async (updates) => {
    const data = await usersApi.patchProfile(updates);
    set({ user: data });
  },

  updatePreferences: async (preferences) => {
    const data = await usersApi.patchPreferences(preferences);
    set({ user: data });
  },

  setPendingPreferences: (prefs) => {
    set({ pendingPreferences: prefs });
  },

  completeOnboarding: () => {
    set({ onboardingComplete: true });
  },

  connectAccount: async (platform, handle) => {
    const data = await usersApi.connectAccount(platform, handle);
    set({ user: data });
  },

  disconnectAccount: async (platform) => {
    const data = await usersApi.disconnectAccount(platform);
    set({ user: data });
  },

  toggleDietaryTag: async (tag) => {
    const { user } = get();
    if (!user) return;
    const tags = user.preferences.dietaryTags;
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    const data = await usersApi.patchPreferences({ dietaryTags: next });
    set({ user: data });
  },

  addAddress: async (address) => {
    const data = await usersApi.addAddress(address);
    set({ user: data });
  },

  updateAddress: async (id, address) => {
    const data = await usersApi.updateAddress(id, address);
    set({ user: data });
  },

  removeAddress: async (id) => {
    const data = await usersApi.deleteAddress(id);
    set({ user: data });
  },

  setDefaultAddress: async (id) => {
    const data = await usersApi.setDefaultAddress(id);
    set({ user: data });
  },

  getDefaultAddress: () => {
    const { user } = get();
    if (!user) return null;
    return user.addresses.find((a) => a.id === user.defaultAddressId) ?? user.addresses[0] ?? null;
  },
}));
