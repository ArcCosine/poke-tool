import { registerSW } from 'virtual:pwa-register';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from './Button';

export const UpdateToast: React.FC = () => {
  const { t } = useApp();
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateFunction, setUpdateFunction] = useState<
    ((reloadPage?: boolean) => Promise<void>) | null
  >(null);

  useEffect(() => {
    try {
      const updateSW = registerSW({
        onNeedRefresh() {
          setNeedRefresh(true);
        },
        onOfflineReady() {
          // offline ready callback
        },
      });
      setUpdateFunction(() => updateSW);
    } catch {
      // SW might not be supported in test or older environments
    }
  }, []);

  if (!needRefresh) return null;

  return (
    <aside
      aria-label={t('pwa.updateAvailable')}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-indigo-200 dark:border-indigo-800/80 shadow-2xl animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <span className="i-lucide-sparkles text-xl" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t('pwa.updateAvailable')}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            className="text-xs px-3 py-1.5 shadow-sm"
            onClick={() => {
              if (updateFunction) {
                updateFunction(true);
              } else {
                window.location.reload();
              }
            }}
          >
            {t('pwa.updateButton')}
          </Button>
          <button
            type="button"
            onClick={() => setNeedRefresh(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label={t('pokemonSearchModal.close')}
          >
            <span className="i-lucide-x text-base block" />
          </button>
        </div>
      </div>
    </aside>
  );
};
