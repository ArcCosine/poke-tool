import type React from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';

export interface PartyControlsProps {
  onNewParty: () => void;
  onOpenPublishDialog: () => void;
  onShareParty: () => void;
  onCopyPokesol: () => void;
  onSaveParty: () => void;
  onDeleteParty: () => void;
  isCopied: boolean;
  hasActiveMembers: boolean;
  isPublic?: boolean;
}

export const PartyControls: React.FC<PartyControlsProps> = ({
  onNewParty,
  onOpenPublishDialog,
  onShareParty,
  onCopyPokesol,
  onSaveParty,
  onDeleteParty,
  isCopied,
  hasActiveMembers,
  isPublic = false,
}) => {
  const { t } = useApp();

  return (
    <div className="card-premium relative z-10 p-4">
      {/* 
        Action Buttons in Specified Order:
        1. 新規作成 (onNewParty)
        2. ランキングに公開する (onOpenPublishDialog)
        3. シェア (onShareParty)
        4. クリップボードにコピー (onCopyPokesol)
        5. パーティを保存 (onSaveParty)
        6. 削除 (onDeleteParty)
      */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* 1. 新規作成 */}
          <Button
            onClick={onNewParty}
            variant="secondary"
            icon="i-lucide-plus"
            className="h-10 flex-1 sm:flex-initial text-xs px-3.5 py-2 whitespace-nowrap"
          >
            {t('partySimulator.newParty')}
          </Button>

          {/* 2. ランキングに公開する */}
          <Button
            onClick={onOpenPublishDialog}
            disabled={!hasActiveMembers}
            variant={isPublic ? 'primary' : 'secondary'}
            icon="i-lucide-trophy"
            className={`h-10 flex-1 sm:flex-initial text-xs px-3.5 py-2 whitespace-nowrap ${
              isPublic
                ? 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white border-transparent'
                : ''
            }`}
          >
            {t('partyShare.isPublic')}
          </Button>

          {/* 3. シェア */}
          <Button
            onClick={onShareParty}
            disabled={!hasActiveMembers}
            variant="secondary"
            icon="i-lucide-share-2"
            className="h-10 flex-1 sm:flex-initial text-xs px-3.5 py-2 whitespace-nowrap"
          >
            {t('share.button')}
          </Button>

          {/* 4. クリップボードにコピー */}
          <Button
            onClick={onCopyPokesol}
            disabled={!hasActiveMembers}
            variant="secondary"
            icon="i-lucide-clipboard"
            className="h-10 flex-1 sm:flex-initial text-xs px-3.5 py-2 whitespace-nowrap"
          >
            {isCopied
              ? t('partySimulator.copiedToClipboard')
              : t('partySimulator.copyToClipboard')}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* 5. パーティを保存 */}
          <Button
            onClick={onSaveParty}
            variant="primary"
            icon="i-lucide-save"
            className="h-10 flex-1 sm:flex-initial text-xs px-4 py-2 font-bold shadow-md shadow-indigo-500/20 whitespace-nowrap"
          >
            {t('saveParty')}
          </Button>

          {/* 6. 削除 */}
          <Button
            onClick={onDeleteParty}
            variant="danger"
            icon="i-lucide-trash-2"
            className="h-10 flex-1 sm:flex-initial text-xs px-3.5 py-2 whitespace-nowrap"
          >
            {t('partySimulator.deleteParty')}
          </Button>
        </div>
      </div>
    </div>
  );
};
