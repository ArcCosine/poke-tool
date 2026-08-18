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
  const { language } = useApp();
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
    const enName = poke.name.en.toLowerCase();
    if (enName.includes(queryLower)) return true;

    // 2. Japanese name match
    const jaName = poke.name.ja;
    const jaClean = jaName.replace(/ー/g, '');

    if (jaName.includes(queryKatakana) || jaClean.includes(queryClean)) {
      return true;
    }

    return false;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        className="card-premium w-full max-w-lg max-h-[80vh] flex flex-col p-5 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            {language === 'ja' ? 'ポケモンを選択' : 'Select Pokémon'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            aria-label={language === 'ja' ? '閉じる' : 'Close'}
          >
            <span className="i-lucide-x text-lg" />
          </button>
        </div>

        {/* Search Input & Auto Advance Control */}
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 i-lucide-search text-base" />
            <input
              ref={inputRef}
              type="text"
              placeholder={
                language === 'ja'
                  ? '名前、ひらがな、カタカナ、ローマ字で検索...'
                  : 'Search by name, kana, romaji...'
              }
              className="input-premium pl-9 py-2 px-3 text-sm w-full font-medium box-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => onToggleAutoAdvance(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-transparent"
            />
            <span>
              {language === 'ja'
                ? '連続入力（ポケモン → 特性・わざ）を有効にする'
                : 'Enable auto-advance (Pokémon → Ability/Moves)'}
            </span>
          </label>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/50">
          {filteredPokemon.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              {language === 'ja'
                ? 'ポケモンが見つかりません。'
                : 'No Pokémon found.'}
            </div>
          ) : (
            filteredPokemon.map((poke) => (
              <button
                key={poke.id}
                type="button"
                onClick={() => onSelect(poke.id)}
                className="w-full text-left py-3.5 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 flex items-center justify-between transition duration-150 rounded-none cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={`/assets/pokemon-sprites/${poke.id}.png`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    alt={poke.name[language]}
                    className="w-10 h-10 object-contain shrink-0"
                    loading="lazy"
                  />
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {poke.name[language]}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {poke.abilities.map((a) => a[language]).join(' / ')}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5">
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
