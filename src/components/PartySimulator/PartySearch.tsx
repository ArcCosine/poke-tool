import type React from 'react';
import { useApp } from '../../context/AppContext';
import { Autocomplete } from '../common/Autocomplete';

export interface PartySearchProps {
  partyName: string;
  parties: { id: string; name: string }[];
  onSelectParty: (id: string) => void;
  onPartyNameChange: (name: string) => void;
}

export const PartySearch: React.FC<PartySearchProps> = ({
  partyName,
  parties,
  onSelectParty,
  onPartyNameChange,
}) => {
  const { t } = useApp();

  return (
    <div className="card-premium relative z-20 flex flex-col gap-4 p-5">
      {/* Current Party Status Display */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="i-lucide-users text-indigo-500 text-xl" />
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            {t('partySimulator.editingParty')}
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
            {partyName || t('defaultPartyName')}
          </span>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
            {t('partySimulator.savedPartiesCount', {
              count: parties.length,
            })}
          </span>
        </div>
      </div>

      {/* Party Search and Rename Autocomplete */}
      <div className="w-full">
        <Autocomplete
          id="party-name-autocomplete"
          label={t('partySimulator.searchRenameParty')}
          value={partyName}
          suggestions={parties.map((p) => p.name)}
          onChange={(val) => {
            const matched = parties.find((p) => p.name === val);
            if (matched) {
              onSelectParty(matched.id);
            } else {
              onPartyNameChange(val);
            }
          }}
          placeholder={t('defaultPartyName')}
          className="h-10 py-2 text-sm font-semibold"
        />
      </div>
    </div>
  );
};
