// Purpose: Agent tab — 4 AI agents with step-by-step agentic flows

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
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ChefHat,
  CalendarDays,
  ShoppingCart,
  PiggyBank,
  Sparkles,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TOKENS } from '../../lib/tokens';
import { useRecipeStore } from '../../stores/recipeStore';
import { useSavingsStore } from '../../stores/savingsStore';
import { useGroceryStore } from '../../stores/groceryStore';
import { usePantry } from '../../hooks/usePantry';
import { getDaysUntilExpiry, formatCookTime } from '../../lib/utils';

// ─── Types ──────────────────────────────────────────────────

type AgentId = 'recipe' | 'mealplan' | 'grocery' | 'savings';

interface AgentDef {
  id: AgentId;
  label: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  bgColor: string;
}

const AGENTS: AgentDef[] = [
  {
    id: 'recipe',
    label: 'Recipe Finder',
    description: 'Find recipes from what you have',
    icon: ChefHat,
    color: TOKENS.colors.primary,
    bgColor: TOKENS.colors.primaryMuted,
  },
  {
    id: 'mealplan',
    label: 'Meal Planner',
    description: 'Plan your week automatically',
    icon: CalendarDays,
    color: TOKENS.colors.accent,
    bgColor: TOKENS.colors.accentLight,
  },
  {
    id: 'grocery',
    label: 'Smart Grocery',
    description: 'Build a list from pantry gaps',
    icon: ShoppingCart,
    color: TOKENS.colors.primary,
    bgColor: TOKENS.colors.primaryMuted,
  },
  {
    id: 'savings',
    label: 'Savings Coach',
    description: 'Track waste and save money',
    icon: PiggyBank,
    color: TOKENS.colors.accent,
    bgColor: TOKENS.colors.accentLight,
  },
];

// ─── Screen ─────────────────────────────────────────────────

export default function AgentScreen() {
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(null);
  const [step, setStep] = useState(0);

  const handleSelect = async (id: AgentId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveAgent(id);
    setStep(0);
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 0) {
      setStep(step - 1);
    } else {
      setActiveAgent(null);
    }
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep(step + 1);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      {activeAgent ? (
        <AgentFlow
          agentId={activeAgent}
          step={step}
          onBack={handleBack}
          onNext={handleNext}
        />
      ) : (
        <AgentPicker onSelect={handleSelect} />
      )}
    </SafeAreaView>
  );
}

// ─── Agent picker (home state) ──────────────────────────────

