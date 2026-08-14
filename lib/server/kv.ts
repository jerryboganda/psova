import 'server-only';
import { hasDurableKv, serverEnv } from './env';

const memory = new Map<string, { value: string; expiresAt?: number }>();

async function remoteCommand<T>(command: Array<string | number>): Promise<T> {
  const env = serverEnv();
  if (!hasDurableKv(env)) throw new Error('Durable key-value storage is not configured');
  const response = await fetch(env.UPSTASH_REDIS_REST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Key-value request failed (${response.status})`);
  const body = await response.json() as { result: T; error?: string };
  if (body.error) throw new Error(body.error);
  return body.result;
}

export async function kvGet(key: string): Promise<string | null> {
  const env = serverEnv();
  if (hasDurableKv(env)) return remoteCommand<string | null>(['GET', key]);
  const item = memory.get(key);
  if (!item) return null;
  if (item.expiresAt && item.expiresAt <= Date.now()) { memory.delete(key); return null; }
  return item.value;
}

export async function kvSet(key: string, value: string, options?: { ttlSeconds?: number; onlyIfMissing?: boolean }): Promise<boolean> {
  const env = serverEnv();
  if (hasDurableKv(env)) {
    const command: Array<string | number> = ['SET', key, value];
    if (options?.ttlSeconds) command.push('EX', options.ttlSeconds);
    if (options?.onlyIfMissing) command.push('NX');
    return (await remoteCommand<string | null>(command)) === 'OK';
  }
  const current = await kvGet(key);
  if (options?.onlyIfMissing && current !== null) return false;
  memory.set(key, { value, expiresAt: options?.ttlSeconds ? Date.now() + options.ttlSeconds * 1000 : undefined });
  return true;
}

export async function kvDelete(key: string): Promise<void> {
  const env = serverEnv();
  if (hasDurableKv(env)) { await remoteCommand<number>(['DEL', key]); return; }
  memory.delete(key);
}

export async function kvAddToSet(key: string, member: string): Promise<void> {
  const env = serverEnv();
  if (hasDurableKv(env)) { await remoteCommand<number>(['SADD', key, member]); return; }
  const members = new Set(JSON.parse((await kvGet(key)) ?? '[]') as string[]); members.add(member); await kvSet(key, JSON.stringify([...members]));
}

export async function kvRemoveFromSet(key: string, member: string): Promise<void> {
  const env = serverEnv();
  if (hasDurableKv(env)) { await remoteCommand<number>(['SREM', key, member]); return; }
  const members = new Set(JSON.parse((await kvGet(key)) ?? '[]') as string[]); members.delete(member); await kvSet(key, JSON.stringify([...members]));
}

export async function kvSetMembers(key: string): Promise<string[]> {
  const env = serverEnv();
  if (hasDurableKv(env)) return remoteCommand<string[]>(['SMEMBERS', key]);
  return JSON.parse((await kvGet(key)) ?? '[]') as string[];
}
