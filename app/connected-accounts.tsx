// Purpose: Connected accounts settings screen — toggle Instagram, TikTok, Instacart

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Card } from '../components/ui/Card';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useUserStore } from '../stores/userStore';
import { useTheme } from '../hooks/useTheme';
import { TOKENS } from '../lib/tokens';

const PLATFORMS = [
  {
    key: 'instagram' as const,
    label: 'Instagram',
    description: 'Import recipes from saved posts and reels',
    color: '#E1306C',
  },
  {
    key: 'tiktok' as const,
    label: 'TikTok',
    description: 'Import recipes from bookmarked videos',
    color: '#000000',
  },
  {
    key: 'instacart' as const,
    label: 'Instacart',
    description: 'One-click grocery pickup and delivery',
    color: '#43B02A',
  },
];

export default function ConnectedAccountsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { connectAccount, disconnectAccount, isConnected } = useUserPreferences();
  const { user } = useUserStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: colors.inputBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.xl,
            fontWeight: TOKENS.typography.weights.bold,
            color: colors.text,
          }}
        >
          Connected Accounts
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.sm,
            color: colors.textSecondary,
            marginBottom: 16,
            lineHeight: 20,
          }}
        >
          Connect your accounts to import recipes and order groceries directly from the app.
        </Text>

        <Card padding="md">
          {PLATFORMS.map((platform, idx) => {
            const connected = isConnected(platform.key);
            return (
              <View
                key={platform.key}
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: idx < PLATFORMS.length - 1 ? 1 : 0,
                  borderBottomColor: colors.borderLight,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {/* Color dot indicator */}
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: platform.color,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: TOKENS.typography.sizes.md,
                          fontWeight: TOKENS.typography.weights.semibold,
                          color: colors.text,
                        }}
                      >
                        {platform.label}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: TOKENS.typography.sizes.sm,
                        color: colors.textSecondary,
                        marginTop: 4,
                        marginLeft: 18,
                      }}
                    >
                      {platform.description}
                    </Text>
                    {connected && user?.connectedAccounts[platform.key] && (
                      <Text
                        style={{
                          fontSize: TOKENS.typography.sizes.xs,
                          color: colors.primary,
                          marginTop: 4,
                          marginLeft: 18,
                        }}
                      >
                        {user.connectedAccounts[platform.key]}
                      </Text>
                    )}
                  </View>

                  <Switch
                    value={connected}
                    onValueChange={(val) => {
                      if (val) {
                        connectAccount(platform.key, `@user.${platform.key}`);
                      } else {
                        disconnectAccount(platform.key);
                      }
                    }}
                    trackColor={{
                      false: colors.border,
                      true: colors.primaryLight,
                    }}
                    thumbColor={connected ? colors.primary : colors.white}
                  />
                </View>
              </View>
            );
          })}
        </Card>
      </View>
    </SafeAreaView>
  );
}
