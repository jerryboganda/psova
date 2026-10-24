// Reading JSON array columns (Center.services / .conditions). Production runs MariaDB, whose JSON type
// is an alias for LONGTEXT, and Prisma may hand such a column back as the raw JSON string instead of
// the parsed array. Accept both so the app never depends on which one the driver returns. Pure.

export function jsonStringArray(value: unknown): string[] {
  let v = value;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v);
    } catch {
      return [];
    }
  }
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}
