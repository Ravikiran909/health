import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  speechEnabled: boolean;
  setSpeechEnabled: (enabled: boolean) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  kn: {
    // Brand & Tagline
    app_title: 'ಆರೋಗ್ಯ ಸಂಪರ್ಕ AI',
    app_subtitle: 'ಗ್ರಾಮೀಣ ಹಾಗೂ ಅರೆ-ನಗರ ಆರೋಗ್ಯ ಪ್ರವೇಶ ವೇದಿಕೆ',
    kannada_toggle: 'ಕನ್ನಡ',
    english_toggle: 'English',

    // Nav items
    nav_home: 'ಮುಖಪುಟ',
    nav_facilities: 'ಆಸ್ಪತ್ರೆಗಳು & PHC',
    nav_appointments: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್',
    nav_asha: 'ಆಶಾ ಸಾಥಿ',
    nav_health_info: 'ಆರೋಗ್ಯ ಮಾಹಿತಿ',
    nav_scorecard: 'ಪ್ರವೇಶ ಸ್ಕೋರ್‌ಕಾರ್ಡ್',
    nav_analytics: 'ವಿಶ್ಲೇಷಣೆ',
    nav_emergency: '108 ತುರ್ತು ಕರೆ',

    // Hero section
    hero_badge: 'ರಾಷ್ಟ್ರೀಯ ಆರೋಗ್ಯ ಹ್ಯಾಕಥಾನ್ 2026',
    hero_heading: 'ಗ್ರಾಮೀಣ ಕುಟುಂಬಗಳಿಗೆ ಸುಲಭ ಆರೋಗ್ಯ ಸೇವೆ',
    hero_description: 'ಕನ್ನಡ ಧ್ವನಿ ಸಹಾಯಕ, ಹತ್ತಿರದ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳ ಮಾಹಿತಿ, 24/7 ತುರ್ತು 108 ನೆರವು ಮತ್ತು ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯರ ಸಮನ್ವಯ ಒಂದೇ ವೇದಿಕೆಯಲ್ಲಿ.',
    voice_assistant_btn: 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ (ಧ್ವನಿ ಸಹಾಯಕ)',
    voice_assistant_sub: 'ಆಸ್ಪತ್ರೆ, ಲಸಿಕೆ ಅಥವಾ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬಗ್ಗೆ ಕೇಳಿ',
    find_phc_btn: 'ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ ಹುಡುಕಿ',
    book_visit_btn: 'ಭೇಟಿಯ ಸಮಯ ನಿಗದಿಪಡಿಸಿ',

    // Quick Action Cards
    card_phc_title: 'ಪ್ರಾಥಮಿಕ ಕೇಂದ್ರ & ಆಸ್ಪತ್ರೆಗಳು',
    card_phc_desc: '24/7 ಸಹಜ ಹೆರಿಗೆ ಕೇಂದ್ರಗಳು, ವೈದ್ಯರ ಲಭ್ಯತೆ, ದೂರ ಮತ್ತು ಗೂಗಲ್ ಮ್ಯಾಪ್ ಮಾರ್ಗ.',
    card_book_title: 'ಆಸ್ಪತ್ರೆ ಭೇಟಿ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್',
    card_book_desc: 'ಗರ್ಭಿಣಿಯರ ತಪಾಸಣೆ ಮತ್ತು ಸಾಮಾನ್ಯ OPD ಗೆ ಸರತಿ ಸಾಲಿಲ್ಲದೆ ವಿನಂತಿ ಸಲ್ಲಿಸಿ.',
    card_asha_title: 'ಆಶಾ ಸಾಥಿ ಪೋರ್ಟಲ್',
    card_asha_desc: 'ಗರ್ಭಿಣಿಯರ ಆರೈಕೆ, ಲಸಿಕಾ ವೇಳಾಪಟ್ಟಿ, ರೆಫರಲ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಫಾಲೋ-ಅಪ್.',
    card_info_title: 'ವಿಶ್ವಾಸಾರ್ಹ ಆರೋಗ್ಯ ಶಿಕ್ಷಣ',
    card_info_desc: 'ಸರ್ಕಾರಿ NHM ಮಾರ್ಗಸೂಚಿಗಳ ಆಧಾರದ ಮೇಲೆ ಲಸಿಕೆ, ಡೆಂಗ್ಯೂ, ಹಾವು ಕಡಿತ ಮುನ್ನೆಚ್ಚರಿಕೆ.',
    card_emergency_title: '108 ತುರ್ತು ಆಂಬುಲೆನ್ಸ್',
    card_emergency_desc: 'ಒಂದೇ ಸ್ಪರ್ಶದಲ್ಲಿ ನೇರ ಕರೆ, ಉಚಿತ ಆಂಬುಲೆನ್ಸ್ ಹಾಗೂ ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ಮಾಹಿತಿ.',
    card_scorecard_title: 'ಪ್ರವೇಶ ಸ್ಕೋರ್‌ಕಾರ್ಡ್ (Hackathon ⭐)',
    card_scorecard_desc: 'ಧ್ವನಿ vs ಸಾಂಪ್ರದಾಯಿಕ ಪರದೆಯ ಸುಲಭತೆಯ ಲೈವ್ ಪರೀಕ್ಷೆ ಮತ್ತು ಮೌಲ್ಯಮಾಪನ.',

    // Common labels
    search_placeholder: 'ಗ್ರಾಮ, ತಾಲೂಕು ಅಥವಾ ಆಸ್ಪತ್ರೆ ಹೆಸರನ್ನು ಟೈಪ್ ಮಾಡಿ...',
    loading: 'ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    offline_notice: 'ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವಿಲ್ಲ. ಮಾಹಿತಿ ಸಾಧನದಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹವಾಗಿದೆ.',
    sync_now: 'ಈಗ ಸಿಂಕ್ ಮಾಡಿ',
    verified_data: 'ದೃಢೀಕೃತ ಸರ್ಕಾರಿ ಸೌಲಭ್ಯ',
    sample_data: 'ಡೆಮೊ ಮಾದರಿ ದತ್ತಾಂಶ',
    call_btn: 'ಕರೆ ಮಾಡಿ',
    directions_btn: 'ಮಾರ್ಗ ನೋಡಿ',
    emergency_disclaimer: 'ಗಂಭೀರ ರೋಗಲಕ್ಷಣಗಳಿದ್ದರೆ ತಕ್ಷಣ 108 ಕರೆ ಮಾಡಿ.',
    medical_disclaimer: 'ಇದು ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ ಶಿಕ್ಷಣ ಮಾಹಿತಿ ಮಾತ್ರ. ವೈದ್ಯರ ಪರೀಕ್ಷೆಗೆ ಪರ್ಯಾಯವಲ್ಲ.',
  },
  en: {
    // Brand & Tagline
    app_title: 'HealthConnect AI',
    app_subtitle: 'Rural & Semi-Urban Healthcare Access Platform',
    kannada_toggle: 'ಕನ್ನಡ',
    english_toggle: 'English',

    // Nav items
    nav_home: 'Home',
    nav_facilities: 'PHCs & Hospitals',
    nav_appointments: 'Appointments',
    nav_asha: 'ASHA Saathi',
    nav_health_info: 'Health Info (RAG)',
    nav_scorecard: 'Access Scorecard ⭐',
    nav_analytics: 'Analytics',
    nav_emergency: '108 Emergency',

    // Hero section
    hero_badge: 'National Healthcare Innovation 2026',
    hero_heading: 'Empowering Rural Healthcare Access with Voice AI',
    hero_description: 'Bilingual Kannada & English voice guidance, verified Primary Health Centre discovery, 108 emergency dispatch assistance, offline PWA caching, and ASHA community worker coordination.',
    voice_assistant_btn: 'Speak with Voice Assistant',
    voice_assistant_sub: 'Ask in Kannada or English for hospitals, appointments & health guidance',
    find_phc_btn: 'Find Nearest PHC / Hospital',
    book_visit_btn: 'Request Appointment',

    // Quick Action Cards
    card_phc_title: 'PHC & Hospital Directory',
    card_phc_desc: '24/7 delivery points, doctor availability, distance, phone contacts, and map navigation.',
    card_book_title: 'Appointment Requests',
    card_book_desc: 'Submit checkup requests for prenatal ANC, immunization, or general OPD consultation.',
    card_asha_title: 'ASHA Saathi Hub',
    card_asha_desc: 'Maternal health tracking, high-risk flags, immunization calendar, and referral tracking.',
    card_info_title: 'Trusted Health Explainer (RAG)',
    card_info_desc: 'Verified public health guidance from NHM Karnataka & MoHFW with source citations.',
    card_emergency_title: '108 Emergency Dialer',
    card_emergency_desc: '1-tap phone dialer trigger, emergency first-aid protocols, and district hospital casualty.',
    card_scorecard_title: 'HealthConnect Access Scorecard ⭐',
    card_scorecard_desc: 'Live usability benchmark comparing Kannada Voice vs Standard GUI completion metrics.',

    // Common labels
    search_placeholder: 'Search by village, taluk, or hospital name...',
    loading: 'Loading information...',
    offline_notice: 'Offline mode active. Requests saved locally in IndexedDB.',
    sync_now: 'Sync Now',
    verified_data: 'Verified Public Facility',
    sample_data: 'Simulated Demo Data',
    call_btn: 'Call Facility',
    directions_btn: 'Get Directions',
    emergency_disclaimer: 'In acute distress, call 108 immediately.',
    medical_disclaimer: 'Educational public health guide only. Does not replace professional medical diagnosis.',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'kn',
  setLanguage: () => {},
  toggleLanguage: () => {},
  speechEnabled: true,
  setSpeechEnabled: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('healthconnect_lang');
    return (saved as Language) || 'kn'; // Default to Kannada for rural focus
  });

  const [speechEnabled, setSpeechEnabled] = useState<boolean>(true);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('healthconnect_lang', lang);
  };

  const toggleLanguage = () => {
    const next = language === 'kn' ? 'en' : 'kn';
    setLanguage(next);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        speechEnabled,
        setSpeechEnabled,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
