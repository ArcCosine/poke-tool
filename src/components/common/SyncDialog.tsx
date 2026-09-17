import type React from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from './Button';
import { Dialog } from './Dialog';

export interface SyncDialogProps {
  isOpen: boolean;
  pendingCount: number;
  onConfirm: () => void;
  onDismiss: () => void;
}

export const SyncDialog: React.FC<SyncDialogProps> = ({
  isOpen,
  pendingCount,
  onConfirm,
  onDismiss,
}) => {
  const { t } = useApp();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onDismiss}
      title={
        <div className="flex items-center gap-2">
          <span className="i-lucide-cloud-upload text-indigo-500 text-xl" />
          <span>{t('auth.syncTitle')}</span>
        </div>
      }
      actions={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onDismiss}>
            {t('auth.discardAction')}
          </Button>
          <Button variant="primary" icon="i-lucide-cloud" onClick={onConfirm}>
            {t('auth.syncAction')}
          </Button>
        </div>
      }
    >
      <div className="py-2 text-slate-700 dark:text-slate-200">
        <p className="text-sm leading-relaxed mb-3">
          {t('auth.syncDescription')}
        </p>
        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-3 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-3">
          <span className="i-lucide-database text-indigo-500 text-xl shrink-0" />
          <div className="text-xs text-indigo-900 dark:text-indigo-200">
            <span className="font-semibold">{pendingCount}</span> 件のパーティが見つかりました。
          </div>
        </div>
      </div>
    </Dialog>
  );
};
