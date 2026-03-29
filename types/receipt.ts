// types/receipt.ts

export interface ReceiptItem {
  name: string;
  brand: string | null;
  variant: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  total_price: number | null;
  category: string;
  subcategory: string | null;
  on_sale: boolean;
  confidence: 'high' | 'medium' | 'low';
  parsing_notes: string | null;
  raw_line: string;
}

export interface ScanResponse {
  scanned_at: string;
  store: {
    name: string | null;
    address: string | null;
    phone: string | null;
  };
  summary: {
    item_count: number;
    subtotal: number | null;
    tax: number | null;
    total: number | null;
  };
  items: ReceiptItem[];
  unparsed_lines: string[];
  raw_text: string;
}
