// utils/receiptParser.ts
// Pure function — no async, no API calls, no side effects.

import type { ScanResponse, ReceiptItem } from '../types/receipt';

// ── Regex constants ──────────────────────────────────────────────────────────
const PHONE_RE = /\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/;
const STREET_RE = /^\d+\s+\w[\w\s]*(st|ave|blvd|rd|dr|ln|way|pkwy|hwy|pl)\.?\b/i;
const DATE_RE = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/;
const PRICE_RE = /\$?(\d{1,4}\.\d{2})/;
const PRICE_ONLY_RE = /^\-?\$?\d+\.\d{2}$/;

const SKIP_PHRASES = [
  /\bthank\s+you\b/i, /\bhave\s+a\s+nice\b/i, /\bcome\s+again\b/i,
  /\bvisit\s+us\b/i,  /\bfollow\s+us\b/i,   /\bcashier\s*:/i,
  /\bterminal\b/i,    /\breg\s*#/i,          /\btrans\s*#/i,
  /\bauth\b/i,        /\bapproval\b/i,
  /\bbalance\s+due\b/i, /\btendered\b/i, /\bchange\b/i, /\bpayment\b/i,
  // Receipt metadata
  /\bwhse\s*:/i, /\btrm\s*:/i, /\btrn\s*:/i, /\bop\s*#/i,
  /\bstore\s*#/i, /\bwww\./i, /\b2x\s+member\b/i, /\bmember\s+#/i,
  // Scale/weight metadata
  /\btare\s*=/i, /\bitem\s*=/i,
  // Starred metadata codes (*WT, *VC, etc.)
  /^\*[A-Z]+$/i,
  // Timestamp HH:MM:SS
  /^\d{2}:\d{2}:\d{2}$/,
  // Dept-code + price lines (WinCo: "20 1.34")
  /^\d{1,3}\s+\d+\.\d{2}$/,
];

const DISCOUNT_PHRASES = [
  /\bsavings\b/i, /\bdiscount\b/i, /\bcoupon\b/i,
  /\bpromo\b/i,   /\breward\b/i,   /\boff\b/i,
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
  'WINCO', 'BAR S', 'RESERS', 'PICSWEET', 'EGGO', 'INDRBRD',
  'KRFT', 'KEEB',
].sort((a, b) => b.length - a.length);

// ── Category map ─────────────────────────────────────────────────────────────
type CatEntry = { keywords: string[]; subcats: Record<string, string[]> };

