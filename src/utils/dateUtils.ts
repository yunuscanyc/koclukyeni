/**
 * Date formatting utilities for the frontend.
 * Ensures all dates across the app are displayed in standard 'dd.aa.yyyy' (DD.MM.YYYY) format.
 */

export function formatDate(dateInput: string | Date | number | null | undefined, fallback: string = '-'): string {
  if (!dateInput) return fallback;

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return fallback;

    // If already in DD.MM.YYYY
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    // Match YYYY-MM-DD or YYYY.MM.DD or YYYY/MM/DD (with optional time)
    const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, '0');
      const day = ymdMatch[3].padStart(2, '0');
      return `${day}.${month}.${year}`;
    }

    // Match DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${day}.${month}.${year}`;
    }
  }

  try {
    const date = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      return typeof dateInput === 'string' ? dateInput : fallback;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  } catch {
    return typeof dateInput === 'string' ? dateInput : fallback;
  }
}

export function formatDateTime(dateInput: string | Date | number | null | undefined, fallback: string = '-'): string {
  if (!dateInput) return fallback;

  try {
    // If it's a string like "2026-09-17 14:30" or ISO
    const trimmed = typeof dateInput === 'string' ? dateInput.trim() : '';
    const date = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput);
    
    if (isNaN(date.getTime())) {
      // If regex matches YYYY-MM-DD
      const datePart = formatDate(trimmed, fallback);
      return datePart;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch {
    return formatDate(dateInput, fallback);
  }
}
