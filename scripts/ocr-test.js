// scripts/ocr-test.js
// Runs Cloud Vision OCR on all test receipt images and writes raw text to ocr-results.txt
// Usage: node scripts/ocr-test.js

const fs = require('fs');
const path = require('path');

// Read API key from .env
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/EXPO_PUBLIC_GCV_API_KEY=(.+)/);
if (!apiKeyMatch) {
  console.error('EXPO_PUBLIC_GCV_API_KEY not found in .env');
  process.exit(1);
}
const API_KEY = apiKeyMatch[1].trim();

const IMAGES = [
  'test-receipt.jpg',
  'test-receipt2.jpg',
  'test-receipt3.jpg',
  'test-receipt4.jpg',
];

async function ocrImage(filename) {
  const imgPath = path.join(__dirname, '../assets', filename);
  if (!fs.existsSync(imgPath)) {
    return `[SKIPPED — file not found: ${filename}]`;
  }
  const base64 = fs.readFileSync(imgPath).toString('base64');
  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{ image: { content: base64 }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    return `[ERROR ${res.status}]: ${err}`;
  }
  const json = await res.json();
  return json.responses?.[0]?.fullTextAnnotation?.text ?? '[NO TEXT DETECTED]';
}

async function main() {
  const lines = [];
  for (const img of IMAGES) {
    console.log(`Processing ${img}...`);
    const text = await ocrImage(img);
    lines.push(`${'='.repeat(60)}`);
    lines.push(`FILE: ${img}`);
    lines.push(`${'='.repeat(60)}`);
    lines.push(text);
    lines.push('');
  }
  const outPath = path.join(__dirname, '../ocr-results.txt');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`\nDone! Results written to ocr-results.txt`);
}

main().catch(console.error);
