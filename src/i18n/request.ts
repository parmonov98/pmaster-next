import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from './config';

const messages = {
  uz: require('../../messages/uz.json'),
  ru: require('../../messages/ru.json'),
  en: require('../../messages/en.json'),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale is a Promise according to the types
  const locale = await requestLocale;

  // Validate that the requested locale exists
  let finalLocale: Locale = locale as Locale ?? defaultLocale;

  if (!locales.includes(finalLocale)) {
    finalLocale = defaultLocale;
  }

  return {
    locale: finalLocale,
    messages: messages[finalLocale],
  };
});
