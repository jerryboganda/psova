// Pure value normalizers (DATA-MODEL §4). Kept free of node:crypto/Prisma so both
// crypto.ts (server, blind indexes) and schemas.ts (shared client+server, Zod
// validation) can share ONE canonical normalization — the same normalized form
// is what gets hashed and what gets validated.

/** CNIC → digits only (expected 13 digits). */
export function normalizeCnic(value: string): string {
  return value.replace(/\D/g, '');
}

/** Progressive CNIC mask for inputs: 12345-1234567-1 (digits only, max 13). */
export function formatCnicInput(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

/** PK phone → digits; `0XXXXXXXXXX` → `92XXXXXXXXXX`; `+`/`00` stripped. */
export function normalizePhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) {
    digits = `92${digits.slice(1)}`;
  } else if (digits.length === 10 && digits.startsWith('3')) {
    digits = `92${digits}`;
  }
  return digits;
}

/** PMC/PMDC number → uppercase alphanumeric. */
export function normalizePmc(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** A normalized PK mobile is `923XXXXXXXXX` (12 digits, starts 92 3). */
export function isValidPkMobile(value: string): boolean {
  const n = normalizePhone(value);
  return /^923\d{9}$/.test(n);
}

/** A valid CNIC normalizes to exactly 13 digits. */
export function isValidCnic(value: string): boolean {
  return /^\d{13}$/.test(normalizeCnic(value));
}

/* --------------------------- date-of-birth helpers ------------------------- */

/** Parse a YYYY-MM-DD dob into structured parts + computed age (in whole years). */
export function deriveDobParts(dob: string): {
  year: number;
  month: number;
  day: number;
  age: number;
  isMinor: boolean;
} {
  const [y, m, d] = dob.split('-').map((s) => Number(s));
  const now = new Date();
  let age = now.getFullYear() - y;
  const beforeBirthday =
    now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d);
  if (beforeBirthday) age -= 1;
  return { year: y, month: m, day: d, age, isMinor: age < 18 };
}

/** True when the dob is a real calendar date, not in the future, not >120y ago. */
export function isPlausibleDob(dob: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;
  const [y, m, d] = dob.split('-').map((s) => Number(s));
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() + 1 !== m ||
    date.getUTCDate() !== d
  ) {
    return false; // e.g. 2021-02-30
  }
  const now = new Date();
  if (date.getTime() > now.getTime()) return false;
  const oldest = new Date();
  oldest.setUTCFullYear(oldest.getUTCFullYear() - 120);
  if (date.getTime() < oldest.getTime()) return false;
  return true;
}
