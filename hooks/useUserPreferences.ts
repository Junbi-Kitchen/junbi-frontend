// Purpose: Hook wrapping userStore for dietary preference and account management

import { useCallback } from 'react';
import { useUserStore } from '../stores/userStore';
import type { DietaryTag } from '../types';

export function useUserPreferences() {
  const store = useUserStore();
  const preferences = store.user?.preferences;

  const updateDietaryTags = useCallback(
    (tags: DietaryTag[]) => {
      store.updatePreferences({ dietaryTags: tags });
    },
    [store]
  );

  const toggleTag = useCallback(
    (tag: DietaryTag) => {
      store.toggleDietaryTag(tag);
    },
    [store]
  );

  const hasTag = useCallback(
    (tag: DietaryTag): boolean => {
      return preferences?.dietaryTags.includes(tag) ?? false;
    },
    [preferences]
  );

  const updateHouseholdSize = useCallback(
    (size: number) => {
      store.updatePreferences({ householdSize: size });
    },
    [store]
  );

  const connectAccount = useCallback(
    (platform: 'instagram' | 'tiktok' | 'instacart', handle: string) => {
      store.connectAccount(platform, handle);
    },
    [store]
  );

  const disconnectAccount = useCallback(
    (platform: 'instagram' | 'tiktok' | 'instacart') => {
      store.disconnectAccount(platform);
    },
    [store]
  );

  const isConnected = useCallback(
    (platform: 'instagram' | 'tiktok' | 'instacart'): boolean => {
      return Boolean(store.user?.connectedAccounts[platform]);
    },
    [store.user]
  );

  return {
    preferences,
    updateDietaryTags,
    toggleTag,
    hasTag,
    updateHouseholdSize,
    connectAccount,
    disconnectAccount,
    isConnected,
  };
}
