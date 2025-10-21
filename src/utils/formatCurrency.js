// Simple currency formatter for the app.
// Returns a string like: K1,234.56 (defaults to en-US formatting)
export function formatCurrency(value, opts = {}) {
  const {
    prefix = 'K',
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = opts || {};

  const num = Number(value || 0);
  // Use toLocaleString for grouping/decimal localization
  const formatted = num.toLocaleString(locale, { minimumFractionDigits, maximumFractionDigits });
  return `${prefix}${formatted}`;
}

export default formatCurrency;
