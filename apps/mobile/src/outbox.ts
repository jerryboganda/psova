import {
  contactRequestSchema,
  contactResponseSchema,
  isRetryableStatus,
  retryDelaySeconds,
  type ContactPayload,
  type OutboxRecord,
} from '@psova/domain';
import { loadOutbox, saveOutboxRecord } from './storage';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? 'https://psova.polytronx.com';

export async function enqueueContact(payload: ContactPayload): Promise<OutboxRecord> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const record: OutboxRecord = {
    id,
    request: contactRequestSchema.parse({ clientSubmissionId: id, payload, appVersion: '0.2.0' }),
    status: 'pending', attempts: 0, nextAttemptAt: now, lastError: null, createdAt: now, updatedAt: now,
  };
  await saveOutboxRecord(record);
  return record;
}

async function sendRecord(record: OutboxRecord): Promise<OutboxRecord> {
  const sending = { ...record, status: 'sending' as const, updatedAt: new Date().toISOString() };
  await saveOutboxRecord(sending);
  try {
    const response = await fetch(`${API_BASE}/api/v1/contact`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(record.request),
    });
    const body = contactResponseSchema.safeParse(await response.json().catch(() => null));
    if (response.ok && body.success && ['accepted', 'duplicate'].includes(body.data.status)) {
      const sent = { ...sending, status: 'sent' as const, attempts: record.attempts + 1, nextAttemptAt: null, lastError: null, updatedAt: new Date().toISOString() };
      await saveOutboxRecord(sent);
      return sent;
    }
    if (!isRetryableStatus(response.status)) throw new Error(body.success ? body.data.message ?? 'Submission rejected' : 'Submission rejected');
    throw Object.assign(new Error(body.success ? body.data.message ?? 'Temporary delivery failure' : 'Temporary delivery failure'), { retryable: true });
  } catch (error) {
    const attempts = record.attempts + 1;
    const retryable = (error as { retryable?: boolean }).retryable ?? error instanceof TypeError;
    const nextAttemptAt = retryable && attempts < 8
      ? new Date(Date.now() + retryDelaySeconds(attempts, record.id.charCodeAt(0)) * 1000).toISOString()
      : null;
    const failed = { ...sending, status: 'failed' as const, attempts, nextAttemptAt, lastError: error instanceof Error ? error.message.slice(0, 500) : 'Unknown delivery error', updatedAt: new Date().toISOString() };
    await saveOutboxRecord(failed);
    return failed;
  }
}

export async function flushOutbox(forceId?: string): Promise<OutboxRecord[]> {
  const now = new Date().toISOString();
  const records = await loadOutbox();
  const eligible = records.filter((record) =>
    (record.status === 'pending' || record.status === 'failed') &&
    (!forceId || record.id === forceId) &&
    (forceId || !record.nextAttemptAt || record.nextAttemptAt <= now),
  );
  const results: OutboxRecord[] = [];
  for (const record of eligible) results.push(await sendRecord(record));
  return results;
}
