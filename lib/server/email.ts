import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import type { ContactRequest } from '@psova/domain';
import { hasEmailDelivery, serverEnv, type ServerEnv } from './env';

let cachedTransport: Transporter | undefined;
function transport(env: ServerEnv): Transporter {
  const port = env.SMTP_PORT ?? 465;
  cachedTransport ??= nodemailer.createTransport({ host: env.SMTP_HOST, port, secure: port === 465, auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } });
  return cachedTransport;
}

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
  try {
    const info = await transport(env).sendMail({
      from: env.SMTP_FROM ?? env.SMTP_USER,
      to: env.PSOVA_CONTACT_TO ?? env.SMTP_USER,
      replyTo: payload.email || undefined,
      subject, text, html,
      messageId: `<contact-${request.clientSubmissionId}@psova.org.pk>`,
    });
    if (!info.accepted?.length) throw Object.assign(new Error('Mailbox accepted no recipient'), { retryable: true });
    return { providerId: info.messageId, acceptedAt: new Date().toISOString() };
  } catch (error) {
    if ((error as { retryable?: boolean }).retryable !== undefined) throw error;
    // 5xx SMTP replies (bad recipient, policy) will not succeed on retry; connection/4xx errors will.
    const code = (error as { responseCode?: number }).responseCode;
    const retryable = !(typeof code === 'number' && code >= 500);
    throw Object.assign(new Error(retryable ? 'Mail server temporarily unavailable' : 'Mail server rejected the message'), { retryable });
  }
}
