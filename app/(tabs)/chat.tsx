import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  CalendarDays,
  ShoppingCart,
  Sparkles,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  AlertTriangle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TOKENS } from '../../lib/tokens';
import { COPY } from '../../lib/copy';
import { useTheme } from '../../hooks/useTheme';
import { useRecipeStore } from '../../stores/recipeStore';
import { useGroceryStore } from '../../stores/groceryStore';
import { usePantry } from '../../hooks/usePantry';
import { getDaysUntilExpiry, formatCookTime } from '../../lib/utils';

// ─── Types ──────────────────────────────────────────────────

type AgentId = 'mealplan' | 'grocery';

interface AgentDef {
  id: AgentId;
  label: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  bgColor: string;
}

// ─── Screen ─────────────────────────────────────────────────

export default function AgentScreen() {
  const { colors } = useTheme();

  const AGENTS: AgentDef[] = [
    {
      id: 'mealplan',
      label: COPY.agents.list.mealplan.label,
      description: COPY.agents.list.mealplan.description,
      icon: CalendarDays,
      color: colors.accent,
      bgColor: colors.accentLight,
    },
    {
      id: 'grocery',
      label: COPY.agents.list.grocery.label,
      description: COPY.agents.list.grocery.description,
      icon: ShoppingCart,
      color: colors.primary,
      bgColor: colors.primaryMuted,
    },
  ];
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(null);
  const [step, setStep] = useState(0);

  const handleSelect = async (id: AgentId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveAgent(id);
    setStep(0);
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 0) setStep(step - 1);
    else setActiveAgent(null);
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep(step + 1);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      {activeAgent ? (
        <AgentFlow agentId={activeAgent} step={step} onBack={handleBack} onNext={handleNext} agents={AGENTS} />
      ) : (
        <AgentPicker onSelect={handleSelect} agents={AGENTS} />
      )}
    </SafeAreaView>
  );
}

// ─── Agent picker ────────────────────────────────────────────

function AgentPicker({ onSelect, agents }: { onSelect: (id: AgentId) => void; agents: AgentDef[] }) {
  const { colors } = useTheme();
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(400)} style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <View style={{
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={16} color={colors.primary} />
          </View>
          <Text style={{ fontSize: TOKENS.typography.sizes['2xl'], fontWeight: TOKENS.typography.weights.bold, color: colors.text }}>
            {COPY.agents.screenTitle}
          </Text>
        </View>
        <Text style={{ fontSize: TOKENS.typography.sizes.sm, color: colors.textSecondary, lineHeight: 20 }}>
          {COPY.agents.screenSubtitle}
        </Text>
      </Animated.View>

      {/* Agent cards */}
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        {agents.map((agent, idx) => {
          const Icon = agent.icon;
          return (
            <Animated.View key={agent.id} entering={FadeInDown.delay(idx * 100).springify()}>
              <TouchableOpacity
                onPress={() => onSelect(agent.id)}
                accessibilityLabel={`${agent.label}: ${agent.description}`}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 18,
                  borderRadius: TOKENS.borderRadius.card,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  ...TOKENS.shadows.sm,
                }}
              >
                <View style={{
                  width: 52, height: 52, borderRadius: 16,
                  backgroundColor: idx === 0 ? colors.accentLight : colors.primaryMuted,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={24} color={idx === 0 ? colors.accent : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: TOKENS.typography.sizes.md, fontWeight: TOKENS.typography.weights.semibold, color: colors.text }}>
                    {agent.label}
                  </Text>
                  <Text style={{ fontSize: TOKENS.typography.sizes.sm, color: colors.textSecondary, marginTop: 3 }}>
                    {agent.description}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Agent flow router ───────────────────────────────────────

function AgentFlow({ agentId, step, onBack, onNext, agents }: {
  agentId: AgentId; step: number; onBack: () => void; onNext: () => void; agents: AgentDef[];
}) {
  const { colors } = useTheme();
  const agent = agents.find((a) => a.id === agentId)!;
  const iconColor = agentId === 'mealplan' ? colors.accent : colors.primary;
  const iconBg = agentId === 'mealplan' ? colors.accentLight : colors.primaryMuted;

  return (
    <View style={{ flex: 1 }}>
      {/* Agent header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: colors.borderLight,
        backgroundColor: colors.surface,
      }}>
        <TouchableOpacity
          onPress={onBack}
          accessibilityLabel="Go back"
          style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={16} color={colors.text} />
        </TouchableOpacity>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
          <agent.icon size={14} color={iconColor} />
        </View>
        <Text style={{ flex: 1, fontSize: TOKENS.typography.sizes.md, fontWeight: TOKENS.typography.weights.semibold, color: colors.text }}>
          {agent.label}
        </Text>
      </View>

      {/* Flow */}
      <View style={{ flex: 1 }}>
        {agentId === 'mealplan' && <MealPlannerFlow step={step} onNext={onNext} />}
        {agentId === 'grocery' && <SmartGroceryFlow step={step} onNext={onNext} />}
      </View>
    </View>
  );
}

// ─── Step indicator ──────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          backgroundColor: i <= current ? colors.primary : colors.borderLight,
        }} />
      ))}
    </View>
  );
}

