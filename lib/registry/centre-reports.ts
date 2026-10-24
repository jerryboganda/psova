// Centre reports and data export (docs/centres/PLAN.md). The report is aggregate counts only (no PII,
// nothing decrypted). The CSV export is the centre's own data, decrypted row by row: owner only,
// rate-limited and audit-logged, and available even after a membership lapses (data is never held hostage).

import type { Center } from '@prisma/client';
import { prisma } from './db';
import { decryptField, decryptNullable } from './crypto';
import { writeAudit } from './audit';
import { AuditAction } from './constants';
import { csvRow } from './csv';

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
const COUNT = (n: { _all?: number } | number | undefined) => (typeof n === 'number' ? n : (n?._all ?? 0));

export type CentreReport = {
  patients: { total: number; sharedWithNvar: number; self: number; staff: number };
  byCondition: { slug: string; count: number }[];
  visits: {
    total: number;
    byMonth: { month: string; count: number }[];
    byResponse: { score: string; count: number }[];
  };
  treatments: { type: string; total: number; outcomes: { outcome: string; count: number }[] }[];
  appointments: { status: string; count: number }[];
};

/** `YYYY-MM` of an instant in centre (PKT) time. */
export function monthKey(at: Date): string {
  return new Date(at.getTime() + PKT_OFFSET_MS).toISOString().slice(0, 7);
}

