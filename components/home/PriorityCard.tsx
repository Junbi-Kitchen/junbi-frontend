// Purpose: Full-width priority card for the home screen — EXPIRING, MEAL_PLAN, GROCERY, SAVINGS

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import {
  AlertTriangle,
  CalendarDays,
  ShoppingCart,
  TrendingUp,
  ChefHat,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Button } from '../ui/Button';
import { SavingsCounter } from './SavingsCounter';
import { TOKENS } from '../../lib/tokens';
import { getDaysUntilExpiry, getPantryStatusColor } from '../../lib/utils';
import type { PantryItem, Recipe } from '../../types';

// ─── Types ───────────────────────────────────────────────────

export type CardType = 'EXPIRING' | 'MEAL_PLAN' | 'GROCERY' | 'SAVINGS';

interface BaseCardData {
  type: CardType;
}

export interface ExpiringCardData extends BaseCardData {
  type: 'EXPIRING';
  item: PantryItem;
  recipeSuggestions: Recipe[];
}

export interface MealPlanCardData extends BaseCardData {
  type: 'MEAL_PLAN';
  plannedCount: number;
  totalDays: number;
  weekDays: { label: string; hasRecipe: boolean }[];
}

export interface GroceryCardData extends BaseCardData {
  type: 'GROCERY';
  itemCount: number;
  estimatedTotal: number;
}

export interface SavingsCardData extends BaseCardData {
  type: 'SAVINGS';
  amountSaved: number;
  mealsCooked: number;
  lastMonthSaved?: number;
  weeklyTrends?: { week: string; saved: number; wasted: number }[];
}

export type PriorityCardData =
  | ExpiringCardData
  | MealPlanCardData
  | GroceryCardData
  | SavingsCardData;

interface PriorityCardProps {
  data: PriorityCardData;
  onCta: () => void;
}

// ─── Shared card shell ───────────────────────────────────────

function CardShell({
  children,
  ctaLabel,
  onCta,
}: {
  children: React.ReactNode;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: TOKENS.colors.background,
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      {children}
      <View style={{ marginTop: 20 }}>
        <Button label={ctaLabel} onPress={onCta} variant="primary" fullWidth />
      </View>
    </View>
  );
}

// ─── EXPIRING card ───────────────────────────────────────────

function ExpiringCard({ data, onCta }: { data: ExpiringCardData; onCta: () => void }) {
  const days = getDaysUntilExpiry(data.item.expiryDate ?? '');
  const status = getPantryStatusColor(data.item.expiryDate ?? '');
  const freshColor =
    status === 'expired'
      ? TOKENS.colors.error
      : status === 'warning'
        ? TOKENS.colors.warning
        : TOKENS.colors.primary;

  const timeLabel =
    days <= 0 ? 'expired today' : days === 1 ? 'expires tomorrow' : `expires in ${days} days`;

  return (
    <CardShell ctaLabel="Cook one of these" onCta={onCta}>
      {/* Icon row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${freshColor}18`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle size={20} color={freshColor} />
        </View>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: `${freshColor}18`,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: freshColor }}>
            {timeLabel}
          </Text>
        </View>
      </View>

      {/* AI voice header */}
      <Text
        style={{
          fontSize: TOKENS.typography.sizes.xl,
          fontWeight: TOKENS.typography.weights.bold,
          color: TOKENS.colors.text,
          lineHeight: 28,
          marginBottom: 4,
        }}
      >
        Your {data.item.name.toLowerCase()} {timeLabel} — here are {data.recipeSuggestions.length} ideas
      </Text>

      <Text
        style={{
          fontSize: TOKENS.typography.sizes.sm,
          color: TOKENS.colors.textSecondary,
          marginBottom: 16,
        }}
      >
        {data.item.quantity} {data.item.unit} left in your pantry
      </Text>

      {/* Recipe suggestions */}
      {data.recipeSuggestions.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {data.recipeSuggestions.slice(0, 3).map((recipe) => (
            <View key={recipe.id} style={{ flex: 1 }}>
              <Image
                source={{ uri: recipe.imageUri }}
                style={{
                  width: '100%',
                  height: 80,
                  borderRadius: 12,
                  backgroundColor: TOKENS.colors.border,
                }}
                resizeMode="cover"
              />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  fontWeight: '500',
                  color: TOKENS.colors.text,
                  marginTop: 6,
                }}
              >
                {recipe.title}
              </Text>
            </View>
          ))}
        </View>
      )}
    </CardShell>
  );
}

// ─── MEAL_PLAN card ──────────────────────────────────────────

