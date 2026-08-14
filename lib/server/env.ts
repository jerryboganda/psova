import 'server-only';
import { z } from 'zod';

const optionalUrl = z.string().url().optional();
const serverEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(10).optional(),
  RESEND_WEBHOOK_SECRET: z.string().min(10).optional(),
  RESEND_FROM: z.string().email().optional(),
  PSOVA_CONTACT_TO: z.string().email().optional(),
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().min(10).optional(),
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

export function hasEmailDelivery(env = serverEnv()): env is ServerEnv & Required<Pick<ServerEnv, 'RESEND_API_KEY' | 'RESEND_FROM' | 'PSOVA_CONTACT_TO'>> {
  return Boolean(env.RESEND_API_KEY && env.RESEND_FROM && env.PSOVA_CONTACT_TO);
}

export function hasDurableKv(env = serverEnv()): env is ServerEnv & Required<Pick<ServerEnv, 'UPSTASH_REDIS_REST_URL' | 'UPSTASH_REDIS_REST_TOKEN'>> {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}
