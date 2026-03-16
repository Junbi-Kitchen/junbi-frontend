// Purpose: Hook managing receipt camera scanning with mocked OCR parsing

import { useState, useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';
import { usePantryStore } from '../stores/pantryStore';
import { MOCK_PANTRY } from '../lib/mockData';
import type { PantryItem } from '../types';

function pickRandomItems(count: number): PantryItem[] {
  const shuffled = [...MOCK_PANTRY].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((item) => ({
    ...item,
    id: `scan-${item.id}-${Date.now()}`,
    addedVia: 'scan' as const,
    addedAt: new Date().toISOString(),
  }));
}

export function useReceiptScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<PantryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pantryStore = usePantryStore();

  const hasPermission = permission?.granted ?? false;

  const startScan = useCallback(async () => {
    if (!hasPermission) {
      await requestPermission();
      return;
    }
    setIsScanning(true);
    setError(null);
    setScanResult(null);

    // Mock OCR with 1.5s delay
    setTimeout(() => {
      const count = Math.floor(Math.random() * 3) + 3; // 3-5 items
      const items = pickRandomItems(count);
      setScanResult(items);
      setIsScanning(false);
    }, 1500);
  }, [hasPermission, requestPermission]);

  const cancelScan = useCallback(() => {
    setIsScanning(false);
    setScanResult(null);
    setError(null);
  }, []);

  const confirmScan = useCallback(() => {
    if (!scanResult) return;
    pantryStore.addFromReceipt(scanResult);
    setScanResult(null);
  }, [scanResult, pantryStore]);

  const retakeScan = useCallback(() => {
    setScanResult(null);
    setIsScanning(false);
  }, []);

  return {
    permission,
    hasPermission,
    isScanning,
    scanResult,
    error,
    requestPermission,
    startScan,
    cancelScan,
    confirmScan,
    retakeScan,
  };
}
