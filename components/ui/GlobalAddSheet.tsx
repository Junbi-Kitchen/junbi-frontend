// Purpose: Global add-action sheet opened from the center tab button

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Camera, PenLine, Link, ScanLine, BookOpen, ImagePlus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';

export type AddAction = 'receipt' | 'ingredient' | 'import' | 'fridge' | 'create-recipe' | 'scan-recipe';

interface GlobalAddSheetProps {
  onSelect: (action: AddAction) => void;
}

type OptionDef = {
  id: AddAction;
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  description: string;
};

const PANTRY_OPTIONS: OptionDef[] = [
  { id: 'receipt', icon: Camera, label: 'Scan Receipt', description: 'Add pantry items from a receipt photo' },
  { id: 'ingredient', icon: PenLine, label: 'Add Ingredient', description: 'Manually add a single pantry item' },
  { id: 'fridge', icon: ScanLine, label: 'Scan Fridge', description: 'Photograph your fridge to log everything' },
];

const RECIPE_OPTIONS: OptionDef[] = [
  { id: 'import', icon: Link, label: 'Import from YouTube', description: 'Paste a YouTube URL to import a recipe' },
  { id: 'create-recipe', icon: BookOpen, label: 'Create Recipe', description: 'Write a recipe from scratch' },
  { id: 'scan-recipe', icon: ImagePlus, label: 'Scan a Recipe', description: 'Take a photo of any printed recipe' },
];

function Section({ title, options, onSelect, colors }: {
  title: string;
  options: OptionDef[];
  onSelect: (action: AddAction) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{
        fontSize: TOKENS.typography.sizes.xs,
        fontWeight: TOKENS.typography.weights.semibold,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
      }}>
        {title}
      </Text>
      {options.map(({ id, icon: Icon, label, description }, idx) => (
        <TouchableOpacity
          key={id}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(id);
          }}
          accessibilityLabel={label}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            paddingVertical: 12,
            borderBottomWidth: idx < options.length - 1 ? 1 : 0,
            borderBottomColor: colors.borderLight,
          }}
        >
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: TOKENS.typography.sizes.md,
              fontWeight: TOKENS.typography.weights.semibold,
              color: colors.text,
            }}>
              {label}
            </Text>
            <Text style={{
              fontSize: TOKENS.typography.sizes.sm,
              color: colors.textSecondary,
              marginTop: 1,
            }}>
              {description}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function GlobalAddSheet({ onSelect }: GlobalAddSheetProps) {
  const { colors } = useTheme();

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 }}>
      <Text style={{
        fontSize: TOKENS.typography.sizes.xl,
        fontWeight: TOKENS.typography.weights.bold,
        color: colors.text,
        marginBottom: 16,
      }}>
        Add
      </Text>
      <Section title="Recipes" options={RECIPE_OPTIONS} onSelect={onSelect} colors={colors} />
      <View style={{ height: 12 }} />
      <Section title="Pantry" options={PANTRY_OPTIONS} onSelect={onSelect} colors={colors} />
    </View>
  );
}