const CATEGORY_MAP: Record<string, CatEntry> = {
  dairy: {
    keywords: [
      'milk','cheese','yogurt','butter','cream','half and half','oat milk',
      'almond milk','soy milk','creamer','whipped','kefir','egg','cottage',
      'mont jack','jack 2#','homo milk','18ct',
    ],
    subcats: {
      milk:    ['milk','homo milk'],
      cheese:  ['cheese','mont jack','jack 2#'],
      yogurt:  ['yogurt','kefir'],
      eggs:    ['egg','18ct'],
      butter:  ['butter'],
      cream:   ['cream','creamer','whipped','cottage'],
      alternative: ['oat milk','almond milk','soy milk','half and half'],
    },
  },
  produce: {
    keywords: [
      'apple','banana','lettuce','tomato','onion','pepper','spinach','kale',
      'carrot','celery','cucumber','avocado','berry','berries','grape','mushroom',
      'zucchini','broccoli','cauliflower','lime','lemon','orange','mango','peach',
      'garlic','ginger','herb','cilantro','parsley','basil','arugula','cabbage',
      'beet','gala','plum','strawberr','diced tom','chpd onion','grape tomato',
      'salsa','pnapl','frozen mango',
    ],
    subcats: {
      fruit: [
        'apple','banana','berry','berries','grape','lime','lemon','orange',
        'mango','peach','avocado','gala','plum','strawberr','frozen mango','pnapl',
      ],
      vegetable: [
        'lettuce','tomato','onion','pepper','spinach','kale','carrot','celery',
        'cucumber','mushroom','zucchini','broccoli','cauliflower','garlic','ginger',
        'arugula','cabbage','beet','diced tom','chpd onion','grape tomato',
      ],
      condiment: ['salsa'],
      herb: ['herb','cilantro','parsley','basil'],
    },
  },
  meat: {
    keywords: [
      'chicken','beef','pork','fish','salmon','turkey','shrimp','lamb','bacon',
      'sausage','steak','ground','grnd','deli','ham','tuna','tilapia','cod',
      'crab','scallop','drumstick','wing','breast','thigh','rib','brisket',
      'chorizo','pepperoni','salami','frank','link','mahi','loin','stew',
      'eye rnd','b/best','indrbrd','chix','0/m ham','links mild','turkey frank',
    ],
    subcats: {
      poultry:    ['chicken','turkey','drumstick','wing','breast','thigh','chix','indrbrd'],
      'red meat': ['beef','pork','lamb','steak','ground','grnd','rib','brisket','chorizo','loin','stew','eye rnd','b/best'],
      seafood:    ['fish','salmon','shrimp','tuna','tilapia','cod','crab','scallop','mahi'],
      deli:       ['deli','ham','0/m ham','bacon','sausage','pepperoni','salami','frank','link','links mild','turkey frank'],
    },
  },
  bakery: {
    keywords: [
      'bread','bagel','muffin','croissant','cake','roll','bun','loaf','tortilla',
      'pita','sourdough','baguette','pretzel','donut','danish','scone','brioche',
      'ciabatta','wrap','sndwch wt','sunbean',
    ],
    subcats: {
      bread:    ['bread','loaf','sourdough','baguette','ciabatta','brioche','sndwch wt','sunbean'],
      rolls:    ['roll','bun','bagel'],
      flatbread: ['tortilla','pita','wrap'],
      pastry:   ['muffin','croissant','cake','donut','danish','scone','pretzel'],
    },
  },
  frozen: {
    keywords: [
      'frozen','ice cream','gelato','sorbet','pizza','waffle','nugget','edamame',
      'popsicle','burrito','pot pie','tater tot','fry','eggo',
    ],
    subcats: {
      dessert: ['ice cream','gelato','sorbet','popsicle'],
      meals:   ['pizza','burrito','pot pie','frozen'],
      sides:   ['waffle','nugget','edamame','tater tot','fry','eggo'],
    },
  },
  beverages: {
    keywords: [
      'juice','soda','water','coffee','tea','sparkling','kombucha','lemonade',
      'wine','beer','cider','smoothie','energy drink','coconut water','cold brew',
      'espresso','matcha',
    ],
    subcats: {
      hot:        ['coffee','tea','espresso','matcha','cold brew'],
      juice:      ['juice','lemonade','smoothie','coconut water','kombucha'],
      soda:       ['soda','sparkling','energy drink'],
      water:      ['water'],
      alcoholic:  ['wine','beer','cider'],
    },
  },
  snacks: {
    keywords: [
      'chip','cracker','popcorn','pretzel','granola','bar','cookie','trail mix',
      'nut','almond','cashew','peanut','jerky','rice cake','candy','chocolate',
      'townhouse','nutty bar','oatmeal crm','oatmeal crem',
    ],
    subcats: {
      chips:  ['chip','cracker','popcorn','rice cake','townhouse'],
      nuts:   ['nut','almond','cashew','peanut','trail mix','jerky'],
      sweet:  ['candy','chocolate','cookie','nutty bar','oatmeal crm','oatmeal crem'],
      bars:   ['granola','bar'],
    },
  },
  pantry: {
    keywords: [
      'pasta','rice','sauce','oil','vinegar','flour','sugar','salt','spice','soup',
      'broth','canned','bean','lentil','oat','cereal','honey','jam','peanut butter',
      'syrup','ketchup','mustard','mayo','dressing','seasoning','stock','noodle',
      'quinoa','mac','spag','manwich','pot sld',
    ],
    subcats: {
      grains:     ['pasta','rice','oat','cereal','noodle','quinoa','flour','mac','spag'],
      canned:     ['canned','bean','lentil','soup','broth','stock','manwich'],
      condiments: ['sauce','oil','vinegar','ketchup','mustard','mayo','dressing','honey','jam','peanut butter','syrup'],
      baking:     ['sugar','salt','spice','seasoning'],
      prepared:   ['pot sld'],
    },
  },
  household: {
    keywords: [
      'detergent','soap','shampoo','conditioner','paper','towel','tissue',
      'cleaner','spray','trash','bag','foil','toothpaste','deodorant','lotion',
      'razor','vitamin','supplement','medicine','half pan','eco half',
    ],
    subcats: {
      cleaning:       ['detergent','soap','cleaner','spray','trash','bag','foil'],
      paper:          ['paper','towel','tissue'],
      'personal care':['shampoo','conditioner','toothpaste','deodorant','lotion','razor'],
      health:         ['vitamin','supplement','medicine'],
      kitchen:        ['half pan','eco half'],
    },
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
    .map(line => {
      let l = line.trim().replace(/\s+/g, ' ');
      if (!l) return '';
      // OCR decimal fixes
      l = l.replace(/(\d)\s+\.\s*(\d)/g, '$1.$2');
      l = l.replace(/(\d+\.\d)\s+(\d)(?=\s|$)/g, '$1$2');
      l = l.replace(/(\d)\s+(\d{2})(?=\s|$)/g, (_, a, b) => `${a}.${b}`);
      l = l.replace(/\b([Oo])(\.\d{2})\b/g, '0$2');
      l = l.replace(/\bl(\.\d{2})\b/g, '1$1');
      // Strip leading single-letter tax codes (E/A) e.g. "E 673919 FF BS BREAST"
      l = l.replace(/^[EA]\s+/, '');
      // Strip leading 5-6 digit item codes e.g. "673919 FF BS BREAST"
      l = l.replace(/^\d{5,6}\s+/, '');
      // Strip inline 8-14 digit barcodes e.g. "CHICKEN WINGS 26840100000"
      l = l.replace(/\s*\b\d{8,14}\b\s*/g, ' ').trim();
      // Strip trailing tax flags: FS, or single letter E/A/B/N
      l = l.replace(/\s+(?:FS|[EABN])$/, '');
      // Normalize leading-decimal prices e.g. ".88" → "0.88"
      l = l.replace(/(^|\s)\.(\d{2})(\s|$)/g, (_, pre, dec, post) => `${pre}0.${dec}${post}`);
      return l.trim();
    })
    .filter(Boolean);
}

// ── Step 2: Store info ────────────────────────────────────────────────────────
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

// ── Step 3: Summary ───────────────────────────────────────────────────────────
function extractSummary(lines: string[]): {
  subtotal: number | null; tax: number | null; total: number | null; remaining: string[];
} {
  let subtotal: number | null = null;
  let tax: number | null = null;
  const totals: number[] = [];
  const remaining: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const isSub   = /\bsubtotal\b/i.test(line);
    const isTax   = /\b(tax|hst|gst)\b/i.test(line);
    const isTotal = /\btotal\b/i.test(line) && !isSub && !isTax;

    if (isSub || isTax || isTotal) {
      // Price may be on same line or the very next line
      let price = parsePrice(line);
      if (price === null && lines[i + 1]) {
        price = parsePrice(lines[i + 1]);
        if (price !== null) i++; // consume the next line too
      }
      if (price !== null) {
        if (isSub) subtotal = price;
        else if (isTax) tax = price;
        else totals.push(price);
        i++;
        continue;
      }
    }

    remaining.push(line);
    i++;
  }

  return { subtotal, tax, total: totals.length ? Math.max(...totals) : null, remaining };
}

