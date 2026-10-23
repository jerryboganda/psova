// Self-check for report helpers: `npx tsx scripts/check-reports.ts`.
import assert from 'node:assert/strict';
import { csvCell, csvRow } from '../lib/registry/csv';

// Quoting
assert.equal(csvCell('plain'), 'plain');
assert.equal(csvCell('a,b'), '"a,b"');
assert.equal(csvCell('say "hi"'), '"say ""hi"""');
assert.equal(csvCell('two\nlines'), '"two\nlines"');
assert.equal(csvCell(null), '');
assert.equal(csvCell(undefined), '');
assert.equal(csvCell(false), 'false');
assert.equal(csvCell(12.5), '12.5');

// Spreadsheet formula injection: text that Excel would execute is defused
assert.equal(csvCell('=HYPERLINK("http://evil","x")'), `"'=HYPERLINK(""http://evil"",""x"")"`);
assert.equal(csvCell('@SUM(1+1)'), "'@SUM(1+1)");
assert.equal(csvCell('+cmd|calc'), "'+cmd|calc");
assert.equal(csvCell('-2+3+cmd|calc'), "'-2+3+cmd|calc");
// …while phone numbers and negative numbers are left alone
assert.equal(csvCell('+92 300 1234567'), '+92 300 1234567');
assert.equal(csvCell('0300-1234567'), '0300-1234567');
assert.equal(csvCell(-3), '-3');
assert.equal(csvRow(['PSV-1', null, 'a,b']), 'PSV-1,,"a,b"');

(async () => {
  // Month buckets use Pakistan time: a visit at 00:00 PKT on 1 June is June, though it is still 31 May in UTC.
  const { monthKey, lastMonths } = await import('../lib/registry/centre-reports');
  assert.equal(monthKey(new Date('2026-05-31T19:00:00Z')), '2026-06');
  assert.equal(monthKey(new Date('2026-05-31T18:59:59Z')), '2026-05');
  assert.deepEqual(lastMonths(3, new Date('2026-02-10T00:00:00Z')), ['2025-12', '2026-01', '2026-02']);
  assert.equal(lastMonths(12, new Date('2026-06-15T00:00:00Z')).at(0), '2025-07');
  console.log('report checks passed');
})();
