'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useLanguageChange } from '@/hooks/useLanguageChange';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  useLanguageChange(); // This will force re-render on language change

  const handleLanguageChange = async (languageCode: string) => {
    console.log('Changing language to:', languageCode);
    
    // Update UI immediately
    await i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
    
    // Update document language
    document.documentElement.lang = languageCode;
    document.documentElement.dir = 'ltr'; // Always left-to-right since Arabic is removed
    
    // Force a re-render by updating state
    window.location.reload();
    
    // Update admin's language preference in database
    try {
      const response = await fetch('/api/auth/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: languageCode,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('Admin language preference updated successfully');
      } else {
        console.error('Failed to update admin language preference:', data.error);
      }
    } catch (error) {
      console.error('Error updating admin language preference:', error);
    }
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span>{currentLanguage.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={language.code === i18n.language ? 'bg-accent' : ''}
          >
            <div className="flex flex-col">
              <span className="font-medium">{language.nativeName}</span>
              <span className="text-xs text-muted-foreground">{language.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
