// Purpose: Recipe detail screen with parallax hero, ingredient pantry split, and steps

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
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
import { usePantry } from '../../hooks/usePantry';
import { useGroceryList } from '../../hooks/useGroceryList';
import { useRecipeStore } from '../../stores/recipeStore';
import { recipesApi } from '../../lib/api/recipes';
import { TOKENS } from '../../lib/tokens';
import { formatCookTime, pluralize } from '../../lib/utils';
import { ToastNotification } from '../../components/ui/ToastNotification';

const { height: H } = Dimensions.get('window');
const HERO_HEIGHT = 320;

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollY = new Animated.Value(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [loading] = useState(false);

  const { saved } = useRecipeStore();
  const localRecipe = saved.find((r) => r.id === id);
  const [recipe, setRecipe] = useState(localRecipe);

  useEffect(() => {
    if (!localRecipe && id) {
      recipesApi.getById(id).then(setRecipe).catch(() => {/* not found */});
    }
  }, [id]);

  const { hasIngredient } = usePantry();
  const { addRecipe, items: groceryItems } = useGroceryList();

  const heroTranslateY = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0, HERO_HEIGHT],
    outputRange: [HERO_HEIGHT / 2, 0, -HERO_HEIGHT / 3],
    extrapolate: 'clamp',
  });

  if (loading || !recipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
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
              color: TOKENS.colors.text,
              marginBottom: 8,
            }}
          >
            {recipe.title}
          </Text>

          {/* Source + date */}
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.sm,
              color: TOKENS.colors.textSecondary,
              marginBottom: 4,
            }}
          >
            {recipe.source} · {recipe.importedFrom} · {formatCookTime(recipe.cookTimeMinutes)}
          </Text>

          <Text
            style={{
              fontSize: TOKENS.typography.sizes.sm,
              color: TOKENS.colors.textSecondary,
              marginBottom: 20,
              lineHeight: 22,
            }}
          >
            {recipe.description}
          </Text>

          {/* Tags */}
          <View style={{ marginBottom: 24 }}>
            <DietaryTagRow tags={recipe.tags} />
          </View>

          {/* Nutrition */}
          <View
            style={{
              backgroundColor: TOKENS.colors.white,
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
              color: TOKENS.colors.text,
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
                  color: TOKENS.colors.primary,
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                What you have ({haveIngredients.length})
              </Text>
              {haveIngredients.map((ing) => (
                <RecipeIngredientRow key={ing.id} ingredient={ing} inPantry={true} />
              ))}
            </>
          )}

          {needIngredients.length > 0 && (
            <>
              <Text
                style={{
                  fontSize: TOKENS.typography.sizes.sm,
                  fontWeight: TOKENS.typography.weights.semibold,
                  color: TOKENS.colors.textSecondary,
                  marginBottom: 8,
                  marginTop: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                What you need ({needIngredients.length})
              </Text>
              {needIngredients.map((ing) => (
                <RecipeIngredientRow key={ing.id} ingredient={ing} inPantry={false} />
              ))}
            </>
          )}

          {/* Steps */}
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.lg,
              fontWeight: TOKENS.typography.weights.bold,
              color: TOKENS.colors.text,
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
            backgroundColor: TOKENS.colors.white,
            borderTopWidth: 1,
            borderTopColor: TOKENS.colors.border,
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
