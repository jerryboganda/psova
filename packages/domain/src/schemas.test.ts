import { describe, expect, it } from 'vitest';
import { contactPayloadSchema, contactRequestSchema, journalExportSchema } from './schemas';

describe('contact contracts', () => {
  it('accepts a valid ask-expert request', () => {
    const result = contactRequestSchema.safeParse({
      clientSubmissionId: 'd1d61b0f-29a8-4ed8-bf12-29785fd89b55',
      payload: {
        kind: 'ask-expert',
        name: 'A Parent',
        email: 'parent@example.com',
        message: 'Please help us find the right care.',
        locale: 'en',
      },
    });
    expect(result.success).toBe(true);
  });

  it('requires a return channel and meaningful message', () => {
    expect(contactPayloadSchema.safeParse({ kind: 'contact', name: 'A', message: 'Hi' }).success).toBe(false);
    expect(contactPayloadSchema.safeParse({ kind: 'pledge', name: 'Donor' }).success).toBe(false);
  });

  it('retains bounded honeypot content for quiet server-side handling', () => {
    expect(contactPayloadSchema.safeParse({
      kind: 'contact',
      name: 'Parent',
      email: 'parent@example.com',
      message: 'A real message',
      website: 'spam.example',
    }).success).toBe(true);
  });
});

describe('journal export', () => {
  it('requires explicit consent timestamp and versioned entries', () => {
    expect(journalExportSchema.safeParse({ schemaVersion: 1, exportedAt: new Date().toISOString(), entries: [] }).success).toBe(false);
  });
});
