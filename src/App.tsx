import { useState } from 'react';
import { Button } from './components/common/Button';
import { LanguageSelector } from './components/common/LanguageSelector';
import { EvCalculator } from './components/EvCalculator/EvCalculator';
import { PartySimulator } from './components/PartySimulator/PartySimulator';
import { StatSearch } from './components/StatSearch/StatSearch';
import { AppProvider, useApp } from './context/AppContext';
import 'virtual:uno.css';
import './index.css';

type Tab = 'dashboard' | 'statSearch' | 'partySimulator' | 'evCalculator';

const tabIcons: Record<Tab, string> = {
  dashboard: 'i-lucide-layout-dashboard',
  statSearch: 'i-lucide-trending-up',
  partySimulator: 'i-lucide-shield-alert',
  evCalculator: 'i-lucide-calculator',
};

const DashboardContent = ({
  setActiveTab,
}: {
  setActiveTab: (tab: Tab) => void;
}) => {
  const { t } = useApp();
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
          <span className="i-lucide-layout-dashboard text-indigo-500" />
          {t('dashboard')}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
          {t('dashboardDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            tab: 'statSearch' as const,
            title: t('statSearch'),
            desc: t('statSearchDesc'),
            icon: 'i-lucide-trending-up',
          },
          {
            tab: 'evCalculator' as const,
            title: t('evCalculator'),
            desc: t('evCalculatorDesc'),
            icon: 'i-lucide-calculator',
          },
          {
            tab: 'partySimulator' as const,
            title: t('partySimulator'),
            desc: t('partySimulatorDesc'),
            icon: 'i-lucide-shield-alert',
          },
        ].map((item) => (
          <button
            key={item.tab}
            type="button"
            onClick={() => setActiveTab(item.tab)}
            className="group card-premium bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 text-left cursor-pointer transition-all hover:scale-102 flex flex-col justify-between p-6 shadow-sm hover:shadow-md"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition duration-200">
                <span
                  className={`${item.icon} text-2xl text-indigo-600 dark:text-indigo-400`}
                />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {item.title}
                </h3>
                <span className="i-lucide-arrow-right text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all text-sm" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 flex flex-wrap justify-center items-center gap-3">
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
      </div>
    </div>
  );
};

const MainLayout = () => {
  const { theme, toggleTheme, t } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    // Sync active tab with hash or fallback to dashboard
    const hash = window.location.hash.replace('#', '') as Tab;
    return ['dashboard', 'statSearch', 'partySimulator'].includes(hash)
      ? hash
      : 'dashboard';
  });

  const changeTab = (tab: Tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans pb-24">
      {/* Header (Top Bar with Logo and Interactivity only) */}
      <header className="border-b border-slate-200 dark:border-slate-800 p-4 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* biome-ignore lint/a11y/useValidAnchor: user requested anchor link instead of button */}
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              changeTab('dashboard');
            }}
            className="text-xl font-bold flex items-center gap-2 cursor-pointer no-underline text-slate-900 dark:text-slate-100"
          >
            <span className="i-lucide-sword text-indigo-500" />
            Poke-Tool
          </a>

          <div className="flex gap-3">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <Button
              data-testid="theme-toggle"
              onClick={toggleTheme}
              variant="secondary"
              className="p-2 text-sm"
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
      <main className="max-w-7xl mx-auto p-6 md:p-12">
        {activeTab === 'dashboard' && (
          <DashboardContent setActiveTab={changeTab} />
        )}
        {activeTab === 'statSearch' && <StatSearch />}
        {activeTab === 'partySimulator' && <PartySimulator />}
        {activeTab === 'evCalculator' && (
          <EvCalculator onImportComplete={() => changeTab('partySimulator')} />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 flex justify-around items-center">
        {(
          ['dashboard', 'statSearch', 'evCalculator', 'partySimulator'] as const
        ).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => changeTab(tab)}
            className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors duration-150 cursor-pointer border-0 bg-transparent outline-none ${
              activeTab === tab
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className={`${tabIcons[tab]} text-xl mb-1`} />
            <span className="text-[10px] tracking-tight">{t(tab)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
