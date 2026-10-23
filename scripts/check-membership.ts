// Self-check for centre membership dates: `npx tsx scripts/check-membership.ts`.
import assert from 'node:assert/strict';
import { addDays, isPubliclyListed, membershipAllowsWrites, membershipState, renewedPeriod } from '../lib/registry/membership';

const now = new Date('2026-06-01T00:00:00.000Z');

assert.equal(membershipState(null, now), 'NONE');
assert.equal(membershipState(addDays(now, 90), now), 'ACTIVE');
assert.equal(membershipState(addDays(now, 30), now), 'EXPIRING');
assert.equal(membershipState(addDays(now, 1), now), 'EXPIRING');
assert.equal(membershipState(addDays(now, -1), now), 'GRACE');
assert.equal(membershipState(addDays(now, -30), now), 'GRACE');
assert.equal(membershipState(addDays(now, -31), now), 'EXPIRED');

assert.equal(membershipAllowsWrites('GRACE'), true);
assert.equal(membershipAllowsWrites('EXPIRED'), false);
assert.equal(membershipAllowsWrites('NONE'), false);

assert.equal(isPubliclyListed('APPROVED', 'ACTIVE'), true);
assert.equal(isPubliclyListed('APPROVED', 'NONE'), false); // approved but unpaid: not listed
assert.equal(isPubliclyListed('SUSPENDED', 'ACTIVE'), false);

// First payment starts now; early renewal stacks on the current expiry; lapsed restarts from now.
assert.equal(renewedPeriod(null, now).end.toISOString(), '2027-06-01T00:00:00.000Z');
const soon = addDays(now, 10);
assert.equal(renewedPeriod(soon, now).start.getTime(), soon.getTime());
assert.equal(renewedPeriod(soon, now).end.toISOString(), '2027-06-11T00:00:00.000Z');
const lapsed = addDays(now, -100);
assert.equal(renewedPeriod(lapsed, now).start.getTime(), now.getTime());

console.log('membership checks passed');
