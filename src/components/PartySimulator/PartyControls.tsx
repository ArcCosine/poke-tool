import type React from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';

export interface PartyControlsProps {
  onCopyPokesol: () => void;
  isCopied: boolean;
  onNewParty: () => void;
  onShareParty: () => void;
  onDeleteParty: () => void;
  onSaveParty: () => void;
  hasActiveMembers: boolean;
}

export const PartyControls: React.FC<PartyControlsProps> = ({
  onCopyPokesol,
  isCopied,
  onNewParty,
  onShareParty,
  onDeleteParty,
  onSaveParty,
  hasActiveMembers,
}) => {
  const { t } = useApp();

  return (
    <div className="card-premium relative z-10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left / Utility Actions: Copy & New */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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

          <Button
            onClick={onNewParty}
            variant="secondary"
            icon="i-lucide-plus"
            className="h-10 flex-1 sm:flex-initial text-xs px-3.5 py-2 whitespace-nowrap"
          >
            {t('partySimulator.newParty')}
          </Button>
        </div>

        {/* Right / Main Actions: Share, Delete, Save */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            onClick={onShareParty}
            disabled={!hasActiveMembers}
            variant="secondary"
            icon="i-lucide-share-2"
            className="h-10 flex-1 sm:flex-initial text-xs px-3.5 py-2 whitespace-nowrap"
          >
            {t('share.button')}
          </Button>

          <Button
            onClick={onDeleteParty}
            variant="danger"
            icon="i-lucide-trash-2"
            className="h-10 flex-1 sm:flex-initial text-xs px-3.5 py-2 whitespace-nowrap"
          >
            {t('partySimulator.deleteParty')}
          </Button>

          <Button
            onClick={onSaveParty}
            variant="primary"
            icon="i-lucide-save"
            className="h-10 flex-1 sm:flex-initial text-xs px-4 py-2 font-bold shadow-md shadow-indigo-500/20 whitespace-nowrap"
          >
            {t('saveParty')}
          </Button>
        </div>
      </div>
    </div>
  );
};
