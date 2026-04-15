import type { MetadataRoute } from 'next';

const baseUrl = 'https://pmaster-next.netlify.app';
const locales = ['uz', 'ru', 'en'];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/blog',
    '/auth/signin',
    '/auth/signup',
    '/privacy',
    '/terms',
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1 : 0.8,
      });
    }
  }

  return entries;
}
