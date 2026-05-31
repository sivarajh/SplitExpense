// Formatting helpers. Single-currency MVP (USD); change CURRENCY to localize.

const CURRENCY = 'USD';
const LOCALE = 'en-US';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

// Always renders a non-negative amount (used when the sign is shown separately).
export function formatAbsCurrency(amount: number): string {
  return currencyFormatter.format(Math.abs(amount));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' });
  }
  return formatDate(iso);
}

// Returns today's date as YYYY-MM-DD (for the `expense_date` column default).
export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}
