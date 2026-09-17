import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '../../components/common/Button';
import { Dialog } from '../../components/common/Dialog';
import { Layout } from '../../components/common/Layout';
import { AppProvider, useApp } from '../../context/AppContext';
import {
  clearOfflineCache,
  downloadAllOfflineData,
  getOfflineCacheStatus,
  type OfflineCacheStatus,
} from '../../utils/offline';
import 'virtual:uno.css';
import '../../index.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DashboardApp = () => {
  const { t } = useApp();

  // PWA install state
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  // Network state
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Offline cache state
  const [cacheStatus, setCacheStatus] = useState<OfflineCacheStatus | null>(
    null
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    loaded: number;
    total: number;
  }>({ loaded: 0, total: 0 });

  // Check standalone mode and listen for install prompts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        // @ts-expect-error - iOS specific standalone check
        Boolean(window.navigator?.standalone);
      setIsInstalled(isStandalone);

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      };

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.addEventListener('appinstalled', handleAppInstalled);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener(
          'beforeinstallprompt',
          handleBeforeInstallPrompt
        );
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Fetch cache status
  useEffect(() => {
    getOfflineCacheStatus().then(setCacheStatus);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowIosGuide(true);
    }
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      await downloadAllOfflineData(undefined, (progress) => {
        setDownloadProgress({
          loaded: progress.loaded,
          total: progress.total,
        });
      });
      const updated = await getOfflineCacheStatus();
      setCacheStatus(updated);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearOfflineCache();
      const updated = await getOfflineCacheStatus();
      setCacheStatus(updated);
    } finally {
      setIsClearing(false);
    }
  };

  const toolCards = [
    {
      href: '/ranking.html',
      title: t('statSearch.title'),
      desc: t('statSearchDesc'),
      icon: 'i-lucide-trending-up',
      gradient:
        'from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-900/50',
      iconColor:
        'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
    },
    {
      href: '/ev-calculator.html',
      title: t('evCalculator.title'),
      desc: t('evCalculatorDesc'),
      icon: 'i-lucide-calculator',
      gradient:
        'from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-900/50',
      iconColor:
        'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
    },
    {
      href: '/party.html',
      title: t('partySimulator.title'),
      desc: t('partySimulatorDesc'),
      icon: 'i-lucide-shield-alert',
      gradient:
        'from-amber-500/10 to-rose-500/10 border-amber-200 dark:border-amber-900/50',
      iconColor:
        'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    },
    {
      href: '/party-ranking.html',
      title: t('partyRanking.title'),
      desc: t('partyRanking.description'),
      icon: 'i-lucide-trophy',
      gradient:
        'from-yellow-500/10 to-amber-500/10 border-yellow-200 dark:border-yellow-900/50',
      iconColor:
        'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    },
  ];

  const progressPercent =
    downloadProgress.total > 0
      ? Math.round((downloadProgress.loaded / downloadProgress.total) * 100)
      : 0;

  return (
    <Layout activePage="dashboard">
      <div className="space-y-10">
        {/* Hero Section */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-8 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Pokémon Champions Ready
            </div>

            {/* Network Indicator Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}
              />
              {isOnline ? t('pwa.online') : t('pwa.offline')}
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {t('dashboard')}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            {t('dashboardDesc')}
          </p>
        </div>

        {/* PWA Install Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-0.5 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-[15px]">
            <div className="flex items-start sm:items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <span className="i-lucide-smartphone text-2xl" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {t('pwa.installBannerTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {t('pwa.installBannerDesc')}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto shrink-0">
              {isInstalled ? (
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-200 dark:border-emerald-800 w-full sm:w-auto">
                  <span className="i-lucide-check-circle-2 text-base" />
                  <span>{t('pwa.installed')}</span>
                </div>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleInstallClick}
                  className="w-full sm:w-auto shadow-md"
                >
                  <span className="i-lucide-download text-base mr-1.5" />
                  {t('pwa.installButton')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Offline Storage Management Card */}
        <div className="card-premium bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 dark:bg-violet-400/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <span className="i-lucide-hard-drive-download text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  {t('pwa.offlineSectionTitle')}
                  {cacheStatus?.isFullyCached && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {t('pwa.fullyCached')}
                    </span>
                  )}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {t('pwa.offlineSectionDesc')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                onClick={handleDownloadAll}
                disabled={isDownloading || isClearing}
                className="w-full sm:w-auto"
              >
                <span className="i-lucide-cloud-download text-base mr-1.5" />
                {isDownloading
                  ? t('pwa.downloading', {
                      loaded: downloadProgress.loaded,
                      total: downloadProgress.total,
                      percent: progressPercent,
                    })
                  : t('pwa.downloadAll')}
              </Button>

              <Button
                variant="danger"
                onClick={handleClearCache}
                disabled={isDownloading || isClearing}
                className="w-full sm:w-auto"
              >
                <span className="i-lucide-trash-2 text-base mr-1.5" />
                {isClearing ? t('pwa.clearing') : t('pwa.clearCache')}
              </Button>
            </div>
          </div>

          {/* Progress Bar (Visible during download) */}
          {isDownloading && (
            <div className="mt-6 space-y-2 animate-in fade-in duration-200">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>
                  {t('pwa.downloading', {
                    loaded: downloadProgress.loaded,
                    total: downloadProgress.total,
                    percent: progressPercent,
                  })}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-200 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Status summary */}
          {cacheStatus && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2.5">
                <span className="i-lucide-images text-indigo-500 text-base" />
                <span>
                  {cacheStatus.cachedCount} / {cacheStatus.totalCount} 画像
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2.5">
                <span className="i-lucide-database text-purple-500 text-base" />
                <span>
                  {t('pwa.cacheSize', { size: cacheStatus.estimatedSizeMB })}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2.5">
                <span
                  className={`text-base ${
                    cacheStatus.isFullyCached
                      ? 'i-lucide-check-circle-2 text-emerald-500'
                      : 'i-lucide-info text-amber-500'
                  }`}
                />
                <span>
                  {cacheStatus.isFullyCached
                    ? t('pwa.fullyCached')
                    : cacheStatus.cachedCount > 0
                      ? t('pwa.partiallyCached', {
                          cached: cacheStatus.cachedCount,
                          total: cacheStatus.totalCount,
                        })
                      : t('pwa.notCached')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* iOS Safari PWA Install Guide Modal */}
      <Dialog
        isOpen={showIosGuide}
        onClose={() => setShowIosGuide(false)}
        title={
          <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <span className="i-lucide-share text-xl" />
            {t('pwa.iosGuideTitle')}
          </span>
        }
        actions={
          <Button variant="secondary" onClick={() => setShowIosGuide(false)}>
            {t('pwa.close')}
          </Button>
        }
      >
        <div className="space-y-4 py-2 text-sm text-slate-700 dark:text-slate-300">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold">
              1
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {t('pwa.iosGuideStep1')}
              </p>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono">
                <span className="i-lucide-share text-sm" /> 共有ボタン
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold">
              2
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {t('pwa.iosGuideStep2')}
              </p>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono">
                <span className="i-lucide-plus-square text-sm" /> ホーム画面に追加
              </div>
            </div>
          </div>
        </div>
      </Dialog>
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
