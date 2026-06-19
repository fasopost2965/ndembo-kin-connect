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

/** Format a monetary amount; unlike formatValeur, null/0 renders as "0 €". */
export function formatMontant(value?: number | null): string {
  return (value ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' $';
}

/** Two-letter initials from "Prénom Nom". */
export function initials(...parts: (string | undefined)[]): string {
  return parts
    .filter(Boolean)
    .map((p) => p![0]?.toUpperCase())
    .slice(0, 2)
    .join('');
}
