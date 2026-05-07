import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useUserStore } from '../../stores/userStore';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import { COPY } from '../../lib/copy';
import type { DietaryTag } from '../../types';

const ALL_TAGS: DietaryTag[] = [
  'vegan', 'vegetarian', 'gluten-free', 'dairy-free',
  'keto', 'paleo', 'nut-free', 'low-carb', 'high-protein', 'mediterranean',
];

export default function QuizScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updatePreferences, updateProfile, setPendingPreferences } = useUserStore();

  const [name, setName] = useState('');
  const [selectedTag, setSelectedTag] = useState<DietaryTag | null>(null);
  const [saving, setSaving] = useState(false);

  const selectTag = async (tag: DietaryTag) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTag((prev) => (prev === tag ? null : tag));
  };

  const handleFinish = async () => {
    setSaving(true);
    const dietaryTags: DietaryTag[] = selectedTag ? [selectedTag] : [];
    try {
      if (user) {
        await updatePreferences({ dietaryTags });
        if (name.trim()) await updateProfile({ name: name.trim() });
        router.replace('/(tabs)');
      } else {
        setPendingPreferences({ dietaryTags, householdSize: 2, name: name.trim() || undefined });
        router.push('/(auth)/signin');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        style={{ padding: 16 }}
      >
        <ChevronLeft size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8 }}>
        <Text style={{ fontSize: TOKENS.typography.sizes['2xl'], fontWeight: TOKENS.typography.weights.bold, color: colors.text, marginBottom: 8 }}>
          {COPY.quiz.title}
        </Text>
        <Text style={{ fontSize: TOKENS.typography.sizes.md, color: colors.textSecondary, marginBottom: 28 }}>
          {COPY.quiz.subtitle}
        </Text>

        {/* Name */}
        <Text style={{ fontSize: TOKENS.typography.sizes.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          Your name
        </Text>
        <View style={{ marginBottom: 28 }}>
          <Input
            placeholder="e.g. Alex"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        {/* Dietary preference — single select */}
        <Text style={{ fontSize: TOKENS.typography.sizes.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
          Dietary preference
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
          <TouchableOpacity
            onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedTag(null); }}
            accessibilityLabel="No dietary restrictions"
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: selectedTag === null ? colors.primary : colors.inputBg,
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: selectedTag === null ? '#fff' : colors.textSecondary,
            }}>
              {COPY.quiz.noneTag}
            </Text>
          </TouchableOpacity>

          {ALL_TAGS.map((tag) => {
            const selected = selectedTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => selectTag(tag)}
                accessibilityLabel={`${selected ? 'Deselect' : 'Select'} ${tag}`}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: selected ? colors.primary : colors.inputBg,
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: selected ? '#fff' : colors.textSecondary,
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
