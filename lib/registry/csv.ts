// CSV output for exports that people open in Excel. Pure.
//
// Cells are quoted when they contain a comma, quote or line break, and text that a spreadsheet
// would execute as a formula (leading = @ tab CR, or a - / + that is not plain number/phone
// text) gets a leading apostrophe, so a patient or visit note can never run in the clinic's Excel.

const PLAIN_NUMBER_OR_PHONE = /^[+-]?[\d\s().-]+$/;

export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && !PLAIN_NUMBER_OR_PHONE.test(s))) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvRow(cells: readonly unknown[]): string {
  return cells.map(csvCell).join(',');
}