// ─── AI message bubble ───────────────────────────────────────

function AiBubble({ text, delay = 0 }: { text: string; delay?: number }) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <View style={{
          width: 28, height: 28, borderRadius: 8,
          backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginTop: 2,
        }}>
          <Sparkles size={13} color={colors.primary} />
        </View>
        <View style={{
          flex: 1, backgroundColor: colors.inputBg,
          borderRadius: 16, borderTopLeftRadius: 4,
          paddingHorizontal: 14, paddingVertical: 12,
        }}>
          <Text style={{ fontSize: 15, lineHeight: 22, color: colors.text }}>{text}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── CTA button ──────────────────────────────────────────────

function CtaButton({ label, onPress, variant = 'primary' }: {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary';
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={label}
      activeOpacity={0.85}
      style={{
        paddingVertical: 14, borderRadius: 12, alignItems: 'center',
        backgroundColor: variant === 'primary' ? colors.primary : colors.surface,
        borderWidth: variant === 'secondary' ? 1 : 0,
        borderColor: colors.border,
      }}
    >
      <Text style={{
        fontSize: TOKENS.typography.sizes.md, fontWeight: TOKENS.typography.weights.semibold,
        color: variant === 'primary' ? '#fff' : colors.text,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Typing dots ─────────────────────────────────────────────

function TypingDots() {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
      <View style={{
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginTop: 2,
      }}>
        <Sparkles size={13} color={colors.primary} />
      </View>
      <View style={{
        flexDirection: 'row', gap: 4,
        paddingHorizontal: 16, paddingVertical: 14,
        borderRadius: 16, borderTopLeftRadius: 4,
        backgroundColor: colors.inputBg,
      }}>
        <PulsingDot delay={0} />
        <PulsingDot delay={150} />
        <PulsingDot delay={300} />
      </View>
    </View>
  );
}

function PulsingDot({ delay }: { delay: number }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);
  React.useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, [delay, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textMuted }, style]} />;
}

// ═══════════════════════════════════════════════════════════
// MEAL PLANNER (Planning Agent)
// Step 0: Configure (budget, # days)
// Step 1: "Planning..." then show week plan
// Step 2: Confirm — view grocery
// ═══════════════════════════════════════════════════════════

