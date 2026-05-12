import Constants from 'expo-constants';
import { auth } from './firebase';

function getBaseUrl(): string {
  // Production or explicit override: env var always wins
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Dev: derive IP from Expo's Metro bundler host so any device on the
  // same WiFi connects without hardcoding an IP address
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:8000`;
  return 'http://localhost:8000';
}

const BASE_URL = getBaseUrl();
console.log('[api] BASE_URL =', BASE_URL);

export class ApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`API ${status}`);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new ApiError(401, 'Not authenticated');
  const token = await user.getIdToken(); // Firebase auto-refreshes near expiry

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function uploadFormData<T>(path: string, formData: FormData): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new ApiError(401, 'Not authenticated');
  const token = await user.getIdToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err);
  }
  return res.json();
}

export const api = {
  get:    <T>(path: string) => request<T>('GET', path),
  post:   <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch:  <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, formData: FormData) => uploadFormData<T>(path, formData),
};
