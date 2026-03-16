// Purpose: Horizontal scrollable dietary tag row with optional selection state

import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
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
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
    >
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <TouchableOpacity
            key={tag}
            onPress={() => onTagPress?.(tag)}
            accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${tag}`}
            disabled={!onTagPress}
            style={{
              opacity: onTagPress && !isSelected && selectedTags.length > 0 ? 0.5 : 1,
              borderWidth: isSelected ? 2 : 0,
              borderColor: '#2D6A4F',
              borderRadius: 999,
            }}
          >
            <Badge label={tag} variant="dietary" tag={tag} size="sm" />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
