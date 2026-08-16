import type React from 'react';
import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import regulationsData from '../../data/regulations.json';
import {
  calculateMaxDamage,
  calculateMaxDurability,
} from '../../utils/calculator';
import { db, type MoveMaster, type PokemonMaster } from '../../utils/db';

const typeColors: Record<string, string> = {
  normal: 'bg-slate-400 text-slate-900',
  fire: 'bg-red-500 text-white',
  water: 'bg-blue-500 text-white',
  grass: 'bg-green-500 text-white',
  electric: 'bg-yellow-400 text-slate-900',
  ice: 'bg-cyan-400 text-slate-900',
  fighting: 'bg-amber-700 text-white',
  poison: 'bg-purple-500 text-white',
  ground: 'bg-amber-600 text-white',
  flying: 'bg-indigo-300 text-slate-900',
  psychic: 'bg-pink-500 text-white',
  bug: 'bg-lime-500 text-slate-900',
  rock: 'bg-yellow-600 text-white',
  ghost: 'bg-violet-700 text-white',
  dragon: 'bg-indigo-600 text-white',
  dark: 'bg-slate-800 text-white',
  steel: 'bg-zinc-500 text-white',
  fairy: 'bg-rose-400 text-slate-900',
};

const typeTranslations: Record<string, { ja: string; en: string }> = {
  normal: { ja: 'ノーマル', en: 'Normal' },
  fire: { ja: 'ほのお', en: 'Fire' },
  water: { ja: 'みず', en: 'Water' },
  grass: { ja: 'くさ', en: 'Grass' },
  electric: { ja: 'でんき', en: 'Electric' },
  ice: { ja: 'こおり', en: 'Ice' },
  fighting: { ja: 'かくとう', en: 'Fighting' },
  poison: { ja: 'どく', en: 'Poison' },
  ground: { ja: 'じめん', en: 'Ground' },
  flying: { ja: 'ひこう', en: 'Flying' },
  psychic: { ja: 'エスパー', en: 'Psychic' },
  bug: { ja: 'むし', en: 'Bug' },
  rock: { ja: 'いわ', en: 'Rock' },
  ghost: { ja: 'ゴースト', en: 'Ghost' },
  dragon: { ja: 'ドラゴン', en: 'Dragon' },
  dark: { ja: 'あく', en: 'Dark' },
  steel: { ja: 'はがね', en: 'Steel' },
  fairy: { ja: 'フェアリー', en: 'Fairy' },
};

interface RankingItem {
  rank: number;
  pokemon: PokemonMaster;
  value: number;
  moveName?: { ja: string; en: string };
  category?: string;
  moveType?: string;
  abilityName?: { ja: string; en: string };
}

