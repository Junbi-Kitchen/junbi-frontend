# Gook — Frontend

Fridge-aware meal planning app built with React Native + Expo.

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
| Expo Go app | Latest | [iOS App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) |

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
| Watchman | `brew install watchman` — **strongly recommended on macOS** to avoid EMFILE errors |
| Expo CLI | `npm install -g expo-cli` |
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

### 2. Install dependencies

```bash
npm install
```

This installs all packages listed in `package.json` including React Native, Expo SDK 51, NativeWind, Zustand, and all other libraries.

### 3. Verify your environment

```bash
npx expo doctor
```

This checks that your environment is correctly configured for Expo development. Fix any warnings it reports before proceeding.

### 4. Start the development server

```bash
npm start
```

This opens the Expo dev menu. From here you can:

- Press `i` to open in iOS Simulator
- Press `a` to open in Android Emulator
- Scan the QR code with the **Expo Go** app on a physical device

---

## Running the App

### On a physical device (easiest)

1. Install **Expo Go** from the App Store or Google Play
2. Make sure your phone and computer are on the **same Wi-Fi network**
3. Run `npm start` and scan the QR code

### On iOS Simulator (macOS only)

```bash
npm run ios
```

Xcode and the iOS Simulator must be installed first.

### On Android Emulator

```bash
npm run android
```

Android Studio and an AVD (Android Virtual Device) must be set up first.

---

## Project Structure

