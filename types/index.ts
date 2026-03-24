// Purpose: All shared TypeScript interfaces and enums for the Gook app

export type DietaryTag =
  | 'vegan'
  | 'vegetarian'
  | 'gluten-free'
  | 'dairy-free'
  | 'keto'
  | 'paleo'
  | 'nut-free'
  | 'low-carb'
  | 'high-protein'
  | 'mediterranean';

export type IngredientCategory =
  | 'produce'
  | 'proteins'
  | 'dairy'
  | 'grains'
  | 'pantry'
  | 'frozen'
  | 'beverages'
  | 'condiments'
  | 'spices'
  | 'bakery';

export type OrderStatus =
  | 'placed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'cancelled';

export type ImportSource = 'instagram' | 'tiktok' | 'url' | 'manual';

export interface Nutrition {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  timerMinutes?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUri: string;
  blurhash: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  nutrition: Nutrition;
  tags: DietaryTag[];
  cookTimeMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  source: string;
  importedFrom: ImportSource;
  savedAt: string;
}

export interface RecipeCollection {
  id: string;
  name: string;
  description: string;
  coverImageUri: string;
  recipeIds: string[];
  createdAt: string;
  emoji: string;
}

export interface PantryItem extends Ingredient {
  expiryDate?: string;
  addedAt: string;
  addedVia: 'receipt' | 'manual' | 'scan';
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  recipeId?: string;
  recipeTitle?: string;
  checked: boolean;
  aisle: string;
}

export interface Store {
  id: string;
  name: string;
  logo: string;
  distance: number;
  supportsPickup: boolean;
  isInstacart?: boolean;
}

export interface Order {
  id: string;
  store: Store;
  items: GroceryItem[];
  status: OrderStatus;
  estimatedPickup: string;
  subtotal: number;
  placedAt: string;
}

export interface UserAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

export interface WasteLogEntry {
  id: string;
  itemName: string;
  action: 'used' | 'tossed';
  estimatedValue: number;
  date: string;
}

export interface WeeklyTrend {
  week: string;
  saved: number;
  wasted: number;
}

export interface UserPreferences {
  dietaryTags: DietaryTag[];
  allergies: string[];
  cuisines: string[];
  householdSize: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  connectedAccounts: {
    instagram?: string;
    tiktok?: string;
    instacart?: string;
  };
  addresses: UserAddress[];
  defaultAddressId: string | null;
}
