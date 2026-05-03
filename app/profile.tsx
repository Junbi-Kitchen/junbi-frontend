// Purpose: User profile screen with preferences, connected accounts link, addresses, and settings

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { BottomSheetWrapper } from '../components/ui/BottomSheetWrapper';
import { AddressPickerSheet } from '../components/grocery/AddressPickerSheet';
import { DietaryTagRow } from '../components/recipe/DietaryTagRow';
import { RecipeCardMini } from '../components/recipe/RecipeCardMini';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useUserStore } from '../stores/userStore';
import { useRecipeStore } from '../stores/recipeStore';
import { useTheme } from '../hooks/useTheme';
import { useThemeStore } from '../stores/themeStore';
import { TOKENS } from '../lib/tokens';
import { APP } from '../lib/constants';
import { COPY } from '../lib/copy';
import { useRouter } from 'expo-router';
import type { DietaryTag } from '../types';

const ALL_TAGS: DietaryTag[] = [
  'vegan', 'vegetarian', 'gluten-free', 'dairy-free',
  'keto', 'paleo', 'nut-free', 'low-carb', 'high-protein', 'mediterranean',
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { mode, setMode } = useThemeStore();
  const router = useRouter();
  const editTagsSheetRef = useRef<BottomSheet>(null);
  const addressSheetRef = useRef<BottomSheet>(null);
  const { preferences, updateDietaryTags, hasTag, isConnected } =
    useUserPreferences();
  const { user, signOut } = useUserStore();
  const { saved: savedRecipes } = useRecipeStore();

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const connectedCount = (['instagram', 'tiktok', 'instacart'] as const).filter(
    (p) => isConnected(p)
  ).length;

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? 'U';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header with back button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: TOKENS.typography.sizes.lg,
            fontWeight: TOKENS.typography.weights.semibold,
            color: colors.text,
            marginRight: 36,
          }}
        >
          Profile
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>
          {/* Avatar */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: colors.primary,
                }}
              >
                {initials}
              </Text>
            </View>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.xl,
                fontWeight: TOKENS.typography.weights.bold,
                color: colors.text,
              }}
            >
              {user?.name}
            </Text>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.sm,
                color: colors.textSecondary,
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
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
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
                      color: colors.text,
                    }}
                  >
                    {connectedCount > 0
                      ? `${connectedCount} account${connectedCount > 1 ? 's' : ''} connected`
                      : 'No accounts connected'}
                  </Text>
                  <Text
                    style={{
                      fontSize: TOKENS.typography.sizes.sm,
                      color: colors.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    Instagram, TikTok, Instacart
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </View>
            </Card>
          </TouchableOpacity>

          {/* Addresses */}
          <SectionHeader title="Saved Addresses" action="Add" onAction={() => addressSheetRef.current?.expand()} />
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
                    borderBottomColor: colors.borderLight,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                        {addr.label}
                      </Text>
                      {addr.id === user.defaultAddressId && (
                        <Badge label="Default" variant="success" size="sm" />
                      )}
                    </View>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                      {addr.street}, {addr.city}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
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
          <Card padding="md" style={{ marginBottom: 16 }}>
            <SettingRow label="Notifications" hasToggle />
            <SettingRow label="Units" value="Imperial" hasBorder />
            {/* Appearance */}
            <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text, marginBottom: 10 }}>
                Appearance
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['light', 'dark', 'system'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMode(m)}
                    accessibilityLabel={`Set theme to ${m}`}
                    style={{
                      flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
                      backgroundColor: mode === m ? colors.primary : colors.inputBg,
                      borderWidth: mode === m ? 0 : 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 13, fontWeight: '600',
                      color: mode === m ? '#fff' : colors.text,
                      textTransform: 'capitalize',
                    }}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <SettingRow label={COPY.profile.about(APP.name)} />
          </Card>

          <Button
            label="Sign out"
            onPress={handleSignOut}
            variant="ghost"
            fullWidth
            style={{ marginBottom: 40 }}
          />
        </View>
      </ScrollView>

      {/* Add address sheet */}
      <BottomSheetWrapper sheetRef={addressSheetRef} snapPoints={['70%']} initialIndex={-1}>
        <AddressPickerSheet onConfirm={() => addressSheetRef.current?.close()} />
      </BottomSheetWrapper>

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
              color: colors.text,
              marginBottom: 16,
            }}
          >
            Edit Dietary Preferences
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {ALL_TAGS.map((tag) => {
              const selected = hasTag(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    selected ? updateDietaryTags([]) : updateDietaryTags([tag]);
                  }}
                  accessibilityLabel={`${selected ? 'Remove' : 'Select'} ${tag}`}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: selected ? colors.primary : colors.inputBg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: selected ? '#fff' : colors.textSecondary,
                      textTransform: 'capitalize',
                    }}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
  const { colors } = useTheme();
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
          color: colors.textSecondary,
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
              color: colors.primary,
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
  const { colors } = useTheme();
  const [enabled, setEnabled] = useState(true);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: hasBorder ? 1 : 0,
        borderBottomColor: colors.borderLight,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          color: colors.text,
        }}
      >
        {label}
      </Text>
      {value && (
        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
          {value}
        </Text>
      )}
      {hasToggle && (
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{
            false: colors.border,
            true: colors.primaryLight,
          }}
          thumbColor={enabled ? colors.primary : colors.surface}
        />
      )}
    </View>
  );
}
