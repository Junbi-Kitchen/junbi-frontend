// Purpose: Recipe detail screen with parallax hero, ingredient pantry split, and steps

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { NutritionBar } from '../../components/recipe/NutritionBar';
import { DietaryTagRow } from '../../components/recipe/DietaryTagRow';
import { RecipeIngredientRow } from '../../components/recipe/RecipeIngredientRow';
import { RecipeStepCard } from '../../components/recipe/RecipeStepCard';
import { Button } from '../../components/ui/Button';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { StepperInput } from '../../components/ui/StepperInput';
import { usePantry } from '../../hooks/usePantry';
import { useGroceryList } from '../../hooks/useGroceryList';
import { useRecipeStore } from '../../stores/recipeStore';
import { useUserStore } from '../../stores/userStore';
import { recipesApi } from '../../lib/api/recipes';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import { COPY } from '../../lib/copy';
import { formatCookTime, pluralize } from '../../lib/utils';
import { ToastNotification } from '../../components/ui/ToastNotification';
import type { DietaryTag } from '../../types';

const ALL_TAGS: DietaryTag[] = [
  'vegan', 'vegetarian', 'gluten-free', 'dairy-free',
  'keto', 'paleo', 'nut-free', 'low-carb', 'high-protein', 'mediterranean',
];

const { height: H } = Dimensions.get('window');
const HERO_HEIGHT = 320;

export default function RecipeDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollY = new Animated.Value(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [loading] = useState(false);

  const { saved } = useRecipeStore();
  const { user } = useUserStore();
  const localRecipe = saved.find((r) => r.id === id);
  const [recipe, setRecipe] = useState(localRecipe);
  const [portions, setPortions] = useState(localRecipe?.servings ?? 4);
  const [activeRestrictions, setActiveRestrictions] = useState<DietaryTag[]>(
    user?.preferences.dietaryTags ?? []
  );

  useEffect(() => {
    if (!localRecipe && id) {
      recipesApi.getById(id).then((r) => {
        setRecipe(r);
        setPortions(r.servings ?? 4);
      }).catch(() => {/* not found */});
    }
  }, [id]);

  const baseServings = recipe?.servings ?? 4;
  const scale = portions / baseServings;

  const toggleRestriction = (tag: DietaryTag) => {
    setActiveRestrictions((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const { hasIngredient } = usePantry();
  const { addRecipe, items: groceryItems } = useGroceryList();

  const heroTranslateY = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0, HERO_HEIGHT],
    outputRange: [HERO_HEIGHT / 2, 0, -HERO_HEIGHT / 3],
    extrapolate: 'clamp',
  });

  if (loading || !recipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonLoader width="100%" height={HERO_HEIGHT} borderRadius={0} />
          <SkeletonLoader width="60%" height={32} borderRadius={8} />
          <SkeletonLoader width="100%" height={80} borderRadius={12} />
          <SkeletonLoader width="100%" height={120} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  const haveIngredients = recipe.ingredients.filter((i) => hasIngredient(i.name));
  const needIngredients = recipe.ingredients.filter((i) => !hasIngredient(i.name));

  const missingCount = needIngredients.length;

  const handleAddMissing = () => {
    addRecipe(recipe.id);
    setToastVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        style={{
          position: 'absolute',
          top: 52,
          left: 16,
          zIndex: 10,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(0,0,0,0.4)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChevronLeft size={20} color="#fff" />
      </TouchableOpacity>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero image with parallax */}
        <View style={{ height: HERO_HEIGHT, overflow: 'hidden' }}>
          <Animated.Image
            source={{ uri: recipe.imageUri }}
            style={{
              width: '100%',
              height: HERO_HEIGHT + 100,
              transform: [{ translateY: heroTranslateY }],
            }}
            resizeMode="cover"
          />
        </View>

        <View style={{ padding: 20 }}>
          {/* Title */}
          <Text
            style={{
              fontSize: TOKENS.typography.sizes['2xl'],
              fontWeight: TOKENS.typography.weights.bold,
              color: colors.text,
              marginBottom: 8,
            }}
          >
            {recipe.title}
          </Text>

          {/* Source + date */}
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.sm,
              color: colors.textSecondary,
              marginBottom: 4,
            }}
          >
            {recipe.source} · {recipe.importedFrom} · {formatCookTime(recipe.cookTimeMinutes)}
          </Text>

          <Text
            style={{
              fontSize: TOKENS.typography.sizes.sm,
              color: colors.textSecondary,
              marginBottom: 20,
              lineHeight: 22,
            }}
          >
            {recipe.description}
          </Text>

          {/* Cook settings */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              ...TOKENS.shadows.sm,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                {COPY.recipe.portions}
              </Text>
              <StepperInput value={portions} onChange={setPortions} min={1} max={12} unit="servings" />
            </View>
            <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 14 }} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 10 }}>
              {COPY.recipe.dietaryRestrictions}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ALL_TAGS.map((tag) => {
                const active = activeRestrictions.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleRestriction(tag)}
                    accessibilityLabel={`${active ? 'Remove' : 'Add'} ${tag} restriction`}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: active ? colors.primaryMuted : colors.inputBg,
                      borderWidth: active ? 1.5 : 0,
                      borderColor: colors.primary,
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: active ? colors.primary : colors.textSecondary,
                      textTransform: 'capitalize',
                    }}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Tags */}
          <View style={{ marginBottom: 24 }}>
            <DietaryTagRow tags={recipe.tags} />
          </View>

          {/* Nutrition */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              ...TOKENS.shadows.sm,
            }}
          >
            <NutritionBar nutrition={recipe.nutrition} />
          </View>

          {/* Ingredients */}
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.lg,
              fontWeight: TOKENS.typography.weights.bold,
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Ingredients
          </Text>

          {haveIngredients.length > 0 && (
            <>
              <Text
                style={{
                  fontSize: TOKENS.typography.sizes.sm,
                  fontWeight: TOKENS.typography.weights.semibold,
                  color: colors.primary,
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                What you have ({haveIngredients.length})
              </Text>
              {haveIngredients.map((ing) => (
                <RecipeIngredientRow key={ing.id} ingredient={ing} inPantry={true} scaledQuantity={ing.quantity * scale} />
              ))}
            </>
          )}

          {needIngredients.length > 0 && (
            <>
              <Text
                style={{
                  fontSize: TOKENS.typography.sizes.sm,
                  fontWeight: TOKENS.typography.weights.semibold,
                  color: colors.textSecondary,
                  marginBottom: 8,
                  marginTop: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                What you need ({needIngredients.length})
              </Text>
              {needIngredients.map((ing) => (
                <RecipeIngredientRow key={ing.id} ingredient={ing} inPantry={false} scaledQuantity={ing.quantity * scale} />
              ))}
            </>
          )}

          {/* Steps */}
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.lg,
              fontWeight: TOKENS.typography.weights.bold,
              color: colors.text,
              marginTop: 24,
              marginBottom: 12,
            }}
          >
            Instructions
          </Text>
          {recipe.steps.map((step) => (
            <RecipeStepCard key={step.stepNumber} step={step} />
          ))}
        </View>
      </Animated.ScrollView>

      {/* Sticky bottom bar */}
      {missingCount > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            padding: 16,
            paddingBottom: 32,
          }}
        >
          <Button
            label={`Add ${pluralize(missingCount, 'missing ingredient')} to list`}
            onPress={handleAddMissing}
            variant="primary"
            fullWidth
          />
        </View>
      )}

      <ToastNotification
        message={`${missingCount} items added to your grocery list`}
        type="success"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}
