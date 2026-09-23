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
  const [avatarError, setAvatarError] = useState(false);

  if (user) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="flex items-center justify-center shrink-0">
          {user.avatarUrl && !avatarError ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              title={user.name}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-500 shadow-xs"
              title={user.name}
              aria-label={user.name}
              role="img"
            >
              <span className="i-lucide-user text-sm" aria-hidden="true" />
            </div>
          )}
        </div>
        <Button
          variant="secondary"
          icon="i-lucide-log-out"
          className="h-7 sm:h-8 px-2 sm:px-2.5 py-1 text-xs whitespace-nowrap text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 transition shrink-0"
          onClick={logout}
          aria-label={t('auth.logout')}
          title={t('auth.logout')}
        >
          <span className="hidden sm:inline">{t('auth.logout')}</span>
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
