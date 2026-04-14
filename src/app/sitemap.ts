import type { MetadataRoute } from 'next';

const baseUrl = 'https://pmaster.uz';
const locales = ['uz', 'ru', 'en'];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '', // landing page
    '/blog',
    '/pricing',
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}${route}`])
          ),
        },
      });
    }
  }

  return entries;
}
