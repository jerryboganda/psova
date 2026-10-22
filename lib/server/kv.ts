import 'server-only';
import { hasDatabase } from './env';

// Key-value storage on the Hostinger MariaDB (same DATABASE_URL as the registry).
// Raw SQL on purpose: the Prisma client generated on the server predates these tables,
// and the tables create themselves on first use so no migration step is needed.
// Without DATABASE_URL (tests, local dev) an in-memory map is used instead.
const memory = new Map<string, { value: string; expiresAt?: number }>();

async function db() {
  const { prisma } = await import('@/lib/registry/db');
  return prisma;
}

let ready: Promise<void> | undefined;
function ensureTables(): Promise<void> {
  ready ??= (async () => {
    const prisma = await db();
    await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS `kv_entry` (`k` VARCHAR(191) NOT NULL, `v` TEXT NOT NULL, `expires_at` DATETIME(3) NULL, PRIMARY KEY (`k`), INDEX `kv_entry_expires_at_idx` (`expires_at`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS `kv_member` (`set_key` VARCHAR(100) NOT NULL, `member` VARCHAR(100) NOT NULL, PRIMARY KEY (`set_key`, `member`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  })().catch((error) => { ready = undefined; throw error; });
  return ready;
}

async function sql() {
  await ensureTables();
  return db();
}

export async function kvGet(key: string): Promise<string | null> {
  if (hasDatabase()) {
    const prisma = await sql();
    const rows = await prisma.$queryRaw<Array<{ v: string }>>`SELECT v FROM kv_entry WHERE k = ${key} AND (expires_at IS NULL OR expires_at > ${new Date()}) LIMIT 1`;
    return rows[0]?.v ?? null;
  }
  const item = memory.get(key);
  if (!item) return null;
  if (item.expiresAt && item.expiresAt <= Date.now()) { memory.delete(key); return null; }
  return item.value;
}

export async function kvSet(key: string, value: string, options?: { ttlSeconds?: number; onlyIfMissing?: boolean }): Promise<boolean> {
  if (hasDatabase()) {
    const prisma = await sql();
    const now = new Date();
    const expiresAt = options?.ttlSeconds ? new Date(now.getTime() + options.ttlSeconds * 1000) : null;
    if (Math.random() < 0.02) await prisma.$executeRaw`DELETE FROM kv_entry WHERE expires_at IS NOT NULL AND expires_at <= ${now}`;
    if (options?.onlyIfMissing) {
      await prisma.$executeRaw`DELETE FROM kv_entry WHERE k = ${key} AND expires_at IS NOT NULL AND expires_at <= ${now}`;
      return (await prisma.$executeRaw`INSERT IGNORE INTO kv_entry (k, v, expires_at) VALUES (${key}, ${value}, ${expiresAt})`) === 1;
    }
    await prisma.$executeRaw`INSERT INTO kv_entry (k, v, expires_at) VALUES (${key}, ${value}, ${expiresAt}) ON DUPLICATE KEY UPDATE v = VALUES(v), expires_at = VALUES(expires_at)`;
    return true;
  }
  const current = await kvGet(key);
  if (options?.onlyIfMissing && current !== null) return false;
  memory.set(key, { value, expiresAt: options?.ttlSeconds ? Date.now() + options.ttlSeconds * 1000 : undefined });
  return true;
}

export async function kvDelete(key: string): Promise<void> {
  if (hasDatabase()) { const prisma = await sql(); await prisma.$executeRaw`DELETE FROM kv_entry WHERE k = ${key}`; return; }
  memory.delete(key);
}

export async function kvAddToSet(key: string, member: string): Promise<void> {
  if (hasDatabase()) { const prisma = await sql(); await prisma.$executeRaw`INSERT IGNORE INTO kv_member (set_key, member) VALUES (${key}, ${member})`; return; }
  const members = new Set(JSON.parse((await kvGet(key)) ?? '[]') as string[]); members.add(member); await kvSet(key, JSON.stringify([...members]));
}

export async function kvRemoveFromSet(key: string, member: string): Promise<void> {
  if (hasDatabase()) { const prisma = await sql(); await prisma.$executeRaw`DELETE FROM kv_member WHERE set_key = ${key} AND member = ${member}`; return; }
  const members = new Set(JSON.parse((await kvGet(key)) ?? '[]') as string[]); members.delete(member); await kvSet(key, JSON.stringify([...members]));
}

export async function kvSetMembers(key: string): Promise<string[]> {
  if (hasDatabase()) {
    const prisma = await sql();
    return (await prisma.$queryRaw<Array<{ member: string }>>`SELECT member FROM kv_member WHERE set_key = ${key}`).map((row) => row.member);
  }
  return JSON.parse((await kvGet(key)) ?? '[]') as string[];
}
