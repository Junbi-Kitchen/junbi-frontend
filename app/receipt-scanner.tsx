// app/receipt-scanner.tsx
// DEV_MODE = true: loads assets/test-receipt.jpg automatically, shows "Run OCR" button.
// DEV_MODE = false: shows live camera with capture button.
// Replace assets/test-receipt.jpg with a real receipt photo before testing.

const DEV_MODE = true;

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Asset } from 'expo-asset';
import MlkitOcr from 'react-native-mlkit-ocr';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Camera, ScanLine } from 'lucide-react-native';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { Button } from '../components/ui/Button';
import { TOKENS } from '../lib/tokens';
import { parseReceipt } from '../utils/receiptParser';

export default function ReceiptScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DEV_MODE: resolve test image URI on mount via expo-asset
  useEffect(() => {
    if (!DEV_MODE) return;
    Asset.fromModule(require('../assets/test-receipt.jpg'))
      .downloadAsync()
      .then(asset => {
        if (!asset.localUri && !asset.uri) {
          setImageError('No test image found. Add a receipt photo at assets/test-receipt.jpg');
        } else {
          setImageUri(asset.localUri ?? asset.uri);
        }
      })
      .catch(() => {
        setImageError('No test image found. Add a receipt photo at assets/test-receipt.jpg');
      });
  }, []);

  const runPipeline = async (uri: string) => {
    setProcessing(true);
    setError(null);
    try {
      // Preprocess: resize longest side to max 1200px
      const processed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.9 }
      );

      // OCR
      const blocks = await MlkitOcr.detectFromUri(processed.uri);
      const rawText = blocks
        .map((b: { lines: { text: string }[] }) => b.lines.map(l => l.text).join('\n'))
        .join('\n');

      if (!rawText.trim()) {
        setError("Couldn't read the receipt. Try better lighting or a clearer image.");
        return;
      }

      const result = parseReceipt(rawText);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({ pathname: '/receipt-result', params: { result: JSON.stringify(result) } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) await runPipeline(photo.uri);
    } catch (e) {
      setError('Failed to capture photo. Try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back" style={{ marginRight: 12 }}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Scan Receipt</Text>
      </View>

      {DEV_MODE ? (
        /* ── Dev mode ─────────────────────────────────────────────────────── */
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
          {imageError ? (
            <View style={{ padding: 16, backgroundColor: TOKENS.colors.errorLight, borderRadius: 12 }}>
              <Text style={{ color: TOKENS.colors.error, fontSize: 14 }}>{imageError}</Text>
            </View>
          ) : imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', height: 400, borderRadius: 12 }}
              resizeMode="contain"
              onError={() => setImageError('No test image found. Add a receipt photo at assets/test-receipt.jpg')}
            />
          ) : (
            <SkeletonLoader width="100%" height={400} borderRadius={12} />
          )}

          {error ? (
            <View style={{ padding: 16, backgroundColor: TOKENS.colors.errorLight, borderRadius: 12 }}>
              <Text style={{ color: TOKENS.colors.error }}>{error}</Text>
            </View>
          ) : null}

          {processing ? (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <ActivityIndicator size="large" color={TOKENS.colors.primary} />
              <Text style={{ color: '#fff', marginTop: 12, fontSize: 14 }}>Reading receipt...</Text>
            </View>
          ) : imageUri && !imageError ? (
            <Button
              label="Run OCR"
              onPress={() => runPipeline(imageUri)}
              variant="primary"
              leftIcon={<ScanLine size={18} color="#fff" />}
            />
          ) : null}
        </ScrollView>
      ) : (
        /* ── Prod mode ────────────────────────────────────────────────────── */
        <View style={{ flex: 1 }}>
          {permission?.granted ? (
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 16 }}>
                Camera access is needed to scan receipts.
              </Text>
              <Button label="Grant Permission" onPress={requestPermission} variant="primary" />
            </View>
          )}

          {/* Receipt guide overlay */}
          <View style={{ position: 'absolute', top: '15%', left: '10%', right: '10%', bottom: '25%', borderWidth: 2, borderColor: '#fff', borderRadius: 12 }} />

          {/* Capture button */}
          {!processing && permission?.granted ? (
            <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={handleCapture}
                accessibilityLabel="Capture receipt photo"
                style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
              >
                <Camera size={32} color="#000" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Processing overlay */}
          {processing ? (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={{ color: '#fff', marginTop: 16 }}>Reading receipt...</Text>
            </View>
          ) : null}

          {/* Error banner */}
          {error ? (
            <View style={{ position: 'absolute', bottom: 140, left: 20, right: 20, backgroundColor: TOKENS.colors.errorLight, borderRadius: 12, padding: 16 }}>
              <Text style={{ color: TOKENS.colors.error }}>{error}</Text>
              <TouchableOpacity onPress={() => setError(null)} accessibilityLabel="Dismiss error" style={{ marginTop: 8 }}>
                <Text style={{ color: TOKENS.colors.primary, fontWeight: '600' }}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}
