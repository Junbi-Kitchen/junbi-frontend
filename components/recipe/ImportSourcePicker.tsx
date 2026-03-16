// Purpose: Bottom sheet content for selecting recipe import source

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Instagram, Play, Globe, PenLine } from 'lucide-react-native';
import { TOKENS } from '../../lib/tokens';
import type { ImportSource } from '../../types';

interface ImportSourcePickerProps {
  onSelect: (source: ImportSource) => void;
}

const SOURCES: {
  source: ImportSource;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
}[] = [
  {
    source: 'instagram',
    label: 'Instagram',
    subtitle: 'Import from a Reel or post',
    icon: Instagram,
    color: '#E1306C',
  },
  {
    source: 'tiktok',
    label: 'TikTok',
    subtitle: 'Import from a TikTok video',
    icon: Play,
    color: '#010101',
  },
  {
    source: 'url',
    label: 'Paste a URL',
    subtitle: 'Any recipe website or blog',
    icon: Globe,
    color: '#3B82F6',
  },
  {
    source: 'manual',
    label: 'Add Manually',
    subtitle: 'Enter recipe details yourself',
    icon: PenLine,
    color: TOKENS.colors.primary,
  },
];

export function ImportSourcePicker({ onSelect }: ImportSourcePickerProps) {
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
      <Text
        style={{
          fontSize: TOKENS.typography.sizes.xl,
          fontWeight: TOKENS.typography.weights.bold,
          color: TOKENS.colors.text,
          marginBottom: 20,
        }}
      >
        Import a Recipe
      </Text>

      {SOURCES.map(({ source, label, subtitle, icon: Icon, color }) => (
        <TouchableOpacity
          key={source}
          onPress={() => onSelect(source)}
          accessibilityLabel={`Import from ${label}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderRadius: 16,
            backgroundColor: TOKENS.colors.inputBg,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: `${color}18`,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}
          >
            <Icon size={22} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.md,
                fontWeight: TOKENS.typography.weights.semibold,
                color: TOKENS.colors.text,
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.sm,
                color: TOKENS.colors.textSecondary,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
