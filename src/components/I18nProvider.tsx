'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import LanguageSelector from './LanguageSelector';
import { Loader } from './ui/loader';

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const pathname = usePathname();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Check if this is a direct quiz link, shared link, quiz taking page, or results page
  const isDirectQuizLink = pathname?.startsWith('/join/') || 
                          pathname?.startsWith('/quiz/') ||
                          pathname?.includes('?pin=') ||
                          (typeof window !== 'undefined' && window.location.search.includes('pin='));

  useEffect(() => {
    const initializeI18n = async () => {
      // Wait for i18n to be initialized
      await i18n.init();
      
      const storedLanguage = localStorage.getItem('language');
      
      // Don't show language selector for direct quiz links
      // The quiz page will handle language setting from quiz data
      if (!storedLanguage && !isDirectQuizLink) {
        setShowLanguageSelector(true);
      } else if (storedLanguage) {
        // Set the stored language and document direction
        i18n.changeLanguage(storedLanguage);
        const isRTL = storedLanguage === 'ar';
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = storedLanguage;
      } else if (isDirectQuizLink) {
        // For direct quiz links without stored language, set default to English
        // The quiz page will override this with the teacher's language
        i18n.changeLanguage('en');
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = 'en';
      }
      
      setIsReady(true);
    };

    initializeI18n();
  }, [isDirectQuizLink]);

  const handleLanguageSelected = () => {
    setShowLanguageSelector(false);
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <Loader variant="brand" size="xl" text="Initializing..." />
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      {showLanguageSelector ? (
        <LanguageSelector onLanguageSelected={handleLanguageSelected} />
      ) : (
        children
      )}
    </I18nextProvider>
  );
} 