import { useState } from 'react';
import { PartySimulator } from './components/PartySimulator/PartySimulator';
import { StatSearch } from './components/StatSearch/StatSearch';
import { AppProvider, useApp } from './context/AppContext';
import 'virtual:uno.css';
import './index.css';

type Tab = 'dashboard' | 'statSearch' | 'imageAnalyzer' | 'partySimulator';

const DashboardContent = ({
  setActiveTab,
}: {
  setActiveTab: (tab: Tab) => void;
}) => {
  const { t } = useApp();
  return (
    <div className="card-premium">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span className="i-lucide-layout-dashboard text-indigo-500" />
        {t('dashboard')}
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Welcome to the Poke-Tool! This tool will support your Pokémon Champions
        data analysis.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('imageAnalyzer')}
          className="card-premium hover:border-indigo-500/50 text-left cursor-pointer transition-all hover:scale-102"
        >
          <span className="i-lucide-scan-face text-3xl text-indigo-500 mb-3 block" />
          <h3 className="font-semibold mb-2">{t('imageAnalyzer')}</h3>
          <p className="text-sm text-slate-500">
            Analyze party images using Onnx OCR locally.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('statSearch')}
          className="card-premium hover:border-indigo-500/50 text-left cursor-pointer transition-all hover:scale-102"
        >
          <span className="i-lucide-trending-up text-3xl text-indigo-500 mb-3 block" />
          <h3 className="font-semibold mb-2">{t('statSearch')}</h3>
          <p className="text-sm text-slate-500">
            Search maximum damage and durability rankings.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('partySimulator')}
          className="card-premium hover:border-indigo-500/50 text-left cursor-pointer transition-all hover:scale-102"
        >
          <span className="i-lucide-shield-alert text-3xl text-indigo-500 mb-3 block" />
          <h3 className="font-semibold mb-2">{t('partySimulator')}</h3>
          <p className="text-sm text-slate-500">
            Analyze party weaknesses and type balances.
          </p>
        </button>
      </div>
    </div>
  );
};

const MainLayout = () => {
  const { language, toggleLanguage, theme, toggleTheme, t } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 p-4 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 justify-between items-center">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="text-xl font-bold flex items-center gap-2 cursor-pointer bg-transparent border-none text-slate-900 dark:text-slate-100"
          >
            <span className="i-lucide-sword text-indigo-500" />
            Poke-Tool
          </button>

          {/* Navigation Tabs */}
          <nav className="flex gap-1 bg-slate-200/50 dark:bg-slate-900/60 p-1 rounded-xl">
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
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t(tab)}
              </button>
            ))}
          </nav>

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
          <DashboardContent setActiveTab={setActiveTab} />
        )}
        {activeTab === 'statSearch' && <StatSearch />}

        {activeTab === 'imageAnalyzer' && (
          <div className="card-premium text-center py-20">
            <span className="i-lucide-scan-face text-5xl text-indigo-500/50 mb-4 block" />
            <h2 className="text-xl font-bold mb-2">{t('imageAnalyzer')}</h2>
            <p className="text-slate-500">
              Coming soon in Step 4/5 (WASM & Onnx OCR Image Analysis).
            </p>
          </div>
        )}

        {activeTab === 'partySimulator' && <PartySimulator />}
      </main>
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
