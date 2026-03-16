// Purpose: Zustand store managing user profile, preferences, addresses, and onboarding state

import { create } from 'zustand';
import type { User, UserPreferences, UserAddress, DietaryTag } from '../types';
import { MOCK_USER } from '../lib/mockData';

interface UserStore {
  user: User | null;
  onboardingComplete: boolean;
  setUser: (user: User) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  completeOnboarding: () => void;
  connectAccount: (platform: 'instagram' | 'tiktok' | 'instacart', handle: string) => void;
  disconnectAccount: (platform: 'instagram' | 'tiktok' | 'instacart') => void;
  toggleDietaryTag: (tag: DietaryTag) => void;
  addAddress: (address: UserAddress) => void;
  updateAddress: (id: string, address: Partial<UserAddress>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  getDefaultAddress: () => UserAddress | null;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: MOCK_USER,
  onboardingComplete: true,

  setUser: (user) => {
    set({ user });
  },

  updatePreferences: (preferences) => {
    set((state) => ({
      user: state.user
        ? { ...state.user, preferences: { ...state.user.preferences, ...preferences } }
        : state.user,
    }));
  },

  completeOnboarding: () => {
    set({ onboardingComplete: true });
  },

  connectAccount: (platform, handle) => {
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            connectedAccounts: { ...state.user.connectedAccounts, [platform]: handle },
          }
        : state.user,
    }));
  },

  disconnectAccount: (platform) => {
    set((state) => {
      if (!state.user) return state;
      const { [platform]: _, ...rest } = state.user.connectedAccounts;
      return { user: { ...state.user, connectedAccounts: rest } };
    });
  },

  toggleDietaryTag: (tag) => {
    set((state) => {
      if (!state.user) return state;
      const tags = state.user.preferences.dietaryTags;
      const next = tags.includes(tag)
        ? tags.filter((t) => t !== tag)
        : [...tags, tag];
      return {
        user: {
          ...state.user,
          preferences: { ...state.user.preferences, dietaryTags: next },
        },
      };
    });
  },

  addAddress: (address) => {
    set((state) => {
      if (!state.user) return state;
      const addresses = [...state.user.addresses, address];
      const defaultId = addresses.length === 1 ? address.id : state.user.defaultAddressId;
      return {
        user: { ...state.user, addresses, defaultAddressId: defaultId },
      };
    });
  },

  updateAddress: (id, updates) => {
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          addresses: state.user.addresses.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        },
      };
    });
  },

  removeAddress: (id) => {
    set((state) => {
      if (!state.user) return state;
      const addresses = state.user.addresses.filter((a) => a.id !== id);
      const defaultId =
        state.user.defaultAddressId === id
          ? addresses[0]?.id ?? null
          : state.user.defaultAddressId;
      return {
        user: { ...state.user, addresses, defaultAddressId: defaultId },
      };
    });
  },

  setDefaultAddress: (id) => {
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          defaultAddressId: id,
          addresses: state.user.addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
          })),
        },
      };
    });
  },

  getDefaultAddress: () => {
    const { user } = get();
    if (!user) return null;
    return user.addresses.find((a) => a.id === user.defaultAddressId) ?? user.addresses[0] ?? null;
  },
}));
