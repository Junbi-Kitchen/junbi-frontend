# Gook — CLAUDE.md

## What We're Building
Fridge-aware meal planning app. React Native + Expo. iOS & Android.
Core loop: Import recipes from social → Track pantry → AI suggests meals → Auto grocery list → One-click pickup order from local stores.

## Tech Stack
- React Native + Expo SDK 51 (managed workflow)
- Expo Router v3 (file-based routing, app/ directory)
- Zustand (global state)
- TanStack React Query v5 (async/server state)
- NativeWind v4 (Tailwind for React Native)
- React Native Reanimated 3 + Gesture Handler (animations + swipe)
- Moti (animation shortcuts)
- React Hook Form + Zod (forms + validation)
- @gorhom/bottom-sheet (all modals/sheets)
- Shopify FlashList (all lists, never FlatList)
- Expo Camera + Image Picker (receipt scanner)
- Expo Haptics (button feedback)
- MMKV (fast local storage)
- Lucide React Native (icons)

## Folder Structure
app/
  _layout.tsx
  (auth)/
    onboarding.tsx
  (tabs)/
    _layout.tsx
    index.tsx         # Recipe swipe feed
    pantry.tsx
    grocery.tsx
    orders.tsx
    profile.tsx
  recipe/[id].tsx
  import.tsx
components/
  ui/                 # Primitives
  recipe/
  pantry/
  grocery/
hooks/
stores/
lib/
  tokens.ts
  utils.ts
  mockData.ts
types/
  index.ts

## Design Language
- Vibe: Clean, warm, premium food app. Think Notion meets a food magazine.
- Background: #FAFAF7 (cream)
- Primary: #2D6A4F (forest green)
- Text: #1A1A1A
- Accent: #F4A261 (warm amber)
- Error: #E63946
- Border radius: 16px cards, 12px inputs, 999px pills
- Shadows: subtle, soft (shadow-sm)
- Typography: system font, bold headers, generous line height
- All modals = bottom sheets, never full screen for quick actions
- Swipe gestures everywhere relevant (feed cards, list rows)

## Hard Rules — Never Break
1. TypeScript strict, no `any`
2. NativeWind classes only, no inline styles
3. FlashList for every list
4. @gorhom/bottom-sheet for every modal/sheet
5. Reanimated 3 for all animations (not the old Animated API)
6. Every screen has a skeleton loader state
7. Every primary button fires Haptics.impactAsync
8. Zod validates all forms before submit
9. Every touchable has accessibilityLabel
10. No class components, no Redux
11. Expo Router only for navigation, never react-navigation directly
12. All colors from lib/tokens.ts, never hardcoded hex
