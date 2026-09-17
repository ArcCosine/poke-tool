import type React from 'react';
import { useApp } from '../../context/AppContext';
import { AppIcon } from './AppIcon';
import { AuthButton } from './AuthButton';
import { Button } from './Button';
import { CookieBanner } from './CookieBanner';
import { LanguageSelector } from './LanguageSelector';
import { UpdateToast } from './UpdateToast';

export type PageId =
  | 'dashboard'
  | 'ranking'
  | 'evCalculator'
  | 'party'
  | 'partyRanking'
  | 'legal';

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
    labelKey: 'nav.dashboard',
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
    labelKey: 'nav.evCalculator',
    icon: 'i-lucide-calculator',
  },
  {
    id: 'party',
    href: '/party.html',
    labelKey: 'nav.partySimulator',
    icon: 'i-lucide-shield-alert',
  },
  {
    id: 'partyRanking',
    href: '/party-ranking.html',
    labelKey: 'nav.partyRanking',
    icon: 'i-lucide-trophy',
  },
];

export const Layout: React.FC<LayoutProps> = ({ children, activePage }) => {
  const { theme, toggleTheme, t } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans pb-36 sm:pb-40">
      {/* Header (Top Bar with Logo, Nav Links, and Controls) */}
      <header className="border-b border-slate-200 dark:border-slate-800 px-3 py-3 sm:px-4 sm:py-4 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          <div className="flex items-center gap-6 shrink-0">
            <a
              href="/index.html"
              className="text-lg sm:text-xl font-bold flex items-center gap-2 sm:gap-2.5 cursor-pointer no-underline text-slate-900 dark:text-slate-100 hover:opacity-90 transition"
            >
              <AppIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-black tracking-tight">
                Poke-Tool
              </span>
            </a>
          </div>

          <div className="flex gap-1.5 sm:gap-3 items-center shrink-0">
            {/* Auth Button */}
            <AuthButton />

            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <Button
              data-testid="theme-toggle"
              onClick={toggleTheme}
              variant="secondary"
              className="p-2 text-sm"
              aria-label={
                theme === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替'
              }
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
      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12">{children}</main>

      {/* Footer Links */}
      <footer className="max-w-7xl mx-auto px-6 pt-12 pb-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 flex flex-wrap justify-center items-center gap-3 mb-6 sm:mb-8">
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
                <span className="text-[10px] tracking-tight">
                  {t(item.labelKey)}
                </span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Cookie Consent Banner (GDPR compliance) */}
      <CookieBanner />

      {/* PWA Update Notification Toast */}
      <UpdateToast />
    </div>
  );
};
