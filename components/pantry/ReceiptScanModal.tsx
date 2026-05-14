import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView } from 'expo-camera';
import { X, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react-native';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { Button } from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';
import {
  useReceiptScanner,
  toEditableItem,
  RECEIPT_CATEGORIES,
  type EditableReceiptItem,
} from '../../hooks/useReceiptScanner';

interface ReceiptScanModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ReceiptScanModal({ visible, onClose }: ReceiptScanModalProps) {
  const { colors } = useTheme();
  const cameraRef = useRef<CameraView>(null);
  const {
    hasPermission,
    isScanning,
    scanResult,
    error,
    requestPermission,
    startScan,
    cancelScan,
    confirmScan,
    retakeScan,
  } = useReceiptScanner();

  const [editableItems, setEditableItems] = useState<EditableReceiptItem[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (scanResult) {
      setEditableItems(scanResult.items.map(toEditableItem));
      setExpandedIndex(null);
    }
  }, [scanResult]);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
    if (photo?.base64) {
      startScan(photo.base64);
    }
  };

  const removeItem = useCallback((index: number) => {
    setEditableItems(prev => prev.filter((_, i) => i !== index));
    setExpandedIndex(prev => {
      if (prev === index) return null;
      if (prev !== null && prev > index) return prev - 1;
      return prev;
    });
  }, []);

  const updateItem = useCallback((index: number, changes: Partial<EditableReceiptItem>) => {
    setEditableItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, ...changes } : item))
    );
  }, []);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await confirmScan(
        editableItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          expiryDate: undefined,
          addedVia: 'receipt' as const,
        }))
      );
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    cancelScan();
    onClose();
  };

  // ── Review screen ──────────────────────────────────────────────────────────
  if (scanResult) {
    const { store, summary } = scanResult;
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
              }}
            >
              <TouchableOpacity
                onPress={retakeScan}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ marginRight: 12 }}
              >
                <ArrowLeft size={22} color={colors.text} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
                  Review Items
                </Text>
                {store.name ? (
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    {store.name}
                    {summary.total != null ? ` · $${summary.total.toFixed(2)}` : ''}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Item list */}
            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
              {editableItems.length === 0 ? (
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
                    No items remaining.
                  </Text>
                </View>
              ) : (
                editableItems.map((item, index) => {
                  const isExpanded = expandedIndex === index;
                  return (
                    <View
                      key={index}
                      style={{
                        marginHorizontal: 16,
                        marginTop: 10,
                        borderRadius: 12,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.borderLight,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Collapsed row */}
                      <TouchableOpacity
                        onPress={() => setExpandedIndex(isExpanded ? null : index)}
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{ fontSize: 15, fontWeight: '600', color: colors.text }}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginTop: 3,
                              gap: 6,
                            }}
                          >
                            <View
                              style={{
                                borderRadius: 6,
                                paddingHorizontal: 7,
                                paddingVertical: 2,
                                borderWidth: 1,
                                borderColor: colors.borderLight,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: colors.textSecondary,
                                  fontWeight: '600',
                                }}
                              >
                                {item.category}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                              {item.quantity} {item.unit}
                              {item.total_price != null
                                ? ` · $${item.total_price.toFixed(2)}`
                                : ''}
                            </Text>
                          </View>
                        </View>
                        {isExpanded ? (
                          <ChevronUp size={18} color={colors.textSecondary} />
                        ) : (
                          <ChevronDown size={18} color={colors.textSecondary} />
                        )}
                        <TouchableOpacity
                          onPress={() => removeItem(index)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={{ marginLeft: 10 }}
                        >
                          <X size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </TouchableOpacity>

                      {/* Expanded edit form */}
                      {isExpanded && (
                        <View
                          style={{
                            borderTopWidth: 1,
                            borderTopColor: colors.borderLight,
                            padding: 14,
                            gap: 12,
                          }}
                        >
                          <View>
                            <Text
                              style={{
                                fontSize: 12,
                                color: colors.textSecondary,
                                marginBottom: 4,
                              }}
                            >
                              Name
                            </Text>
                            <TextInput
                              value={item.name}
                              onChangeText={v => updateItem(index, { name: v })}
                              style={{
                                borderWidth: 1,
                                borderColor: colors.borderLight,
                                borderRadius: 8,
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                fontSize: 15,
                                color: colors.text,
                                backgroundColor: colors.background,
                              }}
                              autoCapitalize="none"
                            />
                          </View>

                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: colors.textSecondary,
                                  marginBottom: 4,
                                }}
                              >
                                Qty
                              </Text>
                              <TextInput
                                value={String(item.quantity)}
                                onChangeText={v =>
                                  updateItem(index, { quantity: parseFloat(v) || 1 })
                                }
                                style={{
                                  borderWidth: 1,
                                  borderColor: colors.borderLight,
                                  borderRadius: 8,
                                  paddingHorizontal: 10,
                                  paddingVertical: 8,
                                  fontSize: 15,
                                  color: colors.text,
                                  backgroundColor: colors.background,
                                }}
                                keyboardType="decimal-pad"
                              />
                            </View>
                            <View style={{ flex: 2 }}>
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: colors.textSecondary,
                                  marginBottom: 4,
                                }}
                              >
                                Unit
                              </Text>
                              <TextInput
                                value={item.unit}
                                onChangeText={v => updateItem(index, { unit: v })}
                                style={{
                                  borderWidth: 1,
                                  borderColor: colors.borderLight,
                                  borderRadius: 8,
                                  paddingHorizontal: 10,
                                  paddingVertical: 8,
                                  fontSize: 15,
                                  color: colors.text,
                                  backgroundColor: colors.background,
                                }}
                                autoCapitalize="none"
                              />
                            </View>
                          </View>

                          <View>
                            <Text
                              style={{
                                fontSize: 12,
                                color: colors.textSecondary,
                                marginBottom: 6,
                              }}
                            >
                              Category
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              <View style={{ flexDirection: 'row', gap: 6 }}>
                                {RECEIPT_CATEGORIES.map(cat => {
                                  const selected = item.category === cat;
                                  return (
                                    <TouchableOpacity
                                      key={cat}
                                      onPress={() => updateItem(index, { category: cat })}
                                      style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 20,
                                        backgroundColor: selected
                                          ? colors.text
                                          : colors.background,
                                        borderWidth: 1,
                                        borderColor: selected
                                          ? colors.text
                                          : colors.borderLight,
                                      }}
                                    >
                                      <Text
                                        style={{
                                          fontSize: 13,
                                          color: selected ? colors.background : colors.text,
                                          fontWeight: selected ? '600' : '400',
                                        }}
                                      >
                                        {cat}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </ScrollView>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Footer */}
            <View
              style={{
                padding: 16,
                gap: 10,
                borderTopWidth: 1,
                borderTopColor: colors.borderLight,
              }}
            >
              <Button
                label={
                  isConfirming
                    ? 'Adding...'
                    : `Add ${editableItems.length} Item${editableItems.length !== 1 ? 's' : ''} to Pantry`
                }
                onPress={handleConfirm}
                variant="primary"
                disabled={editableItems.length === 0 || isConfirming}
                loading={isConfirming}
              />
              <Button label="Retake Photo" onPress={retakeScan} variant="ghost" />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    );
  }

  // ── Camera screen ──────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Scan Receipt</Text>
          <TouchableOpacity
            onPress={handleClose}
            accessibilityLabel="Close scanner"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, position: 'relative' }}>
          {hasPermission ? (
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', marginBottom: 16 }}>Camera access required</Text>
              <Button label="Grant Permission" onPress={requestPermission} variant="primary" />
            </View>
          )}

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
              <Text style={{ color: '#fff', marginTop: 16, fontSize: 16 }}>Scanning...</Text>
            </View>
          )}
        </View>

        {error ? (
          <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
            <Text style={{ color: '#ff6b6b', textAlign: 'center', fontSize: 14 }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ padding: 24, alignItems: 'center' }}>
          <Button
            label={isScanning ? 'Scanning...' : 'Scan Receipt'}
            onPress={handleCapture}
            variant="primary"
            disabled={isScanning || !hasPermission}
            loading={isScanning}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
