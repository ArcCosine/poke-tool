import { useApp } from '../../context/AppContext';

export const Disclaimer = ({ onBack }: { onBack: () => void }) => {
  const { t } = useApp();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
          <span className="i-lucide-alert-triangle text-amber-500" />
          {t('disclaimer')}
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary flex items-center justify-center gap-2 text-sm cursor-pointer self-start sm:self-auto"
        >
          <span className="i-lucide-arrow-left" />
          {t('backToDashboard')}
        </button>
      </div>
      <div className="card-premium">
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-left">
          {t('disclaimerText')}
        </p>
      </div>
    </div>
  );
};
