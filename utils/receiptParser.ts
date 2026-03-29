// utils/receiptParser.ts
// Pure function — no async, no API calls, no side effects.

import type { ScanResponse, ReceiptItem } from '../types/receipt';

// ── Regex constants ──────────────────────────────────────────────────────────
const PHONE_RE = /\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/;
const STREET_RE = /^\d+\s+\w[\w\s]*(st|ave|blvd|rd|dr|ln|way|pkwy|hwy|pl)\.?\b/i;
const DATE_RE = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/;
const PRICE_RE = /\$?(\d{1,4}\.\d{2})/;

const SKIP_PHRASES = [
  /\bthank\s+you\b/i, /\bhave\s+a\s+nice\b/i, /\bcome\s+again\b/i,
  /\bvisit\s+us\b/i,  /\bfollow\s+us\b/i,   /\bcashier\b/i,
  /\bterminal\b/i,    /\breg\s*#/i,          /\btrans\s*#/i,
  /\bauth\b/i,        /\bapproval\b/i,
];

const DISCOUNT_PHRASES = [
  /\bsavings\b/i, /\bdiscount\b/i, /\bcoupon\b/i,
  /\bmember\b/i,  /\bpromo\b/i,   /\breward\b/i,
];

// Sorted longest-first so "ORGANIC VALLEY" matches before "ORGANIC"
const KNOWN_BRANDS = [
  'ORGANIC VALLEY', 'GREAT VALUE', 'MEMBERS MARK', 'COCA COLA',
  'BLUE DIAMOND', 'LAND O LAKES', 'PEPPERIDGE FARM', 'FOSTER FARMS',
  'BEYOND MEAT', "DAVE'S KILLER", 'NATURE VALLEY', 'GENERAL MILLS',
  'OSCAR MAYER', 'HORIZON', 'KIRKLAND', 'TROPICANA', 'PEPSI', 'COKE',
  'DANNON', 'CHOBANI', 'OIKOS', 'BIRDS EYE', "ANNIE'S", 'CLIF', 'KIND',
  'QUAKER', 'KELLOGGS', 'CAMPBELLS', 'HEINZ', 'HUNTS', 'DEL MONTE',
  'SILK', 'OATLY', 'CALIFIA', 'SARGENTO', 'TILLAMOOK', 'KERRYGOLD',
  'PHILADELPHIA', 'KRAFT', 'HILLSHIRE', 'APPLEGATE', 'TYSON', 'PERDUE',
  'IMPOSSIBLE', 'ARNOLD', 'THOMAS', 'MISSION', 'OLE', 'SIETE',
].sort((a, b) => b.length - a.length);

// ── Category map ─────────────────────────────────────────────────────────────
type CatEntry = { keywords: string[]; subcats: Record<string, string[]> };

