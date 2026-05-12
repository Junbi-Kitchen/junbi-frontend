import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import {
  BookmarkCheck,
  Plus,
  ChevronRight,
  Clock,
  Heart,
  Import,
  ChefHat,
  Trash2,
  UtensilsCrossed,
  Pin,
  PinOff,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BottomSheetWrapper } from '../../components/ui/BottomSheetWrapper';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { FreshnessBar } from '../../components/pantry/FreshnessBar';
import { PantrySection } from '../../components/pantry/PantrySection';
import { ManualAddSheet } from '../../components/pantry/ManualAddSheet';
import { SavedToast } from '../../components/shared/SavedToast';
import { usePantry } from '../../hooks/usePantry';
import { useRecipeStore } from '../../stores/recipeStore';
import { useSavingsStore } from '../../stores/savingsStore';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import { formatCookTime, pluralize, getDaysUntilExpiry } from '../../lib/utils';
import type { Recipe, RecipeCollection, PantryItem, IngredientCategory } from '../../types';

const { width: W } = Dimensions.get('window');
const PANTRY_CARD_WIDTH = (W - 48 - 12) / 3;
const RECIPE_CARD_WIDTH = (W - 48 - 12) / 2;

const PANTRY_FILTERS: { key: string; label: string; categories: IngredientCategory[] }[] = [
  { key: 'all', label: 'All', categories: [] },
  { key: 'fridge', label: 'Fridge', categories: ['produce', 'dairy', 'proteins', 'beverages', 'condiments'] },
  { key: 'freezer', label: 'Freezer', categories: ['frozen'] },
  { key: 'pantry', label: 'Pantry', categories: ['grains', 'pantry', 'bakery'] },
  { key: 'spices', label: 'Spices', categories: ['spices'] },
];

type TabView = 'pantry' | 'recipes';

