// Purpose: Savings analysis screen with stock-like graphs for monthly and all-time trends

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react-native';
import { useSavingsStore } from '../stores/savingsStore';
import { useTheme } from '../hooks/useTheme';
import { TOKENS } from '../lib/tokens';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_PADDING = 20;
const CHART_W = SCREEN_W - CHART_PADDING * 2 - 40;
const CHART_H = 200;

type TimeRange = 'month' | 'all';

export default function SavingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const savings = useSavingsStore();
  const [range, setRange] = useState<TimeRange>('month');

  useEffect(() => {
    savings.fetchLog();
  }, []);

  const trends = savings.weeklyTrends;
  const usedCount = savings.wasteLog.filter((e) => e.action === 'used').length;
  const tossedCount = savings.wasteLog.filter((e) => e.action === 'tossed').length;
  const saveRate = usedCount + tossedCount > 0
    ? Math.round((usedCount / (usedCount + tossedCount)) * 100)
    : 0;

  // Build chart data based on range
  const chartData = range === 'month'
    ? trends.map((t) => ({ label: t.week, saved: t.saved, wasted: t.wasted }))
    : [
        { label: 'Jan', saved: 32, wasted: 12 },
        { label: 'Feb', saved: 38, wasted: 8.5 },
        { label: 'Mar', saved: 47.5, wasted: 8.5 },
      ];

  const maxVal = Math.max(...chartData.map((d) => Math.max(d.saved, d.wasted)), 1);

  // Build smooth path for saved line
  const buildPath = (key: 'saved' | 'wasted') => {
    if (chartData.length < 2) return '';
    const stepX = CHART_W / (chartData.length - 1);
    const points = chartData.map((d, i) => ({
      x: i * stepX,
      y: CHART_H - (d[key] / maxVal) * (CHART_H - 20),
    }));

    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + stepX * 0.4;
      const cp1y = points[i - 1].y;
      const cp2x = points[i].x - stepX * 0.4;
      const cp2y = points[i].y;
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`;
    }
    return path;
  };

  // Build area fill path (same curve + close to bottom)
  const buildAreaPath = (key: 'saved' | 'wasted') => {
    const linePath = buildPath(key);
    if (!linePath) return '';
    const stepX = CHART_W / (chartData.length - 1);
    const lastX = (chartData.length - 1) * stepX;
    return `${linePath} L ${lastX},${CHART_H} L 0,${CHART_H} Z`;
  };

  const savedPath = buildPath('saved');
  const wastedPath = buildPath('wasted');
  const savedAreaPath = buildAreaPath('saved');

  const stepX = chartData.length > 1 ? CHART_W / (chartData.length - 1) : CHART_W;

  // Compute change percentage
  const changePercent = range === 'month' && savings.lastMonthSaved > 0
    ? Math.round(((savings.totalSavedThisMonth - savings.lastMonthSaved) / savings.lastMonthSaved) * 100)
    : 0;
  const isPositive = changePercent >= 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.xl,
            fontWeight: TOKENS.typography.weights.bold,
            color: colors.text,
          }}
        >
          Savings Analysis
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Summary stat */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            {range === 'month' ? 'This month' : 'All time'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
            <Text
              style={{
                fontSize: 40,
                fontWeight: '700',
                color: colors.accent,
              }}
            >
              ${range === 'month'
                ? savings.totalSavedThisMonth.toFixed(0)
                : savings.totalSavedAllTime.toFixed(0)}
            </Text>
            {range === 'month' && changePercent !== 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: isPositive ? colors.successLight : colors.errorLight,
                }}
              >
                {isPositive ? (
                  <TrendingUp size={14} color={colors.success} />
                ) : (
                  <TrendingDown size={14} color={colors.error} />
                )}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: isPositive ? colors.success : colors.error,
                  }}
                >
                  {isPositive ? '+' : ''}{changePercent}%
                </Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
            saved from food waste
          </Text>
        </View>

        {/* Time range toggle */}
        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: 20,
            marginTop: 20,
            backgroundColor: colors.inputBg,
            borderRadius: 10,
            padding: 3,
          }}
        >
          {(['month', 'all'] as TimeRange[]).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              accessibilityLabel={r === 'month' ? 'This month' : 'All time'}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: range === r ? colors.surface : 'transparent',
                alignItems: 'center',
                ...(range === r
                  ? {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      elevation: 2,
                    }
                  : {}),
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: range === r ? '600' : '400',
                  color: range === r ? colors.text : colors.textSecondary,
                }}
              >
                {r === 'month' ? 'This Month' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Saved</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error }} />
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Wasted</Text>
              </View>
            </View>
          </View>

          <Svg width={CHART_W} height={CHART_H + 30}>
            <Defs>
              <LinearGradient id="savedGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.accent} stopOpacity="0.2" />
                <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
              <Line
                key={pct}
                x1={0}
                y1={CHART_H - pct * (CHART_H - 20)}
                x2={CHART_W}
                y2={CHART_H - pct * (CHART_H - 20)}
                stroke={colors.borderLight}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            ))}

            {/* Y-axis labels */}
            {[0, 0.5, 1].map((pct) => {
              const val = Math.round(maxVal * pct);
              return (
                <React.Fragment key={`label-${pct}`}>
                  {/* Using SVG text isn't great in RN, we'll use RN Text below */}
                </React.Fragment>
              );
            })}

            {/* Saved area fill */}
            {savedAreaPath && (
              <Path d={savedAreaPath} fill="url(#savedGrad)" />
            )}

            {/* Saved line */}
            {savedPath && (
              <Path
                d={savedPath}
                fill="none"
                stroke={colors.accent}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Wasted line */}
            {wastedPath && (
              <Path
                d={wastedPath}
                fill="none"
                stroke={colors.error}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6,4"
              />
            )}

            {/* Saved dots */}
            {chartData.map((d, i) => (
              <Circle
                key={`s-${i}`}
                cx={i * stepX}
                cy={CHART_H - (d.saved / maxVal) * (CHART_H - 20)}
                r={4}
                fill={colors.accent}
                stroke={colors.surface}
                strokeWidth={2}
              />
            ))}

            {/* Wasted dots */}
            {chartData.map((d, i) => (
              <Circle
                key={`w-${i}`}
                cx={i * stepX}
                cy={CHART_H - (d.wasted / maxVal) * (CHART_H - 20)}
                r={3}
                fill={colors.error}
                stroke={colors.surface}
                strokeWidth={2}
              />
            ))}
          </Svg>

          {/* X-axis labels */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            {chartData.map((d, i) => (
              <Text
                key={i}
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  textAlign: 'center',
                }}
              >
                {d.label}
              </Text>
            ))}
          </View>
        </View>

        {/* Stats grid */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.xs,
              fontWeight: TOKENS.typography.weights.semibold,
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 10,
            }}
          >
            Breakdown
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCard
              label="Saved this month"
              value={`$${savings.totalSavedThisMonth.toFixed(0)}`}
              color={colors.accent}
            />
            <StatCard
              label="Wasted this month"
              value={`$${savings.totalWastedThisMonth.toFixed(0)}`}
              color={colors.error}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <StatCard
              label="Save rate"
              value={`${saveRate}%`}
              color={colors.success}
            />
            <StatCard
              label="Last month"
              value={`$${savings.lastMonthSaved.toFixed(0)}`}
              color={colors.primary}
            />
          </View>
        </View>

        {/* Recent activity */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.xs,
              fontWeight: TOKENS.typography.weights.semibold,
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 10,
            }}
          >
            Recent activity
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.borderLight,
              overflow: 'hidden',
            }}
          >
            {savings.wasteLog.slice(0, 8).map((entry, idx) => (
              <View
                key={entry.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderBottomWidth: idx < 7 ? 1 : 0,
                  borderBottomColor: colors.borderLight,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: entry.action === 'used'
                      ? colors.successLight
                      : colors.errorLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  {entry.action === 'used' ? (
                    <DollarSign size={14} color={colors.success} />
                  ) : (
                    <TrendingDown size={14} color={colors.error} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>
                    {entry.itemName}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: entry.action === 'used' ? colors.success : colors.error,
                  }}
                >
                  {entry.action === 'used' ? '+' : '-'}${entry.estimatedValue.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
        {label}
      </Text>
    </View>
  );
}
