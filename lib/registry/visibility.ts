// NVAR visibility rule for the centres network (docs/centres/PLAN.md): a centre-owned
// record is private to its centre until the centre shares it with NVAR. EVERY NVAR-side
// read (admin queue/records/detail/export, statistics, duplicate detection) must AND this in.

import type { Prisma } from '@prisma/client';

export const NVAR_VISIBLE: Prisma.RegistryPatientWhereInput = {
  OR: [{ centerId: null }, { sharedWithNvar: true }],
};

/** For records already loaded (findUnique by id). */
export function isNvarVisible(rec: { centerId: string | null; sharedWithNvar: boolean }): boolean {
  return rec.centerId === null || rec.sharedWithNvar;
}
