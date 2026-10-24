// Self-check for tolerant JSON-array reads: `npx tsx scripts/check-json.ts`.
import assert from 'node:assert/strict';
import { jsonStringArray } from '../lib/registry/json';

assert.deepEqual(jsonStringArray(['imaging', 'laser']), ['imaging', 'laser']); // MySQL: parsed array
assert.deepEqual(jsonStringArray('["imaging","laser"]'), ['imaging', 'laser']); // MariaDB: raw JSON text
assert.deepEqual(jsonStringArray('[]'), []);
assert.deepEqual(jsonStringArray(['a', 1, null, 'b']), ['a', 'b']); // non-strings dropped
assert.deepEqual(jsonStringArray('not json'), []);
assert.deepEqual(jsonStringArray('{"a":1}'), []); // an object is not an array
assert.deepEqual(jsonStringArray(null), []);
assert.deepEqual(jsonStringArray(undefined), []);
assert.deepEqual(jsonStringArray(42), []);

console.log('json checks passed');
