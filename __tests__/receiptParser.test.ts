import { parseReceipt } from '../utils/receiptParser';

describe('text cleanup', () => {
  test('fixes spaced price "3.4 9" → item price 3.49', () => {
    const raw = 'STORE\nWHOLE MILK 3.4 9\n';
    const result = parseReceipt(raw);
    expect(result.items[0]?.total_price).toBe(3.49);
  });

  test('fixes O for 0: "JUICE O.99" parses as 0.99', () => {
    const raw = 'STORE\nORANGE JUICE O.99\n';
    const result = parseReceipt(raw);
    expect(result.items[0]?.total_price).toBe(0.99);
  });

  test('fixes l for 1: "WATER l.29" parses as 1.29', () => {
    const raw = 'STORE\nSPARKLING WATER l.29\n';
    const result = parseReceipt(raw);
    expect(result.items[0]?.total_price).toBe(1.29);
  });

  test('always returns raw_text unchanged', () => {
    const raw = 'STORE\nMILK 3.49\n';
    expect(parseReceipt(raw).raw_text).toBe(raw);
  });

  test('always returns unparsed_lines array', () => {
    const result = parseReceipt('STORE\nMILK 3.49\n');
    expect(Array.isArray(result.unparsed_lines)).toBe(true);
  });
});

describe('store info', () => {
  test('extracts store name from first line', () => {
    const result = parseReceipt('WHOLE FOODS MARKET\n123 Main Ave\nMILK 3.49\n');
    expect(result.store.name).toBe('WHOLE FOODS MARKET');
  });

  test('extracts street address from first 5 lines', () => {
    const result = parseReceipt('WHOLE FOODS\n123 Main Ave\nMILK 3.49\n');
    expect(result.store.address).toBe('123 Main Ave');
  });

  test('extracts phone number from first 5 lines', () => {
    const result = parseReceipt('STORE\n555-123-4567\nMILK 3.49\n');
    expect(result.store.phone).toBe('555-123-4567');
  });

  test('store name is null when rawText is empty', () => {
    expect(parseReceipt('').store.name).toBeNull();
  });
});

describe('summary extraction', () => {
  test('extracts SUBTOTAL, TAX, TOTAL', () => {
    const raw = 'STORE\nMILK 3.49\nSUBTOTAL 3.49\nTAX 0.28\nTOTAL 3.77\n';
    const result = parseReceipt(raw);
    expect(result.summary.subtotal).toBe(3.49);
    expect(result.summary.tax).toBe(0.28);
    expect(result.summary.total).toBe(3.77);
  });

  test('picks largest value when multiple TOTAL lines', () => {
    const raw = 'STORE\nMILK 3.49\nTOTAL 3.49\nTOTAL DUE 3.77\n';
    expect(parseReceipt(raw).summary.total).toBe(3.77);
  });

  test('total is null when no TOTAL line found', () => {
    expect(parseReceipt('STORE\nMILK 3.49\n').summary.total).toBeNull();
  });

  test('summary lines are not included in items', () => {
    const raw = 'STORE\nMILK 3.49\nSUBTOTAL 3.49\nTAX 0.28\nTOTAL 3.77\n';
    expect(parseReceipt(raw).items).toHaveLength(1);
  });
});

describe('skip lines', () => {
  test('skips THANK YOU', () => {
    const result = parseReceipt('STORE\nMILK 3.49\nTHANK YOU FOR SHOPPING\n');
    expect(result.unparsed_lines.join(' ')).not.toContain('THANK YOU');
  });

  test('skips pure numeric lines (barcodes)', () => {
    const result = parseReceipt('STORE\nMILK 3.49\n0012345678901\n');
    expect(result.unparsed_lines.join(' ')).not.toContain('0012345678901');
  });

  test('skips date-only lines', () => {
    const result = parseReceipt('STORE\nMILK 3.49\n03/28/2026\n');
    expect(result.items).toHaveLength(1);
    expect(result.unparsed_lines.join(' ')).not.toContain('03/28/2026');
  });
});

