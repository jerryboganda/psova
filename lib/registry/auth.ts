// Better Auth server instance (ARCHITECTURE §4). Email/password only. The `role`
// field is a non-writable additional field (default 'clinician') — clients can
// never set it; admin is granted only by the seed script. Node runtime.

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { prisma } from './db';
import { sendPasswordSetupEmail } from './mailer';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'mysql' }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? siteUrl,
  trustedOrigins: [siteUrl],
  emailAndPassword: {
    enabled: true,
    // Registry has no email-verification flow in v1; admin verifies people, not inboxes.
    requireEmailVerification: false,
    // Used for staff invites (set your password) and password resets. 7 days so an invite
    // survives a weekend; revoke other sessions once a password is (re)set.
    resetPasswordTokenExpiresIn: 7 * 24 * 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordSetupEmail(user.email, user.name, url);
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'clinician',
        input: false, // never settable from the client — admin via seed only
      },
    },
  },
  // Better Auth's built-in limiter on auth routes (our own limiter covers /register).
  rateLimit: { enabled: true },
  // Keep the Next.js Set-Cookie plumbing working in server actions / route handlers.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