/** The last `n` month keys ending with the month of `now`, oldest first. */
export function lastMonths(n: number, now: Date = new Date()): string[] {
  const [y, m] = monthKey(now).split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

export async function getCentreReport(center: Center): Promise<CentreReport> {
  const patientWhere = { centerId: center.id };
  const months = lastMonths(12);
  const since = new Date(`${months[0]}-01T00:00:00+05:00`);

  const [total, shared, bySource, byCondition, visitTotal, visitDates, byResponse, treatments, appts] = await Promise.all([
    prisma.registryPatient.count({ where: patientWhere }),
    prisma.registryPatient.count({ where: { ...patientWhere, sharedWithNvar: true } }),
    prisma.registryPatient.groupBy({ by: ['source'], where: patientWhere, _count: { _all: true } }),
    prisma.registryDiagnosis.groupBy({ by: ['conditionSlug'], where: { patient: patientWhere }, _count: { _all: true } }),
    prisma.encounter.count({ where: { centerId: center.id } }),
    prisma.encounter.findMany({ where: { centerId: center.id, date: { gte: since } }, select: { date: true } }),
    prisma.encounter.groupBy({ by: ['responseScore'], where: { centerId: center.id, responseScore: { not: null } }, _count: { _all: true } }),
    prisma.registryTreatment.groupBy({ by: ['type', 'outcome'], where: { diagnosis: { patient: patientWhere } }, _count: { _all: true } }),
    prisma.appointment.groupBy({ by: ['status'], where: { centerId: center.id }, _count: { _all: true } }),
  ]);

  const perMonth = new Map(months.map((m) => [m, 0]));
  for (const v of visitDates) {
    const k = monthKey(v.date);
    if (perMonth.has(k)) perMonth.set(k, (perMonth.get(k) ?? 0) + 1);
  }

  const byType = new Map<string, { type: string; total: number; outcomes: { outcome: string; count: number }[] }>();
  for (const t of treatments) {
    const row = byType.get(t.type) ?? { type: t.type, total: 0, outcomes: [] };
    const n = COUNT(t._count);
    row.total += n;
    row.outcomes.push({ outcome: t.outcome, count: n });
    byType.set(t.type, row);
  }

  return {
    patients: {
      total,
      sharedWithNvar: shared,
      self: COUNT(bySource.find((s) => s.source === 'SELF')?._count),
      staff: COUNT(bySource.find((s) => s.source === 'CLINICIAN')?._count),
    },
    byCondition: byCondition.map((c) => ({ slug: c.conditionSlug, count: COUNT(c._count) })).sort((a, b) => b.count - a.count),
    visits: {
      total: visitTotal,
      byMonth: months.map((month) => ({ month, count: perMonth.get(month) ?? 0 })),
      byResponse: byResponse.map((r) => ({ score: r.responseScore as string, count: COUNT(r._count) })),
    },
    treatments: [...byType.values()].sort((a, b) => b.total - a.total),
    appointments: appts.map((a) => ({ status: a.status, count: COUNT(a._count) })),
  };
}

/* -------------------------------------------------------------------------- */
/*  CSV export                                                                */
/* -------------------------------------------------------------------------- */

const BATCH = 100;
const PATIENT_COLUMNS = [
  'trackingCode', 'mrn', 'fullName', 'guardianName', 'gender', 'dob', 'phone', 'altPhone', 'email', 'cnic',
  'province', 'district', 'address', 'condition', 'bodySite', 'severity', 'source', 'sharedWithNvar', 'registeredAt',
];
const VISIT_COLUMNS = [
  'trackingCode', 'mrn', 'visitDate', 'author', 'response', 'painScore', 'lesionSizeCm', 'notes', 'plan',
  'nextReviewDate', 'treatment', 'drug', 'dose', 'treatmentOutcome', 'complications',
];

/** The row count (so the audit row records how much left) and a stream of the CSV. */
export async function exportCentreCsv(
  center: Center,
  kind: 'patients' | 'visits',
  ctx: { actorId: string; ip: string | null },
): Promise<{ stream: ReadableStream<Uint8Array>; rows: number }> {
  const rows =
    kind === 'patients'
      ? await prisma.registryPatient.count({ where: { centerId: center.id } })
      : await prisma.encounter.count({ where: { centerId: center.id } });

  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_EXPORT,
    entity: kind === 'patients' ? 'RegistryPatient' : 'Encounter',
    meta: { centerId: center.id, kind, rows },
    ip: ctx.ip,
  });

  const encoder = new TextEncoder();
  const date = (d: Date | null) => (d ? new Date(d.getTime() + PKT_OFFSET_MS).toISOString().slice(0, 10) : '');

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode('﻿' + csvRow(kind === 'patients' ? PATIENT_COLUMNS : VISIT_COLUMNS) + '\n'));
      let skip = 0;
      try {
        for (;;) {
          if (kind === 'patients') {
            const batch = await prisma.registryPatient.findMany({
              where: { centerId: center.id },
              orderBy: { createdAt: 'asc' },
              skip,
              take: BATCH,
              include: { diagnoses: { take: 1, orderBy: { createdAt: 'asc' } } },
            });
            if (batch.length === 0) break;
            for (const p of batch) {
              const d = p.diagnoses[0];
              controller.enqueue(
                encoder.encode(
                  csvRow([
                    p.trackingCode, p.mrn, decryptField(p.fullName), decryptNullable(p.guardianName), p.gender, decryptField(p.dob),
                    decryptField(p.phone), decryptNullable(p.altPhone), decryptNullable(p.email), decryptField(p.cnic),
                    p.province, p.district, decryptNullable(p.address), d?.conditionSlug, d?.bodySite, d?.severity,
                    p.source, p.sharedWithNvar, p.createdAt.toISOString(),
                  ]) + '\n',
                ),
              );
            }
            skip += batch.length;
            if (batch.length < BATCH) break;
          } else {
            const batch = await prisma.encounter.findMany({
              where: { centerId: center.id },
              orderBy: { date: 'asc' },
              skip,
              take: BATCH,
              include: {
                patient: { select: { trackingCode: true, mrn: true } },
                author: { select: { name: true } },
                treatments: { take: 1 },
              },
            });
            if (batch.length === 0) break;
            for (const e of batch) {
              const t = e.treatments[0];
              controller.enqueue(
                encoder.encode(
                  csvRow([
                    e.patient.trackingCode, e.patient.mrn, date(e.date), e.author?.name, e.responseScore, e.painScore, e.lesionSizeCm,
                    decryptNullable(e.notes), decryptNullable(e.plan), date(e.nextReviewDate), t?.type, t?.drug, t?.dose, t?.outcome,
                    decryptNullable(t?.complications),
                  ]) + '\n',
                ),
              );
            }
            skip += batch.length;
            if (batch.length < BATCH) break;
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
  return { stream, rows };
}
