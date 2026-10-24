// MDT case-discussion board (docs/centres/PLAN.md). Posts are de-identified by design: they carry
// age band / gender / province / condition and free text, and NO link to a patient. Any approved
// centre's owners and doctors can read and comment (routes enforce roles); only the author centre
// closes a post; PSOVA admins can hide posts and comments.

import type { Center } from '@prisma/client';
import { prisma } from './db';
import { getFile } from './storage';
import { writeAudit } from './audit';
import { AuditAction } from './constants';
import { RegistryApiError } from './guards';
import type { MdtPostCreateInput } from './schemas';

type Ctx = { actorId: string; ip: string | null };
const PAGE_SIZE = 20;

export async function createMdtPost(center: Center, input: MdtPostCreateInput, ctx: Ctx): Promise<string> {
  // Only this centre's own files that carry teaching consent can be attached.
  if (input.documentIds.length > 0) {
    const ok = await prisma.patientDocument.count({
      where: { id: { in: input.documentIds }, centerId: center.id, consentForTeaching: true },
    });
    if (ok !== new Set(input.documentIds).size) throw new RegistryApiError(400, 'validation');
  }
  const post = await prisma.mdtPost.create({
    data: {
      centerId: center.id,
      authorId: ctx.actorId,
      title: input.title,
      summary: input.summary,
      gender: input.gender ?? null,
      ageBand: input.ageBand ?? null,
      province: input.province ?? null,
      conditionSlug: input.conditionSlug ?? null,
      bodySite: input.bodySite ?? null,
      documents: { create: [...new Set(input.documentIds)].map((documentId) => ({ documentId })) },
    },
    select: { id: true },
  });
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_MDT_POST,
    entity: 'MdtPost',
    entityId: post.id,
    meta: { centerId: center.id, documents: input.documentIds.length },
    ip: ctx.ip,
  });
  return post.id;
}

export type MdtListRow = {
  id: string;
  title: string;
  status: string;
  conditionSlug: string | null;
  centre: { name: string; city: string; tier: string };
  comments: number;
  createdAt: string;
};

export async function listMdtPosts(
  query: { status?: 'OPEN' | 'RESOLVED'; page: number },
): Promise<{ items: MdtListRow[]; total: number; page: number; pageSize: number }> {
  const where = { status: query.status ?? { in: ['OPEN', 'RESOLVED'] as ('OPEN' | 'RESOLVED')[] } };
  const [rows, total] = await Promise.all([
    prisma.mdtPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        center: { select: { nameEn: true, city: true, tier: true } },
        _count: { select: { comments: { where: { hidden: false } } } },
      },
    }),
    prisma.mdtPost.count({ where }),
  ]);
  return {
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      conditionSlug: r.conditionSlug,
      centre: { name: r.center.nameEn, city: r.center.city, tier: r.center.tier },
      comments: r._count.comments,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: PAGE_SIZE,
  };
}

export type MdtPostView = {
  id: string;
  title: string;
  summary: string;
  status: string;
  gender: string | null;
  ageBand: string | null;
  province: string | null;
  conditionSlug: string | null;
  bodySite: string | null;
  createdAt: string;
  centreId: string;
  centre: { name: string; city: string };
  author: string | null;
  documents: { id: string; kind: string; mime: string; size: number }[];
  comments: { id: string; body: string; author: string | null; centre: string; createdAt: string }[];
};