// ── Step 4: Skip lines ────────────────────────────────────────────────────────
function shouldSkip(line: string): boolean {
  if (line.length < 3) return true;
  if (/^\d+$/.test(line)) return true;
  if (PHONE_RE.test(line)) return true;
  if (DATE_RE.test(line) && !PRICE_RE.test(line)) return true;
  if (SKIP_PHRASES.some(p => p.test(line))) return true;
  if (/^\*/.test(line) && !PRICE_RE.test(line)) return true;
  return false;
}

// ── Step 5: Item patterns ─────────────────────────────────────────────────────
// PAT_A: weighted item "name weight lb @ unit/lb total"
const PAT_A = /^(.+?)\s+([\d.]+)\s*lb\s+@\s+([\d.]+)\/lb\s+([\d.]+)$/i;
// PAT_B: "qty @ unit name total"
const PAT_B = /^(\d+)\s+@\s+([\d.]+)\s+(.+?)\s+([\d.]+)$/;
// PAT_C: "qty x/@ name total"
const PAT_C = /^(\d+)\s+[x@]\s+(.+?)\s+([\d.]+)$/i;
// PAT_D: "name price" (same line)
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
    // Reject lines where name is only digits or a single char
    const name = m[1].trim();
    if (/^\d+$/.test(name) || name.length < 2) return null;
    return { name, quantity: 1, unit: null,
      unit_price: price, total_price: price,
      on_sale: false, confidence_hint: 'medium', parsing_notes: null, raw_line: line };
  }
  return null;
}

