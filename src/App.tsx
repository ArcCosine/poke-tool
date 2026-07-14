import { AppProvider, useApp } from './context/AppContext';
import 'virtual:uno.css';
import './index.css';

const Dashboard = () => {
  const { language, toggleLanguage, theme, toggleTheme, t } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 p-4 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="i-lucide-sword text-indigo-500" />
            Poke-Tool
          </h1>
          <div className="flex gap-3">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-sm"
            >
              <span className="i-lucide-languages text-slate-500" />
              {language === 'ja' ? 'English' : '日本語'}
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-sm flex items-center"
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
        <div className="card-premium">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="i-lucide-layout-dashboard text-indigo-500" />
            {t('dashboard')}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Welcome to the Poke-Tool! This tool will support your Pokémon
            Champions data analysis.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-premium hover:border-indigo-500/50">
              <span className="i-lucide-scan-face text-3xl text-indigo-500 mb-3 block" />
              <h3 className="font-semibold mb-2">{t('imageAnalyzer')}</h3>
              <p className="text-sm text-slate-500">
                Analyze party images using Onnx OCR locally.
              </p>
            </div>

            <div className="card-premium hover:border-indigo-500/50">
              <span className="i-lucide-trending-up text-3xl text-indigo-500 mb-3 block" />
              <h3 className="font-semibold mb-2">{t('statSearch')}</h3>
              <p className="text-sm text-slate-500">
                Search maximum damage and durability rankings.
              </p>
            </div>

            <div className="card-premium hover:border-indigo-500/50">
              <span className="i-lucide-shield-alert text-3xl text-indigo-500 mb-3 block" />
              <h3 className="font-semibold mb-2">{t('partySimulator')}</h3>
              <p className="text-sm text-slate-500">
                Analyze party weaknesses and type balances.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}

export default App;
