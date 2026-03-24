// Purpose: Home screen — swipeable priority cards (expiring, meal plan, grocery, savings)

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { usePantry } from '../../hooks/usePantry';
import { useGroceryStore } from '../../stores/groceryStore';
import { useRecipeStore } from '../../stores/recipeStore';
import { useSavingsStore } from '../../stores/savingsStore';
import { PriorityCard } from '../../components/home/PriorityCard';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { TOKENS } from '../../lib/tokens';
import { getDaysUntilExpiry } from '../../lib/utils';
import type { PriorityCardData } from '../../components/home/PriorityCard';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_W - 40; // 20px padding on each side
const CARD_GAP = 12;

export default function HomeScreen() {
  const router = useRouter();
  const [loading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollX = useSharedValue(0);

  const { items, expiringItems } = usePantry();
  const groceryItems = useGroceryStore((s) => s.items);
  const recipes = useRecipeStore((s) => s.saved);
  const savings = useSavingsStore();

  // ─── Build priority cards from real store data ────────────

  const buildCards = useCallback((): PriorityCardData[] => {
    const cards: PriorityCardData[] = [];

    // EXPIRING cards — one per expiring item, sorted by urgency
    const sortedExpiring = [...expiringItems].sort((a, b) => {
      const daysA = getDaysUntilExpiry(a.expiryDate ?? '');
      const daysB = getDaysUntilExpiry(b.expiryDate ?? '');
      return daysA - daysB;
    });

    // Show up to 2 expiring cards (most urgent)
    for (const item of sortedExpiring.slice(0, 2)) {
      // Find recipes that use this ingredient
      const suggestions = recipes.filter((r) =>
        r.ingredients.some((ing) =>
          ing.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(ing.name.toLowerCase())
        )
      ).slice(0, 3);

      // Pad with random recipes if we don't have 3 matches
      const remaining = 3 - suggestions.length;
      if (remaining > 0) {
        const extras = recipes
          .filter((r) => !suggestions.some((s) => s.id === r.id))
          .slice(0, remaining);
        suggestions.push(...extras);
      }

      cards.push({
        type: 'EXPIRING',
        item,
        recipeSuggestions: suggestions,
      });
    }

    // MEAL_PLAN card
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const plannedDays = [true, true, false, true, false, false, true]; // mock
    cards.push({
      type: 'MEAL_PLAN',
      plannedCount: plannedDays.filter(Boolean).length,
      totalDays: 7,
      weekDays: dayLabels.map((label, i) => ({
        label,
        hasRecipe: plannedDays[i],
      })),
    });

    // GROCERY card
    const unchecked = groceryItems.filter((i) => !i.checked);
    if (unchecked.length > 0) {
      cards.push({
        type: 'GROCERY',
        itemCount: unchecked.length,
        estimatedTotal: unchecked.length * 3.49, // mock pricing
      });
    }

    // SAVINGS card (always present)
    cards.push({
      type: 'SAVINGS',
      amountSaved: savings.totalSavedThisMonth,
      mealsCooked: savings.wasteLog.filter((e) => e.action === 'used').length,
      lastMonthSaved: savings.lastMonthSaved,
      weeklyTrends: savings.weeklyTrends,
    });

    return cards;
  }, [expiringItems, groceryItems, recipes, savings]);

  const cards = buildCards();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Re-sort triggers via state change; brief visual feedback
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  // ─── Scroll handler for pagination dots ───────────────────

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // ─── CTA handlers ─────────────────────────────────────────

  const handleCta = (card: PriorityCardData) => {
    switch (card.type) {
      case 'EXPIRING':
        if (card.recipeSuggestions[0]) {
          router.push(`/recipe/${card.recipeSuggestions[0].id}`);
        }
        break;
      case 'MEAL_PLAN':
        // Future: navigate to meal plan screen
        break;
      case 'GROCERY':
        router.push('/(tabs)/grocery');
        break;
      case 'SAVINGS':
        // Future: share flow
        break;
    }
  };

  // ─── Skeleton ─────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
        <View style={{ padding: 20, gap: 16 }}>
          <SkeletonLoader width="50%" height={32} borderRadius={8} />
          <SkeletonLoader width="70%" height={18} borderRadius={6} />
          <SkeletonLoader width={CARD_WIDTH} height={320} borderRadius={16} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} width={8} height={8} borderRadius={4} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={TOKENS.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes['2xl'],
              fontWeight: TOKENS.typography.weights.bold,
              color: TOKENS.colors.primary,
            }}
          >
            gook
          </Text>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.sm,
              color: TOKENS.colors.textSecondary,
              marginTop: 4,
            }}
          >
            Here's what needs your attention
          </Text>
        </View>

        {/* Swipeable card carousel */}
        <View style={{ marginTop: 8 }}>
          <Animated.ScrollView
            horizontal
            pagingEnabled={false}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            decelerationRate={0.88}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: CARD_GAP,
            }}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {cards.map((card, idx) => (
              <View key={`${card.type}-${idx}`} style={{ width: CARD_WIDTH }}>
                <PriorityCard data={card} onCta={() => handleCta(card)} />
              </View>
            ))}
          </Animated.ScrollView>

          {/* Pagination dots */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              marginTop: 20,
            }}
          >
            {cards.map((_, idx) => (
              <PaginationDot
                key={idx}
                index={idx}
                scrollX={scrollX}
                cardWidth={CARD_WIDTH + CARD_GAP}
              />
            ))}
          </View>
        </View>

        {/* Pantry summary strip */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.xs,
              fontWeight: TOKENS.typography.weights.semibold,
              color: TOKENS.colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 12,
            }}
          >
            Pantry at a glance
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
            }}
          >
            <StatBox label="Items" value={`${items.length}`} />
            <StatBox
              label="Expiring soon"
              value={`${expiringItems.length}`}
              valueColor={expiringItems.length > 0 ? TOKENS.colors.warning : undefined}
            />
            <StatBox label="Recipes saved" value={`${recipes.length}`} />
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ─── Pagination dot with Reanimated ──────────────────────────

function PaginationDot({
  index,
  scrollX,
  cardWidth,
}: {
  index: number;
  scrollX: Animated.SharedValue<number>;
  cardWidth: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * cardWidth,
      index * cardWidth,
      (index + 1) * cardWidth,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );

    return { width, opacity };
  });

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          backgroundColor: TOKENS.colors.primary,
        },
        animatedStyle,
      ]}
    />
  );
}

// ─── Stat box ────────────────────────────────────────────────

function StatBox({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: TOKENS.colors.white,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: TOKENS.colors.borderLight,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: valueColor ?? TOKENS.colors.text,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: TOKENS.colors.textSecondary,
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
