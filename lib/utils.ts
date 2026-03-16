// Purpose: Shared utility functions used throughout the app

import type { DietaryTag, IngredientCategory } from '../types';

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) return date.toLocaleDateString();
  if (diffDays > 1) return `${diffDays} days ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffHours > 1) return `${diffHours} hours ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffMins > 1) return `${diffMins} minutes ago`;
  return 'Just now';
}

export function pluralize(count: number, word: string, plural?: string): string {
  if (count === 1) return `${count} ${word}`;
  return `${count} ${plural ?? word + 's'}`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '…';
}

export function formatCookTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export function getAisleFromCategory(category: IngredientCategory): string {
  const map: Record<IngredientCategory, string> = {
    produce: 'Produce',
    proteins: 'Meat & Seafood',
    dairy: 'Dairy & Eggs',
    grains: 'Grains & Pasta',
    pantry: 'Pantry',
    frozen: 'Frozen',
    beverages: 'Beverages',
    condiments: 'Condiments & Sauces',
    spices: 'Spices & Herbs',
    bakery: 'Bakery',
  };
  return map[category] ?? 'Other';
}

export function getTagColor(tag: DietaryTag): string {
  const map: Record<DietaryTag, string> = {
    vegan: 'bg-green-100',
    vegetarian: 'bg-emerald-100',
    'gluten-free': 'bg-yellow-100',
    'dairy-free': 'bg-blue-100',
    keto: 'bg-purple-100',
    paleo: 'bg-orange-100',
    'nut-free': 'bg-red-100',
    'low-carb': 'bg-indigo-100',
    'high-protein': 'bg-pink-100',
    mediterranean: 'bg-teal-100',
  };
  return map[tag] ?? 'bg-gray-100';
}

export function getTagTextColor(tag: DietaryTag): string {
  const map: Record<DietaryTag, string> = {
    vegan: 'text-green-700',
    vegetarian: 'text-emerald-700',
    'gluten-free': 'text-yellow-700',
    'dairy-free': 'text-blue-700',
    keto: 'text-purple-700',
    paleo: 'text-orange-700',
    'nut-free': 'text-red-700',
    'low-carb': 'text-indigo-700',
    'high-protein': 'text-pink-700',
    mediterranean: 'text-teal-700',
  };
  return map[tag] ?? 'text-gray-700';
}

export function getPantryStatusColor(expiryDate?: string): 'none' | 'warning' | 'expired' {
  if (!expiryDate) return 'none';
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 3) return 'warning';
  return 'none';
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
