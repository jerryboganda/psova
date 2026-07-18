// Better Auth React client for client components (login/logout). Same-origin:
// baseURL is left to window.location.origin so it works across environments.
'use client';

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient();

export const { signIn, signOut, signUp, useSession } = authClient;
