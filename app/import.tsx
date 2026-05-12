import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Clipboard from 'expo-clipboard';
import { ChevronLeft, Clipboard as ClipboardIcon, Globe, Instagram, Play, Youtube, Plus, Check, Pin } from 'lucide-react-native';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { DietaryTagRow } from '../components/recipe/DietaryTagRow';
import { useRecipeStore } from '../stores/recipeStore';
import { collectionsApi } from '../lib/api/collections';
import { recipesApi } from '../lib/api/recipes';
import { useTheme } from '../hooks/useTheme';
import { TOKENS } from '../lib/tokens';
import type { DietaryTag, ImportSource, Recipe } from '../types';

const schema = z.object({
  url: z.string().min(1, 'Please enter a URL'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
});

type FormData = z.infer<typeof schema>;

function detectSource(url: string): ImportSource {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.startsWith('http')) return 'url';
  return 'manual';
}

const SOURCE_ICONS = {
  instagram: Instagram,
  tiktok: Play,
  youtube: Youtube,
  url: Globe,
  manual: ClipboardIcon,
};

const YOUTUBE_COLLECTION_NAME = 'YouTube Imports';
const YOUTUBE_COLLECTION_EMOJI = '▶️';

const IMPORT_PHASES = [
  'Fetching video from YouTube...',
  'Verifying content...',
  'Extracting recipe with AI...',
  'Finalizing...',
];