export default function KitchenScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [loading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabView>(tabParam === 'recipes' ? 'recipes' : 'pantry');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [toastAmount, setToastAmount] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');

  const itemSheetRef = useRef<BottomSheet>(null);
  const manualAddRef = useRef<BottomSheet>(null);
  const newCollectionRef = useRef<BottomSheet>(null);

  const insets = useSafeAreaInsets();
  const tabBarHeight = 46 + Math.max(insets.bottom, 8);
  const { items, logAction, updateQuantity, removeItem } = usePantry();
  const { logUsed, logTossed } = useSavingsStore();
  const { saved, collections, createCollection, getRecipesForCollection, pinnedRecipes, pinRecipe, unpinRecipe, unsaveRecipe, removeFromCollection } = useRecipeStore();

  const filteredItems = (() => {
    const filter = PANTRY_FILTERS.find((f) => f.key === activeFilter);
    const filtered = filter && filter.categories.length > 0
      ? items.filter((i) => filter.categories.includes(i.category))
      : items;
    return [...filtered].sort((a, b) => {
      const daysA = a.expiryDate ? getDaysUntilExpiry(a.expiryDate) : 999;
      const daysB = b.expiryDate ? getDaysUntilExpiry(b.expiryDate) : 999;
      return daysA - daysB;
    });
  })();

  const handleItemTap = (item: PantryItem) => {
    setSelectedItem(item);
    itemSheetRef.current?.expand();
  };

  const handleMarkUsed = async () => {
    if (!selectedItem) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedItem(null);
    itemSheetRef.current?.close();
    const result = await logAction(selectedItem.id, 'used');
    logUsed(selectedItem.name, result.estimatedValue);
    setToastAmount(result.estimatedValue);
    setToastVisible(true);
  };

  const handleTossed = async () => {
    if (!selectedItem) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedItem(null);
    itemSheetRef.current?.close();
    const result = await logAction(selectedItem.id, 'tossed');
    logTossed(selectedItem.name, result.estimatedValue);
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 20, gap: 12 }}>
          <SkeletonLoader width="40%" height={28} borderRadius={8} />
          <SkeletonLoader width="100%" height={40} borderRadius={12} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} width={PANTRY_CARD_WIDTH} height={130} borderRadius={16} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (activeCollection) {
    const col = collections.find((c) => c.id === activeCollection);
    const colRecipes = col ? getRecipesForCollection(col.id) : [];
    const pinned = pinnedRecipes[activeCollection] ?? [];
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
        <CollectionDetail
          collection={col!}
          recipes={colRecipes}
          pinnedIds={pinned}
          onBack={() => setActiveCollection(null)}
          onRecipePress={(id) => router.push(`/recipe/${id}`)}
          onImport={() => router.push({ pathname: '/import', params: { collectionId: col!.id, collectionName: col!.name } })}
          onPin={(id) => pinRecipe(activeCollection, id)}
          onUnpin={(id) => unpinRecipe(activeCollection, id)}
          onRemove={(id) => removeFromCollection(activeCollection, id)}
          tabBarHeight={tabBarHeight}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          <Text style={{
            fontSize: TOKENS.typography.sizes['2xl'],
            fontWeight: TOKENS.typography.weights.bold,
            color: colors.text,
          }}>
            Kitchen
          </Text>
        </Animated.View>

        {/* Segmented control */}
        <Animated.View entering={FadeInUp.delay(60).duration(400)}>
          <View style={{
            flexDirection: 'row',
            marginHorizontal: 20,
            backgroundColor: colors.inputBg,
            borderRadius: 12,
            padding: 4,
            marginBottom: 16,
          }}>
            {(['pantry', 'recipes'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab);
                }}
                accessibilityLabel={`Switch to ${tab === 'pantry' ? 'My Pantry' : 'Recipes'}`}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: activeTab === tab ? colors.surface : 'transparent',
                  ...(activeTab === tab ? TOKENS.shadows.sm : {}),
                }}
              >
                <Text style={{
                  fontSize: TOKENS.typography.sizes.sm,
                  fontWeight: activeTab === tab ? TOKENS.typography.weights.semibold : TOKENS.typography.weights.regular,
                  color: activeTab === tab ? colors.text : colors.textSecondary,
                }}>
                  {tab === 'pantry' ? 'My Pantry' : 'Recipes'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ─── PANTRY VIEW ───────────────────────────────── */}
        {activeTab === 'pantry' && (
          <>
            <Animated.View entering={FadeInDown.delay(80).duration(400)}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 16 }}
              >
                {PANTRY_FILTERS.map((filter) => {
                  const isActive = activeFilter === filter.key;
                  const count = filter.categories.length > 0
                    ? items.filter((i) => filter.categories.includes(i.category)).length
                    : items.length;
                  return (
                    <TouchableOpacity
                      key={filter.key}
                      onPress={() => setActiveFilter(filter.key)}
                      accessibilityLabel={`Filter by ${filter.label}`}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                        backgroundColor: isActive ? colors.primary : colors.surface,
                        borderWidth: isActive ? 0 : 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text style={{
                        fontSize: TOKENS.typography.sizes.sm,
                        fontWeight: TOKENS.typography.weights.medium,
                        color: isActive ? '#fff' : colors.text,
                      }}>
                        {filter.label}
                      </Text>
                      <Text style={{ fontSize: 11, color: isActive ? 'rgba(255,255,255,0.7)' : colors.textMuted }}>
                        {count}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>

            {filteredItems.length > 0 ? (() => {
              const grouped = filteredItems.reduce<Record<string, PantryItem[]>>((acc, item) => {
                if (!acc[item.category]) acc[item.category] = [];
                acc[item.category].push(item);
                return acc;
              }, {});
              return (
                <View>
                  {(Object.keys(grouped) as IngredientCategory[]).map((cat) => (
                    <PantrySection
                      key={cat}
                      category={cat}
                      items={grouped[cat]}
                      onUpdateQuantity={(id, qty) => updateQuantity(id, qty)}
                      onDelete={(id) => removeItem(id)}
                    />
                  ))}
                </View>
              );
            })() : (
              <EmptyState
                icon={ChefHat}
                title="Your kitchen is empty!"
                subtitle={activeFilter !== 'all'
                  ? 'No items in this category.'
                  : "Scan a receipt to get started — I'll track everything for you."}
                ctaLabel="Add item"
                onCta={() => manualAddRef.current?.expand()}
              />
            )}
          </>
        )}

        {/* ─── RECIPES VIEW ──────────────────────────────── */}
        {activeTab === 'recipes' && (
          <>
            {/* Liked Recipes hero */}
            <Animated.View entering={FadeInDown.delay(80).duration(400)}>
              <TouchableOpacity
                onPress={() => {}}
                accessibilityLabel="View all saved recipes"
                style={{
                  marginHorizontal: 20, borderRadius: 20, overflow: 'hidden',
                  backgroundColor: colors.primaryMuted, ...TOKENS.shadows.sm,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
                  <View style={{
                    width: 56, height: 56, borderRadius: 16,
                    backgroundColor: colors.primary,
                    alignItems: 'center', justifyContent: 'center', marginRight: 16,
                  }}>
                    <Heart size={28} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: TOKENS.typography.sizes.lg,
                      fontWeight: TOKENS.typography.weights.bold,
                      color: colors.text,
                    }}>
                      Liked Recipes
                    </Text>
                    <Text style={{ fontSize: TOKENS.typography.sizes.sm, color: colors.textSecondary, marginTop: 2 }}>
                      {pluralize(saved.length, 'recipe')}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textMuted} />
                </View>
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
                        <Image source={{ uri: recipe.imageUri }} style={{ width: 64, height: 64, borderRadius: 12 }} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Collections */}
            <Animated.View entering={FadeInDown.delay(140).duration(400)}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 20, marginTop: 28, marginBottom: 14,
              }}>
                <Text style={{
                  fontSize: TOKENS.typography.sizes.lg,
                  fontWeight: TOKENS.typography.weights.bold,
                  color: colors.text,
                }}>
                  Collections
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => router.push('/import')}
                    accessibilityLabel="Import recipe"
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                      backgroundColor: colors.inputBg,
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                      borderWidth: 1, borderColor: colors.border,
                    }}
                  >
                    <Import size={14} color={colors.text} />
                    <Text style={{
                      fontSize: TOKENS.typography.sizes.sm,
                      fontWeight: TOKENS.typography.weights.semibold,
                      color: colors.text,
                    }}>
                      Import
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => newCollectionRef.current?.expand()}
                    accessibilityLabel="Create new collection"
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                      backgroundColor: colors.primaryMuted,
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                    }}
                  >
                    <Plus size={14} color={colors.primary} />
                    <Text style={{
                      fontSize: TOKENS.typography.sizes.sm,
                      fontWeight: TOKENS.typography.weights.semibold,
                      color: colors.primary,
                    }}>
                      New
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {collections.length === 0 ? (
              <View style={{ paddingHorizontal: 20 }}>
                <EmptyState
                  icon={BookmarkCheck}
                  title="No collections yet"
                  subtitle="Create your first recipe collection to organize your saved recipes."
                  ctaLabel="Create Collection"
                  onCta={() => newCollectionRef.current?.expand()}
                />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 }}>
                {collections.map((col, idx) => {
                  const colRecipes = getRecipesForCollection(col.id);
                  const coverImage = colRecipes[0]?.imageUri ?? col.coverImageUri;
                  return (
                    <Animated.View key={col.id} entering={FadeInDown.delay(200 + idx * 60).springify()}>
                      <TouchableOpacity
                        onPress={() => setActiveCollection(col.id)}
                        accessibilityLabel={`Open ${col.name} collection`}
                        style={{
                          width: RECIPE_CARD_WIDTH, borderRadius: 16,
                          backgroundColor: colors.surface, overflow: 'hidden', ...TOKENS.shadows.sm,
                        }}
                      >
                        {coverImage ? (
                          <Image source={{ uri: coverImage }} style={{ width: RECIPE_CARD_WIDTH, height: 100 }} />
                        ) : (
                          <View style={{
                            width: RECIPE_CARD_WIDTH, height: 100,
                            backgroundColor: colors.inputBg,
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Text style={{ fontSize: 36 }}>{col.emoji}</Text>
                          </View>
                        )}
                        <View style={{ padding: 12 }}>
                          <Text numberOfLines={1} style={{
                            fontSize: TOKENS.typography.sizes.sm,
                            fontWeight: TOKENS.typography.weights.semibold,
                            color: colors.text,
                          }}>
                            {col.emoji} {col.name}
                          </Text>
                          <Text style={{
                            fontSize: TOKENS.typography.sizes.xs,
                            color: colors.textSecondary, marginTop: 2,
                          }}>
                            {pluralize(col.recipeIds.length, 'recipe')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            )}

            {/* Recently saved */}
            {saved.length > 0 && (
              <>
                <Text style={{
                  fontSize: TOKENS.typography.sizes.lg,
                  fontWeight: TOKENS.typography.weights.bold,
                  color: colors.text,
                  paddingHorizontal: 20, marginTop: 28, marginBottom: 14,
                }}>
                  Recently Saved
                </Text>
                {saved.map((recipe) => (
                  <RecipeListRow
                    key={recipe.id}
                    recipe={recipe}
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                    onDelete={() => unsaveRecipe(recipe.id)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* ─── Bottom Sheets ───────────────────────────────── */}

      <BottomSheetWrapper sheetRef={itemSheetRef} snapPoints={['40%']} initialIndex={-1} onClose={() => setSelectedItem(null)}>
        {selectedItem && (
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <View style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 24 }}>{getItemEmoji(selectedItem.category)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: TOKENS.typography.sizes.lg, fontWeight: TOKENS.typography.weights.bold, color: colors.text }}>
                  {selectedItem.name}
                </Text>
                <Text style={{ fontSize: TOKENS.typography.sizes.sm, color: colors.textSecondary, marginTop: 2 }}>
                  {selectedItem.quantity} {selectedItem.unit}
                  {selectedItem.expiryDate && (() => {
                    const d = getDaysUntilExpiry(selectedItem.expiryDate);
                    return d <= 0 ? ' · Expired' : ` · ${d}d left`;
                  })()}
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <FreshnessBar expiryDate={selectedItem.expiryDate} />
            </View>

            <View style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => itemSheetRef.current?.close()}
                accessibilityLabel={`Cook with ${selectedItem.name}`}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingVertical: 14, paddingHorizontal: 16,
                  borderRadius: 12, backgroundColor: colors.primaryMuted,
                }}
              >
                <UtensilsCrossed size={18} color={colors.primary} />
                <Text style={{ fontSize: TOKENS.typography.sizes.md, fontWeight: TOKENS.typography.weights.semibold, color: colors.primary }}>
                  Cook with this
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={handleMarkUsed}
                  accessibilityLabel="Mark as used"
                  style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 8, paddingVertical: 14, borderRadius: 12,
                    backgroundColor: colors.successLight,
                  }}
                >
                  <ChefHat size={16} color={colors.success} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.success }}>Used it</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTossed}
                  accessibilityLabel="Mark as tossed"
                  style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 8, paddingVertical: 14, borderRadius: 12,
                    backgroundColor: colors.errorLight,
                  }}
                >
                  <Trash2 size={16} color={colors.error} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.error }}>Tossed it</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </BottomSheetWrapper>

      <BottomSheetWrapper sheetRef={manualAddRef} snapPoints={['80%']} initialIndex={-1} keyboardBehavior="interactive">
        <ManualAddSheet onClose={() => manualAddRef.current?.close()} />
      </BottomSheetWrapper>

      <BottomSheetWrapper sheetRef={newCollectionRef} snapPoints={['45%']} initialIndex={-1}>
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: TOKENS.typography.sizes.xl, fontWeight: TOKENS.typography.weights.bold, color: colors.text, marginBottom: 20 }}>
            New Collection
          </Text>
          <Input label="Name" placeholder="e.g. Weeknight Dinners" value={newName} onChangeText={setNewName} />
          <View style={{ marginTop: 12 }}>
            <Input label="Emoji" placeholder="e.g. 🍝" value={newEmoji} onChangeText={setNewEmoji} />
          </View>
          <View style={{ marginTop: 20 }}>
            <Button
              label="Create"
              onPress={() => {
                if (!newName.trim()) return;
                createCollection(newName.trim(), newEmoji || '📌');
                setNewName('');
                setNewEmoji('');
                newCollectionRef.current?.close();
              }}
              variant="primary"
              fullWidth
              disabled={!newName.trim()}
            />
          </View>
        </View>
      </BottomSheetWrapper>

      <SavedToast amount={toastAmount} visible={toastVisible} onDismiss={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

// ─── Helper: emoji for pantry categories ─────────────────────

function getItemEmoji(category: IngredientCategory): string {
  const map: Record<IngredientCategory, string> = {
    produce: '🥬', proteins: '🍗', dairy: '🥛', grains: '🌾',
    pantry: '🥫', frozen: '🧊', beverages: '🧃', condiments: '🫙',
    spices: '🌶️', bakery: '🍞',
  };
  return map[category] ?? '🍽️';
}

// ─── Recipe list row ─────────────────────────────────────────

function RecipeListRow({ recipe, onPress, isPinned, onTogglePin, onDelete }: {
  recipe: Recipe; onPress: () => void;
  isPinned?: boolean; onTogglePin?: () => void;
  onDelete?: () => void;
}) {
  const { colors } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <TouchableOpacity
      onPress={() => {
        swipeableRef.current?.close();
        onDelete?.();
      }}
      accessibilityLabel="Delete recipe"
      activeOpacity={0.85}
      style={{
        width: 80,
        backgroundColor: '#FF3B30',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Trash2 size={22} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 4 }}>Delete</Text>
    </TouchableOpacity>
  );

  const rowContent = (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={`Open ${recipe.title}`}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.background }}
    >
      <Image source={{ uri: recipe.imageUri }} style={{ width: 56, height: 56, borderRadius: 12 }} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isPinned && <Pin size={12} color={colors.primary} />}
          <Text numberOfLines={1} style={{
            flex: 1, fontSize: TOKENS.typography.sizes.md, fontWeight: TOKENS.typography.weights.medium, color: colors.text,
          }}>
            {recipe.title}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Clock size={11} color={colors.textSecondary} />
            <Text style={{ fontSize: TOKENS.typography.sizes.xs, color: colors.textSecondary }}>
              {formatCookTime(recipe.cookTimeMinutes)}
            </Text>
          </View>
          {recipe.tags[0] && <Badge label={recipe.tags[0]} variant="dietary" tag={recipe.tags[0]} size="sm" />}
        </View>
      </View>
      {onTogglePin ? (
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation?.(); onTogglePin(); }}
          accessibilityLabel={isPinned ? 'Unpin recipe' : 'Pin recipe'}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ marginLeft: 8, padding: 4 }}
        >
          {isPinned
            ? <PinOff size={18} color={colors.primary} />
            : <Pin size={18} color={colors.textMuted} />}
        </TouchableOpacity>
      ) : (
        <ChevronRight size={16} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  if (!onDelete) return rowContent;

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      {rowContent}
    </Swipeable>
  );
}