export const StatSearch: React.FC = () => {
  const { language, t } = useApp();
  const [loading, setLoading] = useState(true);
  const [pokemonData, setPokemonData] = useState<PokemonMaster[]>([]);
  const [movesData, setMovesData] = useState<MoveMaster[]>([]);

  // Filters State
  const [searchTarget, setSearchTarget] = useState<
    'damage' | 'physical' | 'special'
  >('damage');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMoveType, setSelectedMoveType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedReg, setSelectedReg] = useState<string>('all');
  const [excludeMega, setExcludeMega] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load master data on mount
  useEffect(() => {
    db.loadMasterData()
      .then((data) => {
        setPokemonData(data.pokemon);
        setMovesData(data.moves);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500">
        <span className="i-lucide-loader-2 animate-spin text-3xl mr-2" />
        {t('loading')}
      </div>
    );
  }

  // 1. Calculate and flatten all pokemon and moves
  const flatList: Omit<RankingItem, 'rank'>[] = [];

  pokemonData.forEach((poke) => {
    if (searchTarget === 'damage') {
      const dmgMoves = calculateMaxDamage(poke, movesData);
      if (dmgMoves.length > 0) {
        dmgMoves.forEach((move) => {
          flatList.push({
            pokemon: poke,
            value: move.value,
            moveName: move.moveName,
            category: move.category,
            moveType: move.moveType,
            abilityName: move.abilityName,
          });
        });
      } else {
        // Fallback for mock test data that has no learnable moves defined
        flatList.push({
          pokemon: poke,
          value: 0,
          moveName: { ja: 'なし', en: 'None' },
          category: 'status',
          moveType: 'normal',
          abilityName: { ja: 'なし', en: 'None' },
        });
      }
    } else {
      const durInfo = calculateMaxDurability(poke);
      flatList.push({
        pokemon: poke,
        value: searchTarget === 'physical' ? durInfo.physical : durInfo.special,
        abilityName:
          searchTarget === 'physical'
            ? durInfo.physicalAbility
            : durInfo.specialAbility,
      });
    }
  });

  // 2. Filter, sort, and slice to top 300
  const rankingList: RankingItem[] = flatList
    // (A) Filter by regulation
    .filter(
      (item) =>
        selectedReg === 'all' || item.pokemon.regulations.includes(selectedReg)
    )
    // (B) Filter by pokemon type
    .filter(
      (item) =>
        selectedType === 'all' || item.pokemon.types.includes(selectedType)
    )
    // (B-2) Filter Mega Pokémon
    .filter(
      (item) =>
        !excludeMega || !item.pokemon.name.en.startsWith('Mega ')
    )
    // (C) Filter by move type (for damage search)
    .filter((item) => {
      if (searchTarget !== 'damage' || selectedMoveType === 'all') return true;
      return item.moveType === selectedMoveType;
    })
    // (D) Filter by category (for damage search)
    .filter((item) => {
      if (searchTarget !== 'damage' || selectedCategory === 'all') return true;
      return item.category === selectedCategory;
    })
    // (E) Sort depending on sortOrder
    .sort((a, b) =>
      sortOrder === 'desc' ? b.value - a.value : a.value - b.value
    )
    // (F) Slice Top 300 and map rank
    .slice(0, 300)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <div className="card-premium grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-5">
        {/* Search Target */}
        <div>
          <label
            htmlFor="search-target"
            className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider"
          >
            {t('searchType')}
          </label>
          <select
            id="search-target"
            value={searchTarget}
            onChange={(e) =>
              setSearchTarget(
                e.target.value as 'damage' | 'physical' | 'special'
              )
            }
            className="input-premium py-2 cursor-pointer text-sm"
          >
            <option value="damage">{t('damage')}</option>
            <option value="physical">{t('phyDef')}</option>
            <option value="special">{t('speDef')}</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label
            htmlFor="type-filter"
            className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider"
          >
            {t('type')}
          </label>
          <select
            id="type-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input-premium py-2 cursor-pointer text-sm"
          >
            <option value="all">{t('allTypes')}</option>
            {Object.keys(typeTranslations).map((tKey) => (
              <option key={tKey} value={tKey}>
                {typeTranslations[tKey][language]}
              </option>
            ))}
          </select>
        </div>

        {/* Move Type Filter */}
        <div>
          <label
            htmlFor="move-type-filter"
            className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider"
          >
            {t('moveType')}
          </label>
          <select
            id="move-type-filter"
            value={selectedMoveType}
            disabled={searchTarget !== 'damage'}
            onChange={(e) => setSelectedMoveType(e.target.value)}
            className="input-premium py-2 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">{t('allMoveTypes')}</option>
            {Object.keys(typeTranslations).map((tKey) => (
              <option key={tKey} value={tKey}>
                {typeTranslations[tKey][language]}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter (Disabled for durability) */}
        <div>
          <label
            htmlFor="category-filter"
            className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider"
          >
            {t('category')}
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            disabled={searchTarget !== 'damage'}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-premium py-2 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">{t('allCategories')}</option>
            <option value="physical">{t('physical')}</option>
            <option value="special">{t('special')}</option>
          </select>
        </div>

        {/* Regulation Filter */}
        <div>
          <label
            htmlFor="reg-filter"
            className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider"
          >
            {t('regulation')}
          </label>
          <select
            id="reg-filter"
            value={selectedReg}
            onChange={(e) => setSelectedReg(e.target.value)}
            className="input-premium py-2 cursor-pointer text-sm"
          >
            <option value="all">{t('allRegulations')}</option>
            {regulationsData.map((reg) => (
              <option key={reg.id} value={reg.id}>
                {reg.name[language] || reg.name.ja}
              </option>
            ))}
          </select>
        </div>
        {/* Exclude Mega Checkbox */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-5 flex items-center gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 mt-1 text-slate-700 dark:text-slate-300">
          <input
            id="exclude-mega"
            type="checkbox"
            checked={excludeMega}
            onChange={(e) => setExcludeMega(e.target.checked)}
            className="w-4 h-4 text-indigo-650 bg-slate-900 border-slate-700 rounded focus:ring-indigo-500 cursor-pointer"
          />
          <label
            htmlFor="exclude-mega"
            className="text-sm font-semibold select-none cursor-pointer"
          >
            {t('excludeMega')}
          </label>
        </div>
      </div>

      {/* Rankings List */}
      <div className="card-premium overflow-hidden p-0 border-x-0 sm:border border-slate-200 dark:border-slate-800 -mx-6 sm:mx-0 rounded-none sm:rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-1 sm:py-4 sm:px-6 w-8 sm:w-16 text-center">{t('rank')}</th>
                <th className="py-3 px-2 sm:py-4 sm:px-6">{t('pokemon')}</th>
                <th className="py-3 px-2 sm:py-4 sm:px-6 hidden md:table-cell">{t('ability')}</th>
                {searchTarget === 'damage' && (
                  <th className="py-3 px-2 sm:py-4 sm:px-6">{t('move')}</th>
                )}
                <th className="py-3 px-2 sm:py-4 sm:px-6 text-right pr-4 sm:pr-8">
                  <button
                    onClick={() =>
                      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                    }
                    className="appearance-none bg-transparent border-none p-0 focus:outline-none focus:ring-0 focus-visible:outline-none select-none text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider ml-auto inline-flex items-center gap-1 cursor-default"
                  >
                    {t('value')}
                    {sortOrder === 'desc' ? (
                      <span className="i-lucide-arrow-down text-slate-400/60 dark:text-slate-500/60 text-sm w-4 h-4" />
                    ) : (
                      <span className="i-lucide-arrow-up text-slate-400/60 dark:text-slate-500/60 text-sm w-4 h-4" />
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {rankingList.map((item) => (
                <tr
                  key={
                    searchTarget === 'damage'
                      ? `${item.pokemon.id}-${item.moveName?.en || ''}`
                      : `${item.pokemon.id}`
                  }
                  className="hover:bg-slate-100/30 dark:hover:bg-slate-900/20 transition-colors duration-150"
                >
                  {/* Rank */}
                  <td className="py-3 px-1 sm:py-4 sm:px-6 text-center font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                    {item.rank === 1 && (
                      <span className="i-lucide-trophy text-yellow-500 text-base sm:text-lg" />
                    )}
                    {item.rank === 2 && (
                      <span className="i-lucide-trophy text-slate-400 text-base sm:text-lg" />
                    )}
                    {item.rank === 3 && (
                      <span className="i-lucide-trophy text-amber-600 text-base sm:text-lg" />
                    )}
                    {item.rank > 3 && item.rank}
                  </td>

                  {/* Pokémon Name */}
                  <td className="py-3 px-2 sm:py-4 sm:px-6 font-semibold text-slate-900 dark:text-slate-100">
                    <div className="flex items-center sm:items-start gap-1.5 sm:gap-2.5">
                      {/* Pokémon Sprite Image */}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-slate-100/50 dark:bg-slate-900/30 flex items-center justify-center border border-slate-200/10 dark:border-slate-850/10 shrink-0 overflow-hidden">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemon.id}.png`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          alt=""
                          className="w-full h-full object-contain select-none"
                          loading="lazy"
                        />
                      </div>

                      <div className="min-w-0">
                        {/* Line 1: Pokemon Name */}
                        <div className="truncate text-xs sm:text-sm">{item.pokemon.name[language]}</div>
                        
                        {/* Pokemon Types (Shown on all screens, directly under name) */}
                        <div className="flex gap-1 mt-0.5 sm:mt-1">
                          {item.pokemon.types.map((typeKey) => (
                            <span
                              key={typeKey}
                              className={`px-1.5 py-0.5 text-[8px] sm:text-xs rounded-md font-medium tracking-wide ${
                                typeColors[typeKey] || 'bg-slate-500 text-white'
                              }`}
                            >
                              {typeTranslations[typeKey]?.[language] || typeKey}
                            </span>
                          ))}
                        </div>

                        {/* Mobile & Tablet-only details: Ability (hidden on desktop md:hidden) */}
                        <div className="flex md:hidden mt-0.5 sm:mt-1">
                          <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md tracking-wide w-fit">
                            {item.abilityName ? item.abilityName[language] : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Pokémon Ability */}
                  <td className="py-3 px-2 sm:py-4 sm:px-6 text-slate-600 dark:text-slate-400 font-medium hidden md:table-cell">
                    {item.abilityName ? item.abilityName[language] : '-'}
                  </td>

                  {/* Best Move (Only for Max Damage) */}
                  {searchTarget === 'damage' && (
                    <td className="py-3 px-2 sm:py-4 sm:px-6">
                      {item.moveName ? (
                        <div className="flex items-start sm:items-center gap-1.5">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
                            {/* Move Name */}
                            <span className="font-medium text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                              {item.moveName[language].split('\n').map((line, i) => (
                                <span key={i}>
                                  {i > 0 && <br />}
                                  {line}
                                </span>
                              ))}
                            </span>

                            {/* Move Type */}
                            {item.moveType && (
                              <span
                                className={`px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-[8px] sm:text-xs rounded-md font-medium tracking-wide w-fit ${
                                  typeColors[item.moveType] || 'bg-slate-500 text-white'
                                }`}
                              >
                                {typeTranslations[item.moveType]?.[language] || item.moveType}
                              </span>
                            )}

                            {/* Classification */}
                            <span className="text-[10px] sm:text-xs text-slate-400">
                              (
                              {item.category === 'physical'
                                ? t('physical')
                                : t('special')}
                              )
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  )}

                  {/* Value */}
                  <td className="py-3 px-2 sm:py-4 sm:px-6 text-right pr-4 sm:pr-8 font-bold text-sm sm:text-base md:text-lg text-indigo-600 dark:text-indigo-400 font-mono">
                    {item.value.toLocaleString()}
                  </td>
                </tr>
              ))}

              {rankingList.length === 0 && (
                <tr>
                  <td
                    colSpan={searchTarget === 'damage' ? 6 : 5}
                    className="py-12 text-center text-slate-500"
                  >
                    No Pokémon match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer under the Rankings List */}
      <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-4 leading-relaxed max-w-2xl mx-auto px-4 select-none">
        {language === 'ja'
          ? '本ツールはファンによる非公式の対戦データ分析支援ツールです。使用されているポケモンの画像（ドット絵）の著作権は、任天堂株式会社、株式会社ゲームフリーク、株式会社クリーチャーズ、および株式会社ポケモンに帰属します。画像データは PokeAPI より動的に取得しています。'
          : 'This tool is an unofficial fan-made battle data analysis helper. All Pokémon images (sprites) used are copyright of Nintendo, Game Freak, Creatures, and The Pokémon Company. Image assets are retrieved dynamically from PokeAPI.'}
      </div>
    </div>
  );
};
