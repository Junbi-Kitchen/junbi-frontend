// Purpose: Recipe import flow with URL detection, simulated fetch, and editable recipe form

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Clipboard from 'expo-clipboard';
import { ChevronLeft, Clipboard as ClipboardIcon, Globe, Instagram, Play } from 'lucide-react-native';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { Badge } from '../components/ui/Badge';
import { DietaryTagRow } from '../components/recipe/DietaryTagRow';
import { useRecipeStore } from '../stores/recipeStore';
import { TOKENS } from '../lib/tokens';
import { MOCK_RECIPES } from '../lib/mockData';
import type { DietaryTag, ImportSource, Recipe } from '../types';

const schema = z.object({
  url: z.string().min(1, 'Please enter a URL or paste recipe content'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
});

type FormData = z.infer<typeof schema>;

function detectSource(url: string): ImportSource {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.startsWith('http')) return 'url';
  return 'manual';
}

const SOURCE_ICONS = {
  instagram: Instagram,
  tiktok: Play,
  url: Globe,
  manual: ClipboardIcon,
};

export default function ImportScreen() {
  const router = useRouter();
  const { addToImportQueue, loadFeed } = useRecipeStore();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<Recipe | null>(null);
  const [selectedTags, setSelectedTags] = useState<DietaryTag[]>([]);

  const { control, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { url: '', title: '' },
    });

  const urlValue = watch('url');
  const source = urlValue ? detectSource(urlValue) : 'manual';
  const SourceIcon = SOURCE_ICONS[source];

  const pasteFromClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setValue('url', text);
  };

  const handleImport = async () => {
    setImporting(true);
    // Simulate a 1.5s fetch
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock: pick a random recipe as the "imported" result
    const mock = MOCK_RECIPES[Math.floor(Math.random() * MOCK_RECIPES.length)];
    setImported({
      ...mock,
      id: `import-${Date.now()}`,
      importedFrom: source,
      savedAt: new Date().toISOString(),
    });
    setValue('title', mock.title);
    setImporting(false);
  };

  const handleSave = () => {
    if (!imported) return;
    const final: Recipe = {
      ...imported,
      tags: selectedTags.length > 0 ? selectedTags : imported.tags,
    };
    addToImportQueue(final);
    useRecipeStore.getState().saveRecipe(final);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          style={{ marginRight: 12 }}
        >
          <ChevronLeft size={24} color={TOKENS.colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.xl,
            fontWeight: TOKENS.typography.weights.bold,
            color: TOKENS.colors.text,
          }}
        >
          Import Recipe
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* URL input */}
        <View style={{ marginBottom: 16 }}>
          <Controller
            control={control}
            name="url"
            render={({ field: { value, onChange } }) => (
              <Input
                label="Recipe URL or content"
                placeholder="https://... or paste recipe text"
                value={value}
                onChangeText={onChange}
                error={errors.url?.message}
                leftIcon={<SourceIcon size={18} color={TOKENS.colors.textSecondary} />}
                rightIcon={
                  <TouchableOpacity
                    onPress={pasteFromClipboard}
                    accessibilityLabel="Paste from clipboard"
                  >
                    <ClipboardIcon size={18} color={TOKENS.colors.primary} />
                  </TouchableOpacity>
                }
              />
            )}
          />
        </View>

        {!imported && (
          <Button
            label="Import Recipe"
            onPress={handleSubmit(handleImport)}
            variant="primary"
            fullWidth
            loading={importing}
          />
        )}

        {/* Loading skeleton */}
        {importing && (
          <View style={{ gap: 12, marginTop: 24 }}>
            <SkeletonLoader width="100%" height={200} borderRadius={16} />
            <SkeletonLoader width="70%" height={28} borderRadius={8} />
            <SkeletonLoader width="100%" height={80} borderRadius={12} />
          </View>
        )}

        {/* Imported form */}
        {imported && !importing && (
          <View style={{ marginTop: 24 }}>
            {/* Image preview */}
            <View
              style={{
                width: '100%',
                height: 200,
                borderRadius: 16,
                backgroundColor: TOKENS.colors.border,
                marginBottom: 16,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: TOKENS.colors.textSecondary }}>
                  Image Preview
                </Text>
              </View>
            </View>

            {/* Title */}
            <Controller
              control={control}
              name="title"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Title"
                  value={value}
                  onChangeText={onChange}
                  error={errors.title?.message}
                />
              )}
            />

            {/* Ingredients preview */}
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.md,
                fontWeight: TOKENS.typography.weights.semibold,
                color: TOKENS.colors.text,
                marginTop: 20,
                marginBottom: 10,
              }}
            >
              Ingredients ({imported.ingredients.length})
            </Text>
            {imported.ingredients.map((ing) => (
              <View
                key={ing.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: TOKENS.colors.borderLight,
                }}
              >
                <Text style={{ fontSize: 14, color: TOKENS.colors.text }}>{ing.name}</Text>
                <Text style={{ fontSize: 14, color: TOKENS.colors.textSecondary }}>
                  {ing.quantity} {ing.unit}
                </Text>
              </View>
            ))}

            {/* Dietary tags */}
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.md,
                fontWeight: TOKENS.typography.weights.semibold,
                color: TOKENS.colors.text,
                marginTop: 20,
                marginBottom: 10,
              }}
            >
              Dietary Tags
            </Text>
            <DietaryTagRow
              tags={(['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'keto', 'paleo'] as DietaryTag[])}
              onTagPress={(tag) =>
                setSelectedTags((prev) =>
                  prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                )
              }
              selectedTags={selectedTags}
            />

            <View style={{ marginTop: 32 }}>
              <Button
                label="Save to Feed"
                onPress={handleSave}
                variant="primary"
                fullWidth
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
