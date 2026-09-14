import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Layout } from '../../components/common/Layout';
import { AppProvider, useApp } from '../../context/AppContext';
import 'virtual:uno.css';
import '../../index.css';

const DashboardApp = () => {
  const { t } = useApp();

  const toolCards = [
    {
      href: '/ranking.html',
      title: t('statSearch.title'),
      desc: t('statSearchDesc'),
      icon: 'i-lucide-trending-up',
      gradient: 'from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
    },
    {
      href: '/ev-calculator.html',
      title: t('evCalculator.title'),
      desc: t('evCalculatorDesc'),
      icon: 'i-lucide-calculator',
      gradient: 'from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-900/50',
      iconColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
    },
    {
      href: '/party.html',
      title: t('partySimulator.title'),
      desc: t('partySimulatorDesc'),
      icon: 'i-lucide-shield-alert',
      gradient: 'from-amber-500/10 to-rose-500/10 border-amber-200 dark:border-amber-900/50',
      iconColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    },
  ];

  return (
    <Layout activePage="dashboard">
      <div className="space-y-10">
        {/* Hero Section */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Pokémon Champions Ready
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {t('dashboard')}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            {t('dashboardDesc')}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {toolCards.map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              className="group card-premium bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 no-underline text-left cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between p-6"
            >
              <div>
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition duration-200 ${tool.iconColor}`}
                >
                  <span className={`${tool.icon} text-2xl`} />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {tool.title}
                  </h2>
                  <span className="i-lucide-arrow-right text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all text-base" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {tool.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>ツールを開く</span>
                <span className="i-lucide-chevron-right ml-1 text-sm" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </Layout>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AppProvider>
        <DashboardApp />
      </AppProvider>
    </StrictMode>
  );
}

export default DashboardApp;
