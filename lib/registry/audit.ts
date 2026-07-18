// Append-only audit trail. writeAudit NEVER throws — a failed audit write must
// not break the user request, but it is logged so failures are visible. Callers
// are responsible for the no-PII rule on `meta` (DATA-MODEL §3, SECURITY §4).

import type { Prisma } from '@prisma/client';
import { prisma } from './db';
import type { ActorRole, AuditActionType } from './constants';

export type AuditInput = {
  actorId?: string | null;
  actorRole?: ActorRole | null;
  action: AuditActionType;
  entity: string;
  entityId?: string | null;
  /** NON-PII only: counts, enum values, filter params, reason codes. */
  meta?: Prisma.InputJsonValue | null;
  ip?: string | null;
};

export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        ...(input.meta != null ? { meta: input.meta } : {}),
        ip: input.ip ?? null,
      },
    });
  } catch (error) {
    // Never surface to the caller; just make the failure visible in server logs.
    console.error('[registry audit] failed to write audit row', {
      action: input.action,
      entity: input.entity,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
