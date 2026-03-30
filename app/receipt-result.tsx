// app/receipt-result.tsx
// Displays parsed ScanResponse: store info, item cards, summary, raw JSON debug block.

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Copy, ScanLine } from 'lucide-react-native';
import { TOKENS } from '../lib/tokens';
import { Button } from '../components/ui/Button';
import type { ScanResponse, ReceiptItem } from '../types/receipt';

const CATEGORY_COLORS: Record<string, string> = {
  dairy: '#3B82F6', produce: '#22C55E', meat: '#EF4444',
  bakery: '#F59E0B', frozen: '#06B6D4', beverages: '#8B5CF6',
  snacks: '#F97316', pantry: '#6B7280', household: '#84CC16', grocery: '#9CA3AF',
};

function ItemCard({ item }: { item: ReceiptItem }) {
  const catColor = CATEGORY_COLORS[item.category] ?? '#9CA3AF';
  return (
    <View
      style={{
        backgroundColor: TOKENS.colors.surface,
        borderRadius: TOKENS.borderRadius.lg,
        padding: 14,
        marginBottom: 8,
        ...TOKENS.shadows.sm,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          {item.brand ? (
            <Text style={{ fontSize: 11, color: TOKENS.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 }}>
              {item.brand}
            </Text>
          ) : null}
          <Text style={{ fontSize: 15, fontWeight: '600', color: TOKENS.colors.text }}>{item.name}</Text>
          {item.variant ? (
            <Text style={{ fontSize: 13, color: TOKENS.colors.textSecondary, marginTop: 2 }}>{item.variant}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            <View style={{ backgroundColor: catColor + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
              <Text style={{ fontSize: 11, color: catColor, fontWeight: '600' }}>
                {item.subcategory ?? item.category}
              </Text>
            </View>
            {item.on_sale ? (
              <View style={{ backgroundColor: TOKENS.colors.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                <Text style={{ fontSize: 11, color: TOKENS.colors.success, fontWeight: '600' }}>SALE</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: TOKENS.colors.text }}>
            {item.total_price != null ? `$${item.total_price.toFixed(2)}` : '—'}
          </Text>
          {item.quantity !== 1 && item.quantity != null ? (
            <Text style={{ fontSize: 12, color: TOKENS.colors.textSecondary, marginTop: 2 }}>
              {item.quantity}{item.unit ? ` ${item.unit}` : ''} × ${item.unit_price?.toFixed(2)}
            </Text>
          ) : null}
          <View
            style={{
              marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999,
              backgroundColor:
                item.confidence === 'high' ? TOKENS.colors.successLight :
                item.confidence === 'medium' ? TOKENS.colors.warningLight : TOKENS.colors.errorLight,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color:
                  item.confidence === 'high' ? TOKENS.colors.success :
                  item.confidence === 'medium' ? TOKENS.colors.warning : TOKENS.colors.error,
              }}
            >
              {item.confidence}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ReceiptResultScreen() {
  const { result } = useLocalSearchParams<{ result: string }>();
  const router = useRouter();

  const scan: ScanResponse = React.useMemo(() => {
    try { return JSON.parse(result ?? '{}'); }
    catch { return { store: { name: null, address: null, phone: null }, summary: { item_count: 0, subtotal: null, tax: null, total: null }, items: [], unparsed_lines: [], raw_text: '', scanned_at: '' }; }
  }, [result]);

  const handleCopyJson = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(result ?? '{}');
  };

  const handleScanAgain = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/receipt-scanner');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: TOKENS.colors.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back" style={{ marginRight: 12 }}>
          <ArrowLeft size={24} color={TOKENS.colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: TOKENS.colors.text }}>
          Receipt Results
        </Text>
        <TouchableOpacity onPress={handleCopyJson} accessibilityLabel="Copy JSON to clipboard" style={{ padding: 4 }}>
          <Copy size={20} color={TOKENS.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Store info */}
        <View style={{ backgroundColor: TOKENS.colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, ...TOKENS.shadows.sm }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: TOKENS.colors.text }}>
            {scan.store?.name ?? 'Unknown Store'}
          </Text>
          {scan.store?.address ? (
            <Text style={{ fontSize: 13, color: TOKENS.colors.textSecondary, marginTop: 4 }}>{scan.store.address}</Text>
          ) : null}
          {scan.summary?.total != null ? (
            <Text style={{ fontSize: 15, fontWeight: '600', color: TOKENS.colors.primary, marginTop: 8 }}>
              Total: ${scan.summary.total.toFixed(2)}
            </Text>
          ) : null}
        </View>

        {/* Items list */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: TOKENS.colors.text, marginBottom: 10 }}>
          {scan.summary?.item_count ?? 0} Items
        </Text>
        <FlashList
          data={scan.items ?? []}
          renderItem={({ item }) => <ItemCard item={item} />}
          estimatedItemSize={80}
          scrollEnabled={false}
        />

        {/* Summary block */}
        {(scan.summary?.subtotal != null || scan.summary?.tax != null || scan.summary?.total != null) ? (
          <View style={{ backgroundColor: TOKENS.colors.surface, borderRadius: 16, padding: 16, marginTop: 8, ...TOKENS.shadows.sm }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: TOKENS.colors.text, marginBottom: 8 }}>Summary</Text>
            {scan.summary.subtotal != null ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ color: TOKENS.colors.textSecondary }}>Subtotal</Text>
                <Text style={{ color: TOKENS.colors.text }}>${scan.summary.subtotal.toFixed(2)}</Text>
              </View>
            ) : null}
            {scan.summary.tax != null ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ color: TOKENS.colors.textSecondary }}>Tax</Text>
                <Text style={{ color: TOKENS.colors.text }}>${scan.summary.tax.toFixed(2)}</Text>
              </View>
            ) : null}
            {scan.summary.total != null ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, marginTop: 4, borderTopWidth: 1, borderTopColor: TOKENS.colors.border }}>
                <Text style={{ fontWeight: '700', color: TOKENS.colors.text }}>Total</Text>
                <Text style={{ fontWeight: '700', color: TOKENS.colors.text }}>${scan.summary.total.toFixed(2)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Unparsed lines */}
        {(scan.unparsed_lines?.length ?? 0) > 0 ? (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: TOKENS.colors.textSecondary, marginBottom: 6 }}>
              Unparsed Lines ({scan.unparsed_lines.length})
            </Text>
            {scan.unparsed_lines.map((line, i) => (
              <Text key={i} style={{ fontSize: 12, color: TOKENS.colors.textMuted, paddingVertical: 2, fontFamily: 'monospace' }}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Raw JSON debug */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: TOKENS.colors.textSecondary, marginBottom: 6 }}>
            Raw JSON
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ backgroundColor: TOKENS.colors.inputBg, borderRadius: 12, padding: 12 }}
          >
            <Text style={{ fontFamily: 'monospace', fontSize: 11, color: TOKENS.colors.text }}>
              {JSON.stringify(scan, null, 2)}
            </Text>
          </ScrollView>
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Scan Again"
              onPress={handleScanAgain}
              variant="ghost"
              leftIcon={<ScanLine size={18} color={TOKENS.colors.text} />}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Copy JSON"
              onPress={handleCopyJson}
              variant="secondary"
              leftIcon={<Copy size={18} color={TOKENS.colors.primary} />}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