export default function ImportScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { collectionId: paramCollectionId, collectionName: paramCollectionName } =
    useLocalSearchParams<{ collectionId?: string; collectionName?: string }>();

  const { collections, fetchCollections, addToCollection, createCollection } = useRecipeStore();

  const [importing, setImporting] = useState(false);
  const [importPhase, setImportPhase] = useState(0);
  const [saving, setSaving] = useState(false);
  const [imported, setImported] = useState<Recipe | null>(null);
  const [selectedTags, setSelectedTags] = useState<DietaryTag[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(paramCollectionId ?? null);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColEmoji, setNewColEmoji] = useState('');

  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    phaseTimers.current.forEach(clearTimeout);
    if (!importing) { setImportPhase(0); return; }
    const delays = [1800, 3400, 5200];
    phaseTimers.current = delays.map((delay, i) =>
      setTimeout(() => setImportPhase(i + 1), delay)
    );
    return () => phaseTimers.current.forEach(clearTimeout);
  }, [importing]);

  const { control, watch, setValue, trigger, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { url: '', title: '' },
    });

  const urlValue = watch('url');
  const source = urlValue ? detectSource(urlValue) : 'manual';
  const SourceIcon = SOURCE_ICONS[source];
  const isYouTube = source === 'youtube';

  const pasteFromClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setValue('url', text);
  };

  const handleImport = async () => {
    const valid = await trigger('url');
    if (!valid) return;
    setImporting(true);
    try {
      const recipe = await recipesApi.importFromUrl(urlValue, source);
      setImported(recipe);
      setValue('title', recipe.title);
    } catch (e: unknown) {
      const msg = (e as { body?: { detail?: string } })?.body?.detail ?? 'Failed to import recipe. Check the URL and try again.';
      Alert.alert('Import failed', msg);
    } finally {
      setImporting(false);
    }
  };

  const findOrCreateYouTubeCollection = async (): Promise<string> => {
    const existing = collections.find((c) => c.name === YOUTUBE_COLLECTION_NAME);
    if (existing) return existing.id;
    const created = await collectionsApi.create({ name: YOUTUBE_COLLECTION_NAME, emoji: YOUTUBE_COLLECTION_EMOJI });
    useRecipeStore.setState((state) => ({ collections: [...state.collections, created] }));
    return created.id;
  };

  const handleCreateCollection = async () => {
    if (!newColName.trim()) return;
    await createCollection(newColName.trim(), newColEmoji.trim() || '📌');
    setNewColName('');
    setNewColEmoji('');
    setShowNewCollection(false);
  };

  const handleSave = async () => {
    if (!imported) return;
    setSaving(true);
    try {
      const final: Recipe = { ...imported, tags: selectedTags.length > 0 ? selectedTags : imported.tags };
      useRecipeStore.setState((state) => ({
        saved: state.saved.some((r) => r.id === final.id) ? state.saved : [final, ...state.saved],
      }));

      if (isYouTube) {
        const ytColId = await findOrCreateYouTubeCollection();
        await addToCollection(ytColId, final.id);
      }

      if (selectedCollectionId && !(isYouTube && selectedCollectionId === collections.find((c) => c.name === YOUTUBE_COLLECTION_NAME)?.id)) {
        await addToCollection(selectedCollectionId, final.id);
      }

      router.replace({ pathname: '/(tabs)/kitchen', params: { tab: 'recipes' } });
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const sectionLabel = (text: string) => (
    <Text style={{
      fontSize: TOKENS.typography.sizes.md,
      fontWeight: TOKENS.typography.weights.semibold,
      color: colors.text,
      marginTop: 20,
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
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: TOKENS.typography.sizes.xl, fontWeight: TOKENS.typography.weights.bold, color: colors.text }}>
            Import Recipe
          </Text>
          {paramCollectionName ? (
            <Text style={{ fontSize: 12, color: colors.primary, marginTop: 1 }}>
              Into: {paramCollectionName}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 16 }}>
          <Controller
            control={control}
            name="url"
            render={({ field: { value, onChange } }) => (
              <Input
                label="Recipe URL"
                placeholder="Paste a YouTube link..."
                value={value}
                onChangeText={onChange}
                error={errors.url?.message}
                leftIcon={<SourceIcon size={18} color={isYouTube ? '#FF0000' : colors.textSecondary} />}
                rightIcon={
                  <TouchableOpacity onPress={pasteFromClipboard} accessibilityLabel="Paste from clipboard">
                    <ClipboardIcon size={18} color={colors.primary} />
                  </TouchableOpacity>
                }
              />
            )}
          />
        </View>

        {!imported && !importing && (
          <Button label="Import Recipe" onPress={handleImport} variant="primary" fullWidth />
        )}

        {/* Phase-aware loading */}
        {importing && (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 20 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                {IMPORT_PHASES[Math.min(importPhase, IMPORT_PHASES.length - 1)]}
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                {IMPORT_PHASES.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: i <= importPhase ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: i <= importPhase ? colors.primary : colors.border,
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        )}

        {imported && !importing && (
          <View style={{ marginTop: 24 }}>
            {/* Thumbnail */}
            <View style={{ width: '100%', height: 200, borderRadius: 16, backgroundColor: colors.border, marginBottom: 16, overflow: 'hidden' }}>
              {imported.imageUri ? (
                <Image source={{ uri: imported.imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.textSecondary }}>No thumbnail</Text>
                </View>
              )}
            </View>

            <Controller
              control={control}
              name="title"
              render={({ field: { value, onChange } }) => (
                <Input label="Title" value={value} onChangeText={onChange} error={errors.title?.message} />
              )}
            />

            {/* Ingredients */}
            {sectionLabel(`Ingredients (${imported.ingredients.length})`)}
            {imported.ingredients.map((ing, idx) => (
              <View key={`${ing.name}-${idx}`} style={{
                flexDirection: 'row', justifyContent: 'space-between',
                paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
              }}>
                <Text style={{ fontSize: 14, color: colors.text, flex: 1 }}>{ing.name}</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  {ing.quantity > 0 ? `${ing.quantity} ` : ''}{ing.unit}
                </Text>
              </View>
            ))}

            {/* Steps */}
            {imported.steps && imported.steps.length > 0 && (
              <>
                {sectionLabel(`Instructions (${imported.steps.length} steps)`)}
                {imported.steps.map((step, idx) => (
                  <View key={idx} style={{
                    flexDirection: 'row', gap: 12, marginBottom: 14,
                    backgroundColor: colors.surface, borderRadius: 12,
                    padding: 14, ...TOKENS.shadows.sm,
                  }}>
                    <View style={{
                      width: 28, height: 28, borderRadius: 14, flexShrink: 0,
                      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22 }}>
                        {step.instruction}
                      </Text>
                      {step.timerMinutes ? (
                        <Text style={{ fontSize: 12, color: colors.primary, marginTop: 6, fontWeight: '600' }}>
                          ⏱ {step.timerMinutes} min
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Dietary tags */}
            {sectionLabel('Dietary Tags')}
            <DietaryTagRow
              tags={(['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'nut-free', 'low-carb', 'high-protein'] as DietaryTag[])}
              onTagPress={(tag) =>
                setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
              }
              selectedTags={selectedTags.length > 0 ? selectedTags : imported.tags}
            />

            {/* Collection picker */}
            {sectionLabel('Add to Collection')}

            {isYouTube && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: '#FF000012', borderRadius: 10,
                paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
              }}>
                <Youtube size={14} color="#FF0000" />
                <Text style={{ fontSize: 13, color: '#CC0000', flex: 1 }}>
                  Auto-added to <Text style={{ fontWeight: '700' }}>YouTube Imports</Text>
                </Text>
              </View>
            )}

            {paramCollectionName && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: colors.primaryMuted, borderRadius: 10,
                paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
              }}>
                <Pin size={14} color={colors.primary} />
                <Text style={{ fontSize: 13, color: colors.primary, flex: 1 }}>
                  Will be added to <Text style={{ fontWeight: '700' }}>{paramCollectionName}</Text>
                </Text>
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {collections.map((col) => {
                const isSelected = selectedCollectionId === col.id;
                const isParamCol = col.id === paramCollectionId;
                return (
                  <TouchableOpacity
                    key={col.id}
                    onPress={() => !isParamCol && setSelectedCollectionId(isSelected ? null : col.id)}
                    accessibilityLabel={`${isSelected ? 'Remove from' : 'Add to'} ${col.name}`}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: isParamCol ? 0.6 : 1,
                    }}
                  >
                    {isSelected && <Check size={12} color="#fff" />}
                    <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? '#fff' : colors.text }}>
                      {col.emoji} {col.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => setShowNewCollection((v) => !v)}
                accessibilityLabel="Create new collection"
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                  backgroundColor: colors.primaryMuted,
                  borderWidth: 1, borderColor: colors.primary,
                }}
              >
                <Plus size={13} color={colors.primary} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>New</Text>
              </TouchableOpacity>
            </ScrollView>

            {showNewCollection && (
              <View style={{
                marginTop: 12, padding: 14, borderRadius: 12,
                backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, gap: 10,
              }}>
                <Input placeholder="Collection name" value={newColName} onChangeText={setNewColName} />
                <Input placeholder="Emoji (e.g. 🍝)" value={newColEmoji} onChangeText={setNewColEmoji} />
                <Button label="Create" onPress={handleCreateCollection} variant="primary" fullWidth disabled={!newColName.trim()} />
              </View>
            )}

            <View style={{ marginTop: 32 }}>
              <Button label="Save to Kitchen" onPress={handleSave} variant="primary" fullWidth loading={saving} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
