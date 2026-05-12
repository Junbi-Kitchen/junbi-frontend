// Purpose: Full-screen swipeable recipe card for the feed with gradient overlay and badges

import React from 'react';
import { View, Text, Image, Dimensions, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Instagram, Play, Globe, PenLine, Youtube } from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import { truncate, formatCookTime } from '../../lib/utils';
import { TOKENS } from '../../lib/tokens';
import type { Recipe } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SOURCE_ICONS = {
  instagram: Instagram,
  tiktok: Play,
  youtube: Youtube,
  url: Globe,
  manual: PenLine,
};

interface RecipeCardProps {
  recipe: Recipe;
  style?: object;
  onPress: () => void;
  pantryMatchPercent?: number;
}

export function RecipeCard({
  recipe,
  style,
  onPress,
  pantryMatchPercent,
}: RecipeCardProps) {
  const SourceIcon = SOURCE_ICONS[recipe.importedFrom];

  return (
    <Animated.View
      style={[
        {
          width: SCREEN_WIDTH - 32,
          height: SCREEN_HEIGHT * 0.65,
          borderRadius: 24,
          overflow: 'hidden',
          position: 'absolute',
          alignSelf: 'center',
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.95}
        accessibilityLabel={`View recipe: ${recipe.title}`}
        style={{ flex: 1 }}
      >
        <Image
          source={{ uri: recipe.imageUri }}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          resizeMode="cover"
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '60%',
          }}
        />

        {/* Top-left: Pantry match badge */}
        {pantryMatchPercent !== undefined && pantryMatchPercent >= 60 && (
          <View style={{ position: 'absolute', top: 16, left: 16 }}>
            <Badge
              label={`${pantryMatchPercent}% in pantry`}
              variant="success"
              size="sm"
            />
          </View>
        )}

        {/* Top-right: Source badge */}
        <View
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 20,
            padding: 8,
          }}
        >
          <SourceIcon size={16} color="#FFFFFF" />
        </View>

        {/* Bottom content */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 }}>
          {/* Tags */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {recipe.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} label={tag} variant="dietary" tag={tag} size="sm" />
            ))}
          </View>

          {/* Title */}
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: TOKENS.typography.sizes['2xl'],
              fontWeight: TOKENS.typography.weights.bold,
              marginBottom: 8,
            }}
          >
            {truncate(recipe.title, 40)}
          </Text>

          {/* Macro chips */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <MacroChip label={`${recipe.nutrition.calories} cal`} />
            <MacroChip label={`${recipe.nutrition.proteinG}g protein`} />
            <MacroChip label={formatCookTime(recipe.cookTimeMinutes)} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function MacroChip({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}
