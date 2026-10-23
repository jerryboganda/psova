// Server-page helper: centre context or a redirect (pages must not throw API errors).
import 'server-only';
import { headers } from 'next/headers';
import { redirect } from '@/i18n/navigation';
import type { CenterRoleValue } from './constants';
import { requireCenterMember, type CenterContext } from './guards';

export async function centrePageContext(
  locale: string,
  roles?: readonly CenterRoleValue[],
): Promise<CenterContext> {
  try {
    return await requireCenterMember(await headers(), { roles });
  } catch {
    // Wrong role → dashboard home; no centre access at all → sign-in.
    return redirect({ href: roles ? '/centre' : '/registry/login', locale });
  }
}
