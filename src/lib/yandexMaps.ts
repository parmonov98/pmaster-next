// Yandex Maps configuration
export const YANDEX_MAPS_API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '492c0c2b-6b82-4b5a-99e8-e77f3ab680bf';

// Check if Yandex Maps API key is configured
export const isYandexMapsConfigured = YANDEX_MAPS_API_KEY && YANDEX_MAPS_API_KEY !== 'placeholder';

// Yandex Maps query configuration for @pbe/react-yandex-maps
export const getYandexMapsQuery = () => {
  return {
    apikey: YANDEX_MAPS_API_KEY || undefined,
    lang: 'ru_RU' as const,
    load: 'package.full'
  };
};
