// Better Auth catch-all handler: login, logout, session, signup (API-SPEC §1).
import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/registry/auth';

export const runtime = 'nodejs';

export const { GET, POST } = toNextJsHandler(auth);
