import type React from 'react';
import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedReg, setSelectedReg] = useState<string>('all');

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

  // Pre-calculate stats and rank them
  const rankingList: RankingItem[] = pokemonData
    .map((poke) => {
      if (searchTarget === 'damage') {
        const dmgInfo = calculateMaxDamage(poke, movesData);
        return {
          pokemon: poke,
          value: dmgInfo.value,
          moveName: dmgInfo.moveName,
          category: dmgInfo.category,
        };
      }

      const durInfo = calculateMaxDurability(poke);
      return {
        pokemon: poke,
        value: searchTarget === 'physical' ? durInfo.physical : durInfo.special,
      };
    })
    // 1. Filter by regulation
    .filter(
      (item) =>
        selectedReg === 'all' || item.pokemon.regulations.includes(selectedReg)
    )
    // 2. Filter by type
    .filter(
      (item) =>
        selectedType === 'all' || item.pokemon.types.includes(selectedType)
    )
    // 3. Filter by category (for damage search)
    .filter((item) => {
      if (searchTarget !== 'damage' || selectedCategory === 'all') return true;
      return item.category === selectedCategory;
    })
    // 4. Sort descending
    .sort((a, b) => b.value - a.value)
    // 5. Slice Top 30 and map rank
    .slice(0, 30)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <div className="card-premium grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
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
            <option value="M-A">Regulation M-A</option>
            <option value="M-B">Regulation M-B</option>
          </select>
        </div>
      </div>

      {/* Rankings List */}
      <div className="card-premium overflow-hidden p-0 border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6 w-16 text-center">{t('rank')}</th>
                <th className="py-4 px-6">{t('pokemon')}</th>
                <th className="py-4 px-6">{t('type')}</th>
                {searchTarget === 'damage' && (
                  <th className="py-4 px-6">{t('move')}</th>
                )}
                <th className="py-4 px-6 text-right pr-8">{t('value')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {rankingList.map((item) => (
                <tr
                  key={item.pokemon.id}
                  className="hover:bg-slate-100/30 dark:hover:bg-slate-900/20 transition-colors duration-150"
                >
                  {/* Rank */}
                  <td className="py-4 px-6 text-center font-bold text-slate-600 dark:text-slate-400">
                    {item.rank === 1 && (
                      <span className="i-lucide-trophy text-yellow-500 text-lg" />
                    )}
                    {item.rank === 2 && (
                      <span className="i-lucide-trophy text-slate-400 text-lg" />
                    )}
                    {item.rank === 3 && (
                      <span className="i-lucide-trophy text-amber-600 text-lg" />
                    )}
                    {item.rank > 3 && item.rank}
                  </td>

                  {/* Pokémon Name */}
                  <td className="py-4 px-6 font-semibold text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-2.5">
                      {/* Placeholder icon box */}
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <span className="i-lucide-swords text-xs text-indigo-500" />
                      </div>
                      <div>
                        <div>{item.pokemon.name[language]}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          #{item.pokemon.id.toString().padStart(4, '0')}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Pokémon Types */}
                  <td className="py-4 px-6">
                    <div className="flex gap-1.5">
                      {item.pokemon.types.map((typeKey) => (
                        <span
                          key={typeKey}
                          className={`px-2 py-0.5 text-xs rounded-md font-medium tracking-wide ${
                            typeColors[typeKey] || 'bg-slate-500 text-white'
                          }`}
                        >
                          {typeTranslations[typeKey]?.[language] || typeKey}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Best Move (Only for Max Damage) */}
                  {searchTarget === 'damage' && (
                    <td className="py-4 px-6">
                      {item.moveName ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.category === 'physical'
                                ? 'bg-orange-500'
                                : 'bg-purple-500'
                            }`}
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {item.moveName[language]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  )}

                  {/* Value */}
                  <td className="py-4 px-6 text-right pr-8 font-bold text-lg text-indigo-600 dark:text-indigo-400 font-mono">
                    {item.value.toLocaleString()}
                  </td>
                </tr>
              ))}

              {rankingList.length === 0 && (
                <tr>
                  <td
                    colSpan={searchTarget === 'damage' ? 5 : 4}
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
    </div>
  );
};