function MealPlanCard({ data, onCta }: { data: MealPlanCardData; onCta: () => void }) {
  return (
    <CardShell ctaLabel="Review plan" onCta={onCta}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: TOKENS.colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CalendarDays size={20} color={TOKENS.colors.primary} />
        </View>
      </View>

      <Text
        style={{
          fontSize: TOKENS.typography.sizes.xl,
          fontWeight: TOKENS.typography.weights.bold,
          color: TOKENS.colors.text,
          lineHeight: 28,
          marginBottom: 4,
        }}
      >
        You've got {data.plannedCount} of {data.totalDays} days planned this week
      </Text>

      <Text
        style={{
          fontSize: TOKENS.typography.sizes.sm,
          color: TOKENS.colors.textSecondary,
          marginBottom: 20,
        }}
      >
        Let me help fill in the gaps
      </Text>

      {/* 7-day mini row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {data.weekDays.map((day, idx) => (
          <View key={idx} style={{ alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: day.hasRecipe
                  ? TOKENS.colors.primaryMuted
                  : TOKENS.colors.inputBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {day.hasRecipe ? (
                <ChefHat size={16} color={TOKENS.colors.primary} />
              ) : (
                <Text style={{ fontSize: 14, color: TOKENS.colors.textMuted }}>—</Text>
              )}
            </View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '500',
                color: TOKENS.colors.textSecondary,
              }}
            >
              {day.label}
            </Text>
          </View>
        ))}
      </View>
    </CardShell>
  );
}

// ─── GROCERY card ────────────────────────────────────────────

function GroceryCard({ data, onCta }: { data: GroceryCardData; onCta: () => void }) {
  return (
    <CardShell ctaLabel="Order now" onCta={onCta}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: TOKENS.colors.accentLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShoppingCart size={20} color={TOKENS.colors.accent} />
        </View>
      </View>

      <Text
        style={{
          fontSize: TOKENS.typography.sizes.xl,
          fontWeight: TOKENS.typography.weights.bold,
          color: TOKENS.colors.text,
          lineHeight: 28,
          marginBottom: 4,
        }}
      >
        Your grocery list has {data.itemCount} item{data.itemCount !== 1 ? 's' : ''}
      </Text>

      <Text
        style={{
          fontSize: TOKENS.typography.sizes.sm,
          color: TOKENS.colors.textSecondary,
          marginBottom: 8,
        }}
      >
        Ready to order — I found the best prices nearby
      </Text>

      {/* Estimated total */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: 6,
          marginTop: 8,
        }}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: '700',
            color: TOKENS.colors.text,
          }}
        >
          ${data.estimatedTotal.toFixed(2)}
        </Text>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.sm,
            color: TOKENS.colors.textSecondary,
          }}
        >
          estimated total
        </Text>
      </View>
    </CardShell>
  );
}

// ─── SAVINGS card ────────────────────────────────────────────

function SavingsCard({ data, onCta }: { data: SavingsCardData; onCta: () => void }) {
  return (
    <CardShell ctaLabel="Share my savings" onCta={onCta}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${TOKENS.colors.accent}20`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TrendingUp size={20} color={TOKENS.colors.accent} />
        </View>
      </View>

      <Text
        style={{
          fontSize: TOKENS.typography.sizes.xl,
          fontWeight: TOKENS.typography.weights.bold,
          color: TOKENS.colors.text,
          lineHeight: 28,
          marginBottom: 4,
        }}
      >
        You're on a roll — {data.mealsCooked} meals cooked this month
      </Text>

      {/* Animated savings counter */}
      <View style={{ marginTop: 8, marginBottom: 16 }}>
        <SavingsCounter
          amount={data.amountSaved}
          lastMonthAmount={data.lastMonthSaved}
          size="lg"
        />
      </View>

      {/* Mini trend chart */}
      {data.weeklyTrends && data.weeklyTrends.length > 1 && (
        <MiniTrendChart trends={data.weeklyTrends} />
      )}
    </CardShell>
  );
}

function MiniTrendChart({ trends }: { trends: { week: string; saved: number; wasted: number }[] }) {
  const chartW = 260;
  const chartH = 60;
  const maxVal = Math.max(...trends.map((t) => t.saved), 1);
  const stepX = chartW / (trends.length - 1);

  const points = trends
    .map((t, i) => `${i * stepX},${chartH - (t.saved / maxVal) * chartH}`)
    .join(' ');

  return (
    <View style={{ marginTop: 4 }}>
      <Svg width={chartW} height={chartH + 10}>
        <Polyline
          points={points}
          fill="none"
          stroke={TOKENS.colors.accent}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {trends.map((t, i) => (
          <Circle
            key={i}
            cx={i * stepX}
            cy={chartH - (t.saved / maxVal) * chartH}
            r={3.5}
            fill={TOKENS.colors.accent}
          />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        {trends.map((t, i) => (
          <Text
            key={i}
            style={{
              fontSize: 9,
              color: TOKENS.colors.textMuted,
            }}
          >
            {t.week}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Exported component ──────────────────────────────────────

export function PriorityCard({ data, onCta }: PriorityCardProps) {
  switch (data.type) {
    case 'EXPIRING':
      return <ExpiringCard data={data} onCta={onCta} />;
    case 'MEAL_PLAN':
      return <MealPlanCard data={data} onCta={onCta} />;
    case 'GROCERY':
      return <GroceryCard data={data} onCta={onCta} />;
    case 'SAVINGS':
      return <SavingsCard data={data} onCta={onCta} />;
  }
}
