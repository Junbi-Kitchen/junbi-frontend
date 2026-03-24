// Purpose: Shareable savings card for social media — triggers native share sheet

import React, { useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Share as ShareIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { TOKENS } from '../../lib/tokens';
import { useUserStore } from '../../stores/userStore';
import { useSavingsStore } from '../../stores/savingsStore';

interface ShareCardProps {
  onShare?: () => void;
}

export function ShareCard({ onShare }: ShareCardProps) {
  const userName = useUserStore((s) => s.user?.name ?? 'Someone');
  const { totalSavedThisMonth, wasteLog } = useSavingsStore();
  const mealsCooked = wasteLog.filter((e) => e.action === 'used').length;

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const message = `I saved $${totalSavedThisMonth.toFixed(2)} this month by reducing food waste with Gook! 🥬\n\n${mealsCooked} meals cooked from ingredients that would have expired.\n\nStop wasting food → gook.app`;

    try {
      const { Share } = await import('react-native');
      await Share.share({ message });
      onShare?.();
    } catch {
      // User cancelled share
    }
  };

  return (
    <View
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: TOKENS.colors.primary,
      }}
    >
      {/* Card content */}
      <View style={{ padding: 28 }}>
        {/* App branding */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 20,
          }}
        >
          gook
        </Text>

        {/* Name + savings */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: '500',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: 6,
          }}
        >
          {userName} saved
        </Text>

        <Text
          style={{
            fontSize: 48,
            fontWeight: '800',
            color: TOKENS.colors.accent,
            lineHeight: 52,
          }}
        >
          ${totalSavedThisMonth.toFixed(2)}
        </Text>

        <Text
          style={{
            fontSize: 16,
            fontWeight: '500',
            color: 'rgba(255,255,255,0.7)',
            marginTop: 6,
          }}
        >
          this month
        </Text>

        {/* Stats row */}
        <View
          style={{
            flexDirection: 'row',
            gap: 24,
            marginTop: 24,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: TOKENS.colors.white }}>
              {mealsCooked}
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
              meals cooked
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: TOKENS.colors.white }}>
              {wasteLog.filter((e) => e.action === 'used').reduce((sum, e) => sum + 1, 0)}
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
              items saved
            </Text>
          </View>
        </View>
      </View>

      {/* Share button */}
      <TouchableOpacity
        onPress={handleShare}
        accessibilityLabel="Share your savings"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          paddingVertical: 16,
          backgroundColor: 'rgba(0,0,0,0.15)',
        }}
      >
        <ShareIcon size={18} color={TOKENS.colors.white} />
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.md,
            fontWeight: TOKENS.typography.weights.semibold,
            color: TOKENS.colors.white,
          }}
        >
          Share my savings
        </Text>
      </TouchableOpacity>
    </View>
  );
}