const CATEGORY_MAP: Record<string, CatEntry> = {
  dairy: {
    keywords: ['milk','cheese','yogurt','butter','cream','half and half','oat milk','almond milk','soy milk','creamer','whipped','kefir'],
    subcats: { milk:['milk'], cheese:['cheese'], yogurt:['yogurt','kefir'], butter:['butter'], cream:['cream','creamer','whipped'], alternative:['oat milk','almond milk','soy milk','half and half'] },
  },
  produce: {
    keywords: ['apple','banana','lettuce','tomato','onion','pepper','spinach','kale','carrot','celery','cucumber','avocado','berry','berries','grape','mushroom','zucchini','broccoli','cauliflower','lime','lemon','orange','mango','peach','garlic','ginger','herb','cilantro','parsley','basil','arugula','cabbage','beet'],
    subcats: { fruit:['apple','banana','berry','berries','grape','lime','lemon','orange','mango','peach','avocado'], vegetable:['lettuce','tomato','onion','pepper','spinach','kale','carrot','celery','cucumber','mushroom','zucchini','broccoli','cauliflower','garlic','ginger','arugula','cabbage','beet'], herb:['herb','cilantro','parsley','basil'] },
  },
  meat: {
    keywords: ['chicken','beef','pork','fish','salmon','turkey','shrimp','lamb','bacon','sausage','steak','ground','deli','ham','tuna','tilapia','cod','crab','scallop','drumstick','wing','breast','thigh','rib','brisket','chorizo','pepperoni','salami'],
    subcats: { poultry:['chicken','turkey','drumstick','wing','breast','thigh'], 'red meat':['beef','pork','lamb','steak','ground','rib','brisket','chorizo'], seafood:['fish','salmon','shrimp','tuna','tilapia','cod','crab','scallop'], deli:['deli','ham','bacon','sausage','pepperoni','salami'] },
  },
  bakery: {
    keywords: ['bread','bagel','muffin','croissant','cake','roll','bun','loaf','tortilla','pita','sourdough','baguette','pretzel','donut','danish','scone','brioche','ciabatta','wrap'],
    subcats: { bread:['bread','loaf','sourdough','baguette','ciabatta','brioche'], rolls:['roll','bun','bagel'], flatbread:['tortilla','pita','wrap'], pastry:['muffin','croissant','cake','donut','danish','scone','pretzel'] },
  },
  frozen: {
    keywords: ['frozen','ice cream','gelato','sorbet','pizza','waffle','nugget','edamame','popsicle','burrito','pot pie','tater tot','fry'],
    subcats: { dessert:['ice cream','gelato','sorbet','popsicle'], meals:['pizza','burrito','pot pie','frozen'], sides:['waffle','nugget','edamame','tater tot','fry'] },
  },
  beverages: {
    keywords: ['juice','soda','water','coffee','tea','sparkling','kombucha','lemonade','wine','beer','cider','smoothie','energy drink','coconut water','cold brew','espresso','matcha'],
    subcats: { hot:['coffee','tea','espresso','matcha','cold brew'], juice:['juice','lemonade','smoothie','coconut water','kombucha'], soda:['soda','sparkling','energy drink'], water:['water'], alcoholic:['wine','beer','cider'] },
  },
  snacks: {
    keywords: ['chip','cracker','popcorn','pretzel','granola','bar','cookie','trail mix','nut','almond','cashew','peanut','jerky','rice cake','candy','chocolate'],
    subcats: { chips:['chip','cracker','popcorn','rice cake'], nuts:['nut','almond','cashew','peanut','trail mix','jerky'], sweet:['candy','chocolate','cookie'], bars:['granola','bar'] },
  },
  pantry: {
    keywords: ['pasta','rice','sauce','oil','vinegar','flour','sugar','salt','spice','soup','broth','canned','bean','lentil','oat','cereal','honey','jam','peanut butter','syrup','ketchup','mustard','mayo','dressing','seasoning','stock','noodle','quinoa'],
    subcats: { grains:['pasta','rice','oat','cereal','noodle','quinoa','flour'], canned:['canned','bean','lentil','soup','broth','stock'], condiments:['sauce','oil','vinegar','ketchup','mustard','mayo','dressing','honey','jam','peanut butter','syrup'], baking:['sugar','salt','spice','seasoning'] },
  },
  household: {
    keywords: ['detergent','soap','shampoo','conditioner','paper','towel','tissue','cleaner','spray','trash','bag','foil','toothpaste','deodorant','lotion','razor','vitamin','supplement','medicine'],
    subcats: { cleaning:['detergent','soap','cleaner','spray','trash','bag','foil'], paper:['paper','towel','tissue'], 'personal care':['shampoo','conditioner','toothpaste','deodorant','lotion','razor'], health:['vitamin','supplement','medicine'] },
  },
};

// ── Utility ──────────────────────────────────────────────────────────────────
function r2(n: number): number { return Math.round(n * 100) / 100; }

function parsePrice(s: string): number | null {
  const m = s.match(PRICE_RE);
  return m ? r2(parseFloat(m[1])) : null;
}

function cleanLines(rawText: string): string[] {
  return rawText
    .split('\n')
    .map(line =>
      line
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/(\d)\s+\.\s*(\d)/g, '$1.$2')
        .replace(/(\d+\.\d)\s+(\d)(?=\s|$)/g, '$1$2')
        .replace(/(\d)\s+(\d{2})(?=\s|$)/g, (_, a, b) => `${a}.${b}`)
        .replace(/\b([Oo])(\.\d{2})\b/g, '0$2')
        .replace(/\bl(\.\d{2})\b/g, '1$1')
    )
    .filter(Boolean);
}

