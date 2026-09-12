import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { PokemonMaster } from '../../utils/db';
import { normalizeSearchText } from '../../utils/string';
import { TypeBadge } from '../common/TypeBadge';

interface PokemonSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (pokemonId: number) => void;
  pokemonData: PokemonMaster[];
  autoAdvance: boolean;
  onToggleAutoAdvance: (val: boolean) => void;
}

export const PokemonSearchModal: React.FC<PokemonSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  pokemonData,
  autoAdvance,
  onToggleAutoAdvance,
}) => {
  const { language, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter logic: supports Romaji, Katakana, Hiragana, English, and ignoring vowel-dash
  const queryKatakana = normalizeSearchText(searchQuery);
  const queryClean = queryKatakana.replace(/ー/g, '');
  const queryLower = searchQuery.toLowerCase().trim();

  const filteredPokemon = pokemonData.filter((poke) => {
    if (!queryLower) return true;

    // 1. English name match
    const enName = (poke.name.en || '').toLowerCase();
    if (enName.includes(queryLower)) return true;

    // 2. Japanese name match
    const jaName = poke.name.ja || '';
    const jaClean = jaName.replace(/ー/g, '');

    if (jaName.includes(queryKatakana) || jaClean.includes(queryClean)) {
      return true;
    }

    // 3. Korean name match
    if (poke.name.ko && poke.name.ko.toLowerCase().includes(queryLower)) {
      return true;
    }

    // 4. Traditional Chinese name match
    if (
      poke.name['zh-Hant'] &&
      poke.name['zh-Hant'].toLowerCase().includes(queryLower)
    ) {
      return true;
    }

    // 5. Simplified Chinese name match
    if (
      poke.name['zh-Hans'] &&
      poke.name['zh-Hans'].toLowerCase().includes(queryLower)
    ) {
      return true;
    }

    return false;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="card-premium w-full max-w-lg p-6 space-y-4 max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="i-lucide-search text-indigo-500" />
            {t('pokemonSearchModal.title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            aria-label={t('pokemonSearchModal.close')}
          >
            <span className="i-lucide-x text-lg" />
          </button>
        </div>

        {/* Search Input & Auto Advance Control */}
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-300 i-lucide-search text-base" />
            <input
              ref={inputRef}
              type="text"
              placeholder={t('pokemonSearchModal.searchPlaceholder')}
              className="input-premium pl-9 py-2 px-3 text-sm w-full font-medium box-border placeholder:text-slate-400 dark:placeholder:text-slate-400 text-slate-800 dark:text-slate-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => onToggleAutoAdvance(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-transparent"
            />
            <span>{t('pokemonSearchModal.autoAdvanceLabel')}</span>
          </label>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-2">
          {filteredPokemon.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-300 font-medium">
              {t('pokemonSearchModal.noResults')}
            </div>
          ) : (
            filteredPokemon.map((poke) => (
              <button
                key={poke.id}
                type="button"
                onClick={() => onSelect(poke.id)}
                className="w-full text-left p-3 flex items-center justify-between transition-all duration-150 rounded-xl cursor-pointer bg-slate-50 hover:bg-indigo-50/70 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-500/60 shadow-xs hover:shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 p-1 shadow-xs">
                    <img
                      src={`/assets/pokemon-sprites/${poke.id}.png`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      alt={poke.name[language] || poke.name.ja}
                      className="w-10 h-10 object-contain shrink-0"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {poke.name[language] || poke.name.ja}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
                      {poke.abilities
                        .map((a) => a[language] || a.ja)
                        .join(' / ')}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 shrink-0 ml-2">
                  {poke.types.map((typeKey) => (
                    <TypeBadge key={typeKey} typeKey={typeKey} />
                  ))}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
