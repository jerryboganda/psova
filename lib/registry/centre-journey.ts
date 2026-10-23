// Centre patient journey (docs/centres/PLAN.md): appointments, visits (encounters) and the
// treatments logged at them. Everything is scoped to one centre; clinical free text is
// encrypted; reads that decrypt are audited by the caller's page/route (list/detail audits).

import type { Center } from '@prisma/client';
import { prisma } from './db';
import { decryptField, decryptNullable, encryptNullable } from './crypto';
import { writeAudit } from './audit';
import { AuditAction, type AppointmentKindValue, type CenterRoleValue } from './constants';
import { RegistryApiError } from './guards';
import { DAY_MS, pktInstant, startOfCentreDay } from './centre-time';
import type { AppointmentCreateInput, AppointmentUpdateInput, EncounterCreateInput } from './schemas';

async function assertOwnPatient(center: Center, patientId: string): Promise<void> {
  const own = await prisma.registryPatient.findFirst({
    where: { id: patientId, centerId: center.id },
    select: { id: true },
  });
  if (!own) throw new RegistryApiError(404, 'not-found');
}

/* -------------------------------------------------------------------------- */
/*  Appointments                                                              */
/* -------------------------------------------------------------------------- */

export async function createAppointment(
  center: Center,
  input: AppointmentCreateInput,
  ctx: { actorId: string; ip: string | null },
): Promise<string> {
  await assertOwnPatient(center, input.patientId);
  const appt = await prisma.appointment.create({
    data: {
      patientId: input.patientId,
      centerId: center.id,
      startsAt: new Date(input.startsAt),
      kind: input.kind,
      note: encryptNullable(input.note),
      createdById: ctx.actorId,
    },
    select: { id: true },
  });
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_APPOINTMENT_CREATE,
    entity: 'Appointment',
    entityId: appt.id,
    meta: { centerId: center.id, kind: input.kind },
    ip: ctx.ip,
  });
  return appt.id;
}

export async function updateAppointment(
  center: Center,
  id: string,
  action: AppointmentUpdateInput,
  ctx: { actorId: string; ip: string | null },
): Promise<void> {
  const appt = await prisma.appointment.findFirst({ where: { id, centerId: center.id }, select: { id: true } });
  if (!appt) throw new RegistryApiError(404, 'not-found');
  await prisma.appointment.update({
    where: { id },
    data:
      action.action === 'STATUS'
        ? { status: action.status }
        : { startsAt: new Date(action.startsAt), status: 'SCHEDULED' },
  });
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_APPOINTMENT_UPDATE,
    entity: 'Appointment',
    entityId: id,
    meta: { centerId: center.id, action: action.action, ...(action.action === 'STATUS' ? { status: action.status } : {}) },
    ip: ctx.ip,
  });
}

export type AppointmentScope = 'today' | 'upcoming' | 'overdue';

export type AppointmentRow = {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  startsAt: string;
  kind: string;
  status: string;
  note: string | null;
};

/** Appointments with the patient's decrypted name and phone (so the list view is audited). */
export async function listAppointments(
  center: Center,
  scope: AppointmentScope,
  ctx: { actorId: string; ip: string | null },
): Promise<AppointmentRow[]> {
  const today = startOfCentreDay();
  const tomorrow = new Date(today.getTime() + DAY_MS);
  const where =
    scope === 'today'
      ? { startsAt: { gte: today, lt: tomorrow } }
      : scope === 'upcoming'
        ? { status: 'SCHEDULED' as const, startsAt: { gte: tomorrow, lt: new Date(today.getTime() + 15 * DAY_MS) } }
        : { status: 'SCHEDULED' as const, startsAt: { lt: today } };

  const rows = await prisma.appointment.findMany({
    where: { centerId: center.id, ...where },
    orderBy: { startsAt: scope === 'overdue' ? 'desc' : 'asc' },
    take: 100,
    include: { patient: { select: { fullName: true, phone: true } } },
  });

  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_APPOINTMENT_LIST,
    entity: 'Appointment',
    meta: { centerId: center.id, scope, count: rows.length },
    ip: ctx.ip,
  });

  return rows.map((r) => ({
    id: r.id,
    patientId: r.patientId,
    patientName: decryptField(r.patient.fullName),
    phone: decryptField(r.patient.phone),
    startsAt: r.startsAt.toISOString(),
    kind: r.kind,
    status: r.status,
    note: decryptNullable(r.note),
  }));
}

/** Dashboard counters (no decryption). */
export async function appointmentCounts(center: Center): Promise<{ today: number; overdue: number }> {
  const today = startOfCentreDay();
  const tomorrow = new Date(today.getTime() + DAY_MS);
  const [todayCount, overdue] = await Promise.all([
    prisma.appointment.count({ where: { centerId: center.id, status: 'SCHEDULED', startsAt: { gte: today, lt: tomorrow } } }),
    prisma.appointment.count({ where: { centerId: center.id, status: 'SCHEDULED', startsAt: { lt: today } } }),
  ]);
  return { today: todayCount, overdue };
}

/* -------------------------------------------------------------------------- */
/*  Visits (encounters) and treatments                                        */
/* -------------------------------------------------------------------------- */

/**
 * Record a visit. Reception cannot; nurses can record the visit itself but not the plan or a
 * treatment (doctor/owner only). Saving also closes today's scheduled appointment for the
 * patient and, if a review date is set, books the follow-up automatically.
 */