function AgentPicker({ onSelect }: { onSelect: (id: AgentId) => void }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 8 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: TOKENS.colors.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={16} color={TOKENS.colors.primary} />
          </View>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes['2xl'],
              fontWeight: TOKENS.typography.weights.bold,
              color: TOKENS.colors.text,
            }}
          >
            AI Agents
          </Text>
        </View>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.sm,
            color: TOKENS.colors.textSecondary,
            lineHeight: 20,
          }}
        >
          Pick an agent to handle your task. Each one walks you through step by step.
        </Text>
      </View>

      {/* Agent cards */}
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        {AGENTS.map((agent, idx) => {
          const Icon = agent.icon;
          return (
            <Animated.View key={agent.id} entering={FadeInDown.delay(idx * 80).springify()}>
              <TouchableOpacity
                onPress={() => onSelect(agent.id)}
                accessibilityLabel={`${agent.label}: ${agent.description}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: TOKENS.colors.white,
                  borderWidth: 1,
                  borderColor: TOKENS.colors.borderLight,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: agent.bgColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} color={agent.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: TOKENS.typography.sizes.md,
                      fontWeight: TOKENS.typography.weights.semibold,
                      color: TOKENS.colors.text,
                    }}
                  >
                    {agent.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: TOKENS.typography.sizes.sm,
                      color: TOKENS.colors.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    {agent.description}
                  </Text>
                </View>
                <ChevronRight size={18} color={TOKENS.colors.textMuted} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Agent flow router ──────────────────────────────────────

function AgentFlow({
  agentId,
  step,
  onBack,
  onNext,
}: {
  agentId: AgentId;
  step: number;
  onBack: () => void;
  onNext: () => void;
}) {
  const agent = AGENTS.find((a) => a.id === agentId)!;

  return (
    <View style={{ flex: 1 }}>
      {/* Agent header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: TOKENS.colors.borderLight,
          backgroundColor: TOKENS.colors.white,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          accessibilityLabel="Go back"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: TOKENS.colors.inputBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={16} color={TOKENS.colors.text} />
        </TouchableOpacity>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: agent.bgColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <agent.icon size={14} color={agent.color} />
        </View>
        <Text
          style={{
            flex: 1,
            fontSize: TOKENS.typography.sizes.md,
            fontWeight: TOKENS.typography.weights.semibold,
            color: TOKENS.colors.text,
          }}
        >
          {agent.label}
        </Text>
      </View>

      {/* Flow content */}
      <View style={{ flex: 1 }}>
        {agentId === 'recipe' && <RecipeFinderFlow step={step} onNext={onNext} />}
        {agentId === 'mealplan' && <MealPlannerFlow step={step} onNext={onNext} />}
        {agentId === 'grocery' && <SmartGroceryFlow step={step} onNext={onNext} />}
        {agentId === 'savings' && <SavingsCoachFlow step={step} onNext={onNext} />}
      </View>
    </View>
  );
}

// ─── Step indicator ─────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            backgroundColor: i <= current ? TOKENS.colors.primary : TOKENS.colors.borderLight,
          }}
        />
      ))}
    </View>
  );
}

// ─── AI message bubble ──────────────────────────────────────

function AiBubble({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: TOKENS.colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
          }}
        >
          <Sparkles size={13} color={TOKENS.colors.primary} />
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: TOKENS.colors.inputBg,
            borderRadius: 16,
            borderTopLeftRadius: 4,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontSize: 15, lineHeight: 22, color: TOKENS.colors.text }}>
            {text}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── CTA button ─────────────────────────────────────────────

function CtaButton({ label, onPress, variant = 'primary' }: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={label}
      style={{
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: variant === 'primary' ? TOKENS.colors.primary : TOKENS.colors.white,
        borderWidth: variant === 'secondary' ? 1 : 0,
        borderColor: TOKENS.colors.border,
      }}
    >
      <Text
        style={{
          fontSize: TOKENS.typography.sizes.md,
          fontWeight: TOKENS.typography.weights.semibold,
          color: variant === 'primary' ? TOKENS.colors.white : TOKENS.colors.text,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Typing dots ────────────────────────────────────────────

function TypingDots() {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: TOKENS.colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}
      >
        <Sparkles size={13} color={TOKENS.colors.primary} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 4,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 16,
          borderTopLeftRadius: 4,
          backgroundColor: TOKENS.colors.inputBg,
        }}
      >
        <PulsingDot delay={0} />
        <PulsingDot delay={150} />
        <PulsingDot delay={300} />
      </View>
    </View>
  );
}

function PulsingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: 7, height: 7, borderRadius: 4, backgroundColor: TOKENS.colors.textMuted },
        style,
      ]}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// RECIPE FINDER FLOW
// Step 0: Show expiring items, ask what to cook with
// Step 1: "Thinking..." then show 3 recipe suggestions
// Step 2: Recipe selected — show detail + add missing to grocery
// ═══════════════════════════════════════════════════════════

function RecipeFinderFlow({ step, onNext }: { step: number; onNext: () => void }) {
  const router = useRouter();
  const { items, expiringItems } = usePantry();
  const recipes = useRecipeStore((s) => s.saved);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const urgent = [...expiringItems].sort((a, b) =>
    getDaysUntilExpiry(a.expiryDate ?? '') - getDaysUntilExpiry(b.expiryDate ?? '')
  ).slice(0, 6);

  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleFindRecipes = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      setShowResults(true);
    }, 1500);
  };

  // Match recipes by selected ingredients
  const matched = recipes.filter((r) =>
    r.ingredients.some((ing) =>
      selectedIngredients.some((sel) =>
        ing.name.toLowerCase().includes(sel.toLowerCase()) ||
        sel.toLowerCase().includes(ing.name.toLowerCase())
      )
    )
  ).slice(0, 3);

  // Pad with extras if needed
  const suggestions = matched.length >= 3 ? matched : [
    ...matched,
    ...recipes.filter((r) => !matched.some((m) => m.id === r.id)).slice(0, 3 - matched.length),
  ];

  // Thinking state
  if (isThinking) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <StepIndicator current={1} total={3} />
        <TypingDots />
        <AiBubble text="Searching for the best matches..." delay={400} />
      </View>
    );
  }

  // Results state
  if (showResults) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <StepIndicator current={1} total={3} />

        <AiBubble
          text={selectedIngredients.length > 0
            ? `I found ${suggestions.length} recipes using ${selectedIngredients.join(', ')}. Pick one to get started!`
            : `Here are ${suggestions.length} recipes you can make tonight.`
          }
        />

        <View style={{ gap: 10 }}>
          {suggestions.map((recipe, idx) => (
            <Animated.View key={recipe.id} entering={FadeInDown.delay(200 + idx * 100).springify()}>
              <TouchableOpacity
                onPress={() => router.push(`/recipe/${recipe.id}`)}
                accessibilityLabel={`Open ${recipe.title}`}
                style={{
                  flexDirection: 'row',
                  backgroundColor: TOKENS.colors.white,
                  borderRadius: 14,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: TOKENS.colors.borderLight,
                }}
              >
                <Image
                  source={{ uri: recipe.imageUri }}
                  style={{ width: 80, height: 80 }}
                />
                <View style={{ flex: 1, padding: 12, justifyContent: 'center' }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: TOKENS.colors.text,
                    }}
                  >
                    {recipe.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Clock size={12} color={TOKENS.colors.textSecondary} />
                    <Text style={{ fontSize: 13, color: TOKENS.colors.textSecondary }}>
                      {formatCookTime(recipe.cookTimeMinutes)}
                    </Text>
                  </View>
                </View>
                <View style={{ justifyContent: 'center', paddingRight: 12 }}>
                  <ChevronRight size={16} color={TOKENS.colors.textMuted} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    );
  }

  // Default: ingredient selection
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
      <StepIndicator current={0} total={3} />

      <AiBubble
        text={urgent.length > 0
          ? `You have ${urgent.length} items expiring soon. Which ones do you want to cook with?`
          : "Let me know what ingredients you want to use and I'll find the perfect recipe."
        }
      />

      {/* Expiring ingredient chips */}
      {urgent.length > 0 && (
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {urgent.map((item) => {
              const days = getDaysUntilExpiry(item.expiryDate ?? '');
              const isSelected = selectedIngredients.includes(item.name);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleIngredient(item.name)}
                  accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${item.name}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: isSelected ? TOKENS.colors.primaryMuted : TOKENS.colors.white,
                    borderWidth: 1,
                    borderColor: isSelected ? TOKENS.colors.primary : TOKENS.colors.borderLight,
                  }}
                >
                  {isSelected && <Check size={14} color={TOKENS.colors.primary} />}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? TOKENS.colors.primary : TOKENS.colors.text,
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: days <= 2 ? TOKENS.colors.error : TOKENS.colors.warning,
                    }}
                  >
                    {days}d
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      )}

      {/* Other pantry items */}
      {items.filter((i) => !urgent.some((u) => u.id === i.id)).length > 0 && (
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: TOKENS.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Other ingredients
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {items.filter((i) => !urgent.some((u) => u.id === i.id)).slice(0, 8).map((item) => {
              const isSelected = selectedIngredients.includes(item.name);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleIngredient(item.name)}
                  accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${item.name}`}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: isSelected ? TOKENS.colors.primaryMuted : TOKENS.colors.white,
                    borderWidth: 1,
                    borderColor: isSelected ? TOKENS.colors.primary : TOKENS.colors.borderLight,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? TOKENS.colors.primary : TOKENS.colors.text,
                    }}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      )}

      <CtaButton
        label={selectedIngredients.length > 0 ? `Find recipes with ${selectedIngredients.length} items` : 'Find any recipe'}
        onPress={handleFindRecipes}
      />
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════
// MEAL PLANNER FLOW
// Step 0: Configure (budget, # days, preferences)
// Step 1: "Planning..." then show week plan
// Step 2: Confirm — add missing items to grocery
// ═══════════════════════════════════════════════════════════

