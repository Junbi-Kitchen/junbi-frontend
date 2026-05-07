// Purpose: Single source of truth for all UI text in the app.
// When adding new strings, add them here first, then reference COPY.screen.key in components.
// Dynamic strings use functions — pass variables, get back a string.

export const COPY = {

  // ─── Onboarding ────────────────────────────────────────────
  onboarding: {
    welcome: "Let's get started",
    continueBtn: 'Continue',
    skipBtn: 'Skip for now',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    signIn: 'Sign in',
    createAccount: 'Create account',
    switchToSignIn: 'Already have an account? Sign in',
    switchToSignUp: "Don't have an account? Sign up",
    errors: {
      missingFields: 'Please enter your email and password.',
      emailInUse: 'That email is already registered. Try signing in instead.',
      wrongPassword: 'Incorrect email or password.',
      weakPassword: 'Password must be at least 6 characters.',
      invalidEmail: 'Please enter a valid email address.',
      invalidCredential: 'Incorrect email or password.',
      serverUnavailable: 'Could not reach the server. Please try again later.',
    },
  },

  // ─── Home ───────────────────────────────────────────────────
  home: {
    pantrySection: 'Pantry at a glance',
    savingsSection: 'This month',
    seeAnalysis: 'See analysis',
    expiringSection: 'Use these first',
    quickActions: 'Quick actions',
    stats: {
      items: 'Items',
      expiringSoon: 'Expiring soon',
      recipes: 'Recipes',
      saved: 'Saved',
      wasted: 'Wasted',
      allTime: 'All time',
    },
    actions: {
      scanReceipt: 'Scan receipt',
      importRecipe: 'Import recipe',
      askAgent: 'Ask agent',
    },
    cardLabels: {
      savings: 'Saved this month',
      pantry: 'Pantry',
      grocery: 'Grocery list',
      expiring: 'Use today',
      quickActions: 'Quick actions',
    },
  },

  // ─── Kitchen ────────────────────────────────────────────────
  kitchen: {
    scanReceipt: 'Scan receipt',
    addManually: 'Add item manually',
    importRecipe: 'Import recipe',
    newCollection: {
      namePlaceholder: 'e.g. Weeknight Dinners',
      emojiPlaceholder: 'e.g. 🍝',
      nameLabel: 'Name',
      emojiLabel: 'Emoji',
      createBtn: 'Create',
    },
  },

  // ─── Agent (chat.tsx) ───────────────────────────────────────
  agents: {
    screenTitle: 'AI Agents',
    screenSubtitle: 'Pick an agent to handle your task. Each one walks you through step by step.',
    list: {
      mealplan: {
        label: 'Planning Agent',
        description: 'Plan your meals and week automatically',
      },
      grocery: {
        label: 'Grocery Agent',
        description: 'Build a smart list from your pantry gaps',
      },
    },
    recipeFinder: {
      promptExpiring: (count: number) =>
        `You have ${count} items expiring soon. Which ones do you want to cook with?`,
      promptGeneric: "Let me know what ingredients you want to use and I'll find the perfect recipe.",
      thinking: 'Searching for the best matches...',
      resultsWithIngredients: (count: number, ingredients: string) =>
        `I found ${count} recipes using ${ingredients}. Pick one to get started!`,
      resultsGeneric: (count: number) =>
        `Here are ${count} recipes you can make tonight.`,
      findBtn: (count: number) =>
        count > 0 ? `Find recipes with ${count} items` : 'Find any recipe',
      otherIngredients: 'Other ingredients',
    },
    mealPlanner: {
      prompt: "Let me plan your meals! Set your budget and how many days you want covered.",
      budgetLabel: 'Weekly budget',
      daysLabel: 'Number of days',
      planBtn: (days: number, budget: number) => `Plan ${days} days for $${budget}`,
      thinking: (days: number, budget: number) =>
        `Planning ${days} days under $${budget}... Using up expiring items first.`,
      ready: (days: number, budget: number) =>
        `Your ${days}-day plan is ready! I prioritized expiring ingredients and kept it under $${budget}.`,
      addToGroceryBtn: 'Add missing items to grocery',
      regenerateBtn: 'Regenerate plan',
    },
    smartGrocery: {
      prompt: (count: number) =>
        `You have ${count} items in your pantry. Let me find what's missing and build a smart list.`,
      stapleslabel: "Common staples you might need",
      buildBtn: 'Build smart grocery list',
      thinking: 'Building your list from pantry gaps...',
      ready: (count: number) =>
        `Here's your optimized list — ${count} items. I added staples you're running low on.`,
      addAllBtn: 'Add all to grocery list',
      stats: {
        inPantry: 'In pantry',
        expiring: 'Expiring',
        onList: 'On list',
      },
    },
    savingsCoach: {
      promptGood: (rate: number) =>
        `Amazing! You're saving ${rate}% of your food. Here's your breakdown.`,
      promptImprove: (rate: number) =>
        `You're saving ${rate}% of your food. Let's get that higher — here's where you stand.`,
      stats: {
        savedThisMonth: 'saved this month',
        itemsUsed: 'Items used',
        itemsWasted: 'Items wasted',
        saveRate: 'Save rate',
        allTimeSavings: 'All-time savings',
        vsLastMonth: 'vs. last month',
        lastMonth: (amount: string) => `Last month: $${amount}`,
      },
      tipsBtn: 'See tips to reduce waste',
      tipsTitle: 'Tips to reduce waste',
      tips: [
        { title: 'FIFO your fridge', desc: 'Move older items to the front so you use them first.' },
        { title: 'Freeze before it expires', desc: 'Most proteins and breads freeze well for weeks.' },
        { title: 'Batch cook on Sundays', desc: 'Use expiring veggies in soups or stir-fries for the week.' },
        { title: 'Check your pantry before shopping', desc: 'Avoid buying duplicates of what you already have.' },
      ],
    },
  },

  // ─── Grocery ────────────────────────────────────────────────
  grocery: {
    emptyTitle: 'Your list is empty',
    emptySubtitle: 'Add items or let the Smart Grocery agent build your list.',
    orderBtn: 'Order with Instacart',
    clearCheckedBtn: 'Clear checked',
  },

  // ─── Profile ────────────────────────────────────────────────
  profile: {
    notifications: 'Notifications',
    units: 'Units',
    unitsValue: 'Imperial',
    about: (appName: string) => `About ${appName}`,
  },

  // ─── Quiz ───────────────────────────────────────────────────
  quiz: {
    title: 'Any dietary preferences?',
    subtitle: 'Pick all that apply. You can always change this later.',
    noneTag: 'None',
    continueBtn: 'Continue',
  },

  // ─── Recipe detail ──────────────────────────────────────────
  recipe: {
    cookSettings: 'Cook settings',
    portions: 'Portions',
    dietaryRestrictions: 'Dietary restrictions',
  },

  // ─── Share card ─────────────────────────────────────────────
  shareCard: {
    message: (appName: string, url: string, saved: string, meals: number) =>
      `I saved $${saved} this month by reducing food waste with ${appName}! 🥬\n\n${meals} meals cooked from ingredients that would have expired.\n\nStop wasting food → ${url}`,
  },

} as const;
