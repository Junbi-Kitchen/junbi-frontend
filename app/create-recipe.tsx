import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Plus, Trash2, ImagePlus, ChevronDown, X } from 'lucide-react-native';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { DietaryTagRow } from '../components/recipe/DietaryTagRow';
import { recipesApi } from '../lib/api/recipes';
import { pantryApi } from '../lib/api/pantry';
import { useRecipeStore } from '../stores/recipeStore';
import { useTheme } from '../hooks/useTheme';
import { TOKENS } from '../lib/tokens';
import type { DietaryTag } from '../types';

const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  cookTimeMinutes: z.coerce.number().min(1).max(1440).default(30),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

type FormData = z.infer<typeof schema>;
type IngredientRow = { name: string; quantity: string; unit: string };
type StepRow = { instruction: string; timerMinutes: string };

const DIFFICULTIES: FormData['difficulty'][] = ['easy', 'medium', 'hard'];
const ALL_TAGS: DietaryTag[] = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'nut-free', 'low-carb', 'high-protein'];

const UNIT_GROUPS = [
  { label: 'Volume', units: ['tsp', 'tbsp', 'cup', 'fl oz', 'ml', 'L'] },
  { label: 'Weight', units: ['g', 'kg', 'oz', 'lb'] },
  { label: 'Count', units: ['piece', 'whole', 'clove', 'slice', 'pinch', 'can', 'bunch', 'sprig', 'fillet', 'strip', 'sheet'] },
];
const ALL_UNITS = UNIT_GROUPS.flatMap((g) => g.units);

// ─── Unit picker modal ────────────────────────────────────────