function MealPlannerFlow({ step, onNext }: { step: number; onNext: () => void }) {
  const recipes = useRecipeStore((s) => s.saved);
  const router = useRouter();
  const [budget, setBudget] = useState<number>(80);
  const [days, setDays] = useState(7);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planReady, setPlanReady] = useState(false);

  const budgetOptions = [40, 60, 80, 100];
  const dayOptions = [3, 5, 7];

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Mock plan: assign recipes to days
  const plan = dayLabels.slice(0, days).map((day, i) => ({
    day,
    recipe: recipes[i % recipes.length],
  }));

  const handleGenerate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPlanning(true);
    setTimeout(() => {
      setIsPlanning(false);
      setPlanReady(true);
    }, 2000);
  };

  if (step === 0 && !isPlanning && !planReady) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <StepIndicator current={0} total={3} />

        <AiBubble text="Let me plan your meals! Set your budget and how many days you want covered." />

        {/* Budget selector */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: TOKENS.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Weekly budget
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {budgetOptions.map((b) => (
              <TouchableOpacity
                key={b}
                onPress={() => setBudget(b)}
                accessibilityLabel={`Set budget to $${b}`}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: budget === b ? TOKENS.colors.primary : TOKENS.colors.white,
                  borderWidth: budget === b ? 0 : 1,
                  borderColor: TOKENS.colors.borderLight,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: budget === b ? TOKENS.colors.white : TOKENS.colors.text,
                  }}
                >
                  ${b}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Days selector */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: TOKENS.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Number of days
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28 }}>
            {dayOptions.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDays(d)}
                accessibilityLabel={`Plan for ${d} days`}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: days === d ? TOKENS.colors.primary : TOKENS.colors.white,
                  borderWidth: days === d ? 0 : 1,
                  borderColor: TOKENS.colors.borderLight,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: days === d ? TOKENS.colors.white : TOKENS.colors.text,
                  }}
                >
                  {d} days
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <CtaButton label={`Plan ${days} days for $${budget}`} onPress={handleGenerate} />
      </ScrollView>
    );
  }

  if (isPlanning) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <StepIndicator current={1} total={3} />
        <TypingDots />
        <AiBubble text={`Planning ${days} days under $${budget}... Using up expiring items first.`} delay={500} />
      </View>
    );
  }

  if (planReady || step >= 1) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <StepIndicator current={2} total={3} />

        <AiBubble text={`Your ${days}-day plan is ready! I prioritized expiring ingredients and kept it under $${budget}.`} />

        <View style={{ gap: 8, marginBottom: 20 }}>
          {plan.map(({ day, recipe }, idx) => (
            <Animated.View key={day} entering={FadeInDown.delay(200 + idx * 80).springify()}>
              <TouchableOpacity
                onPress={() => recipe && router.push(`/recipe/${recipe.id}`)}
                accessibilityLabel={`${day}: ${recipe?.title ?? 'No recipe'}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: TOKENS.colors.white,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: TOKENS.colors.borderLight,
                }}
              >
                <View
                  style={{
                    width: 40,
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: TOKENS.colors.primary }}>
                    {day}
                  </Text>
                </View>
                {recipe?.imageUri ? (
                  <Image source={{ uri: recipe.imageUri }} style={{ width: 44, height: 44, borderRadius: 10, marginRight: 10 }} />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '600', color: TOKENS.colors.text }}>
                    {recipe?.title ?? 'Rest day'}
                  </Text>
                  {recipe && (
                    <Text style={{ fontSize: 12, color: TOKENS.colors.textSecondary, marginTop: 2 }}>
                      {formatCookTime(recipe.cookTimeMinutes)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <CtaButton label="Add missing items to grocery" onPress={onNext} />
        <View style={{ height: 8 }} />
        <CtaButton label="Regenerate plan" onPress={handleGenerate} variant="secondary" />
      </ScrollView>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
// SMART GROCERY FLOW
// Step 0: Show pantry gaps + expiring items
// Step 1: AI-built grocery list
// Step 2: Confirm + send to store
// ═══════════════════════════════════════════════════════════

function SmartGroceryFlow({ step, onNext }: { step: number; onNext: () => void }) {
  const { items, expiringItems } = usePantry();
  const groceryItems = useGroceryStore((s) => s.items);
  const router = useRouter();
  const [isBuilding, setIsBuilding] = useState(false);
  const [listReady, setListReady] = useState(false);

  const unchecked = groceryItems.filter((i) => !i.checked);

  // Mock suggested items based on common staples missing from pantry
  const pantryNames = items.map((i) => i.name.toLowerCase());
  const suggestions = [
    'Olive oil', 'Garlic', 'Onions', 'Rice', 'Salt', 'Eggs', 'Butter', 'Milk',
  ].filter((s) => !pantryNames.includes(s.toLowerCase())).slice(0, 5);

  const handleBuildList = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsBuilding(true);
    setTimeout(() => {
      setIsBuilding(false);
      setListReady(true);
    }, 1800);
  };

  if (step === 0 && !isBuilding && !listReady) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <StepIndicator current={0} total={3} />

        <AiBubble text={`You have ${items.length} items in your pantry. Let me find what's missing and build a smart list.`} />

        {/* Current pantry summary */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View
            style={{
              backgroundColor: TOKENS.colors.white,
              borderRadius: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: TOKENS.colors.borderLight,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: TOKENS.colors.text }}>{items.length}</Text>
                <Text style={{ fontSize: 12, color: TOKENS.colors.textSecondary }}>In pantry</Text>
              </View>
              <View style={{ width: 1, backgroundColor: TOKENS.colors.borderLight }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: TOKENS.colors.warning }}>{expiringItems.length}</Text>
                <Text style={{ fontSize: 12, color: TOKENS.colors.textSecondary }}>Expiring</Text>
              </View>
              <View style={{ width: 1, backgroundColor: TOKENS.colors.borderLight }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: TOKENS.colors.primary }}>{unchecked.length}</Text>
                <Text style={{ fontSize: 12, color: TOKENS.colors.textSecondary }}>On list</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* What's missing */}
        {suggestions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: TOKENS.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Common staples you might need
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {suggestions.map((item) => (
                <View
                  key={item}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: TOKENS.colors.warningLight,
                  }}
                >
                  <AlertTriangle size={12} color={TOKENS.colors.warning} />
                  <Text style={{ fontSize: 13, color: TOKENS.colors.text }}>{item}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <CtaButton label="Build smart grocery list" onPress={handleBuildList} />
      </ScrollView>
    );
  }

  if (isBuilding) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <StepIndicator current={1} total={3} />
        <TypingDots />
        <AiBubble text="Analyzing your pantry and recent meals..." delay={500} />
      </View>
    );
  }

  if (listReady || step >= 1) {
    const allItems = [...suggestions.map((name) => ({ name, isNew: true })), ...unchecked.map((i) => ({ name: i.name, isNew: false }))];

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <StepIndicator current={2} total={3} />

        <AiBubble text={`Here's your optimized list — ${allItems.length} items. I added staples you're running low on.`} />

        <View
          style={{
            backgroundColor: TOKENS.colors.white,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: TOKENS.colors.borderLight,
            marginBottom: 20,
            gap: 4,
          }}
        >
          {allItems.map((item, i) => (
            <Animated.View key={`${item.name}-${i}`} entering={FadeInDown.delay(150 + i * 50).springify()}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 10,
                  borderBottomWidth: i < allItems.length - 1 ? 1 : 0,
                  borderBottomColor: TOKENS.colors.borderLight,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    borderWidth: 1.5,
                    borderColor: TOKENS.colors.border,
                  }}
                />
                <Text style={{ flex: 1, fontSize: 15, color: TOKENS.colors.text }}>{item.name}</Text>
                {item.isNew && (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                      backgroundColor: TOKENS.colors.primaryMuted,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '600', color: TOKENS.colors.primary }}>NEW</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          ))}
        </View>

        <CtaButton label="Add all to grocery list" onPress={() => router.push('/(tabs)/grocery')} />
      </ScrollView>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
