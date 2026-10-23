// Self-check for the wa.me link helper: `npx tsx scripts/check-whatsapp.ts`.
import assert from 'node:assert/strict';
import { waLink } from '../lib/registry/whatsapp';

assert.equal(waLink('0300-1234567', 'hi there'), 'https://wa.me/923001234567?text=hi%20there');
assert.equal(waLink('+92 300 1234567', 'x'), 'https://wa.me/923001234567?text=x');
assert.equal(waLink('923001234567', 'x'), 'https://wa.me/923001234567?text=x');
assert.equal(waLink('021-1234567', 'x'), null); // landline: WhatsApp needs a mobile
assert.equal(waLink('12345', 'x'), null);
assert.match(waLink('03001234567', 'کوڈ: PSV-A1B2-C3D4')!, /text=%DA%A9/);

console.log('whatsapp checks passed');
