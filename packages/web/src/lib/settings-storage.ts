import type { z } from 'zod';

export function loadSettings<T>(
  key: string,
  schema: z.ZodSchema<T>,
  fallback: T
): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const stored = window.localStorage.getItem(key);
  if (!stored) {
    return fallback;
  }

  try {
    const parsed = schema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

export function saveSettings<T>(key: string, data: T) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    // Swallow localStorage errors to avoid breaking the application.
    // Optionally log for debugging purposes.
    console.error('Failed to save settings to localStorage:', error);
  }
}