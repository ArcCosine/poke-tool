import type React from 'react';
import { AppProvider, useApp } from '../../context/AppContext';
import 'virtual:uno.css';
import '../../index.css';

const LegalLayoutContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { language, toggleLanguage, theme, toggleTheme } = useApp();

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans pb-12">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 p-4 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            type="button"
            onClick={handleBackToHome}
            className="text-xl font-bold flex items-center gap-2 cursor-pointer bg-transparent border-none text-slate-900 dark:text-slate-100 font-sans"
          >
            <span className="i-lucide-sword text-indigo-500" />
            Poke-Tool
          </button>

          <div className="flex gap-3">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-sm cursor-pointer font-sans"
            >
              <span className="i-lucide-languages text-slate-500" />
              {language === 'ja' ? 'English' : '日本語'}
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              data-testid="theme-toggle"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-sm flex items-center cursor-pointer"
            >
              {theme === 'dark' ? (
                <span className="i-lucide-sun text-yellow-500" />
              ) : (
                <span className="i-lucide-moon text-indigo-500" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 md:p-12">{children}</main>
    </div>
  );
};

export const LegalLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AppProvider>
      <LegalLayoutContent>{children}</LegalLayoutContent>
    </AppProvider>
  );
};
