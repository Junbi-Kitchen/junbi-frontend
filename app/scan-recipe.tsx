import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Camera, Images, Plus, Trash2 } from 'lucide-react-native';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { DietaryTagRow } from '../components/recipe/DietaryTagRow';
import { recipesApi } from '../lib/api/recipes';
import { useRecipeStore } from '../stores/recipeStore';
import { useTheme } from '../hooks/useTheme';
import { TOKENS } from '../lib/tokens';
import type { DietaryTag } from '../types';

type Phase = 'pick' | 'parsing' | 'review';

type IngredientRow = { name: string; quantity: string; unit: string };
type StepRow = { instruction: string; timerMinutes: string };

const ALL_TAGS: DietaryTag[] = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'nut-free', 'low-carb', 'high-protein'];
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export default function ScanRecipeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [phase, setPhase] = useState<Phase>('pick');
  const [capturedUri, setCapturedUri] = useState('');
  const [saving, setSaving] = useState(false);

  // Review form state (populated after parsing)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cookTimeMinutes, setCookTimeMinutes] = useState('30');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [tags, setTags] = useState<DietaryTag[]>([]);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [steps, setSteps] = useState<StepRow[]>([]);

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to scan a recipe.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      await parseImage(result.assets[0].uri);
    }
  };

  const launchLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      await parseImage(result.assets[0].uri);
    }
  };

  const parseImage = async (uri: string) => {
    setCapturedUri(uri);
    setPhase('parsing');
    try {
      const parsed = await recipesApi.parseImage(uri);
      setTitle(parsed.title ?? '');
      setDescription(parsed.description ?? '');
      setCookTimeMinutes(String(parsed.cookTimeMinutes ?? 30));
      setDifficulty((parsed.difficulty as 'easy' | 'medium' | 'hard') ?? 'medium');
      setTags((parsed.tags ?? []) as DietaryTag[]);
      setIngredients(
        (parsed.ingredients ?? []).map((ing) => ({
          name: (ing as { name: string }).name ?? '',
          quantity: String((ing as { quantity: number }).quantity ?? ''),
          unit: (ing as { unit: string }).unit ?? '',
        }))
      );
      setSteps(
        (parsed.steps ?? []).map((s) => ({
          instruction: (s as { instruction: string }).instruction ?? '',
          timerMinutes: (s as { timerMinutes?: number }).timerMinutes ? String((s as { timerMinutes: number }).timerMinutes) : '',
        }))
      );
      setPhase('review');
    } catch {
      Alert.alert('Parsing failed', 'Could not extract a recipe from this image. Try a clearer photo.');
      setPhase('pick');
    }
  };

  const addIngredient = () => setIngredients((p) => [...p, { name: '', quantity: '', unit: '' }]);
  const removeIngredient = (i: number) => setIngredients((p) => p.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, field: keyof IngredientRow, value: string) =>
    setIngredients((p) => p.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const addStep = () => setSteps((p) => [...p, { instruction: '', timerMinutes: '' }]);
  const removeStep = (i: number) => setSteps((p) => p.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: keyof StepRow, value: string) =>
    setSteps((p) => p.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const onSave = async () => {
    const filledIngredients = ingredients.filter((i) => i.name.trim());
    const filledSteps = steps.filter((s) => s.instruction.trim());
    if (!title.trim()) { Alert.alert('Missing title', 'Add a recipe title.'); return; }
    if (filledSteps.length === 0) { Alert.alert('Missing steps', 'Add at least one step.'); return; }
    setSaving(true);
    try {
      const created = await recipesApi.create({
        title: title.trim(),
        description,
        cookTimeMinutes: parseInt(cookTimeMinutes) || 30,
        difficulty,
        importedFrom: 'manual',
        tags,
        ingredients: filledIngredients.map((i) => ({
          name: i.name.trim(),
          quantity: parseFloat(i.quantity) || 0,
          unit: i.unit.trim(),
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
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back" style={{ marginRight: 12 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: TOKENS.typography.sizes.xl, fontWeight: TOKENS.typography.weights.bold, color: colors.text }}>
          {phase === 'review' ? 'Review Recipe' : 'Scan a Recipe'}
        </Text>
      </View>

      {/* Pick phase */}
      {phase === 'pick' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: 32, gap: 16 }}>
          <Text style={{ fontSize: TOKENS.typography.sizes.md, color: colors.textSecondary, textAlign: 'center', marginBottom: 8 }}>
            Take a photo or choose an image of any recipe — a cookbook page, printed card, or screenshot.
          </Text>
          <Button
            label="Take Photo"
            onPress={launchCamera}
            variant="primary"
            fullWidth
          />
          <Button
            label="Choose from Library"
            onPress={launchLibrary}
            variant="ghost"
            fullWidth
          />
        </View>
      )}

      {/* Parsing phase */}
      {phase === 'parsing' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          {capturedUri ? (
            <Image
              source={{ uri: capturedUri }}
              style={{ width: 200, height: 200, borderRadius: 16, opacity: 0.5 }}
              resizeMode="cover"
            />
          ) : null}
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Extracting recipe...</Text>
        </View>
      )}

      {/* Review phase */}
      {phase === 'review' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          {/* Captured photo thumbnail + retake */}
          {capturedUri ? (
            <View style={{ marginBottom: 20 }}>
              <Image source={{ uri: capturedUri }} style={{ width: '100%', height: 160, borderRadius: 16 }} resizeMode="cover" />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={launchCamera}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Camera size={14} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 13 }}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={launchLibrary}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Images size={14} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 13 }}>Choose different</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Title */}
          <Input label="Recipe title" value={title} onChangeText={setTitle} placeholder="Recipe title" />

          {/* Description */}
          <View style={{ marginTop: 12 }}>
            <Input label="Description (optional)" value={description} onChangeText={setDescription} placeholder="A short summary..." multiline numberOfLines={2} />
          </View>

          {/* Cook time + Difficulty */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Input label="Cook time (min)" value={cookTimeMinutes} onChangeText={setCookTimeMinutes} keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: TOKENS.typography.sizes.sm, color: colors.textSecondary, marginBottom: 6 }}>Difficulty</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {DIFFICULTIES.map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDifficulty(d)}
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
            </View>
          </View>

          {/* Ingredients */}
          {sectionLabel(`Ingredients (${ingredients.filter((i) => i.name).length})`)}
          {ingredients.map((ing, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <View style={{ flex: 3 }}>
                <Input placeholder="Ingredient" value={ing.name} onChangeText={(v) => updateIngredient(i, 'name', v)} />
              </View>
              <View style={{ flex: 1.2 }}>
                <Input placeholder="Qty" value={ing.quantity} onChangeText={(v) => updateIngredient(i, 'quantity', v)} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1.2 }}>
                <Input placeholder="Unit" value={ing.unit} onChangeText={(v) => updateIngredient(i, 'unit', v)} />
              </View>
              {ingredients.length > 1 && (
                <TouchableOpacity onPress={() => removeIngredient(i)} accessibilityLabel="Remove ingredient">
                  <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
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
                <View style={{ width: 26, height: 26, borderRadius: 13, marginTop: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Input placeholder="Describe this step..." value={step.instruction} onChangeText={(v) => updateStep(i, 'instruction', v)} multiline numberOfLines={2} />
                </View>
                {steps.length > 1 && (
                  <TouchableOpacity onPress={() => removeStep(i)} accessibilityLabel="Remove step" style={{ marginTop: 14 }}>
                    <Trash2 size={18} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ marginLeft: 36, marginTop: 6 }}>
                <Input placeholder="Timer (min, optional)" value={step.timerMinutes} onChangeText={(v) => updateStep(i, 'timerMinutes', v)} keyboardType="number-pad" />
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
            onTagPress={(tag) =>
              setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
            }
          />

          {/* Save */}
          <View style={{ marginTop: 32 }}>
            <Button label="Save to Kitchen" onPress={onSave} variant="primary" fullWidth loading={saving} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
