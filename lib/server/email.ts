import 'server-only';
import type { ContactRequest } from '@psova/domain';
import { hasEmailDelivery, serverEnv } from './env';

export type EmailAcceptance = { providerId: string; acceptedAt: string };

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}

export async function deliverContactEmail(request: ContactRequest): Promise<EmailAcceptance> {
  const env = serverEnv();
  if (!hasEmailDelivery(env)) throw Object.assign(new Error('Email delivery is not configured'), { retryable: true });
  const payload = request.payload;
  const subject = `[PSOVA ${payload.kind}] ${(payload.subject || payload.name).replace(/[\r\n]/g, ' ').slice(0, 120)}`;
  const fields = [
    ['Submission', request.clientSubmissionId], ['Kind', payload.kind], ['Name', payload.name], ['Email', payload.email || 'Not provided'],
    ['Phone', payload.phone || 'Not provided'], ['Child age', payload.childAge || 'Not provided'], ['Amount', payload.amount || 'Not provided'],
    ['Designation', payload.designation || 'Not provided'], ['Preferred contact', payload.preferredContact || 'Not provided'], ['Locale', payload.locale],
  ];
  const text = `${fields.map(([key, value]) => `${key}: ${value}`).join('\n')}\n\nMessage:\n${payload.message || 'No message supplied.'}`;
  const html = `<h1>${escapeHtml(subject)}</h1><dl>${fields.map(([key, value]) => `<dt><strong>${escapeHtml(key)}</strong></dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl><h2>Message</h2><p>${escapeHtml(payload.message || 'No message supplied.').replace(/\n/g, '<br>')}</p>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `contact/${request.clientSubmissionId}/v1` },
    body: JSON.stringify({ from: env.RESEND_FROM, to: [env.PSOVA_CONTACT_TO], reply_to: payload.email || undefined, subject, text, html }),
    cache: 'no-store',
  });
  if (!response.ok) {
    const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    throw Object.assign(new Error(retryable ? 'Email provider temporarily unavailable' : 'Email provider rejected the request'), { retryable, status: response.status });
  }
  const result = await response.json() as { id?: string };
  if (!result.id) throw Object.assign(new Error('Email provider returned no acceptance identifier'), { retryable: true });
  return { providerId: result.id, acceptedAt: new Date().toISOString() };
}
