// Purpose: 4-step onboarding flow with animated progress bar and preference setup

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { ChevronLeft, UtensilsCrossed } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { StepperInput } from '../../components/ui/StepperInput';
import { DietaryTagRow } from '../../components/recipe/DietaryTagRow';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { useUserStore } from '../../stores/userStore';
import { TOKENS } from '../../lib/tokens';
import type { DietaryTag } from '../../types';

const ALL_TAGS: DietaryTag[] = [
  'vegan', 'vegetarian', 'gluten-free', 'dairy-free',
  'keto', 'paleo', 'nut-free', 'low-carb', 'high-protein', 'mediterranean',
];

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useUserStore();
  const { updateDietaryTags, updateHouseholdSize, connectAccount, isConnected, preferences } =
    useUserPreferences();

  const [step, setStep] = useState(0);
  const [selectedTags, setSelectedTags] = useState<DietaryTag[]>([]);
  const [householdSize, setHouseholdSize] = useState(2);

  const progressWidth = useSharedValue((1 / TOTAL_STEPS) * 100);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      const next = step + 1;
      setStep(next);
      progressWidth.value = withTiming(((next + 1) / TOTAL_STEPS) * 100, {
        duration: 400,
      });
    } else {
      updateDietaryTags(selectedTags);
      updateHouseholdSize(householdSize);
      completeOnboarding();
      router.replace('/(tabs)');
    }
  };

  const goBack = () => {
    if (step > 0) {
      const prev = step - 1;
      setStep(prev);
      progressWidth.value = withTiming(((prev + 1) / TOTAL_STEPS) * 100, {
        duration: 400,
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      {/* Progress bar */}
      <View style={{ height: 3, backgroundColor: TOKENS.colors.border }}>
        <Animated.View
          style={[
            { height: 3, backgroundColor: TOKENS.colors.primary, borderRadius: 2 },
            progressStyle,
          ]}
        />
      </View>

      {/* Back button */}
      {step > 0 && (
        <TouchableOpacity
          onPress={goBack}
          accessibilityLabel="Go back"
          style={{ padding: 16 }}
        >
          <ChevronLeft size={24} color={TOKENS.colors.text} />
        </TouchableOpacity>
      )}

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: step === 0 ? 48 : 16 }}>
        {/* Step 0: Welcome */}
        {step === 0 && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                backgroundColor: TOKENS.colors.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
              }}
            >
              <UtensilsCrossed size={48} color={TOKENS.colors.primary} />
            </View>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes['3xl'],
                fontWeight: TOKENS.typography.weights.bold,
                color: TOKENS.colors.text,
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              Welcome to Gook
            </Text>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.lg,
                color: TOKENS.colors.textSecondary,
                textAlign: 'center',
                lineHeight: 28,
                marginBottom: 48,
              }}
            >
              Import recipes, track your pantry, and get AI-powered meal suggestions delivered to your door.
            </Text>
            <Button label="Let's get started" onPress={goNext} variant="primary" size="lg" fullWidth />
          </View>
        )}

        {/* Step 1: Dietary Preferences */}
        {step === 1 && (
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: TOKENS.typography.sizes['2xl'], fontWeight: TOKENS.typography.weights.bold, color: TOKENS.colors.text, marginBottom: 8 }}>
              Dietary Preferences
            </Text>
            <Text style={{ fontSize: TOKENS.typography.sizes.md, color: TOKENS.colors.textSecondary, marginBottom: 24 }}>
              Select all that apply — we'll tailor your recipe feed.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
              {ALL_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() =>
                    setSelectedTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                    )
                  }
                  accessibilityLabel={`${selectedTags.includes(tag) ? 'Deselect' : 'Select'} ${tag}`}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: selectedTags.includes(tag)
                      ? TOKENS.colors.primaryMuted
                      : TOKENS.colors.inputBg,
                    borderWidth: selectedTags.includes(tag) ? 2 : 0,
                    borderColor: TOKENS.colors.primary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: selectedTags.includes(tag)
                        ? TOKENS.colors.primary
                        : TOKENS.colors.textSecondary,
                      textTransform: 'capitalize',
                    }}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button label="Continue" onPress={goNext} variant="primary" fullWidth />
          </View>
        )}

        {/* Step 2: Household Size */}
        {step === 2 && (
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: TOKENS.typography.sizes['2xl'], fontWeight: TOKENS.typography.weights.bold, color: TOKENS.colors.text, marginBottom: 8 }}>
              Household Size
            </Text>
            <Text style={{ fontSize: TOKENS.typography.sizes.md, color: TOKENS.colors.textSecondary, marginBottom: 48 }}>
              How many people do you cook for? We'll adjust serving sizes.
            </Text>
            <View style={{ alignItems: 'center', marginBottom: 48 }}>
              <StepperInput
                value={householdSize}
                onChange={setHouseholdSize}
                min={1}
                max={8}
                unit="people"
              />
            </View>
            <Button label="Continue" onPress={goNext} variant="primary" fullWidth />
          </View>
        )}

        {/* Step 3: Connect Accounts */}
        {step === 3 && (
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: TOKENS.typography.sizes['2xl'], fontWeight: TOKENS.typography.weights.bold, color: TOKENS.colors.text, marginBottom: 8 }}>
              Connect Accounts
            </Text>
            <Text style={{ fontSize: TOKENS.typography.sizes.md, color: TOKENS.colors.textSecondary, marginBottom: 32 }}>
              Import recipes directly from your social feeds.
            </Text>

            {(['instagram', 'tiktok'] as const).map((platform) => (
              <View
                key={platform}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: TOKENS.colors.inputBg,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: TOKENS.typography.sizes.md,
                    fontWeight: TOKENS.typography.weights.semibold,
                    color: TOKENS.colors.text,
                    textTransform: 'capitalize',
                  }}
                >
                  {platform}
                </Text>
                <Switch
                  value={isConnected(platform)}
                  onValueChange={(val) => {
                    if (val) {
                      connectAccount(platform, `@user.${platform}`);
                    }
                  }}
                  trackColor={{
                    false: TOKENS.colors.border,
                    true: TOKENS.colors.primaryLight,
                  }}
                  thumbColor={
                    isConnected(platform)
                      ? TOKENS.colors.primary
                      : TOKENS.colors.white
                  }
                />
              </View>
            ))}

            <View style={{ marginTop: 32, gap: 12 }}>
              <Button label="Enter the app" onPress={goNext} variant="primary" fullWidth />
              <Button label="Skip for now" onPress={goNext} variant="ghost" fullWidth />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
