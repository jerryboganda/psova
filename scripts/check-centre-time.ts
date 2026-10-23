// Self-check for centre-local (PKT) day maths: `npx tsx scripts/check-centre-time.ts`.
import assert from 'node:assert/strict';
import { pktInstant, pktLocalToIso, startOfCentreDay } from '../lib/registry/centre-time';

// 15:00 PKT on 1 June → that PKT day started at 00:00 PKT = 19:00Z the evening before.
assert.equal(startOfCentreDay(new Date('2026-06-01T10:00:00Z')).toISOString(), '2026-05-31T19:00:00.000Z');
// 01:00 PKT on 2 June (= 20:00Z on 1 June) is already the next PKT day.
assert.equal(startOfCentreDay(new Date('2026-06-01T20:00:00Z')).toISOString(), '2026-06-01T19:00:00.000Z');
// Exactly midnight PKT belongs to the day it starts.
assert.equal(startOfCentreDay(new Date('2026-06-01T19:00:00Z')).toISOString(), '2026-06-01T19:00:00.000Z');

assert.equal(pktInstant('2026-06-10').toISOString(), '2026-06-09T19:00:00.000Z');
assert.equal(pktInstant('2026-06-10', '09:00:00').toISOString(), '2026-06-10T04:00:00.000Z');
assert.equal(pktLocalToIso('2026-06-10T14:30'), '2026-06-10T09:30:00.000Z');

console.log('centre time checks passed');
