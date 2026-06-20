import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { GradientText } from '@/components/ui/GradientText';

export default function NotFound() {
  const t = useTranslations('NotFound');
  return (
    <div className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div className="flex flex-col items-center gap-6">
        <p className="text-8xl font-black">
          <GradientText>404</GradientText>
        </p>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="max-w-md text-[var(--color-muted)]">{t('body')}</p>
        <Button href="/">{t('cta')}</Button>
      </div>
    </div>
  );
}
