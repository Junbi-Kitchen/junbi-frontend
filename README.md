# Junbi — Frontend

AI-powered kitchen assistant that tracks your pantry, tells you what to cook before food expires, and orders groceries with one tap.

**Core loop:** Import recipes from social → Track pantry → AI suggests meals → Auto grocery list → One-click pickup order from local stores.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [First-Time Setup](#first-time-setup)
- [Running the App](#running-the-app)
- [EAS Builds](#eas-builds)
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

> **This is a mobile-only app (iOS & Android).** It does not run on web — several core libraries (`@gorhom/bottom-sheet`, `@shopify/flash-list`, `expo-haptics`) require native device APIs with no browser equivalent.

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
cd junbi-frontend
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

> **Note:** The `--legacy-peer-deps` flag is needed due to React 19 peer dependency resolution. This is safe and expected for SDK 54.

### 3. Set up environment variables

```bash
cp .env.example .env
```

For local development, you don't need to fill in anything — the app auto-detects the backend IP from Metro and Firebase vars are only required for EAS cloud builds (already configured on the team's EAS project). The only time you'd edit `.env` is for Android Emulator (`EXPO_PUBLIC_API_URL=http://10.0.2.2:8000`).

### 4. Verify your environment

```bash
npx expo doctor
```

Fix any warnings it reports before proceeding.

---

## Running the App

There are three ways to run the app, depending on your needs:

### Option 1: Expo Go (simplest, no install needed)

Best for: pure JS/UI work, quickest to get started.

Limitation: can't run native modules not included in the Expo SDK (e.g. share extensions, push notifications).

1. Install **Expo Go** from the [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Make sure your phone and computer are on the **same Wi-Fi network**
3. Start Metro:
   ```bash
   npx expo start
   ```
4. Scan the QR code with Expo Go

### Option 2: Dev Client APK (recommended for physical device)

Best for: testing features that require native modules (share extensions, camera, etc.) while keeping hot reload.

1. Download the dev client APK from EAS (ask a team member for the link) and install it on your Android phone
2. Start Metro in dev-client mode:
   ```bash
   npx expo start --dev-client
   ```
3. Open the installed Junbi dev app on your phone — it will detect Metro and show a Connect button
4. Tap Connect — you now have hot reload with full native module support

> You only need to reinstall the APK when native code changes (new native module, `app.json` plugin changes, or Expo SDK version bump). For all JS/UI changes, just run Metro.

### Option 3: Simulator / Emulator

```bash
npm run ios      # iOS Simulator (macOS only)
npm run android  # Android Emulator
```

---

## EAS Builds

We use [EAS](https://expo.dev/eas) (Expo Application Services) for cloud builds. You need access to the `junbi-kitchen` org on [expo.dev](https://expo.dev).

### Build profiles

| Profile | Command | Output | Use for |
|---|---|---|---|
| `development` | `eas build --profile development --platform android` | Dev client APK (hot reload) | Rebuilding after native changes |
| `preview` | `eas build --profile preview --platform android` | Standalone APK | Testing real production-like behavior, sharing with testers |
| `production` | `eas build --profile production --platform android` | `.aab` for Play Store | Store submission |

### When to rebuild the dev client

Only rebuild when native code changes — otherwise everyone shares the same APK indefinitely:
- A new native module is added
- `app.json` plugins change
- Expo SDK version bumps

After building, share the new APK download link from [expo.dev](https://expo.dev) → junbi-kitchen → junbi → Builds.

---

## Project Structure

```
junbi-frontend/
├── app/                      # Expo Router screens (file-based routing)
│   ├── _layout.tsx           # Root layout — providers, auth gate, navigation shell
│   ├── import.tsx            # Recipe import screen
│   ├── profile.tsx           # User profile (stack screen with back nav)
│   ├── savings.tsx           # Savings analysis — stock-like graphs + activity log
│   ├── connected-accounts.tsx # Connected accounts settings
│   ├── (auth)/
│   │   ├── onboarding.tsx    # Starting screen — logo + two CTAs
│   │   ├── quiz.tsx          # 2-step quiz — dietary preferences + household size
│   │   └── signin.tsx        # Sign in / sign up with Firebase auth
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Custom bottom tab bar (4 tabs)
│   │   ├── index.tsx         # Home — agentic priority cards + stats sections
│   │   ├── kitchen.tsx       # Kitchen — pantry grid + recipe collections
│   │   ├── chat.tsx          # Agent — 4 AI agent flows (Recipe, Meal Plan, Grocery, Savings)
│   │   └── grocery.tsx       # Grocery list + aisle grouping + Instacart ordering
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
│   ├── api/                  # Per-domain API modules + base client
│   ├── tokens.ts             # ALL design tokens — colors, spacing, typography
│   ├── constants.ts          # App-wide branding (name, URL, tagline)
│   ├── copy.ts               # ALL UI text strings organized by screen
│   ├── firebase.ts           # Firebase app + auth initialization
│   ├── storage.ts            # AsyncStorage wrapper for persisted flags
│   └── mockData.ts           # Mock data seeding all stores for dev
├── types/
│   └── index.ts              # All TypeScript interfaces and types
│
├── assets/                   # App icons and splash screen
├── global.css                # Tailwind/NativeWind entry point
├── tailwind.config.js        # NativeWind config
├── babel.config.js           # Babel config (Reanimated + NativeWind)
├── metro.config.js           # Metro bundler config (NativeWind wrapper)
├── eas.json                  # EAS build profiles
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
| Firebase (JS SDK) | ^12.12.0 | Auth |
| React Native Reanimated | ~4.1.1 | Animations (swipe, transitions, pulse) |
| React Native Gesture Handler | ~2.28.0 | Touch gestures |
| @gorhom/bottom-sheet | ^5.2.8 | All modal sheets |
| @shopify/flash-list | 2.0.2 | Performant lists (replaces FlatList) |
| React Hook Form + Zod | ^7.51.5 / ^3.23.8 | Forms and validation |
| Moti | ^0.29.0 | Animation shortcuts (skeleton loaders) |
| Lucide React Native | ^0.395.0 | Icons |
| Expo Haptics | ~15.0.8 | Tactile feedback on button press |
| Expo Camera | ~17.0.10 | Receipt scanner |
| expo-dev-client | latest | Custom dev builds with native module support |
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
| Savings Analysis | `savings.tsx` | Tap "This month" section on Home |
| Profile | `profile.tsx` | Kitchen screen header icon |
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

```bash
brew install watchman
```

### Expo Go / Dev Client doesn't connect

- Confirm your phone and computer are on the same Wi-Fi network
- Try switching from LAN to Tunnel mode (press `s` in the Expo dev menu)
- If on a corporate/university network, use a hotspot instead

### App connects but API calls fail

Check the `[api] BASE_URL =` log in the Metro console. If it shows `localhost:8000`, the auto-detection failed — set `EXPO_PUBLIC_API_URL` in `.env` to your machine's local IP (e.g. `http://192.168.1.x:8000`). For Android Emulator use `http://10.0.2.2:8000`.

---

## Questions?

Check `CLAUDE.md` in the root for architecture decisions, design tokens, and the full list of hard rules.