```
gook-frontend/
├── app/                      # Expo Router screens (file-based routing)
│   ├── _layout.tsx           # Root layout — providers and navigation shell
│   ├── import.tsx            # Recipe import screen
│   ├── connected-accounts.tsx # Connected accounts settings
│   ├── (auth)/
│   │   └── onboarding.tsx    # 4-step onboarding flow
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Custom bottom tab bar (4 tabs)
│   │   ├── index.tsx         # Pantry management (home)
│   │   ├── recipes.tsx       # Saved recipes & collections (Spotify-style)
│   │   ├── grocery.tsx       # Grocery list + Instacart ordering
│   │   └── profile.tsx       # User profile + addresses
│   └── recipe/
│       └── [id].tsx          # Recipe detail (dynamic route)
│
├── components/
│   ├── ui/                   # Primitive components (Button, Card, Input, etc.)
│   ├── recipe/               # Recipe-specific components
│   ├── pantry/               # Pantry-specific components
│   └── grocery/              # Grocery-specific components
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
| Expo | ~51.0.0 | Managed React Native workflow |
| Expo Router | ~3.5.0 | File-based navigation |
| React Native | 0.74.5 | Core framework |
| NativeWind | ^4.0.36 | Tailwind CSS for React Native |
| Zustand | ^4.5.2 | Global state management |
| TanStack React Query | ^5.40.0 | Async/server state |
| React Native Reanimated | ~3.10.1 | Animations (swipe, transitions) |
| React Native Gesture Handler | ~2.16.1 | Touch gestures |
| @gorhom/bottom-sheet | ^4.6.3 | All modal sheets |
| @shopify/flash-list | 1.6.3 | Performant lists (replaces FlatList) |
| React Hook Form + Zod | ^7.51.5 / ^3.23.8 | Forms and validation |
| Moti | ^0.29.0 | Animation shortcuts (skeleton loaders) |
| Lucide React Native | ^0.395.0 | Icons |
| Expo Haptics | ~13.0.1 | Tactile feedback on button press |
| Expo Camera | ~15.0.16 | Receipt scanner |
| react-native-mmkv | ^2.12.2 | Fast local storage |

---

## Key Conventions

These are hard rules — do not break them.

1. **No `any` types.** TypeScript strict mode is on. All types live in `types/index.ts`.
2. **NativeWind classes only.** No inline `style={{}}` objects for visual styling. Exception: dynamic values computed at runtime (e.g. animated transforms, `TOKENS`-derived colors).
3. **`FlashList` for all lists.** Never use `FlatList`. Import from `@shopify/flash-list`.
4. **`@gorhom/bottom-sheet` for all modals.** Never use `Modal` for quick actions — only for full-screen flows (e.g. camera).
5. **Reanimated 3 for animations.** Never use the legacy `Animated` API. Exception: `Animated.ScrollView` for parallax scroll events.
6. **Every screen needs a skeleton loader.** The `<SkeletonLoader />` component (using Moti) handles this.
7. **Haptic feedback on every primary button.** `Button.tsx` handles this automatically. If you build a custom pressable, call `Haptics.impactAsync()`.
8. **Zod validates all forms** before submit. Use `react-hook-form` + `@hookform/resolvers/zod`.
9. **`accessibilityLabel` on every touchable.**
10. **All colors from `lib/tokens.ts`.** Never hardcode a hex value outside that file.
11. **Expo Router only** for navigation. Never import from `react-navigation` directly.

---

## Troubleshooting

### "Cannot find module 'react-native'" or similar TS errors

The IDE hasn't recognized the installed packages yet. Try:

```bash
npm install          # ensure node_modules exists
```

Then restart your IDE's TypeScript server. In VS Code: `Cmd+Shift+P` → `TypeScript: Restart TS Server`.

### Metro bundler fails to start

```bash
npx expo start --clear
```

The `--clear` flag wipes the Metro cache. Do this whenever you install new packages or after a `git pull`.

### `npx expo doctor` reports issues

Follow the output instructions. Common fixes:

- Xcode not installed: install from the Mac App Store
- Wrong Node version: use [nvm](https://github.com/nvm-sh/nvm) to switch — `nvm use 20`
- Missing Android SDK: open Android Studio → SDK Manager → install the listed SDKs

### NativeWind classes not applying

Ensure `global.css` is imported at the top of `app/_layout.tsx` (it already is — don't remove it). Then clear the Metro cache:

```bash
npx expo start --clear
```

### Reanimated or Gesture Handler not working

These libraries require the Babel plugin to be registered. Check that `babel.config.js` includes:

```js
plugins: ['react-native-reanimated/plugin']
```

After any `babel.config.js` change, restart Metro with `--clear`.

### EMFILE: too many open files (macOS)

Metro's Node file watcher hits macOS's default descriptor limit. Install Watchman:

```bash
brew install watchman
```

Then restart Metro. This replaces the Node-based watcher with a native one that doesn't hit file limits.

### Expo Go doesn't connect

- Confirm your phone and computer are on the same Wi-Fi network
- Try switching from LAN to Tunnel mode in the Expo dev menu (press `s` to toggle)
- If on a corporate/university network, use a hotspot instead

### iOS Simulator not launching

If `npm run ios` hangs or fails:

```bash
# Verify Xcode CLI tools are set
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Install CocoaPods if needed
sudo gem install cocoapods
cd ios && pod install && cd ..
```

---

## Tabs Overview

| Tab | Screen | Description |
|---|---|---|
| Pantry | `index.tsx` | Visual category grid with quick-add chips (home) |
| Recipes | `recipes.tsx` | Saved recipes in Spotify-playlist-style collections |
| Grocery | `grocery.tsx` | Grocery list with Instacart ordering + address management |
| Profile | `profile.tsx` | Dietary preferences, connected accounts, saved addresses |

## State Management

All global state is managed with Zustand stores in `stores/`:

| Store | Purpose |
|---|---|
| `recipeStore` | Saved recipes, collections, CRUD |
| `pantryStore` | Pantry items, categories, receipt scan results |
| `groceryStore` | Grocery list, pantry-aware deduplication |
| `orderStore` | Store selection, cart, order history |
| `userStore` | User profile, dietary prefs, addresses, connected accounts |

---

## Questions?

Check `CLAUDE.md` in the root for architecture decisions, design tokens, and the full list of hard rules.
