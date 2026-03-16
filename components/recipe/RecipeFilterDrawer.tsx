// Purpose: Bottom sheet filter panel for dietary tags, cuisine, cook time, and difficulty

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { TOKENS } from '../../lib/tokens';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getTagColor, getTagTextColor } from '../../lib/utils';
import type { DietaryTag } from '../../types';

const ALL_TAGS: DietaryTag[] = [
  'vegan', 'vegetarian', 'gluten-free', 'dairy-free',
  'keto', 'paleo', 'nut-free', 'low-carb', 'high-protein', 'mediterranean',
];

const CUISINES = ['Italian', 'Asian', 'Mexican', 'Mediterranean', 'American', 'Indian', 'French'];
const COOK_TIMES = ['< 15 min', '< 30 min', '< 60 min', 'Any'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

interface RecipeFilterDrawerProps {
  selectedFilters: DietaryTag[];
  onApply: (filters: DietaryTag[]) => void;
  onClose: () => void;
}

export function RecipeFilterDrawer({
  selectedFilters,
  onApply,
  onClose,
}: RecipeFilterDrawerProps) {
  const [tags, setTags] = useState<DietaryTag[]>(selectedFilters);
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [cookTime, setCookTime] = useState<string>('Any');
  const [difficulty, setDifficulty] = useState<string | null>(null);

  const toggleTag = (tag: DietaryTag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ fontSize: TOKENS.typography.sizes.xl, fontWeight: TOKENS.typography.weights.bold, color: TOKENS.colors.text, marginBottom: 20 }}>
        Filter Recipes
      </Text>

      {/* Dietary */}
      <SectionLabel>Dietary</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {ALL_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            onPress={() => toggleTag(tag)}
            accessibilityLabel={`${tags.includes(tag) ? 'Remove' : 'Add'} ${tag} filter`}
            style={{
              borderRadius: 999,
              borderWidth: tags.includes(tag) ? 2 : 0,
              borderColor: TOKENS.colors.primary,
            }}
          >
            <Badge label={tag} variant="dietary" tag={tag} size="sm" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Cuisine */}
      <SectionLabel>Cuisine</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {CUISINES.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCuisine(cuisine === c ? null : c)}
            accessibilityLabel={`${cuisine === c ? 'Remove' : 'Select'} ${c} cuisine`}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: cuisine === c ? TOKENS.colors.primaryMuted : TOKENS.colors.inputBg,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: cuisine === c ? TOKENS.colors.primary : TOKENS.colors.textSecondary }}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Cook Time */}
      <SectionLabel>Cook Time</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {COOK_TIMES.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setCookTime(t)}
            accessibilityLabel={`Filter by ${t} cook time`}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: cookTime === t ? TOKENS.colors.primaryMuted : TOKENS.colors.inputBg,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: cookTime === t ? TOKENS.colors.primary : TOKENS.colors.textSecondary }}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Difficulty */}
      <SectionLabel>Difficulty</SectionLabel>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
        {DIFFICULTIES.map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setDifficulty(difficulty === d ? null : d)}
            accessibilityLabel={`Filter by ${d} difficulty`}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: difficulty === d ? TOKENS.colors.primaryMuted : TOKENS.colors.inputBg,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: difficulty === d ? TOKENS.colors.primary : TOKENS.colors.textSecondary, textTransform: 'capitalize' }}>
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button
            label="Reset"
            variant="ghost"
            onPress={() => {
              setTags([]);
              setCuisine(null);
              setCookTime('Any');
              setDifficulty(null);
            }}
          />
        </View>
        <View style={{ flex: 2 }}>
          <Button
            label="Apply Filters"
            variant="primary"
            onPress={() => {
              onApply(tags);
              onClose();
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: TOKENS.typography.sizes.sm, fontWeight: TOKENS.typography.weights.semibold, color: TOKENS.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
      {children}
    </Text>
  );
}
