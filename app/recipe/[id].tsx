import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Clock, ChefHat, Timer, Globe } from 'lucide-react-native';
import { NutritionBar } from '../../components/recipe/NutritionBar';
import { DietaryTagRow } from '../../components/recipe/DietaryTagRow';
import { RecipeIngredientRow } from '../../components/recipe/RecipeIngredientRow';
import { Button } from '../../components/ui/Button';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { StepperInput } from '../../components/ui/StepperInput';
import { BottomSheetWrapper } from '../../components/ui/BottomSheetWrapper';
import BottomSheet from '@gorhom/bottom-sheet';
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
import type { DietaryTag, Ingredient, RecipeStep } from '../../types';

const ALL_TAGS: DietaryTag[] = [
  'vegan', 'vegetarian', 'gluten-free', 'dairy-free',
  'keto', 'paleo', 'nut-free', 'low-carb', 'high-protein', 'mediterranean',
];

const SUPPORTED_LANGUAGES = [
  { label: '🇰🇷 Korean', value: 'Korean' },
  { label: '🇪🇸 Spanish', value: 'Spanish' },
  { label: '🇫🇷 French', value: 'French' },
  { label: '🇯🇵 Japanese', value: 'Japanese' },
  { label: '🇨🇳 Chinese', value: 'Chinese' },
  { label: '🇮🇹 Italian', value: 'Italian' },
  { label: '🇵🇹 Portuguese', value: 'Portuguese' },
  { label: '🇩🇪 German', value: 'German' },
];

const { width: W } = Dimensions.get('window');
const HERO_H = 240;
const TABS = ['Ingredients', 'Steps', 'Info'] as const;
type Tab = typeof TABS[number];

