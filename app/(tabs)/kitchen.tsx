// Purpose: Kitchen tab — combines pantry management + recipe collections with segmented control

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import {
  BookmarkCheck,
  Plus,
  ChevronRight,
  Clock,
  Heart,
  User,
  Camera,
  Import,
  PenLine,
  ChefHat,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BottomSheetWrapper } from '../../components/ui/BottomSheetWrapper';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { FreshnessBar } from '../../components/pantry/FreshnessBar';
import { PantrySection } from '../../components/pantry/PantrySection';
import { ManualAddSheet } from '../../components/pantry/ManualAddSheet';
import { ReceiptScanModal } from '../../components/pantry/ReceiptScanModal';
import { SavedToast } from '../../components/shared/SavedToast';
import { usePantry } from '../../hooks/usePantry';
import { useRecipeStore } from '../../stores/recipeStore';
import { useSavingsStore } from '../../stores/savingsStore';
import { TOKENS } from '../../lib/tokens';
import { formatCookTime, pluralize, getDaysUntilExpiry } from '../../lib/utils';
import type { Recipe, RecipeCollection, PantryItem, IngredientCategory } from '../../types';

const { width: W } = Dimensions.get('window');
const PANTRY_CARD_WIDTH = (W - 48 - 12) / 3;
const RECIPE_CARD_WIDTH = (W - 48 - 12) / 2;

// Simplified pantry filter categories
const PANTRY_FILTERS: { key: string; label: string; categories: IngredientCategory[] }[] = [
  { key: 'all', label: 'All', categories: [] },
  { key: 'fridge', label: 'Fridge', categories: ['produce', 'dairy', 'proteins', 'beverages', 'condiments'] },
  { key: 'freezer', label: 'Freezer', categories: ['frozen'] },
  { key: 'pantry', label: 'Pantry', categories: ['grains', 'pantry', 'bakery'] },
  { key: 'spices', label: 'Spices', categories: ['spices'] },
];

type TabView = 'pantry' | 'recipes';

