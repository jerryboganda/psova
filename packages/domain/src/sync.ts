export const MAX_OUTBOX_ATTEMPTS = 8;
export const MAX_BACKOFF_SECONDS = 6 * 60 * 60;

export function retryDelaySeconds(attempt: number, jitterSeed = 0): number {
  const safeAttempt = Math.max(0, Math.min(attempt, MAX_OUTBOX_ATTEMPTS));
  const base = Math.min(30 * 2 ** safeAttempt, MAX_BACKOFF_SECONDS);
  const normalizedSeed = Math.abs(jitterSeed % 1000) / 1000;
  return Math.round(base * (0.8 + normalizedSeed * 0.4));
}

export function shouldReplaceSnapshot(input: {
  currentRevision?: string;
  nextRevision: string;
  currentSchemaVersion?: number;
  nextSchemaVersion: number;
  checksumValid: boolean;
}): boolean {
  if (!input.checksumValid) return false;
  if (input.nextSchemaVersion !== 1) return false;
  if (input.currentSchemaVersion && input.currentSchemaVersion > input.nextSchemaVersion) return false;
  return input.currentRevision !== input.nextRevision;
}

export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}
