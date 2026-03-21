// Purpose: User profile screen with preferences, connected accounts link, addresses, and settings

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { ChevronRight } from 'lucide-react-native';
import { BottomSheetWrapper } from '../../components/ui/BottomSheetWrapper';
import { DietaryTagRow } from '../../components/recipe/DietaryTagRow';
import { RecipeCardMini } from '../../components/recipe/RecipeCardMini';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { useUserStore } from '../../stores/userStore';
import { useRecipeStore } from '../../stores/recipeStore';
import { TOKENS } from '../../lib/tokens';
import { useRouter } from 'expo-router';
import type { DietaryTag } from '../../types';

const ALL_TAGS: DietaryTag[] = [
  'vegan', 'vegetarian', 'gluten-free', 'dairy-free',
  'keto', 'paleo', 'nut-free', 'low-carb', 'high-protein', 'mediterranean',
];

export default function ProfileScreen() {
  const router = useRouter();
  const editTagsSheetRef = useRef<BottomSheet>(null);
  const { preferences, toggleTag, hasTag, isConnected } =
    useUserPreferences();
  const { user } = useUserStore();
  const { saved: savedRecipes } = useRecipeStore();

  const connectedCount = (['instagram', 'tiktok', 'instacart'] as const).filter(
    (p) => isConnected(p)
  ).length;

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? 'U';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>
          {/* Avatar */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: TOKENS.colors.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: TOKENS.colors.primary,
                }}
              >
                {initials}
              </Text>
            </View>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.xl,
                fontWeight: TOKENS.typography.weights.bold,
                color: TOKENS.colors.text,
              }}
            >
              {user?.name}
            </Text>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.sm,
                color: TOKENS.colors.textSecondary,
                marginTop: 4,
              }}
            >
              {user?.email}
            </Text>
          </View>

          {/* Dietary Preferences */}
          <SectionHeader
            title="Dietary Preferences"
            action="Edit"
            onAction={() => editTagsSheetRef.current?.expand()}
          />
          <Card padding="md" style={{ marginBottom: 20 }}>
            {preferences?.dietaryTags && preferences.dietaryTags.length > 0 ? (
              <DietaryTagRow tags={preferences.dietaryTags} />
            ) : (
              <Text style={{ color: TOKENS.colors.textSecondary, fontSize: 14 }}>
                No dietary preferences set
              </Text>
            )}
          </Card>

          {/* Connected Accounts — navigates to settings page */}
          <SectionHeader title="Connected Accounts" />
          <TouchableOpacity
            onPress={() => router.push('/connected-accounts')}
            accessibilityLabel="Manage connected accounts"
            style={{ marginBottom: 20 }}
          >
            <Card padding="md">
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: TOKENS.typography.sizes.md,
                      fontWeight: TOKENS.typography.weights.medium,
                      color: TOKENS.colors.text,
                    }}
                  >
                    {connectedCount > 0
                      ? `${connectedCount} account${connectedCount > 1 ? 's' : ''} connected`
                      : 'No accounts connected'}
                  </Text>
                  <Text
                    style={{
                      fontSize: TOKENS.typography.sizes.sm,
                      color: TOKENS.colors.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    Instagram, TikTok, Instacart
                  </Text>
                </View>
                <ChevronRight size={20} color={TOKENS.colors.textMuted} />
              </View>
            </Card>
          </TouchableOpacity>

          {/* Addresses */}
          <SectionHeader title="Saved Addresses" />
          <Card padding="md" style={{ marginBottom: 20 }}>
            {user?.addresses && user.addresses.length > 0 ? (
              user.addresses.map((addr, idx) => (
                <View
                  key={addr.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderBottomWidth: idx < user.addresses.length - 1 ? 1 : 0,
                    borderBottomColor: TOKENS.colors.borderLight,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: TOKENS.colors.text }}>
                        {addr.label}
                      </Text>
                      {addr.id === user.defaultAddressId && (
                        <Badge label="Default" variant="success" size="sm" />
                      )}
                    </View>
                    <Text style={{ fontSize: 13, color: TOKENS.colors.textSecondary, marginTop: 2 }}>
                      {addr.street}, {addr.city}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: TOKENS.colors.textSecondary, fontSize: 14 }}>
                No addresses saved
              </Text>
            )}
          </Card>

          {/* Import History */}
          {savedRecipes.length > 0 && (
            <>
              <SectionHeader title="Import History" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 8, marginBottom: 20 }}
              >
                {savedRecipes.slice(0, 5).map((recipe) => (
                  <RecipeCardMini
                    key={recipe.id}
                    recipe={recipe}
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                  />
                ))}
              </ScrollView>
            </>
          )}

          {/* Settings */}
          <SectionHeader title="Settings" />
          <Card padding="md" style={{ marginBottom: 40 }}>
            <SettingRow label="Notifications" hasToggle />
            <SettingRow label="Units" value="Imperial" hasBorder />
            <SettingRow label="About Gook" />
          </Card>
        </View>
      </ScrollView>

      {/* Edit tags sheet */}
      <BottomSheetWrapper
        sheetRef={editTagsSheetRef}
        snapPoints={['55%']}
        initialIndex={-1}
      >
        <View style={{ padding: 20 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: TOKENS.colors.text,
              marginBottom: 16,
            }}
          >
            Edit Dietary Preferences
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {ALL_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                accessibilityLabel={`${hasTag(tag) ? 'Remove' : 'Add'} ${tag}`}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: hasTag(tag)
                    ? TOKENS.colors.primaryMuted
                    : TOKENS.colors.inputBg,
                  borderWidth: hasTag(tag) ? 2 : 0,
                  borderColor: TOKENS.colors.primary,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: hasTag(tag)
                      ? TOKENS.colors.primary
                      : TOKENS.colors.textSecondary,
                    textTransform: 'capitalize',
                  }}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button
            label="Done"
            onPress={() => editTagsSheetRef.current?.close()}
            variant="primary"
            fullWidth
          />
        </View>
      </BottomSheetWrapper>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          fontSize: TOKENS.typography.sizes.sm,
          fontWeight: TOKENS.typography.weights.semibold,
          color: TOKENS.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction} accessibilityLabel={action}>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.sm,
              fontWeight: TOKENS.typography.weights.semibold,
              color: TOKENS.colors.primary,
            }}
          >
            {action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function SettingRow({
  label,
  value,
  hasToggle,
  hasBorder,
}: {
  label: string;
  value?: string;
  hasToggle?: boolean;
  hasBorder?: boolean;
}) {
  const [enabled, setEnabled] = useState(true);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: hasBorder ? 1 : 0,
        borderBottomColor: TOKENS.colors.borderLight,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          color: TOKENS.colors.text,
        }}
      >
        {label}
      </Text>
      {value && (
        <Text style={{ fontSize: 14, color: TOKENS.colors.textSecondary }}>
          {value}
        </Text>
      )}
      {hasToggle && (
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{
            false: TOKENS.colors.border,
            true: TOKENS.colors.primaryLight,
          }}
          thumbColor={enabled ? TOKENS.colors.primary : TOKENS.colors.white}
        />
      )}
    </View>
  );
}
