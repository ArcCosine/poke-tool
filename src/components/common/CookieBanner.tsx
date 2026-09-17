import type React from 'react';
import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from './Button';

const STORAGE_KEY = 'poke_cookie_consent';

export const CookieBanner: React.FC = () => {
  const { t } = useApp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (consent !== 'accepted') {
        setIsVisible(true);
      }
    } catch {
      // Ignore storage access errors (e.g. strict privacy mode)
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {
      // Ignore storage write errors
    }
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      aria-label={t('cookieConsent.title')}
      className="fixed bottom-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 sm:p-5 transition-all duration-300"
    >
      <div className="flex items-start gap-3">
        <span
          className="i-lucide-cookie text-amber-500 shrink-0 text-2xl mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t('cookieConsent.title')}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
            {t('cookieConsent.description')}{' '}
            <a
              href="/privacy.html"
              className="text-indigo-600 dark:text-indigo-400 underline hover:opacity-80 font-medium inline-block"
            >
              {t('cookieConsent.privacyPolicy')}
            </a>
          </p>
          <div className="mt-3 flex justify-end">
            <Button
              variant="primary"
              onClick={handleAccept}
              className="text-xs px-4 py-1.5 font-semibold"
            >
              {t('cookieConsent.accept')}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};