function MealPlannerFlow({ step, onNext }: { step: number; onNext: () => void }) {
  const { colors } = useTheme();
  const recipes = useRecipeStore((s) => s.saved);
  const router = useRouter();
  const [budget, setBudget] = useState<number>(80);
  const [days, setDays] = useState(7);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planReady, setPlanReady] = useState(false);

  const budgetOptions = [40, 60, 80, 100];
  const dayOptions = [3, 5, 7];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const plan = dayLabels.slice(0, days).map((day, i) => ({
    day,
    recipe: recipes[i % Math.max(recipes.length, 1)],
  }));

  const handleGenerate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPlanning(true);
    setTimeout(() => { setIsPlanning(false); setPlanReady(true); }, 2000);
  };

  if (step === 0 && !isPlanning && !planReady) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <StepIndicator current={0} total={3} />
        <AiBubble text={COPY.agents.mealPlanner.prompt} />

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            {COPY.agents.mealPlanner.budgetLabel}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {budgetOptions.map((b) => (
              <TouchableOpacity
                key={b}
                onPress={() => setBudget(b)}
                accessibilityLabel={`Set budget to $${b}`}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                  backgroundColor: budget === b ? colors.primary : colors.surface,
                  borderWidth: budget === b ? 0 : 1,
                  borderColor: colors.borderLight,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: budget === b ? '#fff' : colors.text }}>
                  ${b}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            {COPY.agents.mealPlanner.daysLabel}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28 }}>
            {dayOptions.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDays(d)}
                accessibilityLabel={`Plan for ${d} days`}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                  backgroundColor: days === d ? colors.primary : colors.surface,
                  borderWidth: days === d ? 0 : 1,
                  borderColor: colors.borderLight,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: days === d ? '#fff' : colors.text }}>
                  {d}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <CtaButton label={COPY.agents.mealPlanner.planBtn(days, budget)} onPress={handleGenerate} />
      </ScrollView>
    );
  }

  if (isPlanning) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <StepIndicator current={1} total={3} />
        <TypingDots />
        <AiBubble text={COPY.agents.mealPlanner.thinking(days, budget)} delay={500} />
      </View>
    );
  }

  if (planReady || step >= 1) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <StepIndicator current={2} total={3} />
        <AiBubble text={COPY.agents.mealPlanner.ready(days, budget)} />

        <View style={{ gap: 8, marginBottom: 20 }}>
          {plan.map(({ day, recipe }, idx) => (
            <Animated.View key={day} entering={FadeInDown.delay(200 + idx * 80).springify()}>
              <TouchableOpacity
                onPress={() => recipe && router.push(`/recipe/${recipe.id}`)}
                accessibilityLabel={`${day}: ${recipe?.title ?? 'Rest day'}`}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: 12, padding: 12,
                  borderWidth: 1, borderColor: colors.borderLight,
                }}
              >
                <View style={{ width: 40, alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{day}</Text>
                </View>
                {recipe?.imageUri ? (
                  <Image source={{ uri: recipe.imageUri }} style={{ width: 44, height: 44, borderRadius: 10, marginRight: 10 }} />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                    {recipe?.title ?? 'Rest day'}
                  </Text>
                  {recipe && (
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                      {formatCookTime(recipe.cookTimeMinutes)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <CtaButton label={COPY.agents.mealPlanner.addToGroceryBtn} onPress={onNext} />
        <View style={{ height: 8 }} />
        <CtaButton label={COPY.agents.mealPlanner.regenerateBtn} onPress={handleGenerate} variant="secondary" />
      </ScrollView>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
// SMART GROCERY (Grocery Agent)
// Step 0: Show pantry gaps + expiring items
// Step 1: AI-built grocery list
// Step 2: Confirm + send to store
// ═══════════════════════════════════════════════════════════

function SmartGroceryFlow({ step, onNext }: { step: number; onNext: () => void }) {
  const { colors } = useTheme();
  const { items, expiringItems } = usePantry();
  const groceryItems = useGroceryStore((s) => s.items);
  const router = useRouter();
  const [isBuilding, setIsBuilding] = useState(false);
  const [listReady, setListReady] = useState(false);

  const unchecked = groceryItems.filter((i) => !i.checked);
  const pantryNames = items.map((i) => i.name.toLowerCase());
  const suggestions = [
    'Olive oil', 'Garlic', 'Onions', 'Rice', 'Salt', 'Eggs', 'Butter', 'Milk',
  ].filter((s) => !pantryNames.includes(s.toLowerCase())).slice(0, 5);

  const handleBuildList = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsBuilding(true);
    setTimeout(() => { setIsBuilding(false); setListReady(true); }, 1800);
  };

  if (step === 0 && !isBuilding && !listReady) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <StepIndicator current={0} total={3} />
        <AiBubble text={COPY.agents.smartGrocery.prompt(items.length)} />

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={{
            backgroundColor: colors.surface, borderRadius: 14, padding: 16,
            borderWidth: 1, borderColor: colors.borderLight, marginBottom: 12,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              {([
                { val: items.length, label: COPY.agents.smartGrocery.stats.inPantry, color: colors.text },
                { val: expiringItems.length, label: COPY.agents.smartGrocery.stats.expiring, color: colors.warning },
                { val: unchecked.length, label: COPY.agents.smartGrocery.stats.onList, color: colors.primary },
              ] as const).map((stat, i) => (
                <React.Fragment key={stat.label}>
                  {i > 0 && <View style={{ width: 1, backgroundColor: colors.borderLight }} />}
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 22, fontWeight: '700', color: stat.color }}>{stat.val}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{stat.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
        </Animated.View>

        {suggestions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              {COPY.agents.smartGrocery.stapleslabel}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {suggestions.map((item) => (
                <View key={item} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                  backgroundColor: colors.warningLight,
                }}>
                  <AlertTriangle size={12} color={colors.warning} />
                  <Text style={{ fontSize: 13, color: colors.text }}>{item}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <CtaButton label={COPY.agents.smartGrocery.buildBtn} onPress={handleBuildList} />
      </ScrollView>
    );
  }

  if (isBuilding) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <StepIndicator current={1} total={3} />
        <TypingDots />
        <AiBubble text={COPY.agents.smartGrocery.thinking} delay={500} />
      </View>
    );
  }

  if (listReady || step >= 1) {
    const allItems = [
      ...suggestions.map((name) => ({ name, isNew: true })),
      ...unchecked.map((i) => ({ name: i.name, isNew: false })),
    ];

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <StepIndicator current={2} total={3} />
        <AiBubble text={COPY.agents.smartGrocery.ready(allItems.length)} />

        <View style={{
          backgroundColor: colors.surface, borderRadius: 14, padding: 14,
          borderWidth: 1, borderColor: colors.borderLight, marginBottom: 20, gap: 4,
        }}>
          {allItems.map((item, i) => (
            <Animated.View key={`${item.name}-${i}`} entering={FadeInDown.delay(150 + i * 50).springify()}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
                borderBottomWidth: i < allItems.length - 1 ? 1 : 0,
                borderBottomColor: colors.borderLight,
              }}>
                <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border }} />
                <Text style={{ flex: 1, fontSize: 15, color: colors.text }}>{item.name}</Text>
                {item.isNew && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.primaryMuted }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: colors.primary }}>NEW</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          ))}
        </View>

        <CtaButton label={COPY.agents.smartGrocery.addAllBtn} onPress={() => router.push('/(tabs)/grocery')} />
      </ScrollView>
    );
  }

  return null;
}
