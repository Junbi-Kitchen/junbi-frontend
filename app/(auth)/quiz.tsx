// Purpose: 2-step quiz collecting dietary preferences and household size before or after signup.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { StepperInput } from '../../components/ui/StepperInput';
import { useUserStore } from '../../stores/userStore';
import { TOKENS } from '../../lib/tokens';
import type { DietaryTag } from '../../types';

const ALL_TAGS: DietaryTag[] = [
  'vegan', 'vegetarian', 'gluten-free', 'dairy-free',
  'keto', 'paleo', 'nut-free', 'low-carb', 'high-protein', 'mediterranean',
];

export default function QuizScreen() {
  const router = useRouter();
  const { user, updatePreferences, setPendingPreferences } = useUserStore();

  const [step, setStep] = useState<0 | 1>(0);
  const [selectedTags, setSelectedTags] = useState<DietaryTag[]>([]);
  const [householdSize, setHouseholdSize] = useState(2);
  const [saving, setSaving] = useState(false);

  const progressWidth = useSharedValue(50);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` }));

  const goNext = () => {
    setStep(1);
    progressWidth.value = withTiming(100, { duration: 400 });
  };

  const goBack = () => {
    if (step === 1) {
      setStep(0);
      progressWidth.value = withTiming(50, { duration: 400 });
    } else {
      router.back();
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (user) {
        // Already authenticated (same-device new account) — save prefs, go to tabs
        await updatePreferences({ dietaryTags: selectedTags, householdSize });
        router.replace('/(tabs)');
      } else {
        // Pre-auth — stash prefs in Zustand, navigate to signup
        setPendingPreferences({ dietaryTags: selectedTags, householdSize });
        router.push('/(auth)/signin');
      }
    } finally {
      setSaving(false);
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
      <TouchableOpacity
        onPress={goBack}
        accessibilityLabel="Go back"
        style={{ padding: 16 }}
      >
        <ChevronLeft size={24} color={TOKENS.colors.text} />
      </TouchableOpacity>

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8 }}>
        {/* Step 0: Dietary Preferences */}
        {step === 0 && (
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: TOKENS.typography.sizes['2xl'], fontWeight: TOKENS.typography.weights.bold, color: TOKENS.colors.text, marginBottom: 8 }}>
              Dietary Preferences
            </Text>
            <Text style={{ fontSize: TOKENS.typography.sizes.md, color: TOKENS.colors.textSecondary, marginBottom: 24 }}>
              Select all that apply — we'll tailor your recipe feed.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
              {ALL_TAGS.map((tag) => {
                const selected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() =>
                      setSelectedTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )
                    }
                    accessibilityLabel={`${selected ? 'Deselect' : 'Select'} ${tag}`}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: selected ? TOKENS.colors.primaryMuted : TOKENS.colors.inputBg,
                      borderWidth: selected ? 2 : 0,
                      borderColor: TOKENS.colors.primary,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: selected ? TOKENS.colors.primary : TOKENS.colors.textSecondary,
                        textTransform: 'capitalize',
                      }}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Button label="Continue" onPress={goNext} variant="primary" fullWidth />
          </View>
        )}

        {/* Step 1: Household Size */}
        {step === 1 && (
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
            <Button
              label="Finish setup"
              onPress={handleFinish}
              loading={saving}
              variant="primary"
              fullWidth
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
