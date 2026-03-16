// Purpose: Full-screen camera modal for receipt scanning with parsed item preview

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { X } from 'lucide-react-native';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { Button } from '../ui/Button';
import { TOKENS } from '../../lib/tokens';
import { useReceiptScanner } from '../../hooks/useReceiptScanner';
import type { PantryItem } from '../../types';

interface ReceiptScanModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ReceiptScanModal({ visible, onClose }: ReceiptScanModalProps) {
  const {
    hasPermission,
    isScanning,
    scanResult,
    requestPermission,
    startScan,
    cancelScan,
    confirmScan,
    retakeScan,
  } = useReceiptScanner();

  const handleConfirm = () => {
    confirmScan();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
            Scan Receipt
          </Text>
          <TouchableOpacity
            onPress={() => { cancelScan(); onClose(); }}
            accessibilityLabel="Close scanner"
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Camera */}
        <View style={{ flex: 1, position: 'relative' }}>
          {hasPermission ? (
            <CameraView style={{ flex: 1 }} facing="back" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', marginBottom: 16 }}>
                Camera access required
              </Text>
              <Button label="Grant Permission" onPress={requestPermission} variant="primary" />
            </View>
          )}

          {/* Receipt guide overlay */}
          <View
            style={{
              position: 'absolute',
              top: '15%',
              left: '10%',
              right: '10%',
              bottom: '25%',
              borderWidth: 2,
              borderColor: '#fff',
              borderRadius: 12,
            }}
          />

          {/* Scanning shimmer */}
          {isScanning && (
            <View
              style={{
                position: 'absolute',
                inset: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
              }}
            >
              <SkeletonLoader width={200} height={20} borderRadius={10} />
              <Text style={{ color: '#fff', marginTop: 16, fontSize: 16 }}>
                Scanning...
              </Text>
            </View>
          )}
        </View>

        {/* Bottom controls or results */}
        {scanResult ? (
          <View
            style={{
              backgroundColor: TOKENS.colors.white,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: '50%',
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: TOKENS.colors.text,
                marginBottom: 4,
              }}
            >
              Items Found ({scanResult.length})
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: TOKENS.colors.textSecondary,
                marginBottom: 16,
              }}
            >
              Review before adding to pantry
            </Text>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {scanResult.map((item: PantryItem) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: TOKENS.colors.borderLight,
                  }}
                >
                  <Text style={{ fontSize: 15, color: TOKENS.colors.text }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: TOKENS.colors.textSecondary }}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <Button label="Retake" onPress={retakeScan} variant="ghost" />
              </View>
              <View style={{ flex: 2 }}>
                <Button label="Add All to Pantry" onPress={handleConfirm} variant="primary" />
              </View>
            </View>
          </View>
        ) : (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Button
              label={isScanning ? 'Scanning...' : 'Scan Receipt'}
              onPress={startScan}
              variant="primary"
              disabled={isScanning || !hasPermission}
              loading={isScanning}
            />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
