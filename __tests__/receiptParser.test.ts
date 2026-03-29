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
