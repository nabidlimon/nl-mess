import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from '../locales/translations';

export type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('mess_manager_lang');
    return (saved === 'en' || saved === 'bn') ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('mess_manager_lang', lang);
  };

  const t = (path: string, params?: Record<string, string | number>): string => {
    const parts = path.split('.');
    let dict: any = translations[language];
    
    for (const part of parts) {
      if (dict && typeof dict === 'object' && part in dict) {
        dict = dict[part];
      } else {
        // Fallback to English dictionary
        let fallbackDict: any = translations['en'];
        for (const fbPart of parts) {
          if (fallbackDict && typeof fallbackDict === 'object' && fbPart in fallbackDict) {
            fallbackDict = fallbackDict[fbPart];
          } else {
            return path; // Return the path if not found anywhere
          }
        }
        dict = fallbackDict;
        break;
      }
    }

    if (typeof dict !== 'string') {
      return path;
    }

    let result = dict;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
      });
    }

    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
