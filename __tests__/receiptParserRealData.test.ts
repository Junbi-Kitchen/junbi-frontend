import * as fs from 'fs';
import * as path from 'path';
import { parseReceipt } from '../utils/receiptParser';

const COSTCO = `COSTCO
WHOLESALE
Thornton #629
16375 N. Washington St.
Thornton, CO 80023
2X Member 111826278335
E
673919 FF BS BREAST
23.99 E
E
633561 KS DICED TOM
6.49 E
E
967596 JACKORGSALSA
2.97 E
3 @ 4.29
E
878137 18CT EGGS
12.87 E
E 77053 GRAPE TOMATO
6.29 E
404609 ECO HALF PAN
6.49 A
E 55992 GRND TURKEY
18.47 E
E
263423 CHPD ONION
3.59 E
E 22101 MONT JACK 2#
4.45 E
SUBTOTAL
85.61
TAX
3.52
**** TOTAL
89.13
Check/Member Prntd
89.13
CHANGE
0.00
A 8.50% TAX
0.55
E 3.75% TAX
2.97
TOTAL TAX
3.52
TOTAL NUMBER OF ITEMS SOLD =
11
04/20/2016 15:00 629 4 172 14
OP#: 14 Name: PEPPER
Thank You!
Please Come Again
Whse: 629 Trm:4 Trn: 172 OP:14`;

const WHOLE_FOODS = `WHOLE
FOODS
MARKET
SHARON RD.
PL TORTILLA S
6.99 B
CAGE FREE ALL WHIT
BLACK BEANS
3.69 B
1.29 B
Frozen Mangoes 160
2.99 B
Whole Strawberries
2.99 B
OG LF COTTAGE CHEE
3.49 B
*
*VC
*
MAHI MAHI FILLETS
$2 off (1) WC Fill
California Harvest
8.99 B
2.00-
2.69 B
1.08 lb @ 1.99 /lb
*WT
TARE = .01
PLUMS BLACK CV 2.15 B
ITEM = 4040
NHP SLICED OVEN RO
3.99 B
NHP SLICED HICKORY
3.99 B
1.64 lb @ 1.99 /lb
TARE
= .01
WT
GALA APPLES OG
3.26 B
ITEM
= 94135
**** TAX .93 BAL
45.44`;

const WINCO = `WINCO NOODLES
WinCo
FOODS
The Supermarket Lane Price Leader
www.wincofoods.com
800 S Cockrell Hill Rd
Duncanville, TX 75137
Store #0124
Cashier: Yolanda R
09/08/14
CHICKEN WINGS 26840100000
N/YORK TX GRLC 7045900558
PICSWEET BLEND 7056096902
PICSWEET GREENS 7056087677
20 1.34
20 1.28
CHICKEN WINGS 26840100000
DIET LN GRND B 20167400000
PORK LOIN CHOP 20337400000
26841800000
DRUMSTICKS
EYE RND STK FP 20148200000
EYE RND STK FP 20148200000
BEEF FOR STEW 20254300000
PORK 1/2 LOIN 20323300000
B/BEST S STEAK 4497921020
BAR S MEAT FRNK 1590013401
0/M HAM
11:16:24
2.18 FS
5.39 FS
2.68 FS
2.56 FS
5.48 FS
10.87 FS
9.91 FS
5.32 FS
8.39 FS
8.24 FS
10.48 FS
8.12 FS
1.00 FS
.88 FS
4470001903
3.99 FS
7055280303
1.68 FS
2 @ .84
KRFT DELUXE MAC 2100065886
INDRBRD CHIX BR 3737101318
5.98 FS
3.64 FS
2 @ 1.82
EGGO WAFFLE
3800037435
1.96 FS
L/D NUTTY BARS 2430004120
1.25 FS
L\\D OATMEAL CRM 2430004101
1.25 FS
LINKS MILD
74295503660
5.78 FS
KEEB TOWNHOUSE
3010010055
1.98 FS
TURKEY FRANK
4222281210
.88 FS
RESERS POT SLD
7111719300
.98 FS
DM SPAG SAUCE
2400052363
.71 FS
HUNTS MANWICH
2700044212
1.64 FS
2 @ .82
DM PNAPL CHNKY 2400000164
1.96 FS
20.98
SUNBEAN BUNS 7763306333
WINCO SNDWCH WT 7055200115
WINCO HOMO MILK 7055240600
EGGS
1.98 FS
.91 FS
2.48 FS
7003837280
1.37 FS
SUBTOTAL
121.92
TOTAL TAX
.00
TOTAL
121.92`;

const RECEIPTS: Record<string, string> = {
  'test-receipt.jpg (Costco)':  COSTCO,
  'test-receipt2.jpg (Whole Foods)': WHOLE_FOODS,
  'test-receipt3.jpg (WinCo)':  WINCO,
  'test-receipt4.jpg (Costco duplicate)': COSTCO,
};

// Write full parse results to file for inspection
beforeAll(() => {
  const out: Record<string, unknown> = {};
  for (const [name, text] of Object.entries(RECEIPTS)) {
    out[name] = parseReceipt(text);
  }
  fs.writeFileSync(
    path.join(__dirname, '../parse-results.json'),
    JSON.stringify(out, null, 2),
    'utf8'
  );
});

