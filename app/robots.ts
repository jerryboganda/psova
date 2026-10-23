import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Registry admin/clinician areas and APIs are not for crawlers.
      disallow: ['/api/', '/en/registry/admin', '/ur/registry/admin', '/en/registry/clinician', '/ur/registry/clinician', '/en/centre/', '/ur/centre/', '/en/centre$', '/ur/centre$', '/en/registry/login', '/ur/registry/login'],
    },
    sitemap: 'https://psova.org.pk/sitemap.xml',
  };
}
