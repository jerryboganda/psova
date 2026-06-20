import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { CONDITIONS } from '@/data/conditions';

const BASE = 'https://psova.polytronx.com';

const PATHS = [
  '',
  '/about',
  '/what-are-vascular-anomalies',
  '/conditions',
  '/patients',
  '/professionals',
  '/find-a-specialist',
  '/research',
  '/news',
  '/get-involved',
  '/donate',
  '/contact',
  ...CONDITIONS.map((c) => `/conditions/${c.slug}`),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = '2026-06-19';
  return routing.locales.flatMap((locale) =>
    PATHS.map((path) => ({
      url: `${BASE}/${locale}${path}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1 : 0.7,
    })),
  );
}