export default function KitchenScreen() {
  const router = useRouter();
  const [loading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabView>('pantry');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const [scanVisible, setScanVisible] = useState(false);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [toastAmount, setToastAmount] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);

  // Recipe state
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');

  const addSheetRef = useRef<BottomSheet>(null);
  const itemSheetRef = useRef<BottomSheet>(null);
  const manualAddRef = useRef<BottomSheet>(null);
  const newCollectionRef = useRef<BottomSheet>(null);

  const { items, logAction, updateQuantity, removeItem } = usePantry();
  const { logUsed, logTossed } = useSavingsStore();
  const {
    saved,
    collections,
    createCollection,
    getRecipesForCollection,
  } = useRecipeStore();

  // ─── Pantry items filtered + sorted by urgency ────────────

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

  // ─── Handlers ─────────────────────────────────────────────

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

  // ─── Skeleton ─────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
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

  // ─── Collection detail subview ────────────────────────────

  if (activeCollection) {
    const col = collections.find((c) => c.id === activeCollection);
    const colRecipes = col ? getRecipesForCollection(col.id) : [];
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
        <CollectionDetail
          collection={col!}
          recipes={colRecipes}
          onBack={() => setActiveCollection(null)}
          onRecipePress={(id) => router.push(`/recipe/${id}`)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: TOKENS.typography.sizes['2xl'],
              fontWeight: TOKENS.typography.weights.bold,
              color: TOKENS.colors.text,
            }}
          >
            Kitchen
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => addSheetRef.current?.expand()}
              accessibilityLabel="Add new item"
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                backgroundColor: TOKENS.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={18} color={TOKENS.colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              accessibilityLabel="Open profile"
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                backgroundColor: TOKENS.colors.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={18} color={TOKENS.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Segmented control */}
        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: 20,
            backgroundColor: TOKENS.colors.inputBg,
            borderRadius: 12,
            padding: 4,
            marginBottom: 16,
          }}
        >
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
                backgroundColor: activeTab === tab ? TOKENS.colors.white : 'transparent',
                ...(activeTab === tab ? TOKENS.shadows.sm : {}),
              }}
            >
              <Text
                style={{
                  fontSize: TOKENS.typography.sizes.sm,
                  fontWeight: activeTab === tab ? TOKENS.typography.weights.semibold : TOKENS.typography.weights.regular,
                  color: activeTab === tab ? TOKENS.colors.text : TOKENS.colors.textSecondary,
                }}
              >
                {tab === 'pantry' ? 'My Pantry' : 'Recipes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── PANTRY VIEW ───────────────────────────────── */}
        {activeTab === 'pantry' && (
          <>
            {/* Category filter chips */}
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
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: isActive ? TOKENS.colors.primary : TOKENS.colors.white,
                      borderWidth: isActive ? 0 : 1,
                      borderColor: TOKENS.colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: TOKENS.typography.sizes.sm,
                        fontWeight: TOKENS.typography.weights.medium,
                        color: isActive ? TOKENS.colors.white : TOKENS.colors.text,
                      }}
                    >
                      {filter.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: isActive ? 'rgba(255,255,255,0.7)' : TOKENS.colors.textMuted,
                      }}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Pantry sections grouped by category */}
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
                subtitle={activeFilter !== 'all' ? 'No items in this category.' : 'Scan a receipt to get started — I\'ll track everything for you.'}
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
            <TouchableOpacity
              onPress={() => {}}
              accessibilityLabel="View all saved recipes"
              style={{
                marginHorizontal: 20,
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: TOKENS.colors.primaryMuted,
                ...TOKENS.shadows.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
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

            {/* Collections */}
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
                onPress={() => newCollectionRef.current?.expand()}
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
                {collections.map((col) => {
                  const colRecipes = getRecipesForCollection(col.id);
                  const coverImage = colRecipes[0]?.imageUri ?? col.coverImageUri;
                  return (
                    <TouchableOpacity
                      key={col.id}
                      onPress={() => setActiveCollection(col.id)}
                      accessibilityLabel={`Open ${col.name} collection`}
                      style={{
                        width: RECIPE_CARD_WIDTH,
                        borderRadius: 16,
                        backgroundColor: TOKENS.colors.white,
                        overflow: 'hidden',
                        ...TOKENS.shadows.sm,
                      }}
                    >
                      {coverImage ? (
                        <Image source={{ uri: coverImage }} style={{ width: RECIPE_CARD_WIDTH, height: 100 }} />
                      ) : (
                        <View
                          style={{
                            width: RECIPE_CARD_WIDTH,
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
                          numberOfLines={1}
                          style={{
                            fontSize: TOKENS.typography.sizes.sm,
                            fontWeight: TOKENS.typography.weights.semibold,
                            color: TOKENS.colors.text,
                          }}
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
          </>
        )}
      </ScrollView>

      {/* ─── Bottom Sheets ───────────────────────────────── */}

      {/* Add options sheet (+ button in header) */}
      <BottomSheetWrapper sheetRef={addSheetRef} snapPoints={['30%']} initialIndex={-1}>
        <View style={{ padding: 20, gap: 4 }}>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.lg,
              fontWeight: TOKENS.typography.weights.bold,
              color: TOKENS.colors.text,
              marginBottom: 12,
            }}
          >
            Add to Kitchen
          </Text>
          <AddOptionRow
            icon={Camera}
            label="Scan receipt"
            onPress={() => {
              addSheetRef.current?.close();
              setScanVisible(true);
            }}
          />
          <AddOptionRow
            icon={PenLine}
            label="Add item manually"
            onPress={() => {
              addSheetRef.current?.close();
              setTimeout(() => manualAddRef.current?.expand(), 300);
            }}
          />
          <AddOptionRow
            icon={Import}
            label="Import recipe"
            onPress={() => {
              addSheetRef.current?.close();
              router.push('/import');
            }}
          />
        </View>
      </BottomSheetWrapper>

      {/* Item detail sheet */}
      <BottomSheetWrapper
        sheetRef={itemSheetRef}
        snapPoints={['40%']}
        initialIndex={-1}
        onClose={() => setSelectedItem(null)}
      >
        {selectedItem && (
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            {/* Item info */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: TOKENS.colors.inputBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 24 }}>{getItemEmoji(selectedItem.category)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: TOKENS.typography.sizes.lg,
                    fontWeight: TOKENS.typography.weights.bold,
                    color: TOKENS.colors.text,
                  }}
                >
                  {selectedItem.name}
                </Text>
                <Text
                  style={{
                    fontSize: TOKENS.typography.sizes.sm,
                    color: TOKENS.colors.textSecondary,
                    marginTop: 2,
                  }}
                >
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

            {/* Actions */}
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  itemSheetRef.current?.close();
                  // TODO: navigate to recipes filtered by this ingredient
                }}
                accessibilityLabel={`Cook with ${selectedItem.name}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: TOKENS.colors.primaryMuted,
                }}
              >
                <UtensilsCrossed size={18} color={TOKENS.colors.primary} />
                <Text
                  style={{
                    fontSize: TOKENS.typography.sizes.md,
                    fontWeight: TOKENS.typography.weights.semibold,
                    color: TOKENS.colors.primary,
                  }}
                >
                  Cook with this
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={handleMarkUsed}
                  accessibilityLabel="Mark as used"
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: TOKENS.colors.successLight,
                  }}
                >
                  <ChefHat size={16} color={TOKENS.colors.success} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: TOKENS.colors.success }}>
                    Used it
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTossed}
                  accessibilityLabel="Mark as tossed"
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: TOKENS.colors.errorLight,
                  }}
                >
                  <Trash2 size={16} color={TOKENS.colors.error} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: TOKENS.colors.error }}>
                    Tossed it
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </BottomSheetWrapper>

      {/* Manual add sheet */}
      <BottomSheetWrapper sheetRef={manualAddRef} snapPoints={['80%']} initialIndex={-1} keyboardBehavior="interactive">
        <ManualAddSheet onClose={() => manualAddRef.current?.close()} />
      </BottomSheetWrapper>

      {/* New collection sheet */}
      <BottomSheetWrapper sheetRef={newCollectionRef} snapPoints={['45%']} initialIndex={-1}>
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

      {/* Receipt scan */}
      <ReceiptScanModal visible={scanVisible} onClose={() => setScanVisible(false)} />

      {/* Saved toast */}
      <SavedToast
        amount={toastAmount}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Helper: emoji for pantry categories ─────────────────────

function getItemEmoji(category: IngredientCategory): string {
  const map: Record<IngredientCategory, string> = {
    produce: '🥬',
    proteins: '🍗',
    dairy: '🥛',
    grains: '🌾',
    pantry: '🥫',
    frozen: '🧊',
    beverages: '🧃',
    condiments: '🫙',
    spices: '🌶️',
    bakery: '🍞',
  };
  return map[category] ?? '🍽️';
}

// ─── Add option row ──────────────────────────────────────────

function AddOptionRow({
  icon: Icon,
  label,
  onPress,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderRadius: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: TOKENS.colors.inputBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color={TOKENS.colors.text} />
      </View>
      <Text
        style={{
          fontSize: TOKENS.typography.sizes.md,
          fontWeight: TOKENS.typography.weights.medium,
          color: TOKENS.colors.text,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Recipe list row ─────────────────────────────────────────

function RecipeListRow({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={`Open ${recipe.title}`}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 }}
    >
      <Image source={{ uri: recipe.imageUri }} style={{ width: 56, height: 56, borderRadius: 12 }} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: TOKENS.typography.sizes.md,
            fontWeight: TOKENS.typography.weights.medium,
            color: TOKENS.colors.text,
          }}
        >
          {recipe.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Clock size={11} color={TOKENS.colors.textSecondary} />
            <Text style={{ fontSize: TOKENS.typography.sizes.xs, color: TOKENS.colors.textSecondary }}>
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

// ─── Collection detail view ──────────────────────────────────

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
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
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
        <TouchableOpacity onPress={onBack} accessibilityLabel="Go back to collections" style={{ marginBottom: 12 }}>
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
          <Text style={{ fontSize: TOKENS.typography.sizes.sm, color: TOKENS.colors.textSecondary, marginTop: 4 }}>
            {collection.description}
          </Text>
        ) : null}
        <Text style={{ fontSize: TOKENS.typography.sizes.xs, color: TOKENS.colors.textMuted, marginTop: 8 }}>
          {pluralize(recipes.length, 'recipe')}
        </Text>
      </View>
      {recipes.length === 0 ? (
        <EmptyState icon={BookmarkCheck} title="Empty collection" subtitle="Save recipes and add them here." />
      ) : (
        recipes.map((recipe) => (
          <RecipeListRow key={recipe.id} recipe={recipe} onPress={() => onRecipePress(recipe.id)} />
        ))
      )}
    </ScrollView>
  );
}
