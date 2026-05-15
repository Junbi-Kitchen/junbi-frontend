# CLAUDE.md — Junbi Frontend

## What This App Does (in one sentence)
AI-powered kitchen assistant that tracks your pantry, tells you what to cook before food expires, and orders groceries with one tap — saving the average family ~$2,900/year in food waste.

## The Pivot: Why We're Refactoring
The current UI is built like every other recipe app: 4-tab layout, browse-first, user-does-everything. We are pivoting to an **agentic UI** — the AI proposes, the user confirms. Less navigation, more automation, higher retention.

**Old mental model:** User opens app → navigates to feature → does the thing
**New mental model:** User opens app → AI already figured it out → user taps to confirm

---

## Architecture

### Routing (Expo Router v3)
```
app/
  _layout.tsx              # Root providers + nav shell
  (auth)/onboarding.tsx    # Starting screen — logo, "Get started", "Already have an account?"
  (auth)/quiz.tsx          # 2-step quiz — dietary preferences + household size
  (auth)/signin.tsx        # Sign in / sign up form (Zod + RHF, password toggle, inline errors)
  (tabs)/
    _layout.tsx            # Bottom nav (4 tabs: Home, Kitchen, Agent, Grocery)
    index.tsx              # Home — agentic priority cards (swipeable) + stats sections
    kitchen.tsx            # Kitchen — pantry grid + recipe collections
    chat.tsx               # Agent — 4 AI agent flows (Recipe Finder, Meal Planner, Smart Grocery, Savings Coach)
    grocery.tsx            # Grocery list + aisle grouping + Instacart ordering
  recipe/[id].tsx          # Recipe detail
  import.tsx               # Social recipe import
  profile.tsx              # User profile (stack screen, accessed from Kitchen header)
  savings.tsx              # Savings analysis — stock-like graphs, monthly/all-time trends, activity log
  connected-accounts.tsx   # Connected accounts settings
```

### State (Zustand stores in stores/)
| Store | What it holds |
|-------|--------------|
| pantryStore | Items, categories, expiry dates, scan results |
| recipeStore | Saved recipes, collections, favorites |
| groceryStore | Grocery list, deduplication, store selection |
| orderStore | Cart, order history, delivery addresses |
| userStore | Profile, dietary prefs, connected accounts, `pendingPreferences` (transient quiz state carried through pre-auth signup) |
| savingsStore | Savings tracking, waste log, weekly trends, monthly comparisons |

### Key Files
- `lib/tokens.ts` — ALL design tokens. Single source of truth for colors, spacing, typography.
- `lib/constants.ts` — ALL app-wide branding (name, URL, tagline). Change the app name here, not in components.
- `lib/copy.ts` — ALL UI text strings, organized by screen. Use `COPY.screen.key` in components — never hardcode user-facing strings inline.
- `types/index.ts` — ALL TypeScript interfaces.
- `lib/mockData.ts` — Seeds all stores for development.
- `lib/storage.ts` — AsyncStorage wrapper for persisted boolean flags (`hasSeenOnboarding`). Swap the implementation to MMKV here when moving to a dev client — one place to change.
- `lib/api/` — Per-domain API modules (`users.ts`, `pantry.ts`, `recipes.ts`, etc.) + base `api.ts` with auto-detected backend URL.
- `components/ui/` — Shared primitives (Button, Card, Input, etc.)

---

## Design System — DO NOT DEVIATE

### Colors (from lib/tokens.ts)
| Token | Hex | Usage |
|-------|-----|-------|
| background | #FAFAF7 | App background (warm cream) |
| primary | #2D6A4F | CTAs, active states, headers |
| primaryLight | #E8F5EE | Soft green backgrounds, tags |
| text | #1A1A1A | Body text |
| textSecondary | #6B7280 | Muted labels, timestamps |
| accent | #F4A261 | Warm amber — savings, highlights, celebrations |
| error | #E63946 | Expiring items, destructive actions |
| warning | #F59E0B | Use-soon items (yellow zone) |
| success | #22C55E | Fresh items, saved-from-waste confirmations |
| border | #E5E5E0 | Dividers, card borders |
| surface | #FFFFFF | Card backgrounds |

### Freshness Color System (critical — this is our signature)
- **Fresh (7+ days):** success green
- **Use soon (3-6 days):** warning amber
- **Expiring (0-2 days):** error red with subtle pulse animation
- **Staple (no expiry):** textSecondary gray

### Spacing & Radius
- Border radius: 16px cards, 12px inputs/buttons, 999px pills
- Shadows: subtle only (`shadow-sm`), never heavy
- Padding: 16px screen horizontal, 12px card internal
- Gaps: 12px between list items, 16px between sections

### Typography
- System font stack (San Francisco / Roboto)
- Headings: bold (700), generous tracking
- Body: regular (400), 1.5 line height minimum
- Never below 13px for any text

### Icons
- Lucide React Native only. Never mix icon libraries.
- Size: 20px for inline, 24px for nav, 28px for empty states
- Color: inherit from parent or use textSecondary

---

## The Agentic UI Rules