export async function getMdtPost(id: string): Promise<MdtPostView | null> {
  const p = await prisma.mdtPost.findFirst({
    where: { id, status: { not: 'HIDDEN' } },
    include: {
      center: { select: { nameEn: true, city: true } },
      author: { select: { name: true } },
      documents: { include: { document: { select: { id: true, kind: true, mime: true, size: true } } } },
      comments: {
        where: { hidden: false },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { name: true } }, center: { select: { nameEn: true } } },
      },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    summary: p.summary,
    status: p.status,
    gender: p.gender,
    ageBand: p.ageBand,
    province: p.province,
    conditionSlug: p.conditionSlug,
    bodySite: p.bodySite,
    createdAt: p.createdAt.toISOString(),
    centreId: p.centerId,
    centre: { name: p.center.nameEn, city: p.center.city },
    author: p.author?.name ?? null,
    documents: p.documents.map((d) => d.document),
    comments: p.comments.map((c) => ({
      id: c.id,
      body: c.body,
      author: c.author?.name ?? null,
      centre: c.center.nameEn,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

export async function addMdtComment(center: Center, postId: string, body: string, ctx: Ctx): Promise<void> {
  const post = await prisma.mdtPost.findFirst({ where: { id: postId, status: { not: 'HIDDEN' } }, select: { id: true } });
  if (!post) throw new RegistryApiError(404, 'not-found');
  const c = await prisma.mdtComment.create({
    data: { postId, centerId: center.id, authorId: ctx.actorId, body },
    select: { id: true },
  });
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_MDT_COMMENT,
    entity: 'MdtComment',
    entityId: c.id,
    meta: { centerId: center.id, postId },
    ip: ctx.ip,
  });
}

/** The author centre marks a discussion resolved (or reopens it). */
export async function setMdtStatus(center: Center, postId: string, action: 'RESOLVE' | 'REOPEN', ctx: Ctx): Promise<void> {
  const res = await prisma.mdtPost.updateMany({
    where: { id: postId, centerId: center.id, status: { in: ['OPEN', 'RESOLVED'] } },
    data: { status: action === 'RESOLVE' ? 'RESOLVED' : 'OPEN' },
  });
  if (res.count === 0) throw new RegistryApiError(404, 'not-found');
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_MDT_UPDATE,
    entity: 'MdtPost',
    entityId: postId,
    meta: { centerId: center.id, action },
    ip: ctx.ip,
  });
}

/** A file attached to a visible post. Audited. The neutral name avoids leaking an original that may name the patient. */
export async function readMdtDocument(
  center: Center,
  postId: string,
  documentId: string,
  ctx: Ctx,
): Promise<{ bytes: Buffer; mime: string; fileName: string }> {
  const link = await prisma.mdtPostDocument.findFirst({
    where: { postId, documentId, post: { status: { not: 'HIDDEN' } }, document: { consentForTeaching: true } },
    include: { document: true },
  });
  if (!link) throw new RegistryApiError(404, 'not-found');
  const doc = link.document;
  const bytes = await getFile(doc.centerId, doc.storageKey);
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_MDT_DOCUMENT_VIEW,
    entity: 'PatientDocument',
    entityId: doc.id,
    meta: { viewerCenterId: center.id, postId },
    ip: ctx.ip,
  });
  return { bytes, mime: doc.mime, fileName: `${doc.kind.toLowerCase()}-${doc.id.slice(-6)}` };
}

/* -------------------------------------------------------------------------- */
/*  Admin moderation                                                          */
/* -------------------------------------------------------------------------- */

export type AdminMdtRow = {
  id: string;
  title: string;
  summary: string;
  status: string;
  centre: string;
  createdAt: string;
  comments: { id: string; body: string; centre: string; hidden: boolean }[];
};

export async function listMdtForAdmin(page: number): Promise<{ items: AdminMdtRow[]; total: number; pageSize: number }> {
  const [rows, total] = await Promise.all([
    prisma.mdtPost.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { center: { select: { nameEn: true } }, comments: { orderBy: { createdAt: 'asc' }, include: { center: { select: { nameEn: true } } } } },
    }),
    prisma.mdtPost.count(),
  ]);
  return {
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      status: r.status,
      centre: r.center.nameEn,
      createdAt: r.createdAt.toISOString(),
      comments: r.comments.map((c) => ({ id: c.id, body: c.body, centre: c.center.nameEn, hidden: c.hidden })),
    })),
    total,
    pageSize: PAGE_SIZE,
  };
}

export async function moderateMdt(
  target: { kind: 'post' | 'comment'; id: string },
  action: 'HIDE' | 'UNHIDE',
  ctx: Ctx,
): Promise<void> {
  if (target.kind === 'comment') {
    const res = await prisma.mdtComment.updateMany({ where: { id: target.id }, data: { hidden: action === 'HIDE' } });
    if (res.count === 0) throw new RegistryApiError(404, 'not-found');
  } else {
    const post = await prisma.mdtPost.findUnique({ where: { id: target.id }, select: { id: true } });
    if (!post) throw new RegistryApiError(404, 'not-found');
    // Unhiding reopens the discussion; the author can resolve it again.
    await prisma.mdtPost.update({ where: { id: target.id }, data: { status: action === 'HIDE' ? 'HIDDEN' : 'OPEN' } });
  }
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'admin',
    action: AuditAction.MDT_MODERATE,
    entity: target.kind === 'post' ? 'MdtPost' : 'MdtComment',
    entityId: target.id,
    meta: { action },
    ip: ctx.ip,
  });
}
