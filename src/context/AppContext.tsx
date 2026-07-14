import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'ja' | 'en';
export type Theme = 'light' | 'dark';

interface AppContextProps {
  language: Language;
  toggleLanguage: () => void;
  theme: Theme;
  toggleTheme: () => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const uiTranslations: Record<Language, Record<string, string>> = {
  ja: {
    dashboard: 'ダッシュボード',
    imageAnalyzer: '画像分析',
    statSearch: '火力・耐久検索',
    partySimulator: 'パーティシミュレーター',
  },
  en: {
    dashboard: 'Dashboard',
    imageAnalyzer: 'Image Analyzer',
    statSearch: 'Stat Search',
    partySimulator: 'Party Simulator',
  },
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize language from localStorage or default to 'ja'
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('lang') as Language;
    return saved === 'ja' || saved === 'en' ? saved : 'ja';
  });

  // Initialize theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  // Apply theme class to document element on mount and theme change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === 'ja' ? 'en' : 'ja';
      localStorage.setItem('lang', next);
      return next;
    });
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  const t = (key: string): string => {
    return uiTranslations[language][key] || key;
  };

  return (
    <AppContext.Provider
      value={{ language, toggleLanguage, theme, toggleTheme, t }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