These override any previous design decisions. This is the new direction.

### Rule 1: AI Proposes, User Confirms
Every screen should feel like the app already figured out what you need. The user's primary action is confirming or tweaking, not searching or browsing.

**BAD:** Empty grocery list with an "Add items" button
**GOOD:** Pre-populated grocery list with "I built this from your meal plan. Edit or confirm."

**BAD:** Recipe search with filters
**GOOD:** "Your chicken expires tomorrow. Here are 3 recipes that use it."

### Rule 2: One Priority Per Screen
The home screen shows ONE thing at a time — the most important action right now. Swipeable cards, not a feed. Not a grid. Not a dashboard.

Priority order:
1. Expiring food alert + recipe suggestions
2. Meal plan ready for review
3. Grocery list ready to order
4. Savings milestone celebration
5. New recipe imported successfully

### Rule 3: The AI Speaks Like a Person
All AI-generated text should be first person, casual, warm. Like a helpful friend who's good at cooking.

**BAD:** "3 recipe suggestions based on your available ingredients"
**GOOD:** "Your avocados are perfect today — here's a quick guacamole that takes 5 minutes"

**BAD:** "Meal plan generated successfully"
**GOOD:** "Your week is planned! I used up everything expiring soon and kept it under $80."

### Rule 4: Bottom Sheet AI Chat (Global)
Add a pull-up AI chat sheet accessible from ANY screen. This is the escape hatch for everything. Instead of adding settings screens and search UIs, users talk to the AI.

- "I'm vegetarian now" → updates preferences
- "What should I cook tonight?" → recipes from pantry
- "Plan my week for $60" → full meal plan
- "I just bought groceries" → opens camera for receipt scan

### Rule 5: Savings Are Always Visible
Show money saved prominently. This is our retention hook and viral loop.
- Home screen: running savings counter
- After marking an item "used": "+$3.50 saved!"
- Weekly summary push notification
- Shareable savings card for social media

### Rule 6: Reduce Tabs, Increase AI
**Implemented:** 4 tabs (Home, Kitchen, Agent, Grocery)

- Home = priority cards (agentic, proactive) + stats sections (pantry, savings, expiring, quick actions)
- Kitchen = pantry grid + recipe collections (combined)
- Agent = 4 AI agent flows (Recipe Finder, Meal Planner, Smart Grocery, Savings Coach)
- Grocery = agentic list + aisle grouping + Instacart ordering
- Profile = accessible from Kitchen screen header, not a tab
- Savings analysis = accessible from Home "This month" section tap

---

## Hard Rules — Never Break

### Code Quality
1. TypeScript strict, no `any`. All types in `types/index.ts`.
2. NativeWind classes only. No inline `style={{}}` except dynamic runtime values.
3. FlashList for every list. Never FlatList.
4. @gorhom/bottom-sheet for every modal/sheet.
5. Reanimated 4 for animations. Never legacy Animated API (except Animated.ScrollView for parallax).
6. Every screen has a skeleton loader (Moti-based).
7. Every primary button fires `Haptics.impactAsync()`.
8. Zod validates all forms. React Hook Form + @hookform/resolvers/zod.
9. `accessibilityLabel` on every touchable element.
10. No class components. No Redux. Zustand only.
11. Expo Router only. Never import react-navigation directly.
12. All colors from `lib/tokens.ts`. Zero hardcoded hex values in components.

### Component Rules
- Every component file under 150 lines. Split if longer.
- Extract repeated UI patterns into `components/ui/`.
- Props interfaces defined inline in the component file, not in types/index.ts (keep types/index.ts for domain models).
- Default exports for screen components, named exports for shared components.

### Naming
- Files: kebab-case (`priority-card.tsx`, `pantry-grid.tsx`)
- Components: PascalCase (`PriorityCard`, `PantryGrid`)
- Hooks: camelCase with `use` prefix (`usePantryItems`, `useExpiringItems`)
- Stores: camelCase with `Store` suffix (`pantryStore`, `recipeStore`)
- Types: PascalCase (`PantryItem`, `Recipe`, `GroceryListItem`)

---

## What Exists vs What Needs to Change

### KEEP (these work well)
- Recipe detail screen
- Recipe import flow
- Grocery list + Instacart ordering
- Bottom sheet pattern (used everywhere, feels native)
- Skeleton loaders
- Haptic feedback system
- NativeWind styling approach
- Zustand store architecture
- All reusable UI primitives in components/ui/

