import { setRequestLocale } from 'next-intl/server';
import { Hero } from '@/components/sections/home/Hero';
import { DualPath } from '@/components/sections/home/DualPath';
import { StatsBand } from '@/components/sections/home/StatsBand';
import { Mission } from '@/components/sections/home/Mission';
import { ConditionsPreview } from '@/components/sections/home/ConditionsPreview';
import { MapTeaser } from '@/components/sections/home/MapTeaser';
import { ValuesGrid } from '@/components/sections/home/ValuesGrid';
import { NewsPreview } from '@/components/sections/home/NewsPreview';
import { FinalCTA } from '@/components/sections/home/FinalCTA';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <DualPath />
      <StatsBand />
      <Mission />
      <ConditionsPreview />
      <MapTeaser />
      <ValuesGrid />
      <NewsPreview />
      <FinalCTA />
    </>
  );
}
