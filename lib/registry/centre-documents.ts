// Clinical photos / reports for a centre's patients (docs/centres/PLAN.md). Bytes are encrypted
// on disk (storage.ts); here: validation, quota, metadata, and the audit trail. Every view of a
// file is audited. Roles are enforced by the routes (view/upload: owner, doctor, nurse; delete: owner, doctor).

import type { Center } from '@prisma/client';
import { prisma } from './db';
import { decryptField, encryptField } from './crypto';
import { writeAudit } from './audit';
import { AuditAction } from './constants';
import { RegistryApiError } from './guards';
import {
  MAX_UPLOAD_BYTES,
  centreQuotaBytes,
  getFile,
  putFile,
  removeFile,
  safeFileName,
  sniffMime,
  uploadsConfigured,
} from './storage';
import type { DocumentUploadInput } from './schemas';

export async function uploadDocument(
  center: Center,
  patientId: string,
  file: { bytes: Buffer; name: string },
  meta: DocumentUploadInput,
  ctx: { actorId: string; ip: string | null },
): Promise<string> {
  if (!uploadsConfigured()) throw new RegistryApiError(503, 'unavailable');
  if (file.bytes.length === 0) throw new RegistryApiError(400, 'validation');
  if (file.bytes.length > MAX_UPLOAD_BYTES) throw new RegistryApiError(413, 'payload-too-large');
  const mime = sniffMime(file.bytes);
  if (!mime) throw new RegistryApiError(400, 'validation');

  const own = await prisma.registryPatient.findFirst({
    where: { id: patientId, centerId: center.id },
    select: { id: true },
  });
  if (!own) throw new RegistryApiError(404, 'not-found');

  const used = await prisma.patientDocument.aggregate({ where: { centerId: center.id }, _sum: { size: true } });
  if ((used._sum.size ?? 0) + file.bytes.length > centreQuotaBytes()) {
    throw new RegistryApiError(413, 'quota-exceeded');
  }

  const storageKey = await putFile(center.id, file.bytes);
  try {
    const doc = await prisma.patientDocument.create({
      data: {
        patientId,
        centerId: center.id,
        kind: meta.kind,
        fileName: encryptField(safeFileName(file.name, mime)),
        mime,
        size: file.bytes.length,
        storageKey,
        consentForTeaching: meta.consentForTeaching,
        uploadedById: ctx.actorId,
      },
      select: { id: true },
    });
    await writeAudit({
      actorId: ctx.actorId,
      actorRole: 'center',
      action: AuditAction.CENTER_DOCUMENT_UPLOAD,
      entity: 'PatientDocument',
      entityId: doc.id,
      meta: { centerId: center.id, kind: meta.kind, mime, size: file.bytes.length },
      ip: ctx.ip,
    });
    return doc.id;
  } catch (e) {
    await removeFile(center.id, storageKey); // never leave an unreferenced encrypted file behind
    throw e;
  }
}

export type DocumentRow = {
  id: string;
  kind: string;
  fileName: string;
  mime: string;
  size: number;
  consentForTeaching: boolean;
  createdAt: string;
};

/** Metadata for a patient's documents (file names decrypted; the patient page audits the view). */
export async function listDocuments(center: Center, patientId: string): Promise<DocumentRow[]> {
  const rows = await prisma.patientDocument.findMany({
    where: { patientId, centerId: center.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return rows.map((d) => ({
    id: d.id,
    kind: d.kind,
    fileName: decryptField(d.fileName),
    mime: d.mime,
    size: d.size,
    consentForTeaching: d.consentForTeaching,
    createdAt: d.createdAt.toISOString(),
  }));
}

/** Decrypt a file for download/preview. Audited. 404 for another centre's document. */
export async function readDocument(
  center: Center,
  id: string,
  ctx: { actorId: string; ip: string | null },
): Promise<{ bytes: Buffer; mime: string; fileName: string }> {
  const doc = await prisma.patientDocument.findFirst({ where: { id, centerId: center.id } });
  if (!doc) throw new RegistryApiError(404, 'not-found');
  const bytes = await getFile(center.id, doc.storageKey);
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_DOCUMENT_VIEW,
    entity: 'PatientDocument',
    entityId: doc.id,
    meta: { centerId: center.id, kind: doc.kind },
    ip: ctx.ip,
  });
  return { bytes, mime: doc.mime, fileName: decryptField(doc.fileName) };
}

export async function deleteDocument(
  center: Center,
  id: string,
  ctx: { actorId: string; ip: string | null },
): Promise<void> {
  const doc = await prisma.patientDocument.findFirst({ where: { id, centerId: center.id } });
  if (!doc) throw new RegistryApiError(404, 'not-found');
  await prisma.patientDocument.delete({ where: { id } });
  await removeFile(center.id, doc.storageKey);
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_DOCUMENT_DELETE,
    entity: 'PatientDocument',
    entityId: id,
    meta: { centerId: center.id, kind: doc.kind },
    ip: ctx.ip,
  });
}
