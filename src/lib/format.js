/** Format digits as Icelandic-style grouped number (e.g. 1.000.000). */
export function formatAmountInput(value) {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('is-IS');
}

/** Parse formatted amount string to integer ISK. */
export function parseAmountInput(value) {
  const digits = String(value).replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateString(dateStr) {
  if (!dateStr) return null;
  return new Date(`${dateStr}T12:00:00`);
}
