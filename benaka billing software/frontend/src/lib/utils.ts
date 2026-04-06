/**
 * Format paise (integer) to INR currency string.
 * Example: 350000 → "₹3,500.00"
 */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Format paise to compact INR (for dashboard cards).
 * Example: 15000000 → "₹1.5L"
 */
export function formatPaiseCompact(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 10000000) {
    return `₹${(rupees / 10000000).toFixed(1)}Cr`;
  }
  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(1)}L`;
  }
  if (rupees >= 1000) {
    return `₹${(rupees / 1000).toFixed(1)}K`;
  }
  return formatPaise(paise);
}

/**
 * Convert rupees string to paise integer.
 * Example: "3500" → 350000
 */
export function rupeesToPaise(rupees: string | number): number {
  if (rupees === '' || rupees === null || rupees === undefined) return 0;
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  return isNaN(num) ? 0 : Math.round(num * 100);
}

/**
 * Convert paise to rupees number.
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Format a date string to readable format.
 * Example: "2026-04-06" → "06 Apr 2026"
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a datetime string to readable format.
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate number of days between two date strings (inclusive).
 * Same day counts as 1 day.
 */
export function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  // Strip time for clean offset
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  const ms = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

/**
 * Convert number to words for Indian invoice (simplified).
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertChunk(n % 100) : '');
  }

  // Indian numbering: Lakh (1,00,000) and Crore (1,00,00,000)
  const rupees = Math.floor(num / 100);
  const paise = num % 100;

  let result = '';

  if (rupees > 0) {
    const crore = Math.floor(rupees / 10000000);
    const lakh = Math.floor((rupees % 10000000) / 100000);
    const thousand = Math.floor((rupees % 100000) / 1000);
    const remainder = rupees % 1000;

    if (crore > 0) result += convertChunk(crore) + ' Crore ';
    if (lakh > 0) result += convertChunk(lakh) + ' Lakh ';
    if (thousand > 0) result += convertChunk(thousand) + ' Thousand ';
    if (remainder > 0) result += convertChunk(remainder);

    result = result.trim() + ' Rupees';
  }

  if (paise > 0) {
    result += (result ? ' and ' : '') + convertChunk(paise) + ' Paise';
  }

  return result + ' Only';
}

/**
 * Get status badge CSS class.
 */
export function getStatusClass(status: string): string {
  switch (status) {
    case 'Available': return 'badge-available';
    case 'On-Trip': return 'badge-on-trip';
    case 'Maintenance': return 'badge-maintenance';
    case 'Paid': return 'badge-paid';
    case 'Unpaid': return 'badge-unpaid';
    case 'Partially Paid': return 'badge-partial';
    case 'Draft': return 'badge-draft';
    default: return 'badge-draft';
  }
}

/**
 * Classnames utility (tiny version).
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