// ── Costco ────────────────────────────────────────────────────────────────────
describe('Costco receipt', () => {
  const result = parseReceipt(COSTCO);

  it('detects store name', () => {
    expect(result.store.name).toMatch(/costco/i);
  });

  it('detects total', () => {
    expect(result.summary.total).toBe(89.13);
  });

  it('parses FF BS BREAST', () => {
    const item = result.items.find(i => /breast/i.test(i.name));
    expect(item).toBeDefined();
    expect(item?.total_price).toBe(23.99);
    expect(item?.category).toBe('meat');
  });

  it('parses KS DICED TOM', () => {
    const item = result.items.find(i => /diced/i.test(i.name));
    expect(item).toBeDefined();
    expect(item?.total_price).toBe(6.49);
  });

  it('parses 18CT EGGS with quantity 3', () => {
    const item = result.items.find(i => /egg/i.test(i.name));
    expect(item).toBeDefined();
    expect(item?.total_price).toBe(12.87);
    expect(item?.quantity).toBe(3);
    expect(item?.unit_price).toBe(4.29);
  });

  it('parses GRND TURKEY', () => {
    const item = result.items.find(i => /turkey/i.test(i.name));
    expect(item).toBeDefined();
    expect(item?.total_price).toBe(18.47);
    expect(item?.category).toBe('meat');
  });

  it('parses MONT JACK 2#', () => {
    const item = result.items.find(i => /mont jack/i.test(i.name));
    expect(item).toBeDefined();
    expect(item?.total_price).toBe(4.45);
    expect(item?.category).toBe('dairy');
  });

  it('does not have quantity undefined for single items', () => {
    const breast = result.items.find(i => /breast/i.test(i.name));
    expect(breast?.quantity).not.toBeUndefined();
  });
});

// ── Whole Foods ───────────────────────────────────────────────────────────────
describe('Whole Foods receipt', () => {
  const result = parseReceipt(WHOLE_FOODS);

  it('detects store name', () => {
    expect(result.store.name).toMatch(/whole/i);
  });

  it('parses PL TORTILLA S', () => {
    const item = result.items.find(i => /tortilla/i.test(i.name));
    expect(item).toBeDefined();
    expect(item?.total_price).toBe(6.99);
    expect(item?.category).toBe('bakery');
  });

  it('parses BLACK BEANS', () => {
    const item = result.items.find(i => /bean/i.test(i.name));
    expect(item).toBeDefined();
    expect(item?.total_price).toBe(3.69);
  });

  it('parses California Harvest (mahi mahi brand line) with discount applied', () => {
    // Whole Foods splits MAHI MAHI across 5 lines (name, discount desc, brand, price, discount amt)
    // The parser captures the brand line "California Harvest" with the price and discount
    const item = result.items.find(i => /california harvest/i.test(i.name));
    expect(item).toBeDefined();
    expect(item?.total_price).toBe(8.99);
    expect(item?.on_sale).toBe(true);
  });

  it('parses GALA APPLES', () => {
    const item = result.items.find(i => /gala|apple/i.test(i.name));
    expect(item).toBeDefined();
    expect(item?.category).toBe('produce');
  });

  it('does not throw when quantity is absent', () => {
    expect(() => parseReceipt(WHOLE_FOODS)).not.toThrow();
    result.items.forEach(item => {
      expect(item.quantity).not.toBeUndefined();
    });
  });
});

// ── WinCo ─────────────────────────────────────────────────────────────────────
describe('WinCo receipt', () => {
  const result = parseReceipt(WINCO);

  it('detects store name', () => {
    expect(result.store.name).toMatch(/winco/i);
  });

  it('detects total', () => {
    expect(result.summary.total).toBe(121.92);
  });

  it('parses EGGO WAFFLE', () => {
    const item = result.items.find(i => /eggo|waffle/i.test(i.name));
    expect(item).toBeDefined();
    expect(item?.total_price).toBe(1.96);
    expect(item?.category).toBe('frozen');
  });

  it('parses LINKS MILD', () => {
    const item = result.items.find(i => /link/i.test(i.name));
    expect(item).toBeDefined();
    expect(item?.total_price).toBe(5.78);
    expect(item?.category).toBe('meat');
  });

  it('parses TURKEY FRANK', () => {
    const item = result.items.find(i => /frank|turkey/i.test(i.name));
    expect(item).toBeDefined();
    expect(item?.category).toBe('meat');
  });

  it('parses EGGO WAFFLE with quantity 1 (no qty line for this item)', () => {
    const item = result.items.find(i => /eggo|waffle/i.test(i.name));
    expect(item?.quantity).toBe(1);
    expect(item?.total_price).toBe(1.96);
  });

  it('parses KEEB TOWNHOUSE (crackers)', () => {
    const item = result.items.find(i => /townhouse/i.test(i.name));
    expect(item).toBeDefined();
    expect(item?.total_price).toBe(1.98);
    expect(item?.category).toBe('snacks');
  });

  it('does not throw when quantity is absent', () => {
    expect(() => parseReceipt(WINCO)).not.toThrow();
    result.items.forEach(item => {
      expect(item.quantity).not.toBeUndefined();
    });
  });
});