// ── Step 2: Store info ───────────────────────────────────────────────────────
function extractStoreInfo(lines: string[]): { store: ScanResponse['store']; remaining: string[] } {
  const head = lines.slice(0, Math.min(5, lines.length));
  const tail = lines.slice(head.length);
  const name = head[0] ?? null;
  let address: string | null = null;
  let phone: string | null = null;
  const used = new Set<number>([0]);

  for (let i = 1; i < head.length; i++) {
    if (!phone && PHONE_RE.test(head[i])) { phone = head[i]; used.add(i); }
    else if (!address && STREET_RE.test(head[i])) { address = head[i]; used.add(i); }
  }

  return {
    store: { name, address, phone },
    remaining: [...head.filter((_, i) => !used.has(i)), ...tail],
  };
}

// ── Step 3: Summary ──────────────────────────────────────────────────────────
function extractSummary(lines: string[]): {
  subtotal: number | null; tax: number | null; total: number | null; remaining: string[];
} {
  let subtotal: number | null = null;
  let tax: number | null = null;
  const totals: number[] = [];
  const remaining: string[] = [];

  for (const line of lines) {
    const price = parsePrice(line);
    if (/\bsubtotal\b/i.test(line) && price !== null) { subtotal = price; continue; }
    if (/\b(tax|hst|gst)\b/i.test(line) && price !== null) { tax = price; continue; }
    if (/\btotal\b/i.test(line) && price !== null) { totals.push(price); continue; }
    remaining.push(line);
  }

  return { subtotal, tax, total: totals.length ? Math.max(...totals) : null, remaining };
}

// ── Step 4: Skip lines ───────────────────────────────────────────────────────
function shouldSkip(line: string): boolean {
  if (line.length < 4) return true;
  if (/^\d+$/.test(line)) return true;
  if (PHONE_RE.test(line)) return true;
  if (DATE_RE.test(line) && !PRICE_RE.test(line)) return true;
  if (SKIP_PHRASES.some(p => p.test(line))) return true;
  if (/^\*/.test(line) && !PRICE_RE.test(line)) return true;
  return false;
}

// ── Step 6: Item patterns ────────────────────────────────────────────────────
const PAT_A = /^(.+?)\s+([\d.]+)\s*lb\s+@\s+([\d.]+)\/lb\s+([\d.]+)$/i;
const PAT_B = /^(\d+)\s+@\s+([\d.]+)\s+(.+?)\s+([\d.]+)$/;
const PAT_C = /^(\d+)\s+[x@]\s+(.+?)\s+([\d.]+)$/i;
const PAT_D = /^(.+?)\s+(\d+\.\d{2})$/;

interface RawItem {
  name: string; quantity: number | null; unit: string | null;
  unit_price: number | null; total_price: number | null;
  on_sale: boolean; confidence_hint: 'high' | 'medium' | 'low';
  parsing_notes: string | null; raw_line: string;
}

function matchLine(line: string): RawItem | null {
  let m: RegExpMatchArray | null;

  if ((m = line.match(PAT_A))) {
    return { name: m[1].trim(), quantity: parseFloat(m[2]), unit: 'lb',
      unit_price: r2(parseFloat(m[3])), total_price: r2(parseFloat(m[4])),
      on_sale: false, confidence_hint: 'high', parsing_notes: 'weighted item', raw_line: line };
  }
  if ((m = line.match(PAT_B))) {
    const qty = parseInt(m[1], 10);
    return { name: m[3].trim(), quantity: qty, unit: null,
      unit_price: r2(parseFloat(m[2])), total_price: r2(parseFloat(m[4])),
      on_sale: false, confidence_hint: 'high', parsing_notes: null, raw_line: line };
  }
  if ((m = line.match(PAT_C))) {
    const qty = parseInt(m[1], 10);
    const total = r2(parseFloat(m[3]));
    return { name: m[2].trim(), quantity: qty, unit: null,
      unit_price: r2(total / qty), total_price: total,
      on_sale: false, confidence_hint: 'high', parsing_notes: null, raw_line: line };
  }
  if ((m = line.match(PAT_D))) {
    const price = r2(parseFloat(m[2]));
    if (price > 999) return null;
    return { name: m[1].trim(), quantity: 1, unit: null,
      unit_price: price, total_price: price,
      on_sale: false, confidence_hint: 'medium', parsing_notes: null, raw_line: line };
  }
  return null;
}

