export const SUPPORTED_LANGUAGES = {
  en: { code: 'en-IN', name: 'English', flag: '🇬🇧' },
  hi: { code: 'hi-IN', name: 'हिंदी', flag: '🇮🇳' },
  ta: { code: 'ta-IN', name: 'தமிழ்', flag: '🇮🇳' }
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export const DEFAULT_LANGUAGE: LanguageCode = 'en';
