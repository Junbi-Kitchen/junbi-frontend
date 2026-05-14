import { useState, useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';
import { usePantryStore } from '../stores/pantryStore';
import { pantryApi } from '../lib/api/pantry';
import type { ScanResponse, PantryItem } from '../types';

export const RECEIPT_CATEGORIES = [
  'produce', 'proteins', 'dairy', 'grains', 'frozen',
  'pantry', 'condiments', 'spices', 'bakery', 'beverages',
] as const;

const VALID_CATEGORIES = new Set<string>(RECEIPT_CATEGORIES);

export type EditableReceiptItem = {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  total_price: number | null;
  confidence: 'high' | 'medium' | 'low';
};

export function toEditableItem(item: ScanResponse['items'][number]): EditableReceiptItem {
  return {
    name: item.name,
    quantity: item.quantity ?? 1,
    unit: item.unit ?? 'count',
    category: VALID_CATEGORIES.has(item.category) ? item.category : 'pantry',
    total_price: item.total_price,
    confidence: item.confidence,
  };
}

type AddInput = Pick<PantryItem, 'name' | 'quantity' | 'unit' | 'category' | 'expiryDate' | 'addedVia'>;

export function useReceiptScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pantryStore = usePantryStore();

  const hasPermission = permission?.granted ?? false;

  const startScan = useCallback(async (base64: string) => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);
    try {
      const result = await pantryApi.scanReceipt(base64);
      setScanResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Receipt scan failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const cancelScan = useCallback(() => {
    setIsScanning(false);
    setScanResult(null);
    setError(null);
  }, []);

  const confirmScan = useCallback(async (items: AddInput[]) => {
    await pantryStore.addFromReceipt(items);
    setScanResult(null);
  }, [pantryStore]);

  const retakeScan = useCallback(() => {
    setScanResult(null);
    setIsScanning(false);
    setError(null);
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
