// Purpose: Horizontal scrollable dietary tag row with optional selection state

import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { DietaryTag } from '../../types';

interface DietaryTagRowProps {
  tags: DietaryTag[];
  onTagPress?: (tag: DietaryTag) => void;
  selectedTags?: DietaryTag[];
}

export function DietaryTagRow({
  tags,
  onTagPress,
  selectedTags = [],
}: DietaryTagRowProps) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
    >
      {tags.map((tag) => {
        const isSelected = !onTagPress || selectedTags.includes(tag);
        const dimmed = onTagPress && !isSelected && selectedTags.length > 0;
        return (
          <TouchableOpacity
            key={tag}
            onPress={() => onTagPress?.(tag)}
            accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${tag}`}
            disabled={!onTagPress}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: isSelected ? colors.primary : colors.inputBg,
              opacity: dimmed ? 0.45 : 1,
            }}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: isSelected ? '#fff' : colors.textSecondary,
              textTransform: 'capitalize',
            }}>
              {tag}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
