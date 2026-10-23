import { getFormatter, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/registry/db';

/** A centre's membership payments, newest first, with the admin's reason when rejected. */
export async function PaymentHistory({ centerId }: { centerId: string }) {
  const t = await getTranslations('Centres.dash');
  const tp = await getTranslations('Centres.apply.payment');
  const format = await getFormatter();
  const payments = await prisma.centerPayment.findMany({
    where: { centerId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  if (payments.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">{t('payments.empty')}</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {payments.map((p) => (
        <li key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">
              {tp(`methods.${p.method}`)} · <span dir="ltr">{p.txnRef}</span>
            </span>
            <span className="text-xs text-[var(--color-muted)]">{t(`payments.${p.status}`)}</span>
          </div>
          <p className="mt-1 text-xs text-[var(--color-faint)]">
            {t('payments.date')}: {format.dateTime(p.paidOn, { dateStyle: 'medium' })}
          </p>
          {p.status === 'REJECTED' && p.rejectReason && (
            <p className="mt-2 text-xs text-[var(--color-rose)]">
              {t('reason')}: {p.rejectReason}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
