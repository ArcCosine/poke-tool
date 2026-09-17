import type React from 'react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { Checkbox } from '../common/Checkbox';
import { Input } from '../common/Input';
import { Select } from '../common/Select';

export interface PartySearchProps {
  partyName: string;
  parties: { id: string; name: string }[];
  onSelectParty: (id: string) => void;
  onPartyNameChange: (name: string) => void;
  isPublic?: boolean;
  rentalCode?: string;
  articleUrl?: string;
  description?: string;
  onMetaChange?: (fields: {
    isPublic?: boolean;
    rentalCode?: string;
    articleUrl?: string;
    description?: string;
  }) => void;
}

export const PartySearch: React.FC<PartySearchProps> = ({
  partyName,
  parties,
  onSelectParty,
  onPartyNameChange,
  isPublic = false,
  rentalCode = '',
  articleUrl = '',
  description = '',
  onMetaChange,
}) => {
  const { t } = useApp();
  const [isMetaOpen, setIsMetaOpen] = useState(false);

  const currentMatchedParty = parties.find((p) => p.name === partyName);

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
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
            {t('partySimulator.savedPartiesCount', {
              count: parties.length,
            })}
          </span>
          <Button
            data-testid="toggle-party-meta"
            variant="secondary"
            className="h-8 px-2.5 py-1 text-xs"
            onClick={() => setIsMetaOpen(!isMetaOpen)}
          >
            <span
              className={`mr-1 ${
                isMetaOpen ? 'i-lucide-chevron-up' : 'i-lucide-settings-2'
              }`}
            />
            {isMetaOpen ? t('close') : t('partyShare.isPublic')}
          </Button>
        </div>
      </div>

      {/* Party Name Input & Saved Party Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-7 lg:col-span-8">
          <Input
            id="party-name-input"
            label={t('partySimulator.partyName')}
            value={partyName}
            onChange={(e) => onPartyNameChange(e.target.value)}
            placeholder={t('partySimulator.partyNamePlaceholder')}
            className="h-10 py-2 text-sm font-semibold w-full"
          />
        </div>
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

      {/* Expanded Meta Settings (Public Sharing, Rental Code, Article URL, Description) */}
      {isMetaOpen && (
        <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Checkbox
              id="party-is-public"
              checked={isPublic}
              onChange={(e) => onMetaChange?.({ isPublic: e.target.checked })}
              label={t('partyShare.isPublic')}
            />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              ({t('partyShare.isPublicHelp')})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="party-rental-code"
              label={t('partyShare.rentalCode')}
              value={rentalCode}
              onChange={(e) => onMetaChange?.({ rentalCode: e.target.value })}
              placeholder={t('partyShare.rentalCodePlaceholder')}
              className="h-9 text-xs"
            />
            <Input
              id="party-article-url"
              label={t('partyShare.articleUrl')}
              value={articleUrl}
              onChange={(e) => onMetaChange?.({ articleUrl: e.target.value })}
              placeholder={t('partyShare.articleUrlPlaceholder')}
              className="h-9 text-xs"
            />
          </div>

          <Input
            id="party-description"
            label={t('partyShare.description')}
            value={description}
            onChange={(e) => onMetaChange?.({ description: e.target.value })}
            placeholder={t('partyShare.descriptionPlaceholder')}
            className="h-9 text-xs"
          />
        </div>
      )}
    </div>
  );
};
