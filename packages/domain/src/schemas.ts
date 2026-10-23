import { z } from 'zod';

export const localeSchema = z.enum(['en', 'ur']);
export type Locale = z.infer<typeof localeSchema>;

export const localizedStringSchema = z.object({
  en: z.string().trim().min(1),
  ur: z.string().trim().min(1),
});
export type LocalizedString = z.infer<typeof localizedStringSchema>;

const normalizedPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const conditionSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.enum(['tumor', 'malformation']),
  name: localizedStringSchema,
  short: localizedStringSchema,
  tagline: localizedStringSchema,
  summary: localizedStringSchema,
  ageOnset: localizedStringSchema,
  prevalence: localizedStringSchema,
  signs: z.array(localizedStringSchema).min(1),
  diagnosis: localizedStringSchema,
  treatment: localizedStringSchema,
  whenToSeeDoctor: localizedStringSchema,
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  hotspot: normalizedPointSchema,
});
export type Condition = z.infer<typeof conditionSchema>;

export const centerVerificationSchema = z.object({
  status: z.enum(['unverified', 'verified', 'stale']).default('unverified'),
  verifiedAt: z.string().datetime().nullable().default(null),
  source: z.string().url().nullable().default(null),
  note: localizedStringSchema.optional(),
});

export const careCenterSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: localizedStringSchema,
  city: localizedStringSchema,
  province: localizedStringSchema,
  type: z.enum(['public', 'private', 'trust']),
  services: z.array(localizedStringSchema).min(1),
  conditions: z.array(z.string()).min(1),
  phone: z.string().min(6).nullable().default(null),
  website: z.string().url().optional(),
  geo: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  pos: normalizedPointSchema,
  flagship: z.boolean().optional(),
  registered: z
    .object({ slug: z.string(), tier: z.enum(['MEMBER', 'ACCREDITED', 'EXCELLENCE']) })
    .optional(),
  verification: centerVerificationSchema.default({
    status: 'unverified',
    verifiedAt: null,
    source: null,
  }),
});
export type CareCenter = z.infer<typeof careCenterSchema>;

export const newsItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  kind: z.enum(['news', 'event', 'story']),
  date: z.string().date(),
  title: localizedStringSchema,
  excerpt: localizedStringSchema,
  tag: localizedStringSchema,
  body: localizedStringSchema.optional(),
  publicationStatus: z.enum(['draft', 'published']).default('draft'),
});
export type NewsItem = z.infer<typeof newsItemSchema>;

export const glossaryTermSchema = z.object({
  term: localizedStringSchema,
  def: localizedStringSchema,
});
export type GlossaryTerm = z.infer<typeof glossaryTermSchema>;

export const contentSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.string().min(1),
  publishedAt: z.string().datetime(),
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
  review: z.object({
    clinical: z.enum(['pending', 'approved']),
    urdu: z.enum(['pending', 'approved']),
    directory: z.enum(['pending', 'approved']),
  }),
  conditions: z.array(conditionSchema),
  centers: z.array(careCenterSchema),
  news: z.array(newsItemSchema),
  glossary: z.array(glossaryTermSchema),
});
export type ContentSnapshot = z.infer<typeof contentSnapshotSchema>;

export const contactKindSchema = z.enum(['contact', 'ask-expert', 'pledge']);
export const contactPayloadSchema = z
  .object({
    kind: contactKindSchema.default('contact'),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254).optional().or(z.literal('')),
    subject: z.string().trim().max(160).optional(),
    message: z.string().trim().max(5000).optional(),
    childAge: z.string().trim().max(40).optional(),
    phone: z.string().trim().max(40).optional(),
    amount: z.string().trim().max(40).optional(),
    designation: z.enum(['general', 'zakat', 'sponsor-child', 'recurring']).optional(),
    method: z.enum(['any', 'bank', 'jazzcash', 'easypaisa', 'raast', 'international']).optional(),
    preferredContact: z.enum(['phone', 'whatsapp', 'email']).optional(),
    locale: localeSchema.default('en'),
    website: z.string().max(255).optional(),
  })
  .superRefine((data, ctx) => {
    const hasEmail = Boolean(data.email);
    const hasPhone = Boolean(data.phone && data.phone.replace(/\D/g, '').length >= 6);
    if (data.kind === 'pledge') {
      if (!hasEmail && !hasPhone) {
        ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Provide a phone number or email.' });
      }
      return;
    }
    if (!hasEmail) {
      ctx.addIssue({ code: 'custom', path: ['email'], message: 'A valid email is required.' });
    }
    if (!data.message || data.message.length < 5) {
      ctx.addIssue({ code: 'custom', path: ['message'], message: 'Message must be at least 5 characters.' });
    }
  });
export type ContactPayload = z.infer<typeof contactPayloadSchema>;

export const contactRequestSchema = z.object({
  clientSubmissionId: z.string().uuid(),
  payload: contactPayloadSchema,
  appVersion: z.string().max(40).optional(),
});
export type ContactRequest = z.infer<typeof contactRequestSchema>;

export const contactResponseSchema = z.object({
  ok: z.boolean(),
  status: z.enum(['accepted', 'duplicate', 'retryable', 'rejected']),
  submissionId: z.string(),
  message: z.string().optional(),
  retryAfterSeconds: z.number().int().positive().optional(),
});
export type ContactResponse = z.infer<typeof contactResponseSchema>;

export const pushRegistrationSchema = z.object({
  token: z.string().min(16).max(4096),
  platform: z.enum(['android', 'ios']),
  locale: localeSchema,
  appVersion: z.string().max(40),
  consentedAt: z.string().datetime(),
});
export type PushRegistration = z.infer<typeof pushRegistrationSchema>;

export const outboxRecordSchema = z.object({
  id: z.string().uuid(),
  request: contactRequestSchema,
  status: z.enum(['draft', 'pending', 'sending', 'sent', 'failed']),
  attempts: z.number().int().nonnegative(),
  nextAttemptAt: z.string().datetime().nullable(),
  lastError: z.string().max(500).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type OutboxRecord = z.infer<typeof outboxRecordSchema>;

export const journalExportSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string().datetime(),
  disclaimerAcceptedAt: z.string().datetime(),
  entries: z.array(z.object({
    id: z.string().uuid(),
    occurredAt: z.string().datetime(),
    note: z.string().max(5000),
    photoNames: z.array(z.string().max(255)),
  })),
});
export type JournalExport = z.infer<typeof journalExportSchema>;
