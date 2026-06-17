import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a market value (number) as "850 000 €" style — French spacing. */
export function formatValeur(value?: number | null): string {
  if (value == null) return '—';
  return value.toLocaleString('fr-FR').replace(/ /g, ' ') + ' €';
}

/** Two-letter initials from "Prénom Nom". */
export function initials(...parts: (string | undefined)[]): string {
  return parts
    .filter(Boolean)
    .map((p) => p![0]?.toUpperCase())
    .slice(0, 2)
    .join('');
}
