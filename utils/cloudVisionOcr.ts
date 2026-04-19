// utils/cloudVisionOcr.ts
// Sends an image to Google Cloud Vision OCR REST API and returns extracted text.
// Requires EXPO_PUBLIC_GCV_API_KEY in your .env file.

const GCV_URL = 'https://vision.googleapis.com/v1/images:annotate';

export async function runCloudVision(base64: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GCV_API_KEY;
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_GCV_API_KEY is not set. Add it to your .env file.');
  }

  const response = await fetch(`${GCV_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloud Vision API error ${response.status}: ${err}`);
  }

  const json = await response.json();
  const fullText: string =
    json.responses?.[0]?.fullTextAnnotation?.text ?? '';

  return fullText;
}
