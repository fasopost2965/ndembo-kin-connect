'use client';

import { useEffect } from 'react';

/**
 * Debounced draft persistence to localStorage — protects in-progress form input
 * against power cuts / page reloads (frequent in the RDC field context).
 * Pair with loadDraft() on mount and clearDraft() once the form is submitted.
 */
export function useAutosave<T>(key: string, value: T, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const id = setTimeout(() => {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
    }, 800);
    return () => clearTimeout(id);
  }, [key, value, enabled]);
}

export function loadDraft<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}
