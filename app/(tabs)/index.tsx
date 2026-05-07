import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Camera, Link2, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePantry } from '../../hooks/usePantry';
import { useGroceryStore } from '../../stores/groceryStore';
import { useSavingsStore } from '../../stores/savingsStore';
import { UrgencyCard } from '../../components/home/UrgencyCard';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import { COPY } from '../../lib/copy';
import { getDaysUntilExpiry } from '../../lib/utils';

const GAP = 12;
const PAD = 16;

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { items, expiringItems } = usePantry();
  const groceryItems = useGroceryStore((s) => s.items);
  const savings = useSavingsStore();

  const criticalItems = expiringItems
    .filter((i) => getDaysUntilExpiry(i.expiryDate ?? '') <= 2)
    .slice(0, 2);
  const uncheckedCount = groceryItems.filter((i) => !i.checked).length;
  const mealsCooked = savings.wasteLog.filter((e) => e.action === 'used').length;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const go = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as never);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 24, gap: GAP }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={{ paddingTop: 12, paddingBottom: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primary, fontFamily: TOKENS.typography.fontFamily.bold }}>
            Junbi
          </Text>
          <Text style={{ fontSize: 13, color: colors.cardLabel, marginTop: 2 }}>
            {criticalItems.length > 0
              ? `${criticalItems.length} item${criticalItems.length > 1 ? 's' : ''} need attention`
              : 'Your kitchen at a glance'}
          </Text>
        </View>

        {/* Critical expiring */}
        {criticalItems.length > 0 && (
          <View style={{ flexDirection: 'row', gap: GAP }}>
            {criticalItems.map((item, i) => (
              <UrgencyCard key={item.id} item={item} delay={i * 60} flex />
            ))}
            {criticalItems.length === 1 && <View style={{ flex: 1 }} />}
          </View>
        )}

        {/* Savings hero */}
        <Animated.View entering={FadeInUp.delay(60).duration(400)}>
          <TouchableOpacity
            onPress={() => go('/savings')}
            accessibilityLabel="View savings analysis"
            activeOpacity={0.85}
            style={{
              backgroundColor: colors.primary,
              borderRadius: TOKENS.borderRadius.card,
              padding: 18,
              ...TOKENS.shadows.sm,
            }}
          >
            <CardLabel text={COPY.home.cardLabels.savings} light />
            <Text style={{ fontSize: 36, fontWeight: '700', color: '#fff', marginTop: 6, fontFamily: TOKENS.typography.fontFamily.bold }}>
              ${savings.totalSavedThisMonth.toFixed(0)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                {mealsCooked} meal{mealsCooked !== 1 ? 's' : ''} cooked from pantry
              </Text>
              <ChevronRight size={16} color="rgba(255,255,255,0.5)" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Pantry + Grocery pair */}
        <Animated.View entering={FadeInUp.delay(120).duration(400)} style={{ flexDirection: 'row', gap: GAP }}>
          <StatCard
            label={COPY.home.cardLabels.pantry}
            value={`${items.length}`}
            sub={expiringItems.length > 0 ? `${expiringItems.length} expiring soon` : 'All fresh'}
            subColor={expiringItems.length > 0 ? colors.freshnessAmber : colors.freshnessGreen}
            onPress={() => go('/(tabs)/kitchen')}
          />
          <StatCard
            label={COPY.home.cardLabels.grocery}
            value={`${uncheckedCount}`}
            sub={uncheckedCount === 0 ? "You're stocked" : 'items to buy'}
            onPress={() => go('/(tabs)/grocery')}
          />
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInUp.delay(180).duration(400)}>
          <View style={{ backgroundColor: colors.surface, borderRadius: TOKENS.borderRadius.card, padding: 18, ...TOKENS.shadows.sm }}>
            <CardLabel text={COPY.home.cardLabels.quickActions} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <ActionBtn icon={Camera} label={COPY.home.actions.scanReceipt} onPress={() => go('/(tabs)/kitchen')} />
              <ActionBtn icon={Link2} label={COPY.home.actions.importRecipe} onPress={() => go('/import')} />
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── CardLabel ─────────────────────────────────────────────────

function CardLabel({ text, light }: { text: string; light?: boolean }) {
  const { colors } = useTheme();
  return (
    <Text style={{
      fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase',
      color: light ? 'rgba(255,255,255,0.6)' : colors.cardLabel,
      fontFamily: TOKENS.typography.fontFamily.semibold,
    }}>
      {text}
    </Text>
  );
}

// ── StatCard ──────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor, onPress }: {
  label: string; value: string; sub: string; subColor?: string; onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={label}
      activeOpacity={0.85}
      style={{ flex: 1, backgroundColor: colors.surface, borderRadius: TOKENS.borderRadius.card, padding: 18, ...TOKENS.shadows.sm }}
    >
      <CardLabel text={label} />
      <Text style={{ fontSize: 30, fontWeight: '700', color: colors.text, marginTop: 8, fontFamily: TOKENS.typography.fontFamily.bold }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: subColor ?? colors.cardLabel, marginTop: 4 }}>
        {sub}
      </Text>
    </TouchableOpacity>
  );
}

// ── ActionBtn ─────────────────────────────────────────────────

function ActionBtn({ icon: Icon, label, onPress }: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={label}
      activeOpacity={0.8}
      style={{ flex: 1, alignItems: 'center', gap: 8, backgroundColor: colors.background, borderRadius: 12, paddingVertical: 14 }}
    >
      <Icon size={22} color={colors.primary} />
      <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary, textAlign: 'center' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
