/**
 * Thin storage wrapper — currently uses AsyncStorage (Expo Go compatible).
 * When moving to a dev client, replace the implementation with MMKV:
 *
 *   import { MMKV } from 'react-native-mmkv';
 *   const mmkv = new MMKV();
 *   export const storage = {
 *     getBoolean: (key: string) => mmkv.getBoolean(key),
 *     set: (key: string, value: boolean) => mmkv.set(key, value),
 *   };
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  getBoolean: async (key: string): Promise<boolean> => {
    const val = await AsyncStorage.getItem(key);
    return val === 'true';
  },
  set: async (key: string, value: boolean): Promise<void> => {
    await AsyncStorage.setItem(key, String(value));
  },
};

export const STORAGE_KEYS = {
  HAS_SEEN_ONBOARDING: 'hasSeenOnboarding',
};