// ── Step 7: Brand extraction ─────────────────────────────────────────────────
function resolveBrand(name: string): { brand: string | null; cleanName: string } {
  const upper = name.toUpperCase();
  const matched = KNOWN_BRANDS.find(b => upper === b || upper.startsWith(b + ' '));
  if (matched) {
    return { brand: matched, cleanName: name.slice(matched.length).trim() || name };
  }
  const tokens = name.split(' ');
  let caps = 0;
  for (const t of tokens) {
    if (/^[A-Z0-9&'.]+$/.test(t)) caps++;
    else break;
  }
  if (caps > 0 && caps < tokens.length) {
    return { brand: tokens.slice(0, caps).join(' '), cleanName: tokens.slice(caps).join(' ') };
  }
  return { brand: null, cleanName: name };
}

// ── Step 8: Variant extraction ────────────────────────────────────────────────
const VARIANT_RE = /\b(\d*\.?\d+\s*)?(fl\s*oz|oz|ml|liter|lb|lbs|kg|\bg\b|ct|count|pk|pack|pieces|mini|large|xl|jumbo|family|party|value)\b/i;

function resolveVariant(name: string): { variant: string | null; cleanName: string } {
  const m = name.match(VARIANT_RE);
  if (!m) return { variant: null, cleanName: name };
  return { variant: m[0].trim(), cleanName: name.replace(VARIANT_RE, '').replace(/\s+/g, ' ').trim() };
}

// ── Step 9: Category ─────────────────────────────────────────────────────────
function resolveCategory(name: string): { category: string; subcategory: string | null } {
  const lower = name.toLowerCase();
  for (const [cat, { keywords, subcats }] of Object.entries(CATEGORY_MAP)) {
    const kw =
      keywords.filter(k => k.includes(' ')).find(k => lower.includes(k)) ??
      keywords.filter(k => !k.includes(' ')).find(k => lower.includes(k));
    if (kw) {
      const sub = Object.entries(subcats).find(([, words]) => words.includes(kw));
      return { category: cat, subcategory: sub ? sub[0] : null };
    }
  }
  return { category: 'grocery', subcategory: null };
}

// ── Step 10: Confidence ──────────────────────────────────────────────────────
function resolveConfidence(item: RawItem & { brand: string | null }): 'high' | 'medium' | 'low' {
  if (item.confidence_hint === 'low') return 'low';
  if (item.confidence_hint === 'high') return 'high';
  return 'medium';
}

// ── Main export ───────────────────────────────────────────────────────────────
export function parseReceipt(rawText: string): ScanResponse {
  if (!rawText.trim()) {
    return {
      scanned_at: new Date().toISOString(),
      store: { name: null, address: null, phone: null },
      summary: { item_count: 0, subtotal: null, tax: null, total: null },
      items: [], unparsed_lines: [], raw_text: rawText,
    };
  }

  const lines = cleanLines(rawText);
  const { store, remaining: r1 } = extractStoreInfo(lines);
  const { subtotal, tax, total, remaining: r2lines } = extractSummary(r1);

  const items: ReceiptItem[] = [];
  const unparsed: string[] = [];
  let pendingDiscount: { line: string; amount: number | null } | null = null;

  for (const line of r2lines) {
    if (shouldSkip(line)) continue;

    const isDiscount = DISCOUNT_PHRASES.some(p => p.test(line)) || /^-\s*\$?\d/.test(line);
    if (isDiscount) { pendingDiscount = { line, amount: parsePrice(line) }; continue; }

    const raw = matchLine(line);
    if (!raw) { unparsed.push(line); pendingDiscount = null; continue; }

    const { brand, cleanName: afterBrand } = resolveBrand(raw.name);
    const { variant, cleanName } = resolveVariant(afterBrand);
    const { category, subcategory } = resolveCategory(cleanName || raw.name);

    let on_sale = raw.on_sale;
    let parsing_notes = raw.parsing_notes;
    if (pendingDiscount) {
      on_sale = true;
      parsing_notes = parsing_notes
        ? `${parsing_notes}; discount ${pendingDiscount.amount}`
        : `discount ${pendingDiscount.amount}`;
      pendingDiscount = null;
    }

    const enriched = { ...raw, brand, on_sale, parsing_notes };
    items.push({
      name: cleanName || raw.name,
      brand,
      variant,
      quantity: raw.quantity,
      unit: raw.unit,
      unit_price: raw.unit_price,
      total_price: raw.total_price,
      category,
      subcategory,
      on_sale,
      confidence: resolveConfidence(enriched),
      parsing_notes,
      raw_line: raw.raw_line,
    });
  }

  return {
    scanned_at: new Date().toISOString(),
    store,
    summary: { item_count: items.length, subtotal, tax, total },
    items,
    unparsed_lines: unparsed,
    raw_text: rawText,
  };
}
