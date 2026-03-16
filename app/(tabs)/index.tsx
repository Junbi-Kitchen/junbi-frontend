// Purpose: Recipe swipe feed — the main discovery screen with card stack and action bar

import React, { useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import {
  SlidersHorizontal,
  Import,
  X,
  Heart,
  Plus,
  Home,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { RecipeCard } from '../../components/recipe/RecipeCard';
import { RecipeFilterDrawer } from '../../components/recipe/RecipeFilterDrawer';
import { ImportSourcePicker } from '../../components/recipe/ImportSourcePicker';
import { BottomSheetWrapper } from '../../components/ui/BottomSheetWrapper';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { useRecipeFeed } from '../../hooks/useRecipeFeed';
import { useGroceryList } from '../../hooks/useGroceryList';
import { usePantry } from '../../hooks/usePantry';
import { useRecipeStore } from '../../stores/recipeStore';
import { TOKENS } from '../../lib/tokens';

const { width: W, height: H } = Dimensions.get('window');

export default function FeedScreen() {
  const router = useRouter();
  const filterSheetRef = useRef<BottomSheet>(null);
  const importSheetRef = useRef<BottomSheet>(null);
  const [loading] = React.useState(false);

  const { recipes, rotation, handleSwipeLeft, handleSwipeRight, createGesture } =
    useRecipeFeed();
  const { addRecipe } = useGroceryList();
  const { hasIngredient } = usePantry();
  const { activeFilters, setFilters } = useRecipeStore();

  const getPantryMatch = (recipe: (typeof recipes)[0]) => {
    const total = recipe.ingredients.length;
    if (total === 0) return 0;
    const have = recipe.ingredients.filter((ing: { name: string }) => hasIngredient(ing.name)).length;
    return Math.round((have / total) * 100);
  };

  const topRecipe = recipes[0];
  const secondRecipe = recipes[1];
  const thirdRecipe = recipes[2];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <SkeletonLoader width={W - 32} height={H * 0.65} borderRadius={24} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      {/* Top bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <Text
          style={{
            fontSize: TOKENS.typography.sizes['2xl'],
            fontWeight: TOKENS.typography.weights.bold,
            color: TOKENS.colors.primary,
          }}
        >
          gook
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={() => filterSheetRef.current?.expand()}
            accessibilityLabel="Open filters"
          >
            <SlidersHorizontal size={22} color={TOKENS.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => importSheetRef.current?.expand()}
            accessibilityLabel="Import recipe"
          >
            <Import size={22} color={TOKENS.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Card stack */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {recipes.length === 0 ? (
          <EmptyState
            icon={Home}
            title="You've seen everything"
            subtitle="You've gone through all the recipes. Check back soon for new ones."
            ctaLabel="Refresh Feed"
            onCta={() => useRecipeStore.getState().loadFeed()}
          />
        ) : (
          <>
            {/* Back cards (static, scaled down) */}
            {thirdRecipe && (
              <View
                style={{
                  position: 'absolute',
                  transform: [{ scale: 0.88 }, { translateY: -20 }],
                  opacity: 0.6,
                }}
              >
                <RecipeCard
                  recipe={thirdRecipe}
                  onPress={() => {}}
                  pantryMatchPercent={getPantryMatch(thirdRecipe)}
                />
              </View>
            )}
            {secondRecipe && (
              <View
                style={{
                  position: 'absolute',
                  transform: [{ scale: 0.94 }, { translateY: -10 }],
                  opacity: 0.8,
                }}
              >
                <RecipeCard
                  recipe={secondRecipe}
                  onPress={() => {}}
                  pantryMatchPercent={getPantryMatch(secondRecipe)}
                />
              </View>
            )}
            {topRecipe && (
              <GestureDetector gesture={createGesture(topRecipe)}>
                <RecipeCard
                  recipe={topRecipe}
                  style={rotation}
                  onPress={() => router.push(`/recipe/${topRecipe.id}`)}
                  pantryMatchPercent={getPantryMatch(topRecipe)}
                />
              </GestureDetector>
            )}
          </>
        )}
      </View>

      {/* Action bar */}
      {topRecipe && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 24,
            paddingBottom: 32,
            paddingTop: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => handleSwipeLeft(topRecipe)}
            accessibilityLabel="Skip recipe"
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: TOKENS.colors.errorLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={24} color={TOKENS.colors.error} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              addRecipe(topRecipe);
            }}
            accessibilityLabel="Add to grocery list"
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: TOKENS.colors.accentLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={20} color={TOKENS.colors.accent} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSwipeRight(topRecipe)}
            accessibilityLabel="Save recipe"
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: TOKENS.colors.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart size={24} color={TOKENS.colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Filter sheet */}
      <BottomSheetWrapper
        sheetRef={filterSheetRef}
        snapPoints={['75%']}
        initialIndex={-1}
      >
        <RecipeFilterDrawer
          selectedFilters={activeFilters}
          onApply={setFilters}
          onClose={() => filterSheetRef.current?.close()}
        />
      </BottomSheetWrapper>

      {/* Import sheet */}
      <BottomSheetWrapper
        sheetRef={importSheetRef}
        snapPoints={['55%']}
        initialIndex={-1}
      >
        <ImportSourcePicker
          onSelect={(_source) => {
            importSheetRef.current?.close();
            router.push('/import');
          }}
        />
      </BottomSheetWrapper>
    </SafeAreaView>
  );
}