// ── Step 6: Brand extraction ──────────────────────────────────────────────────
function resolveBrand(name: string): { brand: string | null; cleanName: string } {
  const upper = name.toUpperCase();
  const matched = KNOWN_BRANDS.find(b => upper === b || upper.startsWith(b + ' '));
  if (matched) {
    return { brand: matched, cleanName: name.slice(matched.length).trim() || name };
  }
  const tokens = name.split(' ');
  let caps = 0;
  for (const t of tokens) {
    if (/^[A-Z0-9&'.\/#+]+$/.test(t)) caps++;
    else break;
  }
  if (caps > 0 && caps < tokens.length) {
    return { brand: tokens.slice(0, caps).join(' '), cleanName: tokens.slice(caps).join(' ') };
  }
  return { brand: null, cleanName: name };
}

// ── Step 7: Variant extraction ────────────────────────────────────────────────
const VARIANT_RE = /\b(\d*\.?\d+\s*)?(fl\s*oz|oz|ml|liter|lb|lbs|kg|\bg\b|ct|count|pk|pack|pieces|mini|large|xl|jumbo|family|party|value)\b/i;

function resolveVariant(name: string): { variant: string | null; cleanName: string } {
  const m = name.match(VARIANT_RE);
  if (!m) return { variant: null, cleanName: name };
  return { variant: m[0].trim(), cleanName: name.replace(VARIANT_RE, '').replace(/\s+/g, ' ').trim() };
}

// ── Step 8: Category ──────────────────────────────────────────────────────────
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

// ── Step 9: Confidence ────────────────────────────────────────────────────────
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

  // Carries a qty/unit_price from a standalone "N @ price" line to the next item
  let pendingQty: { quantity: number; unit_price: number } | null = null;

  let i = 0;
  while (i < r2lines.length) {
    const line = r2lines[i];

    // Standalone quantity line e.g. "3 @ 4.29" — store and apply to next item
    const qtyLineMatch = line.match(/^(\d+)\s*@\s*([\d.]+)$/);
    if (qtyLineMatch) {
      pendingQty = {
        quantity: parseInt(qtyLineMatch[1], 10),
        unit_price: r2(parseFloat(qtyLineMatch[2])),
      };
      i++;
      continue;
    }

    if (shouldSkip(line)) { i++; continue; }

    const isDiscount =
      DISCOUNT_PHRASES.some(p => p.test(line)) ||
      /^-\s*\$?\d/.test(line) ||
      /\d+\.\d{2}-$/.test(line);  // trailing minus e.g. "2.00-"

    if (isDiscount) {
      if (items.length > 0) {
        const last = items[items.length - 1];
        const amount = parsePrice(line);
        items[items.length - 1] = {
          ...last,
          on_sale: true,
          parsing_notes: last.parsing_notes
            ? `${last.parsing_notes}; discount ${amount}`
            : `discount ${amount}`,
        };
      }
      i++;
      continue;
    }

    // Multi-line pairing: if no price on this line, look ahead for a price-only line
    // (skipping over any skip-able lines in between, e.g. timestamps, barcodes)
    let combined = line;
    if (!PRICE_RE.test(line)) {
      let j = i + 1;
      while (j < r2lines.length && shouldSkip(r2lines[j])) j++;
      if (j < r2lines.length && PRICE_ONLY_RE.test(r2lines[j])) {
        combined = `${line} ${r2lines[j]}`;
        i = j; // advance past the price line (i++ at end of loop handles +1)
      }
    }

    const raw = matchLine(combined);
    if (!raw) { unparsed.push(combined); i++; continue; }

    // Apply a pending standalone qty line only if qty × unit_price ≈ item total
    // This prevents misattribution when the qty line belongs to a previous item
    if (pendingQty && raw.total_price !== null) {
      const expected = r2(pendingQty.quantity * pendingQty.unit_price);
      if (Math.abs(expected - raw.total_price) < 0.02) {
        raw.quantity = pendingQty.quantity;
        raw.unit_price = pendingQty.unit_price;
      }
    }
    pendingQty = null;

    const { brand, cleanName: afterBrand } = resolveBrand(raw.name);
    const { variant, cleanName } = resolveVariant(afterBrand);
    const { category, subcategory } = resolveCategory(cleanName || raw.name);

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
      on_sale: raw.on_sale,
      confidence: resolveConfidence({ ...raw, brand }),
      parsing_notes: raw.parsing_notes,
      raw_line: raw.raw_line,
    });

    i++;
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