export async function createEncounter(
  center: Center,
  patientId: string,
  input: EncounterCreateInput,
  ctx: { actorId: string; role: CenterRoleValue; ip: string | null },
): Promise<{ encounterId: string; followUpBooked: boolean }> {
  if (ctx.role === 'RECEPTION') throw new RegistryApiError(403, 'forbidden');
  if (ctx.role === 'NURSE' && (input.plan || input.treatment)) throw new RegistryApiError(403, 'forbidden');

  const patient = await prisma.registryPatient.findFirst({
    where: { id: patientId, centerId: center.id },
    select: { id: true, diagnoses: { select: { id: true }, orderBy: { createdAt: 'asc' }, take: 1 } },
  });
  if (!patient) throw new RegistryApiError(404, 'not-found');
  const diagnosisId = patient.diagnoses[0]?.id;
  if (input.treatment && !diagnosisId) throw new RegistryApiError(409, 'conflict');

  const visitDay = pktInstant(input.date);
  const reviewDay = input.nextReviewDate ? pktInstant(input.nextReviewDate) : null;

  const result = await prisma.$transaction(async (tx) => {
    const encounter = await tx.encounter.create({
      data: {
        patientId,
        centerId: center.id,
        authorId: ctx.actorId,
        date: visitDay,
        notes: encryptNullable(input.notes),
        lesionSizeCm: input.lesionSizeCm ?? null,
        painScore: input.painScore ?? null,
        responseScore: input.responseScore ?? null,
        plan: encryptNullable(input.plan),
        nextReviewDate: reviewDay,
        ...(input.treatment && diagnosisId
          ? {
              treatments: {
                create: {
                  diagnosisId,
                  type: input.treatment.type,
                  facility: center.nameEn,
                  year: Number(input.date.slice(0, 4)),
                  outcome: input.treatment.outcome,
                  date: visitDay,
                  drug: input.treatment.drug || null,
                  dose: input.treatment.dose || null,
                  complications: encryptNullable(input.treatment.complications),
                },
              },
            }
          : {}),
      },
      select: { id: true },
    });

    // The visit happened: close the appointment that was booked for that day.
    await tx.appointment.updateMany({
      where: {
        patientId,
        centerId: center.id,
        status: 'SCHEDULED',
        startsAt: { gte: visitDay, lt: new Date(visitDay.getTime() + DAY_MS) },
      },
      data: { status: 'DONE' },
    });

    let followUpBooked = false;
    if (reviewDay) {
      const at = pktInstant(input.nextReviewDate!, '09:00:00');
      const exists = await tx.appointment.findFirst({
        where: { patientId, centerId: center.id, status: 'SCHEDULED', startsAt: { gte: reviewDay, lt: new Date(reviewDay.getTime() + DAY_MS) } },
        select: { id: true },
      });
      if (!exists) {
        await tx.appointment.create({
          data: { patientId, centerId: center.id, startsAt: at, kind: 'FOLLOW_UP', createdById: ctx.actorId },
        });
        followUpBooked = true;
      }
    }
    return { encounterId: encounter.id, followUpBooked };
  });

  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_VISIT_CREATE,
    entity: 'Encounter',
    entityId: result.encounterId,
    meta: {
      centerId: center.id,
      hasTreatment: Boolean(input.treatment),
      followUpBooked: result.followUpBooked,
    },
    ip: ctx.ip,
  });
  return result;
}

export type JourneyEncounter = {
  id: string;
  date: string;
  authorName: string | null;
  notes: string | null;
  lesionSizeCm: number | null;
  painScore: number | null;
  responseScore: string | null;
  plan: string | null;
  nextReviewDate: string | null;
  treatments: {
    id: string;
    type: string;
    drug: string | null;
    dose: string | null;
    outcome: string;
    complications: string | null;
  }[];
};

export type JourneyAppointment = {
  id: string;
  startsAt: string;
  kind: AppointmentKindValue;
  status: string;
  note: string | null;
};

/** The patient's visits and appointments (decrypted; the patient page audits the view). Reception sees no visits. */
export async function getJourney(
  center: Center,
  patientId: string,
  role: CenterRoleValue,
): Promise<{ encounters: JourneyEncounter[]; appointments: JourneyAppointment[] }> {
  const [encounters, appointments] = await Promise.all([
    role === 'RECEPTION'
      ? Promise.resolve([])
      : prisma.encounter.findMany({
          where: { patientId, centerId: center.id },
          orderBy: { date: 'desc' },
          take: 100,
          include: { treatments: true, author: { select: { name: true } } },
        }),
    prisma.appointment.findMany({
      where: { patientId, centerId: center.id },
      orderBy: { startsAt: 'desc' },
      take: 100,
    }),
  ]);

  return {
    encounters: encounters.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      authorName: e.author?.name ?? null,
      notes: decryptNullable(e.notes),
      lesionSizeCm: e.lesionSizeCm,
      painScore: e.painScore,
      responseScore: e.responseScore,
      plan: decryptNullable(e.plan),
      nextReviewDate: e.nextReviewDate?.toISOString() ?? null,
      treatments: e.treatments.map((t) => ({
        id: t.id,
        type: t.type,
        drug: t.drug,
        dose: t.dose,
        outcome: t.outcome,
        complications: decryptNullable(t.complications),
      })),
    })),
    appointments: appointments.map((a) => ({
      id: a.id,
      startsAt: a.startsAt.toISOString(),
      kind: a.kind,
      status: a.status,
      note: decryptNullable(a.note),
    })),
  };
}
