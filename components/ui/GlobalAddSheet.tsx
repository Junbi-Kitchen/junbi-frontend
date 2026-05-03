// Purpose: Global add-action sheet opened from the center tab button

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Camera, PenLine, Link, ScanLine } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';

export type AddAction = 'receipt' | 'ingredient' | 'import' | 'fridge';

interface GlobalAddSheetProps {
  onSelect: (action: AddAction) => void;
}

const OPTIONS: { id: AddAction; icon: React.ComponentType<{ size: number; color: string }>; label: string; description: string }[] = [
  { id: 'receipt', icon: Camera, label: 'Scan Receipt', description: 'Add pantry items from a receipt photo' },
  { id: 'ingredient', icon: PenLine, label: 'Add Ingredient', description: 'Manually add a single pantry item' },
  { id: 'import', icon: Link, label: 'Import Recipe', description: 'Paste a URL to save a recipe' },
  { id: 'fridge', icon: ScanLine, label: 'Scan Fridge', description: 'Photograph your fridge to log everything' },
];

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
      {OPTIONS.map(({ id, icon: Icon, label, description }, idx) => (
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
            paddingVertical: 14,
            borderBottomWidth: idx < OPTIONS.length - 1 ? 1 : 0,
            borderBottomColor: colors.borderLight,
          }}
        >
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon size={20} color={colors.primary} />
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
              marginTop: 2,
            }}>
              {description}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
