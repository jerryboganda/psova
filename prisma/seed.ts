// Admin seeding (DATA-MODEL §7). Run: `npm run db:seed` (prisma loads .env, then
// tsx runs this). Reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME. Admin is the
// ONLY way an 'admin' role is ever granted. Idempotent: skips if the user exists.
// Uses relative imports so tsx resolves without tsconfig path aliases.

import { auth } from '../lib/registry/auth';
import { prisma } from '../lib/registry/db';
import { writeAudit } from '../lib/registry/audit';
import { AuditAction } from '../lib/registry/constants';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? 'PSOVA Admin';

  if (!email || !password) {
    console.error('[seed] ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'admin') {
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'admin' } });
      console.log(`[seed] existing user ${email} promoted to admin.`);
    } else {
      console.log(`[seed] admin ${email} already exists — nothing to do.`);
    }
    return;
  }

  await auth.api.signUpEmail({ body: { name, email, password } });
  const user = await prisma.user.update({ where: { email }, data: { role: 'admin' } });

  await writeAudit({
    actorId: user.id,
    actorRole: 'system',
    action: AuditAction.ADMIN_SEEDED,
    entity: 'User',
    entityId: user.id,
    meta: { via: 'seed' },
  });

  console.log(`[seed] admin account created for ${email}.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('[seed] failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
