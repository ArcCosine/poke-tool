import type React from 'react';
import { useApp } from '../../context/AppContext';
import { Input } from '../common/Input';
import { Select } from '../common/Select';

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

  const currentMatchedParty = parties.find((p) => p.name === partyName);

  return (
    <div className="card-premium relative z-20 p-4 sm:p-5">
      {/* 
        Responsive layout:
        - Mobile: vertical stack (party name input on top, saved party select below)
        - PC (md+): horizontal layout (party name input on the left, saved party select on the right)
      */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Unified Editing Party Name Field */}
        <div className="md:col-span-7 lg:col-span-8">
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="party-name-input"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
            >
              <span className="i-lucide-edit-3 text-indigo-500 text-sm" />
              <span>{t('partySimulator.partyName')}</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/50">
                {t('partySimulator.editingParty')}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {t('partySimulator.savedPartiesCount', {
                  count: parties.length,
                })}
              </span>
            </div>
          </div>
          <Input
            id="party-name-input"
            value={partyName}
            onChange={(e) => onPartyNameChange(e.target.value)}
            placeholder={t('partySimulator.partyNamePlaceholder')}
            className="h-10 py-2 text-sm font-semibold w-full"
          />
        </div>

        {/* Saved Party Selector Dropdown */}
        <div className="md:col-span-5 lg:col-span-4">
          <Select
            id="saved-party-select"
            label={t('partySimulator.selectSavedParty')}
            value={currentMatchedParty ? currentMatchedParty.id : ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val) onSelectParty(val);
            }}
            className="h-10 py-2 text-sm font-semibold w-full"
          >
            <option value="">
              -- {t('partySimulator.selectSavedParty')} --
            </option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
};
