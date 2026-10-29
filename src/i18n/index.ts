import { Language, LanguageConfig, SUPPORTED_LANGUAGES } from '../types';
import { en } from './translations/en';
import { kn } from './translations/kn';
import { hi } from './translations/hi';
import { te } from './translations/te';
import { ml } from './translations/ml';
import { ta } from './translations/ta';

export const translations: Record<Language, Record<string, string>> = {
  en,
  kn,
  hi,
  te,
  ml,
  ta,
};

export { SUPPORTED_LANGUAGES };

export function getLanguageConfig(code: Language): LanguageConfig {
  return (
    SUPPORTED_LANGUAGES.find((lang) => lang.code === code) ||
    SUPPORTED_LANGUAGES[0]
  );
}

/**
 * Translates a key with fallback to English, and supports parameter interpolation (e.g. {radius})
 */
export function translate(
  lang: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const dictionary = translations[lang] || translations.en;
  let text = dictionary[key] || translations.en[key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
    });
  }

  return text;
}