describe('discount linking', () => {
  test('links MEMBER SAVINGS to preceding item, sets on_sale=true', () => {
    const raw = 'STORE\nMILK 3.49\nMEMBER SAVINGS -1.00\nTOTAL 2.49\n';
    const result = parseReceipt(raw);
    expect(result.items[0].on_sale).toBe(true);
    expect(result.items[0].parsing_notes).toContain('discount');
  });
});

describe('item pattern matching', () => {
  test('Pattern D: standard name + price', () => {
    const result = parseReceipt('STORE\nWHOLE MILK 3.49\n');
    expect(result.items[0].total_price).toBe(3.49);
    expect(result.items[0].quantity).toBe(1);
  });

  test('Pattern C: quantity prefix "2 x BUTTER 5.98"', () => {
    const result = parseReceipt('STORE\n2 x BUTTER 5.98\n');
    expect(result.items[0].quantity).toBe(2);
    expect(result.items[0].total_price).toBe(5.98);
    expect(result.items[0].unit_price).toBe(2.99);
  });

  test('Pattern B: "3 @ 1.99 YOGURT CUP 5.97"', () => {
    const result = parseReceipt('STORE\n3 @ 1.99 YOGURT CUP 5.97\n');
    expect(result.items[0].quantity).toBe(3);
    expect(result.items[0].unit_price).toBe(1.99);
    expect(result.items[0].total_price).toBe(5.97);
  });

  test('Pattern A: weighted "BEEF GROUND 1.25 lb @ 4.99/lb 6.24"', () => {
    const result = parseReceipt('STORE\nBEEF GROUND 1.25 lb @ 4.99/lb 6.24\n');
    expect(result.items[0].unit).toBe('lb');
    expect(result.items[0].quantity).toBe(1.25);
    expect(result.items[0].unit_price).toBe(4.99);
    expect(result.items[0].total_price).toBe(6.24);
    expect(result.items[0].parsing_notes).toBe('weighted item');
  });

  test('unmatched lines go to unparsed_lines', () => {
    const result = parseReceipt('STORE\nXXXXXXXXXXXXXXXX\n');
    expect(result.unparsed_lines).toContain('XXXXXXXXXXXXXXXX');
  });
});

describe('brand extraction', () => {
  test('extracts known brand CHOBANI', () => {
    const result = parseReceipt('STORE\nCHOBANI YOGURT PLAIN 1.49\n');
    expect(result.items[0].brand).toBe('CHOBANI');
  });

  test('extracts multi-word brand GREAT VALUE', () => {
    const result = parseReceipt('STORE\nGREAT VALUE MILK 2.49\n');
    expect(result.items[0].brand).toBe('GREAT VALUE');
  });
});

describe('category assignment', () => {
  test('assigns dairy to milk', () => {
    expect(parseReceipt('STORE\nWHOLE MILK 3.49\n').items[0].category).toBe('dairy');
  });

  test('assigns produce to apple', () => {
    expect(parseReceipt('STORE\nFUJI APPLE 0.89\n').items[0].category).toBe('produce');
  });

  test('assigns meat to chicken', () => {
    expect(parseReceipt('STORE\nCHICKEN BREAST 7.99\n').items[0].category).toBe('meat');
  });

  test('defaults to grocery for unknown', () => {
    expect(parseReceipt('STORE\nXYZABC PRODUCT 2.99\n').items[0].category).toBe('grocery');
  });
});

describe('confidence scoring', () => {
  test('weighted item → high', () => {
    const result = parseReceipt('STORE\nBEEF GROUND 1.25 lb @ 4.99/lb 6.24\n');
    expect(result.items[0].confidence).toBe('high');
  });

  test('pattern D → medium', () => {
    const result = parseReceipt('STORE\nSOME PRODUCT 2.99\n');
    expect(result.items[0].confidence).toBe('medium');
  });
});

describe('output contract', () => {
  test('scanned_at is a valid ISO string', () => {
    const result = parseReceipt('STORE\n');
    expect(new Date(result.scanned_at).toISOString()).toBe(result.scanned_at);
  });

  test('item_count matches items array length', () => {
    const result = parseReceipt('STORE\nMILK 3.49\nBREAD 2.99\n');
    expect(result.summary.item_count).toBe(result.items.length);
  });
});
