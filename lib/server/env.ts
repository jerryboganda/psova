import 'server-only';
import { z } from 'zod';

const serverEnvSchema = z.object({
  // Contact email goes out through the Hostinger mailbox (same SMTP_* as the registry mailer).
  SMTP_HOST: z.string().min(3).optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().min(3).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(3).optional(),
  PSOVA_CONTACT_TO: z.string().email().optional(),
  // Optional remote push (Google FCM is the only way to wake an Android/iOS app).
  FIREBASE_PROJECT_ID: z.string().min(2).optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().min(20).optional(),
  PUSH_PUBLISH_SECRET: z.string().min(24).optional(),
  PUSH_TOKEN_ENCRYPTION_KEY: z.string().min(40).optional(),
  RATE_LIMIT_HMAC_KEY: z.string().min(24).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  cached ??= serverEnvSchema.parse(process.env);
  return cached;
}

export function hasEmailDelivery(env = serverEnv()): env is ServerEnv & Required<Pick<ServerEnv, 'SMTP_HOST' | 'SMTP_USER' | 'SMTP_PASS'>> {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

/** Durable storage is the Hostinger MariaDB behind the registry. */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