### DONE (completed refactors)
- `(tabs)/index.tsx`: Agentic priority cards (swipeable) + stats sections + quick actions
- `(tabs)/_layout.tsx`: 4 tabs (Home, Kitchen, Agent, Grocery) with custom tab bar
- `(tabs)/chat.tsx`: 4-agent selection screen with step-by-step agentic flows
- `(tabs)/grocery.tsx`: Agentic grocery list with AI summary, aisle grouping, store picker
- `(tabs)/kitchen.tsx`: Pantry grid + recipe collections (combined)
- `profile.tsx`: Moved from tab to stack screen with back navigation; sign-out button added
- `savings.tsx`: Stock-like savings analysis graphs (monthly/all-time)
- `components/home/PriorityCard.tsx` — Swipeable agentic cards (fixed height)
- `components/home/SavingsCounter.tsx` — Animated savings display
- `components/pantry/FreshnessBar.tsx` — Color-coded expiry indicator
- `components/shared/ShareCard.tsx` — Shareable savings card using native share sheet
- `(auth)/onboarding.tsx`: Rewritten as starting screen (logo + two CTAs, no state)
- `(auth)/quiz.tsx`: NEW — 2-step quiz (dietary tags + household size), sets `hasSeenOnboarding` flag
- `(auth)/signin.tsx`: NEW — sign in/up with Zod + RHF, password visibility toggle, inline Firebase error messages
- `_layout.tsx`: Auth gate reads `hasSeenOnboarding` from storage, routes first-time vs returning users correctly, `onQuizScreen` exception allows Case 3 post-signup quiz
- `lib/storage.ts`: NEW — AsyncStorage wrapper for persisted boolean flags
- `stores/userStore.ts`: Added `pendingPreferences` + `setPendingPreferences` for carrying quiz state through pre-auth signup

### DO NOT TOUCH
- `lib/tokens.ts` — Design tokens are locked
- `types/index.ts` — Extend, don't reorganize
- `babel.config.js`, `metro.config.js`, `tailwind.config.js` — Build config is stable
- `app.json` — Expo config is stable

---

## When Working on This Codebase

### Before making changes
- Read the relevant store in `stores/` to understand current state shape
- Check `types/index.ts` for existing interfaces before creating new ones
- Look at `lib/tokens.ts` for any color/spacing values

### After making changes
- Run `npx expo start --clear` if you changed any config file
- Verify skeleton loaders still work on new/modified screens
- Verify haptic feedback fires on new buttons
- Check that FlashList estimatedItemSize is set for any new lists

### Common Patterns in This Codebase
- Bottom sheets: `const bottomSheetRef = useRef<BottomSheet>(null)` + snapPoints
- Animations: `useAnimatedStyle` + `withSpring` / `withTiming` from Reanimated 4
- Lists: `<FlashList data={items} renderItem={...} estimatedItemSize={80} />`
- Forms: `useForm<SchemaType>({ resolver: zodResolver(schema) })`
- Navigation: `router.push('/recipe/[id]')` via Expo Router
- Storage: `lib/storage.ts` (AsyncStorage wrapper) for persisted flags, Zustand for runtime state. MMKV will replace AsyncStorage inside `storage.ts` when switching to a dev client — change it in one place.

---

## Backend Integration

### How API Calls Work

All API calls go through `lib/api.ts` (base client) → `lib/api/<domain>.ts` (per-domain module) → Zustand store action.

**Base client auto-injects Firebase token:**
```typescript
// lib/api.ts — simplified
const token = await firebaseUser.getIdToken();
fetch(url, { headers: { Authorization: `Bearer ${token}` } });
```

**Backend URL resolution (dev):**
- `EXPO_PUBLIC_API_URL` if set in `.env`
- Otherwise auto-detects from Expo Metro bundler host (works on same WiFi)
- Android Emulator: set `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000`

**Auth flow (full sequence):**
1. User signs in → Firebase SDK returns ID token
2. `_layout.tsx` `onAuthStateChanged` fires → routes to tabs
3. `userStore.fetchProfile()` called → hits `GET /users/me` with Bearer token
4. Backend verifies token, auto-creates user rows if first visit, returns full profile
5. All subsequent API calls use `getIdToken()` (auto-refreshes near expiry)

### Backend Integration Status

Most features call the real FastAPI backend (localhost:8000 in dev) via Zustand stores + `lib/api/`. `lib/mockData.ts` seeds stores for dev when backend is unreachable.

| Feature | Status |
|---|---|
| Pantry CRUD + ingredient search | ✅ Live |
| Pantry scan (camera → Claude vision) | ✅ Live |
| Recipe feed, saved, detail | ✅ Live |
| Recipe image parsing | ✅ Live |
| User profile + preferences | ✅ Live |
| Grocery list (generate, manage, aisle grouping) | ✅ Live |
| Savings tracking + waste log | ✅ Live |
| AI agent flows (Recipe Finder, Meal Planner, Smart Grocery, Savings Coach) | 🟡 Mocked — UI exists, no backend endpoints wired |
| Receipt OCR | 🟡 Mocked — `useReceiptScanner` returns stub, backend ignores image |
| Recipe URL import / scraping | 🟡 Stub — backend creates blank row, no scraping |

### Development Commands

```bash
npm install --legacy-peer-deps   # install deps
npx expo start                   # start dev server (QR code for Expo Go)
npx expo start --clear           # use after changing any config file
npx expo start --android         # Android emulator
npx expo start --ios             # iOS simulator
```

---

## North Star UX

Open the app. The first thing you see is: "Your chicken and spinach expire in 2 days. I found a creamy tuscan chicken recipe — takes 25 minutes and uses both. Want me to add the missing ingredients to your grocery list?"

One tap. Done. That's the app.
