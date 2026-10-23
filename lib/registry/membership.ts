// Centre membership lifecycle (docs/centres/PLAN.md). Pure — safe to import from
// client components. State is computed on read from `membershipExpiresAt`, so no
// cron job is needed: reminder window → grace period → hidden/read-only.

import { MEMBERSHIP_GRACE_DAYS, MEMBERSHIP_REMINDER_DAYS } from './constants';

export type MembershipState = 'NONE' | 'ACTIVE' | 'EXPIRING' | 'GRACE' | 'EXPIRED';

const DAY_MS = 24 * 60 * 60 * 1000;

export function membershipState(expiresAt: Date | null, now: Date = new Date()): MembershipState {
  if (!expiresAt) return 'NONE';
  const left = expiresAt.getTime() - now.getTime();
  if (left > MEMBERSHIP_REMINDER_DAYS * DAY_MS) return 'ACTIVE';
  if (left >= 0) return 'EXPIRING';
  if (-left <= MEMBERSHIP_GRACE_DAYS * DAY_MS) return 'GRACE';
  return 'EXPIRED';
}

/** Writes (and public listing) stay on through the grace period, then stop. */
export function membershipAllowsWrites(state: MembershipState): boolean {
  return state === 'ACTIVE' || state === 'EXPIRING' || state === 'GRACE';
}

/** Public directory/profile visibility. */
export function isPubliclyListed(status: string, state: MembershipState): boolean {
  return status === 'APPROVED' && membershipAllowsWrites(state);
}

/** A verified yearly payment extends from the later of now and the current expiry. */
export function renewedPeriod(
  current: Date | null,
  now: Date = new Date(),
): { start: Date; end: Date } {
  const start = current && current.getTime() > now.getTime() ? current : now;
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  return { start, end };
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}
