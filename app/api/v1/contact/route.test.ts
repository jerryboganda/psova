import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleContact } from '@/lib/server/contact-handler';

vi.mock('@/lib/server/email', () => ({
  deliverContactEmail: vi.fn(async (request: { clientSubmissionId: string }) => ({ providerId: `email-${request.clientSubmissionId}`, acceptedAt: '2026-08-14T12:00:00.000Z' })),
}));

const id = 'd1d61b0f-29a8-4ed8-bf12-29785fd89b55';
function request(body: unknown) {
  return new Request('https://psova.example/api/v1/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.10' }, body: JSON.stringify(body) });
}

beforeEach(() => { vi.unstubAllEnvs(); });

describe('versioned contact handler', () => {
  it('accepts a provider-backed submission and deduplicates a retry', async () => {
    const body = { clientSubmissionId: id, payload: { kind: 'contact', name: 'Parent', email: 'parent@example.com', message: 'Please help us find a clinic.', locale: 'en' } };
    const first = await handleContact(request(body));
    expect(first.status).toBe(202);
    expect(await first.json()).toMatchObject({ ok: true, status: 'accepted', submissionId: id });
    const duplicate = await handleContact(request(body));
    expect(duplicate.status).toBe(200);
    expect(await duplicate.json()).toMatchObject({ status: 'duplicate' });
  });

  it('rejects malformed and oversized requests without provider work', async () => {
    const invalid = await handleContact(request({ nope: true }));
    expect(invalid.status).toBe(400);
    const oversized = await handleContact(request({ clientSubmissionId: id, payload: { kind: 'contact', name: 'Parent', email: 'parent@example.com', message: 'x'.repeat(25_000) } }));
    expect(oversized.status).toBe(413);
  });

  it('quietly accepts honeypot submissions', async () => {
    const response = await handleContact(request({ clientSubmissionId: crypto.randomUUID(), payload: { kind: 'contact', name: 'Bot Name', email: 'bot@example.com', message: 'Spam message', website: 'https://spam.example' } }));
    expect(response.status).toBe(202);
  });
});
