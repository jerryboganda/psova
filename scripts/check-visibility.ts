// Self-check for the NVAR visibility rule: `npx tsx scripts/check-visibility.ts`.
// (The DB-level guarantee — every NVAR query ANDs NVAR_VISIBLE — is enforced in patients.ts/stats.ts.)
import assert from 'node:assert/strict';
import { NVAR_VISIBLE, isNvarVisible } from '../lib/registry/visibility';

assert.equal(isNvarVisible({ centerId: null, sharedWithNvar: false }), true); // legacy NVAR record
assert.equal(isNvarVisible({ centerId: 'c1', sharedWithNvar: false }), false); // private to its centre
assert.equal(isNvarVisible({ centerId: 'c1', sharedWithNvar: true }), true); // shared with NVAR
assert.deepEqual(NVAR_VISIBLE, { OR: [{ centerId: null }, { sharedWithNvar: true }] });

console.log('visibility checks passed');
