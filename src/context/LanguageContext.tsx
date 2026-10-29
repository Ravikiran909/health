import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, LanguageConfig, SUPPORTED_LANGUAGES } from '../types';
import { translate, getLanguageConfig } from '../i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  speechEnabled: boolean;
  setSpeechEnabled: (enabled: boolean) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  currentLanguageConfig: LanguageConfig;
  supportedLanguages: LanguageConfig[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'kn',
  setLanguage: () => {},
  toggleLanguage: () => {},
  speechEnabled: true,
  setSpeechEnabled: () => {},
  speechRate: 0.95,
  setSpeechRate: () => {},
  fontSize: 'normal',
  setFontSize: () => {},
  highContrast: false,
  setHighContrast: () => {},
  t: (key) => key,
  currentLanguageConfig: SUPPORTED_LANGUAGES[1], // kn
  supportedLanguages: SUPPORTED_LANGUAGES,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('healthconnect_language');
      if (
        saved &&
        SUPPORTED_LANGUAGES.some((item) => item.code === saved)
      ) {
        return saved as Language;
      }
    } catch {}
    return 'kn'; // Default to Kannada for state focus
  });

  const [speechEnabled, setSpeechEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('healthconnect_speech_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [speechRate, setSpeechRateState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('healthconnect_speech_rate');
      return saved ? parseFloat(saved) : 0.95;
    } catch {
      return 0.95;
    }
  });

  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'xlarge'>(
    () => {
      try {
        const saved = localStorage.getItem('healthconnect_font_size');
        if (saved === 'large' || saved === 'xlarge') return saved;
      } catch {}
      return 'normal';
    }
  );

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('healthconnect_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('healthconnect_language', lang);
    } catch {}
  };

  const toggleLanguage = () => {
    // Cycle through languages: en -> kn -> hi -> te -> ml -> ta -> en
    const currentIndex = SUPPORTED_LANGUAGES.findIndex(
      (l) => l.code === language
    );
    const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
    setLanguage(SUPPORTED_LANGUAGES[nextIndex].code);
  };

  const setSpeechRate = (rate: number) => {
    setSpeechRateState(rate);
    try {
      localStorage.setItem('healthconnect_speech_rate', String(rate));
    } catch {}
  };

  const setFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSizeState(size);
    try {
      localStorage.setItem('healthconnect_font_size', size);
    } catch {}
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    try {
      localStorage.setItem('healthconnect_high_contrast', String(enabled));
    } catch {}
  };

  // Sync font size and high contrast classes to root html / body
  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'large') {
      root.style.fontSize = '17px';
    } else if (fontSize === 'xlarge') {
      root.style.fontSize = '18.5px';
    } else {
      root.style.fontSize = '16px';
    }

    if (highContrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }
  }, [fontSize, highContrast]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(language, key, params);
  };

  const currentLanguageConfig = getLanguageConfig(language);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        speechEnabled,
        setSpeechEnabled,
        speechRate,
        setSpeechRate,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        t,
        currentLanguageConfig,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
