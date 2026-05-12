import { api } from '../api';
import type { Recipe } from '../../types';

interface FeedResponse {
  recipes: Recipe[];
  next_cursor: string | null;
}

interface CreateRecipeInput {
  title: string;
  description?: string;
  imageUri?: string;
  blurhash?: string;
  cookTimeMinutes?: number;
  difficulty?: string;
  importedFrom?: string;
  source?: string;
  tags?: string[];
  ingredients?: Array<{ name: string; quantity: number; unit: string; category?: string }>;
  steps?: Array<{ stepNumber?: number; instruction: string; timerMinutes?: number }>;
  nutrition?: { calories?: number; proteinG?: number; carbsG?: number; fatG?: number };
}

export const recipesApi = {
  getFeed: (params?: { cursor?: string; tags?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.tags) query.set('tags', params.tags);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<FeedResponse>(`/recipes/feed${qs ? `?${qs}` : ''}`);
  },
  getSaved: (params?: { cursor?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<FeedResponse>(`/recipes/saved${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => api.get<Recipe>(`/recipes/${id}`),
  create: (recipe: CreateRecipeInput) => api.post<Recipe>('/recipes', recipe),
  importFromUrl: (url: string, source: string) =>
    api.post<Recipe>('/recipes/import', { url, source }),
  parseImage: (imageUri: string, mimeType = 'image/jpeg') => {
    const formData = new FormData();
    formData.append('image', { uri: imageUri, type: mimeType, name: 'recipe.jpg' } as unknown as Blob);
    return api.upload<CreateRecipeInput>('/recipes/parse-image', formData);
  },
  translate: (payload: {
    target_language: string;
    title: string;
    description: string;
    ingredients: Array<{ name: string; quantity: number; unit: string; category?: string }>;
    steps: Array<{ stepNumber?: number; instruction: string; timerMinutes?: number }>;
  }) => api.post<{
    language: string;
    title: string;
    description: string;
    ingredients: Array<{ name: string; quantity: number; unit: string; category?: string }>;
    steps: Array<{ stepNumber?: number; instruction: string; timerMinutes?: number }>;
  }>('/recipes/translate', payload),
  save: (id: string) => api.post<{ detail: string }>(`/recipes/saved/${id}`),
  unsave: (id: string) => api.delete<{ detail: string }>(`/recipes/saved/${id}`),
  skip: (id: string) => api.post<{ detail: string }>(`/recipes/skip/${id}`),
};
