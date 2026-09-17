import type React from 'react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import { Dialog } from './Dialog';

export const AuthButton: React.FC = () => {
  const { user, loginWithGoogle, loginWithX, logout } = useAuth();
  const { t } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <span className="i-lucide-user text-xs text-indigo-500" />
          )}
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[80px] sm:max-w-[120px] truncate">
            {user.name}
          </span>
        </div>
        <Button
          variant="secondary"
          icon="i-lucide-log-out"
          className="h-8 sm:h-9 px-2.5 sm:px-3 py-1.5 text-xs whitespace-nowrap text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 transition"
          onClick={logout}
          aria-label={t('auth.logout')}
          title={t('auth.logout')}
        >
          <span>{t('auth.logout')}</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        icon="i-lucide-log-in"
        className="h-8 sm:h-9 px-3 py-1.5 text-xs whitespace-nowrap"
        onClick={() => setIsModalOpen(true)}
      >
        {t('auth.login')}
      </Button>

      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <span className="i-lucide-log-in text-indigo-500 text-lg" />
            <span>{t('auth.login')}</span>
          </div>
        }
      >
        <div className="py-3 text-slate-700 dark:text-slate-200 flex flex-col gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('auth.loginPrompt')}
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 shadow-sm transition"
            >
              <span className="i-lucide-chrome text-red-500 text-lg" />
              <span>{t('auth.loginWithGoogle')}</span>
            </button>

            <button
              type="button"
              onClick={loginWithX}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 shadow-sm transition"
            >
              <span className="i-lucide-twitter text-sky-500 text-lg" />
              <span>{t('auth.loginWithX')}</span>
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
};
