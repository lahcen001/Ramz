'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook that forces component re-render when language changes
 * This ensures all translated text updates immediately when language changes
 */
export function useLanguageChange() {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  return language;
}