function UnitPickerModal({ value, onSelect, onClose }: {
  value: string;
  onSelect: (unit: string) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1}>
          <View style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            paddingTop: 16, paddingBottom: 36,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Select Unit</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {UNIT_GROUPS.map((group) => (
              <View key={group.label}>
                <Text style={{
                  fontSize: 11, fontWeight: '700', color: colors.textMuted,
                  textTransform: 'uppercase', letterSpacing: 0.8,
                  paddingHorizontal: 20, paddingVertical: 8,
                }}>
                  {group.label}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 4 }}>
                  {group.units.map((unit) => {
                    const selected = value === unit;
                    return (
                      <TouchableOpacity
                        key={unit}
                        onPress={() => { onSelect(unit); onClose(); }}
                        style={{
                          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                          backgroundColor: selected ? colors.primary : colors.inputBg,
                          borderWidth: selected ? 0 : 1, borderColor: colors.border,
                        }}
                      >
                        <Text style={{
                          fontSize: 14, fontWeight: selected ? '700' : '500',
                          color: selected ? '#fff' : colors.text,
                        }}>
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Ingredient row with autocomplete ────────────────────────

function IngredientInputRow({ ing, index, showDelete, onUpdate, onRemove }: {
  ing: IngredientRow;
  index: number;
  showDelete: boolean;
  onUpdate: (field: keyof IngredientRow, value: string) => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [unitPickerOpen, setUnitPickerOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNameChange = useCallback((text: string) => {
    onUpdate('name', text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await pantryApi.searchIngredients(text);
        const names = results.map((r) => r.name).filter((n) => n.toLowerCase() !== text.toLowerCase());
        setSuggestions(names.slice(0, 6));
        setShowSuggestions(names.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 280);
  }, [onUpdate]);

  const selectSuggestion = (name: string) => {
    onUpdate('name', name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {/* Name with autocomplete */}
        <View style={{ flex: 3 }}>
          <TextInput
            placeholder="Ingredient"
            placeholderTextColor={colors.textMuted}
            value={ing.name}
            onChangeText={handleNameChange}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            style={{
              backgroundColor: colors.inputBg,
              borderWidth: 1, borderColor: colors.border,
              borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11,
              fontSize: 14, color: colors.text,
            }}
          />
          {showSuggestions && (
            <View style={{
              position: 'absolute', top: 44, left: 0, right: 0, zIndex: 999,
              backgroundColor: colors.surface, borderRadius: 10,
              borderWidth: 1, borderColor: colors.border,
              overflow: 'hidden',
              shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            }}>
              {suggestions.map((name) => (
                <TouchableOpacity
                  key={name}
                  onPress={() => selectSuggestion(name)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 11,
                    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
                  }}
                >
                  <Text style={{ fontSize: 14, color: colors.text }}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quantity */}
        <View style={{ flex: 1 }}>
          <TextInput
            placeholder="Qty"
            placeholderTextColor={colors.textMuted}
            value={ing.quantity}
            onChangeText={(v) => onUpdate('quantity', v)}
            keyboardType="decimal-pad"
            style={{
              backgroundColor: colors.inputBg,
              borderWidth: 1, borderColor: colors.border,
              borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11,
              fontSize: 14, color: colors.text,
            }}
          />
        </View>

        {/* Unit picker button */}
        <TouchableOpacity
          onPress={() => setUnitPickerOpen(true)}
          accessibilityLabel="Select unit"
          style={{
            flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
            borderRadius: 10, paddingHorizontal: 10, paddingVertical: 11,
          }}
        >
          <Text style={{
            fontSize: 14, color: ing.unit ? colors.text : colors.textMuted,
            flex: 1,
          }} numberOfLines={1}>
            {ing.unit || 'Unit'}
          </Text>
          <ChevronDown size={13} color={colors.textMuted} />
        </TouchableOpacity>

        {showDelete && (
          <TouchableOpacity onPress={onRemove} accessibilityLabel="Remove ingredient" style={{ paddingBottom: 2 }}>
            <Trash2 size={18} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {unitPickerOpen && (
        <UnitPickerModal
          value={ing.unit}
          onSelect={(unit) => onUpdate('unit', unit)}
          onClose={() => setUnitPickerOpen(false)}
        />
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────

export default function CreateRecipeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { saved } = useRecipeStore();
  const [saving, setSaving] = useState(false);
  const [imageUri, setImageUri] = useState('');
  const [tags, setTags] = useState<DietaryTag[]>([]);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([{ name: '', quantity: '', unit: '' }]);
  const [steps, setSteps] = useState<StepRow[]>([{ instruction: '', timerMinutes: '' }]);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', cookTimeMinutes: 30, difficulty: 'medium' },
  });

  const difficulty = watch('difficulty');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const addIngredient = () => setIngredients((prev) => [...prev, { name: '', quantity: '', unit: '' }]);
  const removeIngredient = (i: number) => setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, field: keyof IngredientRow, value: string) =>
    setIngredients((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const addStep = () => setSteps((prev) => [...prev, { instruction: '', timerMinutes: '' }]);
  const removeStep = (i: number) => setSteps((prev) => prev.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: keyof StepRow, value: string) =>
    setSteps((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const onSave = async (data: FormData) => {
    const filledIngredients = ingredients.filter((i) => i.name.trim());
    const filledSteps = steps.filter((s) => s.instruction.trim());
    if (filledIngredients.length === 0) { Alert.alert('Missing ingredients', 'Add at least one ingredient.'); return; }
    if (filledSteps.length === 0) { Alert.alert('Missing steps', 'Add at least one step.'); return; }
    setSaving(true);
    try {
      const created = await recipesApi.create({
        title: data.title,
        description: data.description ?? '',
        cookTimeMinutes: data.cookTimeMinutes,
        difficulty: data.difficulty,
        importedFrom: 'manual',
        imageUri,
        tags,
        ingredients: filledIngredients.map((i) => ({
          name: i.name.trim().toLowerCase(),
          quantity: parseFloat(i.quantity) || 0,
          unit: i.unit,
        })),
        steps: filledSteps.map((s, idx) => ({
          stepNumber: idx + 1,
          instruction: s.instruction.trim(),
          timerMinutes: parseInt(s.timerMinutes) || undefined,
        })),
      });
      useRecipeStore.setState((state) => ({
        saved: state.saved.some((r) => r.id === created.id) ? state.saved : [created, ...state.saved],
      }));
      router.replace({ pathname: '/(tabs)/kitchen', params: { tab: 'recipes' } });
    } catch {
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const sectionLabel = (text: string) => (
    <Text style={{
      fontSize: TOKENS.typography.sizes.md,
      fontWeight: TOKENS.typography.weights.semibold,
      color: colors.text,
      marginTop: 24,
      marginBottom: 10,
    }}>
      {text}
    </Text>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back" style={{ marginRight: 12 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: TOKENS.typography.sizes.xl, fontWeight: TOKENS.typography.weights.bold, color: colors.text }}>
          Create Recipe
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cover photo */}
        <TouchableOpacity
          onPress={pickImage}
          accessibilityLabel="Pick cover photo"
          style={{
            width: '100%', height: 180, borderRadius: 16,
            backgroundColor: colors.border, marginBottom: 20,
            overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <ImagePlus size={28} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Add cover photo (optional)</Text>
            </View>
          )}
        </TouchableOpacity>

        <Controller
          control={control}
          name="title"
          render={({ field: { value, onChange } }) => (
            <Input label="Recipe title" placeholder="e.g. Spicy Chicken Tacos" value={value} onChangeText={onChange} error={errors.title?.message} />
          )}
        />

        <View style={{ marginTop: 12 }}>
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange } }) => (
              <Input label="Description (optional)" placeholder="A short summary..." value={value ?? ''} onChangeText={onChange} multiline numberOfLines={3} />
            )}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="cookTimeMinutes"
              render={({ field: { value, onChange } }) => (
                <Input label="Cook time (min)" placeholder="30" value={String(value)} onChangeText={onChange} keyboardType="number-pad" error={errors.cookTimeMinutes?.message} />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: TOKENS.typography.sizes.sm, color: colors.textSecondary, marginBottom: 6 }}>Difficulty</Text>
            <Controller
              control={control}
              name="difficulty"
              render={({ field: { onChange } }) => (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {DIFFICULTIES.map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => onChange(d)}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center',
                        backgroundColor: difficulty === d ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '600', textTransform: 'capitalize', color: difficulty === d ? '#fff' : colors.textSecondary }}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>
        </View>

        {/* Ingredients */}
        {sectionLabel(`Ingredients (${ingredients.filter((i) => i.name).length})`)}
        {ingredients.map((ing, i) => (
          <IngredientInputRow
            key={i}
            ing={ing}
            index={i}
            showDelete={ingredients.length > 1}
            onUpdate={(field, value) => updateIngredient(i, field, value)}
            onRemove={() => removeIngredient(i)}
          />
        ))}
        <TouchableOpacity onPress={addIngredient} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Plus size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Add ingredient</Text>
        </TouchableOpacity>

        {/* Steps */}
        {sectionLabel(`Steps (${steps.filter((s) => s.instruction).length})`)}
        {steps.map((step, i) => (
          <View key={i} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{
                width: 26, height: 26, borderRadius: 13, marginTop: 12,
                backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Describe this step..."
                  value={step.instruction}
                  onChangeText={(v) => updateStep(i, 'instruction', v)}
                  multiline
                  numberOfLines={2}
                />
              </View>
              {steps.length > 1 && (
                <TouchableOpacity onPress={() => removeStep(i)} accessibilityLabel="Remove step" style={{ marginTop: 14 }}>
                  <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
            <View style={{ marginLeft: 36, marginTop: 6 }}>
              <Input
                placeholder="Timer (min, optional)"
                value={step.timerMinutes}
                onChangeText={(v) => updateStep(i, 'timerMinutes', v)}
                keyboardType="number-pad"
              />
            </View>
          </View>
        ))}
        <TouchableOpacity onPress={addStep} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Plus size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Add step</Text>
        </TouchableOpacity>

        {/* Dietary tags */}
        {sectionLabel('Dietary Tags')}
        <DietaryTagRow
          tags={ALL_TAGS}
          selectedTags={tags}
          onTagPress={(tag) => setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
        />

        <View style={{ marginTop: 32 }}>
          <Button label="Save to Kitchen" onPress={handleSubmit(onSave)} variant="primary" fullWidth loading={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