// ─── Collection detail view ──────────────────────────────────

function CollectionDetail({ collection, recipes, pinnedIds, onBack, onRecipePress, onImport, onPin, onUnpin, onRemove, tabBarHeight }: {
  collection: RecipeCollection; recipes: Recipe[];
  pinnedIds: string[];
  onBack: () => void; onRecipePress: (id: string) => void;
  onImport: () => void;
  onPin: (id: string) => void; onUnpin: (id: string) => void;
  onRemove: (id: string) => void;
  tabBarHeight: number;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}>
      <View style={{
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
        backgroundColor: colors.primaryMuted,
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <TouchableOpacity onPress={onBack} accessibilityLabel="Go back to collections">
            <Text style={{ fontSize: TOKENS.typography.sizes.sm, fontWeight: TOKENS.typography.weights.semibold, color: colors.primary }}>
              ← Back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onImport}
            accessibilityLabel="Import recipe into this collection"
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
            }}
          >
            <Import size={13} color="#fff" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Import</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 40, marginBottom: 8 }}>{collection.emoji}</Text>
        <Text style={{ fontSize: TOKENS.typography.sizes['2xl'], fontWeight: TOKENS.typography.weights.bold, color: colors.text }}>
          {collection.name}
        </Text>
        {collection.description ? (
          <Text style={{ fontSize: TOKENS.typography.sizes.sm, color: colors.textSecondary, marginTop: 4 }}>
            {collection.description}
          </Text>
        ) : null}
        <Text style={{ fontSize: TOKENS.typography.sizes.xs, color: colors.textMuted, marginTop: 8 }}>
          {pluralize(recipes.length, 'recipe')}
        </Text>
      </View>
      {recipes.length === 0 ? (
        <EmptyState
          icon={BookmarkCheck}
          title="Empty collection"
          subtitle="Tap Import to add a YouTube recipe or any URL."
          ctaLabel="Import Recipe"
          onCta={onImport}
        />
      ) : (
        recipes.map((recipe) => {
          const isPinned = pinnedIds.includes(recipe.id);
          return (
            <RecipeListRow
              key={recipe.id}
              recipe={recipe}
              isPinned={isPinned}
              onPress={() => onRecipePress(recipe.id)}
              onTogglePin={() => isPinned ? onUnpin(recipe.id) : onPin(recipe.id)}
              onDelete={() => onRemove(recipe.id)}
            />
          );
        })
      )}
    </ScrollView>
  );
}