// SAVINGS COACH FLOW
// Step 0: Show savings overview + stats
// Step 1: Tips to reduce waste
// Step 2: Share your progress
// ═══════════════════════════════════════════════════════════

function SavingsCoachFlow({ step, onNext }: { step: number; onNext: () => void }) {
  const savings = useSavingsStore();
  const [showTips, setShowTips] = useState(false);

  const usedCount = savings.wasteLog.filter((e) => e.action === 'used').length;
  const tossedCount = savings.wasteLog.filter((e) => e.action === 'tossed').length;
  const savingsRate = usedCount + tossedCount > 0
    ? Math.round((usedCount / (usedCount + tossedCount)) * 100)
    : 100;

  const tips = [
    { title: 'FIFO your fridge', desc: 'Move older items to the front so you use them first.' },
    { title: 'Freeze before it expires', desc: 'Most proteins and breads freeze well for weeks.' },
    { title: 'Batch cook on Sundays', desc: 'Use expiring veggies in soups or stir-fries for the week.' },
    { title: 'Check your pantry before shopping', desc: 'Avoid buying duplicates of what you already have.' },
  ];

  if (step === 0 && !showTips) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <StepIndicator current={0} total={2} />

        <AiBubble
          text={savingsRate >= 80
            ? `Amazing! You're saving ${savingsRate}% of your food. Here's your breakdown.`
            : `You're saving ${savingsRate}% of your food. Let's get that higher — here's where you stand.`
          }
        />

        {/* Stats cards */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View
            style={{
              backgroundColor: TOKENS.colors.white,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: TOKENS.colors.borderLight,
              marginBottom: 12,
            }}
          >
            {/* Main savings */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 40, fontWeight: '700', color: TOKENS.colors.accent }}>
                ${savings.totalSavedThisMonth.toFixed(0)}
              </Text>
              <Text style={{ fontSize: 14, color: TOKENS.colors.textSecondary, marginTop: 2 }}>
                saved this month
              </Text>
            </View>

            {/* Stat row */}
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: TOKENS.colors.success }}>{usedCount}</Text>
                <Text style={{ fontSize: 12, color: TOKENS.colors.textSecondary }}>Items used</Text>
              </View>
              <View style={{ width: 1, backgroundColor: TOKENS.colors.borderLight }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: TOKENS.colors.error }}>{tossedCount}</Text>
                <Text style={{ fontSize: 12, color: TOKENS.colors.textSecondary }}>Items wasted</Text>
              </View>
              <View style={{ width: 1, backgroundColor: TOKENS.colors.borderLight }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: TOKENS.colors.primary }}>{savingsRate}%</Text>
                <Text style={{ fontSize: 12, color: TOKENS.colors.textSecondary }}>Save rate</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* All-time */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: TOKENS.colors.primaryMuted,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View>
              <Text style={{ fontSize: 13, color: TOKENS.colors.textSecondary }}>All-time savings</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: TOKENS.colors.primary, marginTop: 2 }}>
                ${savings.totalSavedAllTime.toFixed(0)}
              </Text>
            </View>
            <TrendingUp size={24} color={TOKENS.colors.primary} />
          </View>
        </Animated.View>

        {/* vs last month */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: TOKENS.colors.accentLight,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <View>
              <Text style={{ fontSize: 13, color: TOKENS.colors.textSecondary }}>vs. last month</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: TOKENS.colors.accent, marginTop: 2 }}>
                {savings.totalSavedThisMonth >= savings.lastMonthSaved ? '+' : ''}
                ${(savings.totalSavedThisMonth - savings.lastMonthSaved).toFixed(0)}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: TOKENS.colors.textSecondary }}>
              Last month: ${savings.lastMonthSaved.toFixed(0)}
            </Text>
          </View>
        </Animated.View>

        <CtaButton label="Show me tips to save more" onPress={() => setShowTips(true)} />
      </ScrollView>
    );
  }

  // Tips view
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
      <StepIndicator current={1} total={2} />

      <AiBubble text="Here are my top tips based on your usage patterns:" />

      <View style={{ gap: 10, marginBottom: 24 }}>
        {tips.map((tip, idx) => (
          <Animated.View key={tip.title} entering={FadeInDown.delay(200 + idx * 100).springify()}>
            <View
              style={{
                backgroundColor: TOKENS.colors.white,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: TOKENS.colors.borderLight,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: TOKENS.colors.text, marginBottom: 4 }}>
                {tip.title}
              </Text>
              <Text style={{ fontSize: 13, lineHeight: 19, color: TOKENS.colors.textSecondary }}>
                {tip.desc}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <AiBubble text="Keep using items before they expire and you'll easily save $200+ this month!" delay={600} />
    </ScrollView>
  );
}
