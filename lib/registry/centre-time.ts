// Centre-local time. Pakistan is UTC+5 all year, so a centre's "today" is a PKT calendar day.
// Pure — safe for client components.

export const DAY_MS = 24 * 60 * 60 * 1000;
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** 00:00 PKT of the day containing `at`. */
export function startOfCentreDay(at: Date = new Date()): Date {
  return new Date(Math.floor((at.getTime() + PKT_OFFSET_MS) / DAY_MS) * DAY_MS - PKT_OFFSET_MS);
}

/** A YYYY-MM-DD date at a PKT wall-clock time (default midnight). */
export function pktInstant(date: string, time = '00:00:00'): Date {
  return new Date(`${date}T${time}+05:00`);
}

/** A `datetime-local` input value (PKT wall clock, no offset) → an absolute ISO instant. */
export function pktLocalToIso(local: string): string {
  return new Date(`${local}:00+05:00`).toISOString();
}
