import { useState } from 'react';
import { ImageAnalyzer } from './components/ImageAnalyzer/ImageAnalyzer';
import { PartySimulator } from './components/PartySimulator/PartySimulator';
import { StatSearch } from './components/StatSearch/StatSearch';
import { AppProvider, useApp } from './context/AppContext';
import 'virtual:uno.css';
import './index.css';

type Tab = 'dashboard' | 'statSearch' | 'imageAnalyzer' | 'partySimulator';

const tabIcons: Record<Tab, string> = {
  dashboard: 'i-lucide-layout-dashboard',
  statSearch: 'i-lucide-trending-up',
  imageAnalyzer: 'i-lucide-scan-face',
  partySimulator: 'i-lucide-shield-alert',
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
        <button
          type="button"
          onClick={() => setActiveTab('imageAnalyzer')}
          className="card-premium hover:border-indigo-500/50 text-left cursor-pointer transition-all hover:scale-102"
        >
          <span className="i-lucide-scan-face text-3xl text-indigo-500 mb-3 block" />
          <h3 className="font-semibold mb-2">{t('imageAnalyzer')}</h3>
          <p className="text-sm text-slate-500">{t('imageAnalyzerDesc')}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('statSearch')}
          className="card-premium hover:border-indigo-500/50 text-left cursor-pointer transition-all hover:scale-102"
        >
          <span className="i-lucide-trending-up text-3xl text-indigo-500 mb-3 block" />
          <h3 className="font-semibold mb-2">{t('statSearch')}</h3>
          <p className="text-sm text-slate-500">{t('statSearchDesc')}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('partySimulator')}
          className="card-premium hover:border-indigo-500/50 text-left cursor-pointer transition-all hover:scale-102"
        >
          <span className="i-lucide-shield-alert text-3xl text-indigo-500 mb-3 block" />
          <h3 className="font-semibold mb-2">{t('partySimulator')}</h3>
          <p className="text-sm text-slate-500">{t('partySimulatorDesc')}</p>
        </button>
      </div>
    </div>
  );
};

const MainLayout = () => {
  const { language, toggleLanguage, theme, toggleTheme, t } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    // Sync active tab with hash or fallback to dashboard
    const hash = window.location.hash.replace('#', '') as Tab;
    return [
      'dashboard',
      'statSearch',
      'imageAnalyzer',
      'partySimulator',
    ].includes(hash)
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
          <button
            type="button"
            onClick={() => changeTab('dashboard')}
            className="text-xl font-bold flex items-center gap-2 cursor-pointer bg-transparent border-none text-slate-900 dark:text-slate-100"
          >
            <span className="i-lucide-sword text-indigo-500" />
            Poke-Tool
          </button>

          <div className="flex gap-3">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-sm cursor-pointer"
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
      <main className="max-w-7xl mx-auto p-6 md:p-12">
        {activeTab === 'dashboard' && (
          <DashboardContent setActiveTab={changeTab} />
        )}
        {activeTab === 'statSearch' && <StatSearch />}
        {activeTab === 'imageAnalyzer' && <ImageAnalyzer />}
        {activeTab === 'partySimulator' && <PartySimulator />}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 flex justify-around items-center">
        {(
          [
            'dashboard',
            'statSearch',
            'imageAnalyzer',
            'partySimulator',
          ] as Tab[]
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
