# Gook — Frontend

AI-powered kitchen assistant that tracks your pantry, tells you what to cook before food expires, and orders groceries with one tap.

**Core loop:** Import recipes from social → Track pantry → AI suggests meals → Auto grocery list → One-click pickup order from local stores.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [First-Time Setup](#first-time-setup)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Key Conventions](#key-conventions)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Install these before anything else.

### Required

| Tool | Version | Install |
|---|---|---|
| Node.js | 18 LTS or 20 LTS | [nodejs.org](https://nodejs.org) |
| npm | 9+ (comes with Node) | — |
| Expo Go app | SDK 54+ | [iOS App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) |

> **This is a mobile-only app (iOS & Android).** It does not run on web — several core libraries (`react-native-mmkv`, `@gorhom/bottom-sheet`, `@shopify/flash-list`, `expo-haptics`) require native device APIs with no browser equivalent.

### For iOS Simulator (macOS only)

| Tool | Notes |
|---|---|
| Xcode | Install from the Mac App Store |
| Xcode Command Line Tools | Run: `xcode-select --install` |
| iOS Simulator | Included with Xcode |

### For Android Emulator

| Tool | Notes |
|---|---|
| Android Studio | [developer.android.com/studio](https://developer.android.com/studio) |
| Android SDK | Install via Android Studio → SDK Manager |
| Android Emulator | Create a virtual device in Android Studio → AVD Manager |

### Recommended

| Tool | Notes |
|---|---|
| Watchman | `brew install watchman` — **strongly recommended on macOS** to avoid EMFILE errors and file watcher recrawl warnings |
| VS Code | With the React Native Tools extension |

---

## System Requirements

| | Minimum |
|---|---|
| macOS | 12 Monterey+ (for iOS development) |
| Windows / Linux | Android only (no iOS simulator) |
| RAM | 8 GB (16 GB recommended) |
| Disk | ~5 GB free for simulators and node_modules |

---

## First-Time Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd gook-frontend
```

### 2. Set up environment variables

Copy the example `.env` file and fill in your values:

```bash
cp .env.example .env
```

### 3. Install dependencies

```bash
npm install --legacy-peer-deps
```

> **Note:** The `--legacy-peer-deps` flag is needed due to React 19 peer dependency resolution. This is safe and expected for SDK 54.

### 4. Verify your environment

```bash
npx expo doctor
```

Fix any warnings it reports before proceeding.

### 5. Start the development server

```bash
npx expo start --clear
```

From the dev menu:

- Press `i` to open in iOS Simulator
- Press `a` to open in Android Emulator
- Scan the QR code with **Expo Go** on a physical device

---

## Running the App

### On a physical device (easiest)

1. Install **Expo Go** (SDK 54+) from the App Store or Google Play
2. Make sure your phone and computer are on the **same Wi-Fi network**
3. Run `npx expo start` and scan the QR code

### On iOS Simulator (macOS only)

```bash
npm run ios
```

### On Android Emulator

```bash
npm run android
```

---

## Project Structure

```
gook-frontend/
├── app/                      # Expo Router screens (file-based routing)
│   ├── _layout.tsx           # Root layout — providers and navigation shell
│   ├── import.tsx            # Recipe import screen
│   ├── profile.tsx           # User profile (stack screen with back nav)
│   ├── connected-accounts.tsx # Connected accounts settings
│   ├── (auth)/
│   │   └── onboarding.tsx    # 4-step onboarding flow
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Custom bottom tab bar (4 tabs)
│   │   ├── index.tsx         # Home — agentic priority cards + stats sections
│   │   ├── kitchen.tsx       # Kitchen — pantry grid + recipe collections
│   │   ├── chat.tsx          # Agent — 4 AI agent flows (Recipe, Meal Plan, Grocery, Savings)
│   │   └── grocery.tsx       # Grocery list + aisle grouping + Instacart ordering
│   ├── savings.tsx           # Savings analysis — stock-like graphs + activity log
│   └── recipe/
│       └── [id].tsx          # Recipe detail (dynamic route)
│
├── components/
│   ├── ui/                   # Primitive components (Button, Card, Input, etc.)
│   ├── home/                 # Home screen components (PriorityCard, SavingsCounter)
│   ├── recipe/               # Recipe-specific components
│   ├── pantry/               # Pantry-specific components (FreshnessBar, PantryGrid)
│   ├── grocery/              # Grocery-specific components
│   └── shared/               # Cross-screen components (SavedToast, ShareCard)
│
├── hooks/                    # Custom React hooks
├── stores/                   # Zustand global state stores
├── lib/
│   ├── tokens.ts             # ALL design tokens — colors, spacing, typography
│   ├── utils.ts              # Shared utility functions
│   └── mockData.ts           # Mock data seeding all stores
├── types/
│   └── index.ts              # All TypeScript interfaces and types
│
├── global.css                # Tailwind/NativeWind entry point
├── tailwind.config.js        # NativeWind config
├── babel.config.js           # Babel config (Reanimated + NativeWind)
├── metro.config.js           # Metro bundler config (NativeWind wrapper)
├── app.json                  # Expo app config
└── tsconfig.json             # TypeScript config
```

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| Expo | ^54.0.0 | Managed React Native workflow |
| Expo Router | ~6.0.23 | File-based navigation |
| React | 19.1.0 | UI framework |
| React Native | 0.81.5 | Core mobile framework |
| NativeWind | ^4.0.36 | Tailwind CSS for React Native |
| Zustand | ^4.5.2 | Global state management |
| TanStack React Query | ^5.40.0 | Async/server state |
| React Native Reanimated | ~4.1.1 | Animations (swipe, transitions, pulse) |
| React Native Gesture Handler | ~2.28.0 | Touch gestures |
| @gorhom/bottom-sheet | ^5.2.8 | All modal sheets |
| @shopify/flash-list | 2.0.2 | Performant lists (replaces FlatList) |
| React Hook Form + Zod | ^7.51.5 / ^3.23.8 | Forms and validation |
| Moti | ^0.29.0 | Animation shortcuts (skeleton loaders) |
| Lucide React Native | ^0.395.0 | Icons |
| Expo Haptics | ~15.0.8 | Tactile feedback on button press |
| Expo Camera | ~17.0.10 | Receipt scanner |
| react-native-mmkv | ^2.12.2 | Fast local storage |
| react-native-svg | 15.12.1 | SVG rendering (charts, icons) |

---

## Tabs Overview

| Tab | Screen | Description |
|---|---|---|
| Home | `index.tsx` | Agentic priority cards + pantry stats, savings summary, expiring items, quick actions |
| Kitchen | `kitchen.tsx` | Pantry grid with freshness bars + recipe collections (segmented control) |
| Agent | `chat.tsx` | 4 AI agent flows — Recipe Finder, Meal Planner, Smart Grocery, Savings Coach |
| Grocery | `grocery.tsx` | Agentic grocery list with AI summary, aisle grouping, store picker, Instacart ordering |

### Additional Screens

| Screen | File | Access |
|---|---|---|
| Savings Analysis | `savings.tsx` | Tap "This month" section on Home — stock-like graphs, monthly/all-time trends, activity log |
| Profile | `profile.tsx` | Kitchen screen header icon — stack screen with back navigation |
| Recipe Detail | `recipe/[id].tsx` | Tap any recipe card |
| Recipe Import | `import.tsx` | Quick action on Home or Kitchen |

---

## State Management

All global state is managed with Zustand stores in `stores/`:

| Store | Purpose |
|---|---|
| `recipeStore` | Saved recipes, collections, CRUD |
| `pantryStore` | Pantry items, categories, receipt scan results |
| `groceryStore` | Grocery list, pantry-aware deduplication |
| `orderStore` | Store selection, cart, order history |
| `userStore` | User profile, dietary prefs, addresses, connected accounts |
| `savingsStore` | Savings tracking, waste logging, weekly trends |

---

## Key Conventions

These are hard rules — do not break them.

1. **No `any` types.** TypeScript strict mode is on. All domain types live in `types/index.ts`.
2. **All colors from `lib/tokens.ts`.** Never hardcode a hex value outside that file.
3. **`@gorhom/bottom-sheet` for all modals.** Never use `Modal` for quick actions — only for full-screen flows (e.g. camera).
4. **Reanimated 4 for animations.** Never use the legacy `Animated` API. Exception: `Animated.ScrollView` for parallax scroll events.
5. **Every screen needs a skeleton loader.** The `<SkeletonLoader />` component (using Moti) handles this.
6. **Haptic feedback on every primary button.** `Button.tsx` handles this automatically. If you build a custom pressable, call `Haptics.impactAsync()`.
7. **Zod validates all forms** before submit. Use `react-hook-form` + `@hookform/resolvers/zod`.
8. **`accessibilityLabel` on every touchable.**
9. **Expo Router only** for navigation. Never import from `react-navigation` directly.
10. **`SafeAreaView` from `react-native-safe-area-context`**, not from `react-native` (deprecated in RN 0.81).

---

## Troubleshooting

### "Cannot find module 'react-native'" or similar TS errors

```bash
npm install --legacy-peer-deps
```

Then restart your IDE's TypeScript server. In VS Code: `Cmd+Shift+P` → `TypeScript: Restart TS Server`.

### Metro bundler fails to start

```bash
npx expo start --clear
```

The `--clear` flag wipes the Metro cache. Do this whenever you install new packages or after a `git pull`.

### "Cannot find module 'react-native-worklets/plugin'"

Reanimated v4 requires the worklets package:

```bash
npm install react-native-worklets@0.5.1 --legacy-peer-deps
```

### "Project is incompatible with this version of Expo Go"

Make sure your Expo Go app is updated to SDK 54. The project requires Expo SDK 54+.

### `npx expo doctor` reports version mismatches

Run the fix command:

```bash
npx expo install --fix -- --legacy-peer-deps
```

### NativeWind classes not applying

Ensure `global.css` is imported at the top of `app/_layout.tsx` (it already is — don't remove it). Then clear Metro:

```bash
npx expo start --clear
```

### Reanimated or Gesture Handler not working

Check that `babel.config.js` includes:

```js
plugins: ['react-native-reanimated/plugin']
```

After any `babel.config.js` change, restart Metro with `--clear`.

### EMFILE: too many open files / MustScanSubDirs recrawl (macOS)

Install Watchman:

```bash
brew install watchman
```

### Expo Go doesn't connect

- Confirm your phone and computer are on the same Wi-Fi network
- Try switching from LAN to Tunnel mode (press `s` in the Expo dev menu)
- If on a corporate/university network, use a hotspot instead

---

## Questions?

Check `CLAUDE.md` in the root for architecture decisions, design tokens, and the full list of hard rules.
