import type React from 'react';
import { useApp } from '../../context/AppContext';
import { AppIcon } from './AppIcon';
import { Button } from './Button';
import { LanguageSelector } from './LanguageSelector';

export type PageId = 'dashboard' | 'ranking' | 'evCalculator' | 'party';

interface LayoutProps {
  children: React.ReactNode;
  activePage: PageId;
}

const navItems: {
  id: PageId;
  href: string;
  labelKey: string;
  icon: string;
}[] = [
  {
    id: 'dashboard',
    href: '/index.html',
    labelKey: 'dashboard',
    icon: 'i-lucide-layout-dashboard',
  },
  {
    id: 'ranking',
    href: '/ranking.html',
    labelKey: 'statSearch.title',
    icon: 'i-lucide-trending-up',
  },
  {
    id: 'evCalculator',
    href: '/ev-calculator.html',
    labelKey: 'evCalculator.title',
    icon: 'i-lucide-calculator',
  },
  {
    id: 'party',
    href: '/party.html',
    labelKey: 'partySimulator.title',
    icon: 'i-lucide-shield-alert',
  },
];

export const Layout: React.FC<LayoutProps> = ({ children, activePage }) => {
  const { theme, toggleTheme, t } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans pb-24">
      {/* Header (Top Bar with Logo, Nav Links, and Controls) */}
      <header className="border-b border-slate-200 dark:border-slate-800 p-4 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a
              href="/index.html"
              className="text-xl font-bold flex items-center gap-2.5 cursor-pointer no-underline text-slate-900 dark:text-slate-100 hover:opacity-90 transition"
            >
              <AppIcon className="w-7 h-7" />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-black tracking-tight">
                Poke-Tool
              </span>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 no-underline ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={`${item.icon} text-base`} />
                    {t(item.labelKey)}
                  </a>
                );
              })}
            </nav>
          </div>

          <div className="flex gap-3 items-center">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <Button
              data-testid="theme-toggle"
              onClick={toggleTheme}
              variant="secondary"
              className="p-2 text-sm"
              aria-label={theme === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替'}
            >
              {theme === 'dark' ? (
                <span className="i-lucide-sun text-yellow-500" />
              ) : (
                <span className="i-lucide-moon text-indigo-500" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12">
        {children}
      </main>

      {/* Footer Links */}
      <footer className="max-w-7xl mx-auto px-6 pt-12 pb-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 flex flex-wrap justify-center items-center gap-3">
        <a
          href="/privacy.html"
          className="hover:text-slate-600 dark:hover:text-slate-200 transition font-sans no-underline"
        >
          {t('privacyPolicy')}
        </a>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <a
          href="/disclaimer.html"
          className="hover:text-slate-600 dark:hover:text-slate-200 transition font-sans no-underline"
        >
          {t('disclaimer')}
        </a>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <a
          href="/terms.html"
          className="hover:text-slate-600 dark:hover:text-slate-200 transition font-sans no-underline"
        >
          {t('termsOfService')}
        </a>
      </footer>

      {/* Bottom Navigation Bar (Visible on all screen sizes) */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-md md:max-w-lg mx-auto flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors duration-150 no-underline ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <span className={`${item.icon} text-xl mb-1`} />
                <span className="text-[10px] tracking-tight">{t(item.labelKey)}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
