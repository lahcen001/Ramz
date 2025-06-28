'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { Loader } from './ui/loader';

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  // Check if this is a direct quiz link, shared link, quiz taking page, or results page
  const isDirectQuizLink = pathname?.startsWith('/join/') || 
                          pathname?.startsWith('/quiz/') ||
                          pathname?.includes('?pin=') ||
                          (typeof window !== 'undefined' && window.location.search.includes('pin='));

  // Check if this is an admin page
  const isAdminPage = pathname?.startsWith('/admin');

  useEffect(() => {
    const initializeI18n = async () => {
      // Wait for i18n to be initialized
      await i18n.init();
      
      let targetLanguage = 'en'; // Default to English
      
      if (isAdminPage) {
        // For admin pages, check if user is authenticated first
        try {
          const response = await fetch('/api/auth/admin');
          const data = await response.json();
          
          if (data.authenticated && data.admin?.language) {
            // If admin is logged in, use their preferred language
            targetLanguage = data.admin.language;
          } else {
            // If admin is not logged in, use system language
            const browserLanguage = navigator.language.split('-')[0];
            const supportedLanguages = ['en', 'ar', 'fr'];
            targetLanguage = supportedLanguages.includes(browserLanguage) ? browserLanguage : 'en';
          }
        } catch {
          // If there's an error checking auth, use system language
          const browserLanguage = navigator.language.split('-')[0];
          const supportedLanguages = ['en', 'ar', 'fr'];
          targetLanguage = supportedLanguages.includes(browserLanguage) ? browserLanguage : 'en';
        }
      } else if (isDirectQuizLink) {
        // For direct quiz links, use English as default
        // The quiz page will override this with the admin's language when joining
        targetLanguage = 'en';
      } else {
        // For regular users (home page), use English by default
        targetLanguage = 'en';
      }
      
      // Set the target language and document direction
      i18n.changeLanguage(targetLanguage);
      const isRTL = targetLanguage === 'ar';
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = targetLanguage;
      
      setIsReady(true);
    };

    initializeI18n();
  }, [isDirectQuizLink, isAdminPage]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <Loader variant="brand" size="xl" text="Initializing..." />
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
} 