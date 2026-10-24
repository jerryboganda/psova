import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { CONDITIONS } from '@/data/conditions';
import { getListedCenters } from '@/lib/registry/directory';

const BASE = 'https://psova.org.pk';

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
  // Public registry routes only (admin/clinician are excluded, see robots.ts).
  '/registry',
  '/registry/statistics',
  '/registry/enroll',
  '/registry/status',
  '/centres/apply',
  '/support-fund',
  ...CONDITIONS.map((c) => `/conditions/${c.slug}`),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const centres = await getListedCenters().catch(() => []);
  const paths = [...PATHS, ...centres.map((c) => `/centres/${c.slug}`)];
  const lastModified = '2026-06-19';
  return routing.locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${BASE}/${locale}${path}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1 : 0.7,
    })),
  );
}
