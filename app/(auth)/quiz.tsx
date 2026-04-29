import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../stores/userStore';
import { TOKENS } from '../../lib/tokens';
import { COPY } from '../../lib/copy';
import type { DietaryTag } from '../../types';

const ALL_TAGS: DietaryTag[] = [
  'vegan', 'vegetarian', 'gluten-free', 'dairy-free',
  'keto', 'paleo', 'nut-free', 'low-carb', 'high-protein', 'mediterranean',
];

export default function QuizScreen() {
  const router = useRouter();
  const { user, updatePreferences, setPendingPreferences } = useUserStore();

  const [selectedTags, setSelectedTags] = useState<DietaryTag[]>([]);
  const [saving, setSaving] = useState(false);

  const noneActive = selectedTags.length === 0;

  const toggleTag = (tag: DietaryTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (user) {
        // Already authenticated (same-device new account) — save prefs, go to tabs
        await updatePreferences({ dietaryTags: selectedTags });
        router.replace('/(tabs)');
      } else {
        setPendingPreferences({ dietaryTags: selectedTags, householdSize: 2 });
        router.push('/(auth)/signin');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        style={{ padding: 16 }}
      >
        <ChevronLeft size={24} color={TOKENS.colors.text} />
      </TouchableOpacity>

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8 }}>
        <Text style={{ fontSize: TOKENS.typography.sizes['2xl'], fontWeight: TOKENS.typography.weights.bold, color: TOKENS.colors.text, marginBottom: 8 }}>
          {COPY.quiz.title}
        </Text>
        <Text style={{ fontSize: TOKENS.typography.sizes.md, color: TOKENS.colors.textSecondary, marginBottom: 24 }}>
          {COPY.quiz.subtitle}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
          {/* None pill — visually selected when nothing else is chosen */}
          <TouchableOpacity
            onPress={() => setSelectedTags([])}
            accessibilityLabel="No dietary restrictions"
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: noneActive ? TOKENS.colors.primaryMuted : TOKENS.colors.inputBg,
              borderWidth: noneActive ? 2 : 0,
              borderColor: TOKENS.colors.primary,
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: noneActive ? TOKENS.colors.primary : TOKENS.colors.textSecondary,
            }}>
              {COPY.quiz.noneTag}
            </Text>
          </TouchableOpacity>

          {ALL_TAGS.map((tag) => {
            const selected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
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
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: selected ? TOKENS.colors.primary : TOKENS.colors.textSecondary,
                  textTransform: 'capitalize',
                }}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          label={COPY.quiz.continueBtn}
          onPress={handleFinish}
          loading={saving}
          variant="primary"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}