export default function RecipeDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [toastVisible, setToastVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Ingredients');

  const pagerRef = useRef<ScrollView>(null);
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const translateSheetRef = useRef<BottomSheet>(null);

  const [translating, setTranslating] = useState(false);
  const [translatedLanguage, setTranslatedLanguage] = useState<string | null>(null);
  const [translatedIngredients, setTranslatedIngredients] = useState<Ingredient[] | null>(null);
  const [translatedSteps, setTranslatedSteps] = useState<RecipeStep[] | null>(null);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);

  const { saved, getCachedTranslation, cacheTranslation } = useRecipeStore();
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
      }).catch(() => {});
    }
  }, [id]);

  const baseServings = recipe?.servings ?? 4;
  const scale = portions / baseServings;
  const { hasIngredient } = usePantry();
  const { addRecipe } = useGroceryList();

  const displayIngredients = translatedIngredients ?? recipe?.ingredients ?? [];
  const displaySteps = translatedSteps ?? recipe?.steps ?? [];
  const displayTitle = translatedTitle ?? recipe?.title ?? '';
  const displayDescription = translatedDescription ?? recipe?.description ?? '';

  const goToTab = useCallback((tab: Tab) => {
    const idx = TABS.indexOf(tab);
    setActiveTab(tab);
    pagerRef.current?.scrollTo({ x: idx * W, animated: true });
    Animated.timing(indicatorAnim, { toValue: idx, duration: 200, useNativeDriver: true }).start();
  }, [indicatorAnim]);

  const onScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    const tab = TABS[Math.min(idx, TABS.length - 1)];
    setActiveTab(tab);
    Animated.timing(indicatorAnim, { toValue: idx, duration: 150, useNativeDriver: true }).start();
  };

  const handleTranslate = async (language: string) => {
    if (!recipe) return;
    translateSheetRef.current?.close();
    if (translatedLanguage === language) {
      setTranslatedLanguage(null);
      setTranslatedIngredients(null);
      setTranslatedSteps(null);
      setTranslatedTitle(null);
      setTranslatedDescription(null);
      return;
    }

    // Check session cache before calling the API
    const cached = getCachedTranslation(recipe.id, language);
    if (cached) {
      setTranslatedLanguage(language);
      setTranslatedTitle(cached.title);
      setTranslatedDescription(cached.description);
      setTranslatedIngredients(cached.ingredients as Ingredient[]);
      setTranslatedSteps(cached.steps as RecipeStep[]);
      return;
    }

    setTranslating(true);
    try {
      const result = await recipesApi.translate({
        target_language: language,
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
      });
      cacheTranslation(recipe.id, language, result);
      setTranslatedLanguage(language);
      setTranslatedTitle(result.title);
      setTranslatedDescription(result.description);
      setTranslatedIngredients(result.ingredients as Ingredient[]);
      setTranslatedSteps(result.steps as RecipeStep[]);
    } catch {
      Alert.alert('Translation failed', 'Could not translate this recipe. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  if (!recipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonLoader width="100%" height={HERO_H} borderRadius={0} />
          <SkeletonLoader width="60%" height={32} borderRadius={8} />
          <SkeletonLoader width="100%" height={80} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  const haveIngredients = displayIngredients.filter((i) => hasIngredient(i.name));
  const needIngredients = displayIngredients.filter((i) => !hasIngredient(i.name));
  const missingCount = recipe.ingredients.filter((i) => !hasIngredient(i.name)).length;

  const indicatorX = indicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, W / 3, (W / 3) * 2],
  });

  const TAB_BAR_H = 46;
  const BOTTOM_H = missingCount > 0 ? 80 + insets.bottom : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        style={{
          position: 'absolute', top: insets.top + 8, left: 16, zIndex: 20,
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <ChevronLeft size={20} color="#fff" />
      </TouchableOpacity>

      {/* Translate button */}
      <TouchableOpacity
        onPress={() => translateSheetRef.current?.expand()}
        accessibilityLabel="Translate recipe"
        style={{
          position: 'absolute', top: insets.top + 8, right: 16, zIndex: 20,
          flexDirection: 'row', alignItems: 'center', gap: 5,
          backgroundColor: translatedLanguage ? colors.primary : 'rgba(0,0,0,0.45)',
          paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
        }}
      >
        {translating
          ? <ActivityIndicator size="small" color="#fff" />
          : <Globe size={15} color="#fff" />}
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
          {translatedLanguage ?? 'Translate'}
        </Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={{ height: HERO_H + insets.top, backgroundColor: colors.border }}>
        {recipe.imageUri ? (
          <Image source={{ uri: recipe.imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ChefHat size={48} color={colors.textMuted} />
          </View>
        )}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          paddingHorizontal: 20, paddingBottom: 16, paddingTop: 48,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <Text style={{ color: '#fff', fontSize: TOKENS.typography.sizes['2xl'], fontWeight: TOKENS.typography.weights.bold, lineHeight: 30 }}>
            {displayTitle}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={13} color="rgba(255,255,255,0.8)" />
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{formatCookTime(recipe.cookTimeMinutes)}</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textTransform: 'capitalize' }}>{recipe.difficulty}</Text>
            {translatedLanguage && (
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                {translatedLanguage}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Tab bar */}
      <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, height: TAB_BAR_H }}>
        <View style={{ flexDirection: 'row', flex: 1 }}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => goToTab(tab)}
              accessibilityLabel={`${tab} tab`}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{
                fontSize: TOKENS.typography.sizes.sm,
                fontWeight: activeTab === tab ? TOKENS.typography.weights.bold : TOKENS.typography.weights.regular,
                color: activeTab === tab ? colors.primary : colors.textSecondary,
              }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Animated.View style={{
          position: 'absolute', bottom: 0, left: 0,
          width: W / 3, height: 2.5, backgroundColor: colors.primary, borderRadius: 2,
          transform: [{ translateX: indicatorX }],
        }} />
      </View>

      {/* Horizontal pager — each page is a ScrollView so content inside can scroll vertically */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{ height: '100%' }}
      >
        {/* ── Ingredients ── */}
        <ScrollView
          style={{ width: W }}
          contentContainerStyle={{ padding: 20, paddingBottom: BOTTOM_H + 20 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{COPY.recipe.portions}</Text>
            <StepperInput value={portions} onChange={setPortions} min={1} max={12} unit="servings" />
          </View>

          {haveIngredients.length > 0 && (
            <>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                You have · {haveIngredients.length}
              </Text>
              {haveIngredients.map((ing, i) => (
                <RecipeIngredientRow key={`have-${i}`} ingredient={ing} inPantry scaledQuantity={ing.quantity * scale} />
              ))}
            </>
          )}

          {needIngredients.length > 0 && (
            <>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 20, marginBottom: 8 }}>
                You need · {needIngredients.length}
              </Text>
              {needIngredients.map((ing, i) => (
                <RecipeIngredientRow key={`need-${i}`} ingredient={ing} inPantry={false} scaledQuantity={ing.quantity * scale} />
              ))}
            </>
          )}

          {displayIngredients.length === 0 && (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>No ingredients listed.</Text>
          )}
        </ScrollView>

        {/* ── Steps ── */}
        <ScrollView
          style={{ width: W }}
          contentContainerStyle={{ padding: 20, paddingBottom: BOTTOM_H + 20 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {displaySteps.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>No steps listed.</Text>
          ) : (
            displaySteps.map((step, idx) => (
              <View key={step.stepNumber ?? idx} style={{
                flexDirection: 'row', gap: 14, marginBottom: 16,
                backgroundColor: colors.surface, borderRadius: 14,
                padding: 16, ...TOKENS.shadows.sm,
              }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 16, flexShrink: 0, marginTop: 1,
                  backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{step.stepNumber ?? idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: colors.text, lineHeight: 24 }}>{step.instruction}</Text>
                  {step.timerMinutes ? (
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10,
                      alignSelf: 'flex-start', backgroundColor: colors.accentLight,
                      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
                    }}>
                      <Timer size={12} color={colors.accent} />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.accent }}>{step.timerMinutes} min</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* ── Info ── */}
        <ScrollView
          style={{ width: W }}
          contentContainerStyle={{ padding: 20, paddingBottom: BOTTOM_H + 20 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {displayDescription ? (
            <Text style={{ fontSize: 15, color: colors.text, lineHeight: 24, marginBottom: 24 }}>{displayDescription}</Text>
          ) : null}

          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 24, ...TOKENS.shadows.sm }}>
            <NutritionBar nutrition={recipe.nutrition} />
          </View>

          {recipe.tags.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                Dietary
              </Text>
              <DietaryTagRow tags={recipe.tags} />
            </View>
          )}

          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 10 }}>{COPY.recipe.dietaryRestrictions}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {ALL_TAGS.map((tag) => {
              const active = activeRestrictions.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setActiveRestrictions((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag])}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                    backgroundColor: active ? colors.primaryMuted : colors.inputBg,
                    borderWidth: active ? 1.5 : 0, borderColor: colors.primary,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '500', color: active ? colors.primary : colors.textSecondary, textTransform: 'capitalize' }}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {recipe.source ? (
            <Text style={{ fontSize: 12, color: colors.textMuted }}>Source: {recipe.source}</Text>
          ) : null}
        </ScrollView>
      </ScrollView>

      {/* Sticky CTA */}
      {missingCount > 0 && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
          paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12,
        }}>
          <Button
            label={`Add ${pluralize(missingCount, 'missing ingredient')} to list`}
            onPress={() => { addRecipe(recipe.id); setToastVisible(true); }}
            variant="primary"
            fullWidth
          />
        </View>
      )}

      {/* Language picker sheet */}
      <BottomSheetWrapper sheetRef={translateSheetRef} snapPoints={['55%']} initialIndex={-1}>
        <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: TOKENS.typography.sizes.xl, fontWeight: TOKENS.typography.weights.bold, color: colors.text }}>
              Translate Recipe
            </Text>
            {translatedLanguage && (
              <TouchableOpacity
                onPress={() => handleTranslate(translatedLanguage)}
                accessibilityLabel="Show original"
              >
                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>Show Original</Text>
              </TouchableOpacity>
            )}
          </View>
          {SUPPORTED_LANGUAGES.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              onPress={() => handleTranslate(value)}
              accessibilityLabel={`Translate to ${value}`}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
              }}
            >
              <Text style={{ fontSize: 16, color: colors.text }}>{label}</Text>
              {translatedLanguage === value && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetWrapper>

      <ToastNotification
        message={`${missingCount} items added to your grocery list`}
        type="success"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}
