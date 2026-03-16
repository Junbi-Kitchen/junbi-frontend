// Purpose: Spotify-playlist-style recipe collection screen with saved recipes and user collections

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import BottomSheet from '@gorhom/bottom-sheet';
import {
  BookmarkCheck,
  Plus,
  ChevronRight,
  Clock,
  Heart,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BottomSheetWrapper } from '../../components/ui/BottomSheetWrapper';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { useRecipeStore } from '../../stores/recipeStore';
import { TOKENS } from '../../lib/tokens';
import { formatCookTime, pluralize, truncate } from '../../lib/utils';
import type { Recipe, RecipeCollection } from '../../types';

const { width: W } = Dimensions.get('window');
const CARD_WIDTH = (W - 48 - 12) / 2;

export default function RecipesScreen() {
  const router = useRouter();
  const [loading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const newCollectionSheetRef = useRef<BottomSheet>(null);

  const {
    saved,
    collections,
    createCollection,
    getRecipesForCollection,
  } = useRecipeStore();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonLoader width="50%" height={32} borderRadius={8} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <SkeletonLoader width={CARD_WIDTH} height={180} borderRadius={16} />
            <SkeletonLoader width={CARD_WIDTH} height={180} borderRadius={16} />
          </View>
          <SkeletonLoader width="100%" height={200} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  // If viewing a specific collection
  if (activeCollection) {
    const col = collections.find((c) => c.id === activeCollection);
    const recipes = col ? getRecipesForCollection(col.id) : [];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
        <CollectionDetail
          collection={col!}
          recipes={recipes}
          onBack={() => setActiveCollection(null)}
          onRecipePress={(id) => router.push(`/recipe/${id}`)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes['2xl'],
              fontWeight: TOKENS.typography.weights.bold,
              color: TOKENS.colors.text,
            }}
          >
            My Recipes
          </Text>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.sm,
              color: TOKENS.colors.textSecondary,
              marginTop: 4,
            }}
          >
            {pluralize(saved.length, 'recipe')} saved
          </Text>
        </View>

        {/* Liked Recipes hero row */}
        <TouchableOpacity
          onPress={() => {}}
          accessibilityLabel="View all saved recipes"
          style={{
            marginHorizontal: 20,
            marginTop: 16,
            borderRadius: 20,
            overflow: 'hidden',
            backgroundColor: TOKENS.colors.primaryMuted,
            ...TOKENS.shadows.sm,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: TOKENS.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              <Heart size={28} color={TOKENS.colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: TOKENS.typography.sizes.lg,
                  fontWeight: TOKENS.typography.weights.bold,
                  color: TOKENS.colors.text,
                }}
              >
                Liked Recipes
              </Text>
              <Text
                style={{
                  fontSize: TOKENS.typography.sizes.sm,
                  color: TOKENS.colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {pluralize(saved.length, 'recipe')}
              </Text>
            </View>
            <ChevronRight size={20} color={TOKENS.colors.textMuted} />
          </View>

          {/* Mini preview strip */}
          {saved.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}
            >
              {saved.slice(0, 6).map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  onPress={() => router.push(`/recipe/${recipe.id}`)}
                  accessibilityLabel={`Open ${recipe.title}`}
                >
                  <Image
                    source={{ uri: recipe.imageUri }}
                    style={{ width: 64, height: 64, borderRadius: 12 }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </TouchableOpacity>

        {/* Collections header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            marginTop: 28,
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.lg,
              fontWeight: TOKENS.typography.weights.bold,
              color: TOKENS.colors.text,
            }}
          >
            Collections
          </Text>
          <TouchableOpacity
            onPress={() => newCollectionSheetRef.current?.expand()}
            accessibilityLabel="Create new collection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: TOKENS.colors.primaryMuted,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
            }}
          >
            <Plus size={14} color={TOKENS.colors.primary} />
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.sm,
                fontWeight: TOKENS.typography.weights.semibold,
                color: TOKENS.colors.primary,
              }}
            >
              New
            </Text>
          </TouchableOpacity>
        </View>

        {/* Collection cards grid */}
        {collections.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon={BookmarkCheck}
              title="No collections yet"
              subtitle="Create your first recipe collection to organize your saved recipes."
              ctaLabel="Create Collection"
              onCta={() => newCollectionSheetRef.current?.expand()}
            />
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingHorizontal: 20,
              gap: 12,
            }}
          >
            {collections.map((col) => {
              const recipes = getRecipesForCollection(col.id);
              const coverImage = recipes[0]?.imageUri ?? col.coverImageUri;
              return (
                <TouchableOpacity
                  key={col.id}
                  onPress={() => setActiveCollection(col.id)}
                  accessibilityLabel={`Open ${col.name} collection`}
                  style={{
                    width: CARD_WIDTH,
                    borderRadius: 16,
                    backgroundColor: TOKENS.colors.white,
                    overflow: 'hidden',
                    ...TOKENS.shadows.sm,
                  }}
                >
                  {coverImage ? (
                    <Image
                      source={{ uri: coverImage }}
                      style={{ width: CARD_WIDTH, height: 100 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: CARD_WIDTH,
                        height: 100,
                        backgroundColor: TOKENS.colors.inputBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 36 }}>{col.emoji}</Text>
                    </View>
                  )}
                  <View style={{ padding: 12 }}>
                    <Text
                      style={{
                        fontSize: TOKENS.typography.sizes.sm,
                        fontWeight: TOKENS.typography.weights.semibold,
                        color: TOKENS.colors.text,
                      }}
                      numberOfLines={1}
                    >
                      {col.emoji} {col.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: TOKENS.typography.sizes.xs,
                        color: TOKENS.colors.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {pluralize(col.recipeIds.length, 'recipe')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Recently saved */}
        {saved.length > 0 && (
          <>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.lg,
                fontWeight: TOKENS.typography.weights.bold,
                color: TOKENS.colors.text,
                paddingHorizontal: 20,
                marginTop: 28,
                marginBottom: 14,
              }}
            >
              Recently Saved
            </Text>
            {saved.slice(0, 5).map((recipe) => (
              <RecipeListRow
                key={recipe.id}
                recipe={recipe}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Create collection sheet */}
      <BottomSheetWrapper
        sheetRef={newCollectionSheetRef}
        snapPoints={['45%']}
        initialIndex={-1}
      >
        <View style={{ padding: 20 }}>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.xl,
              fontWeight: TOKENS.typography.weights.bold,
              color: TOKENS.colors.text,
              marginBottom: 20,
            }}
          >
            New Collection
          </Text>
          <Input
            label="Name"
            placeholder="e.g. Weeknight Dinners"
            value={newName}
            onChangeText={setNewName}
          />
          <View style={{ marginTop: 12 }}>
            <Input
              label="Emoji"
              placeholder="e.g. 🍝"
              value={newEmoji}
              onChangeText={setNewEmoji}
            />
          </View>
          <View style={{ marginTop: 20 }}>
            <Button
              label="Create"
              onPress={() => {
                if (!newName.trim()) return;
                createCollection(newName.trim(), newEmoji || '📌');
                setNewName('');
                setNewEmoji('');
                newCollectionSheetRef.current?.close();
              }}
              variant="primary"
              fullWidth
              disabled={!newName.trim()}
            />
          </View>
        </View>
      </BottomSheetWrapper>
    </SafeAreaView>
  );
}

/** Spotify-style horizontal recipe row */
function RecipeListRow({
  recipe,
  onPress,
}: {
  recipe: Recipe;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={`Open ${recipe.title}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
      }}
    >
      <Image
        source={{ uri: recipe.imageUri }}
        style={{ width: 56, height: 56, borderRadius: 12 }}
      />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.md,
            fontWeight: TOKENS.typography.weights.medium,
            color: TOKENS.colors.text,
          }}
          numberOfLines={1}
        >
          {recipe.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Clock size={11} color={TOKENS.colors.textSecondary} />
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.xs,
                color: TOKENS.colors.textSecondary,
              }}
            >
              {formatCookTime(recipe.cookTimeMinutes)}
            </Text>
          </View>
          {recipe.tags[0] && (
            <Badge label={recipe.tags[0]} variant="dietary" tag={recipe.tags[0]} size="sm" />
          )}
        </View>
      </View>
      <ChevronRight size={16} color={TOKENS.colors.textMuted} />
    </TouchableOpacity>
  );
}

/** Full collection detail view */
function CollectionDetail({
  collection,
  recipes,
  onBack,
  onRecipePress,
}: {
  collection: RecipeCollection;
  recipes: Recipe[];
  onBack: () => void;
  onRecipePress: (id: string) => void;
}) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
          backgroundColor: TOKENS.colors.primaryMuted,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          accessibilityLabel="Go back to collections"
          style={{ marginBottom: 12 }}
        >
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.sm,
              fontWeight: TOKENS.typography.weights.semibold,
              color: TOKENS.colors.primary,
            }}
          >
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 40, marginBottom: 8 }}>{collection.emoji}</Text>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes['2xl'],
            fontWeight: TOKENS.typography.weights.bold,
            color: TOKENS.colors.text,
          }}
        >
          {collection.name}
        </Text>
        {collection.description ? (
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.sm,
              color: TOKENS.colors.textSecondary,
              marginTop: 4,
            }}
          >
            {collection.description}
          </Text>
        ) : null}
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.xs,
            color: TOKENS.colors.textMuted,
            marginTop: 8,
          }}
        >
          {pluralize(recipes.length, 'recipe')}
        </Text>
      </View>

      {/* Recipe list */}
      {recipes.length === 0 ? (
        <EmptyState
          icon={BookmarkCheck}
          title="Empty collection"
          subtitle="Swipe right on recipes in the feed to save them, then add them here."
        />
      ) : (
        recipes.map((recipe) => (
          <RecipeListRow
            key={recipe.id}
            recipe={recipe}
            onPress={() => onRecipePress(recipe.id)}
          />
        ))
      )}
    </ScrollView>
  );
}
