import type React from 'react';
import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  db,
  type ItemMaster,
  type MoveMaster,
  type PokemonMaster,
} from '../../utils/db';
import type { PokemonInstance } from '../../utils/party';
import { getCalculatedStat, NATURES, stepToEv } from '../../utils/party';
import { megaStoneMap, typeTranslations } from '../../utils/pokemon';
import { Autocomplete } from '../common/Autocomplete';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { TypeBadge } from '../common/TypeBadge';
import { PokemonSearchModal } from '../PartySimulator/PokemonSearchModal';

interface EvCalculatorProps {
  onImportComplete?: () => void;
}

type StatKey =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'sp_attack'
  | 'sp_defense'
  | 'speed';

const STAT_KEYS: StatKey[] = [
  'hp',
  'attack',
  'defense',
  'sp_attack',
  'sp_defense',
  'speed',
];

export const EvCalculator: React.FC<EvCalculatorProps> = ({
  onImportComplete,
}) => {
  const {
    language,
    t,
    addPokemonToPartyDirectly,
    replacePokemonInParty,
    pendingPokemonToAdd,
    setPendingPokemonToAdd,
    partyMembers,
    createNewParty,
    parties,
  } = useApp();
  const [loading, setLoading] = useState(true);
  const [pokemonData, setPokemonData] = useState<PokemonMaster[]>([]);
  const [movesData, setMovesData] = useState<MoveMaster[]>([]);
  const [itemsData, setItemsData] = useState<ItemMaster[]>([]);

  // Selection state
  const [selectedPoke, setSelectedPoke] = useState<PokemonMaster | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPartySelectOpen, setIsPartySelectOpen] = useState(false);
  const [pendingInstanceToAdd, setPendingInstanceToAdd] =
    useState<PokemonInstance | null>(null);

  // Pokemon configurations
  const [nature, setNature] = useState('neutral');
  const [ability, setAbility] = useState('');
  const [item, setItem] = useState('');
  const [moves, setMoves] = useState<number[]>([0, 0, 0, 0]);
  const [evs, setEvs] = useState<Record<StatKey, number>>({
    hp: 0,
    attack: 0,
    defense: 0,
    sp_attack: 0,
    sp_defense: 0,
    speed: 0,
  });

  const totalEv = Object.values(evs).reduce((a, b) => a + b, 0);

  // Load master data
  useEffect(() => {
    db.loadMasterData()
      .then((data) => {
        setPokemonData(data.pokemon);
        setMovesData(data.moves);
        setItemsData(data.items);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectPokemon = (masterId: number) => {
    const poke = pokemonData.find((p) => p.id === masterId);
    if (!poke) return;
    setSelectedPoke(poke);
    setAbility(poke.abilities[0]?.ja || '');
    setNature('neutral');

    // Auto-fill mega stone if applicable
    let initialItem = '';
    if (poke.name.ja.startsWith('メガ') && poke.name.ja !== 'メガレックウザ') {
      const mapped = megaStoneMap[poke.name.ja];
      if (mapped) {
        initialItem = language === 'ja' ? mapped.ja : mapped.en;
      } else {
        initialItem = `${poke.name.ja.replace('メガ', '')}ナイト`;
      }
    }
    setItem(initialItem);
    setMoves([0, 0, 0, 0]);
    setEvs({
      hp: 0,
      attack: 0,
      defense: 0,
      sp_attack: 0,
      sp_defense: 0,
      speed: 0,
    });
    setIsSearchOpen(false);
  };

  const handleEvChange = (stat: StatKey, stepVal: number) => {
    const cleanStep = Math.max(0, Math.min(32, stepVal));
    setEvs((prev) => {
      const otherTotal = Object.entries(prev)
        .filter(([k]) => k !== stat)
        .reduce((sum, [_, v]) => sum + v, 0);

      const allowedMax = Math.min(32, 66 - otherTotal);
      return {
        ...prev,
        [stat]: Math.min(cleanStep, allowedMax),
      };
    });
  };

  const handleAdd = () => {
    if (!selectedPoke) return;

    const instance: PokemonInstance = {
      id: Math.random().toString(36).substring(2, 9),
      masterId: selectedPoke.id,
      ability,
      nature,
      item,
      moves,
      evs: {
        hp: stepToEv(evs.hp),
        attack: stepToEv(evs.attack),
        defense: stepToEv(evs.defense),
        sp_attack: stepToEv(evs.sp_attack),
        sp_defense: stepToEv(evs.sp_defense),
        speed: stepToEv(evs.speed),
      },
    };

    if (parties.length > 0) {
      setPendingInstanceToAdd(instance);
      setIsPartySelectOpen(true);
    } else {
      const createdId = createNewParty(
        language === 'ja' ? 'マイパーティ' : 'My Party',
        []
      );
      addPokemonToPartyDirectly(instance, createdId);
      if (onImportComplete) onImportComplete();
    }
  };

  const handleConfirmAddParty = (targetPartyId: string) => {
    if (!pendingInstanceToAdd) return;
    addPokemonToPartyDirectly(pendingInstanceToAdd, targetPartyId);
    setIsPartySelectOpen(false);
    setPendingInstanceToAdd(null);
    if (onImportComplete) onImportComplete();
  };

  const handleReplaceSlot = (index: number) => {
    if (pendingPokemonToAdd) {
      replacePokemonInParty(index, pendingPokemonToAdd);
      if (onImportComplete) onImportComplete();
    }
  };

  const handleCreateNewPartyWithPending = () => {
    if (pendingPokemonToAdd) {
      createNewParty(
        language === 'ja'
          ? `${pendingPokemonToAdd.id}入りパーティ`
          : `Party with ${pendingPokemonToAdd.id}`,
        [pendingPokemonToAdd]
      );
      setPendingPokemonToAdd(null);
      if (onImportComplete) onImportComplete();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500">
        <span className="i-lucide-loader-2 animate-spin text-3xl mr-2" />
        {t('loading')}
      </div>
    );
  }

  // Find learnable moves
  const learnableMoves = selectedPoke
    ? movesData.filter((m) => selectedPoke.learnable_moves.includes(m.id))
    : [];

  const getNatureMultiplier = (stat: StatKey): number => {
    const nat = NATURES.find((n) => n.id === nature);
    if (!nat) return 1.0;
    if (nat.plus === stat) return 1.1;
    if (nat.minus === stat) return 0.9;
    return 1.0;
  };

  const getNatureColorClass = (stat: StatKey): string => {
    const mult = getNatureMultiplier(stat);
    if (mult > 1.0) return 'text-red-500 font-bold';
    if (mult < 1.0) return 'text-blue-500 font-bold';
    return 'text-slate-600 dark:text-slate-400';
  };

  const getNatureSymbol = (stat: StatKey): string => {
    const mult = getNatureMultiplier(stat);
    if (mult > 1.0) return '▲';
    if (mult < 1.0) return '▼';
    return '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
            <span className="i-lucide-calculator text-indigo-500" />
            {language === 'ja' ? '努力値計算ツール' : 'EV Calculator'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'ja'
              ? '努力値と性格を調整し、レベル50時の実数値を計算します。'
              : 'Adjust EVs and natures to calculate Level 50 stats.'}
          </p>
        </div>
        {selectedPoke ? (
          <Button
            onClick={handleAdd}
            variant="primary"
            icon="i-lucide-plus"
            className="shadow-md shadow-indigo-500/20"
          >
            {language === 'ja' ? 'パーティに追加' : 'Add to Party'}
          </Button>
        ) : (
          <Button onClick={() => setIsSearchOpen(true)} icon="i-lucide-search">
            {language === 'ja' ? 'ポケモンを選択' : 'Select Pokémon'}
          </Button>
        )}
      </div>

      {selectedPoke ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="card-premium relative z-30 overflow-visible p-5 border-l-4 border-l-indigo-500 dark:border-l-indigo-600 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition duration-200 group flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center"
            title={
              language === 'ja'
                ? 'クリックしてポケモンを変更'
                : 'Click to change Pokémon'
            }
          >
            {/* Left Side: Avatar, Name, Type */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center shrink-0 overflow-hidden shadow-sm relative">
                <img
                  src={`/assets/pokemon-sprites/${selectedPoke.id}.png`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  alt={selectedPoke.name[language]}
                  className="w-14 h-14 object-contain"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                  <span className="i-lucide-refresh-cw text-white text-base animate-spin-slow" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-none flex items-center gap-2">
                  {selectedPoke.name[language]}
                  <span className="i-lucide-refresh-cw text-slate-400 text-xs opacity-0 group-hover:opacity-100 transition duration-200" />
                </h3>
                <div className="flex gap-1.5 mt-2">
                  {selectedPoke.types.map((typeKey) => (
                    <TypeBadge key={typeKey} typeKey={typeKey} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side / Base Settings: Nature, Ability, Item */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:flex-1 lg:max-w-2xl cursor-default"
            >
              {/* Nature Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'ja' ? '性格' : 'Nature'}
                </label>
                <Select
                  value={nature}
                  onChange={(e) => setNature(e.target.value)}
                  className="py-1 text-xs font-semibold"
                >
                  {NATURES.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name[language]}
                      {n.plus
                        ? ` (+${statNameLabel(n.plus)} -${statNameLabel(n.minus!)})`
                        : ''}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Ability Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'ja' ? '特性' : 'Ability'}
                </label>
                <Select
                  value={ability}
                  onChange={(e) => setAbility(e.target.value)}
                  className="py-1 text-xs font-semibold"
                >
                  {selectedPoke.abilities.map((a) => (
                    <option key={a.ja} value={a.ja}>
                      {a[language]}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Item Autocomplete */}
              <div className="space-y-1">
                <Autocomplete
                  id="item-select"
                  label={language === 'ja' ? '持ち物' : 'Item'}
                  value={item}
                  suggestions={itemsData.map((i) => i.name[language])}
                  onChange={(val) => setItem(val)}
                  placeholder={
                    language === 'ja' ? '持ち物を選択...' : 'Search items...'
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Config Column */}
            <div className="lg:col-span-2 card-premium space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="i-lucide-activity text-indigo-500" />
                  {language === 'ja' ? '努力値と実数値' : 'EVs and Stats'}
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">
                    EV Total:{' '}
                    <span
                      className={
                        totalEv > 66
                          ? 'text-red-500'
                          : 'text-indigo-600 dark:text-indigo-400'
                      }
                    >
                      {totalEv}
                    </span>{' '}
                    / 66
                  </span>
                </div>
              </div>

              {/* Stat Row Grid */}
              <div className="space-y-4">
                {STAT_KEYS.map((stat) => {
                  const base = selectedPoke.base_stats[stat];
                  const ev = evs[stat];
                  const calcStat = getCalculatedStat(
                    stat,
                    base,
                    stepToEv(ev),
                    nature
                  );
                  const isHp = stat === 'hp';
                  const natureColor = isHp ? '' : getNatureColorClass(stat);
                  const natureSymbol = isHp ? '' : getNatureSymbol(stat);

                  return (
                    <div
                      key={stat}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center border-b border-slate-100 dark:border-slate-800/50 pb-3 last:border-0 last:pb-0"
                    >
                      {/* Stat Label */}
                      <div className="md:col-span-2">
                        <span className="text-sm font-bold uppercase tracking-wide block">
                          {stat === 'hp' ? 'HP' : t(stat)}
                        </span>
                        <span className="text-xs text-slate-400">
                          Base: {base}
                        </span>
                      </div>

                      {/* Nature multiplier label */}
                      <div className="md:col-span-1 text-center">
                        <span className={`text-xs ${natureColor}`}>
                          {natureSymbol}
                        </span>
                      </div>

                      {/* EV Slider & Inputs */}
                      <div className="md:col-span-7 flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="32"
                          step="1"
                          value={ev}
                          onChange={(e) =>
                            handleEvChange(stat, parseInt(e.target.value))
                          }
                          className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
                        />
                        <input
                          type="number"
                          min="0"
                          max="32"
                          value={ev}
                          onChange={(e) =>
                            handleEvChange(stat, parseInt(e.target.value) || 0)
                          }
                          className="w-16 text-center px-1.5 py-1 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleEvChange(stat, 0)}
                            className="px-1 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                          >
                            0
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEvChange(stat, 32)}
                            className="px-1 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                          >
                            32
                          </button>
                        </div>
                      </div>

                      {/* Final Stat Output */}
                      <div className="md:col-span-2 text-right">
                        <span
                          className={`text-lg font-extrabold ${natureColor}`}
                        >
                          {calcStat}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details Column */}
            <div className="space-y-6">
              {/* Moves Selector */}
              <div className="card-premium space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="i-lucide-swords text-indigo-500" />
                  {language === 'ja' ? '技構成' : 'Moves'}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {[0, 1, 2, 3].map((idx) => {
                    const moveId = moves[idx] || 0;
                    const currentMove = learnableMoves.find(
                      (m) => m.id === moveId
                    );
                    const currentMoveText = currentMove
                      ? `${currentMove.name[language]} (${typeTranslations[currentMove.type]?.[language] || currentMove.type})`
                      : '';

                    return (
                      <Autocomplete
                        key={idx}
                        id={`move-select-${idx}`}
                        label={`${t('selectMove')} ${idx + 1}`}
                        value={currentMoveText}
                        suggestions={learnableMoves.map((m) => {
                          const nameOnly = m.name[language];
                          const typeName =
                            typeTranslations[m.type]?.[language] || m.type;
                          return `${nameOnly} (${typeName})`;
                        })}
                        onChange={(val) => {
                          const nextMoves = [...moves];
                          if (val === '') {
                            nextMoves[idx] = 0;
                          } else {
                            const found = learnableMoves.find((m) => {
                              const nameOnly = m.name[language];
                              const typeName =
                                typeTranslations[m.type]?.[language] || m.type;
                              const nameWithType = `${nameOnly} (${typeName})`;
                              return nameOnly === val || nameWithType === val;
                            });
                            nextMoves[idx] = found ? found.id : 0;
                          }
                          setMoves(nextMoves);
                        }}
                        placeholder={t('selectMove')}
                        className="py-1.5 text-xs font-semibold"
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-premium py-20 text-center space-y-4">
          <span className="i-lucide-help-circle text-5xl text-slate-300 dark:text-slate-700 block mx-auto" />
          <p className="text-slate-500">
            {language === 'ja'
              ? '上のボタンから努力値を計算したいポケモンを選択してください。'
              : 'Please select a Pokémon above to start EV calculations.'}
          </p>
        </div>
      )}

      {/* Pokemon Search Modal */}
      <PokemonSearchModal
        isOpen={isSearchOpen}
        pokemonData={pokemonData}
        onSelect={handleSelectPokemon}
        onClose={() => setIsSearchOpen(false)}
        autoAdvance={false}
        onToggleAutoAdvance={() => {}}
      />

      {/* Replacement Modal (If party is full) */}
      {pendingPokemonToAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="card-premium w-full max-w-lg p-6 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl animate-in fade-in duration-200">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="i-lucide-alert-triangle text-amber-500" />
                {language === 'ja' ? 'パーティが満杯です' : 'Party is Full'}
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                {language === 'ja'
                  ? '現在のパーティにはすでに6匹設定されています。新規のパーティを作るか、既存のメンバーを入れ替えてください。'
                  : 'Your current party already has 6 members. Create a new party or replace one of the existing slots.'}
              </p>
            </div>

            {/* List of members to replace */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {language === 'ja'
                  ? '入れ替えるスロットを選択'
                  : 'Select a Slot to Replace'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {partyMembers.map((member, index) => {
                  const master = pokemonData.find(
                    (p) => p.id === member.masterId
                  );
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleReplaceSlot(index)}
                      className="flex items-center gap-3 p-3 text-left border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition cursor-pointer bg-transparent outline-none font-sans"
                    >
                      <span className="text-xs font-semibold text-slate-400 w-5">
                        #{index + 1}
                      </span>
                      <div>
                        <span className="text-sm font-bold block text-slate-800 dark:text-slate-200">
                          {master
                            ? master.name[language]
                            : `--- Slot ${index + 1} ---`}
                        </span>
                        {master && (
                          <span className="text-xs text-slate-400 block truncate max-w-40">
                            {member.ability || 'No Ability'} / {member.nature}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col md:flex-row gap-2 justify-end">
              <Button
                onClick={handleCreateNewPartyWithPending}
                icon="i-lucide-plus"
                className="w-full md:w-auto"
              >
                {language === 'ja'
                  ? '新規パーティを作成して追加'
                  : 'Create New Party & Add'}
              </Button>
              <Button
                onClick={() => setPendingPokemonToAdd(null)}
                variant="secondary"
                className="w-full md:w-auto"
              >
                {language === 'ja' ? 'キャンセル' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Target Party Selection Modal */}
      {isPartySelectOpen && pendingInstanceToAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="card-premium w-full max-w-md p-6 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl animate-in fade-in duration-200">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="i-lucide-plus-circle text-indigo-500" />
                {language === 'ja'
                  ? '追加先のパーティを選択'
                  : 'Select Target Party'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ja'
                  ? 'このポケモンを追加したいパーティを選択してください。'
                  : 'Select which party you want to add this Pokémon to.'}
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {parties.map((p) => {
                const filledCount = p.members.filter(
                  (m) => m.masterId !== 0
                ).length;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleConfirmAddParty(p.id)}
                    className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-slate-855 bg-slate-50/50 dark:bg-slate-955/20 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition cursor-pointer flex items-center justify-between outline-none font-sans"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {p.name}
                    </span>
                    <span className="text-xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full">
                      {filledCount} / 6
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const createdId = createNewParty(
                    language === 'ja' ? 'マイパーティ' : 'My Party',
                    []
                  );
                  handleConfirmAddParty(createdId);
                }}
                className="w-full transition duration-200 cursor-pointer font-semibold flex items-center justify-center gap-2 btn-secondary py-2.5 text-sm"
              >
                <span className="i-lucide-plus" />
                {language === 'ja'
                  ? '新規のパーティを作成して追加'
                  : 'Create New Party & Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPartySelectOpen(false);
                  setPendingInstanceToAdd(null);
                }}
                className="w-full transition duration-200 cursor-pointer font-semibold flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm"
              >
                {language === 'ja' ? 'キャンセル' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper translation mapping for nature label
function statNameLabel(key: string): string {
  const map: Record<string, string> = {
    attack: 'A',
    defense: 'B',
    sp_attack: 'C',
    sp_defense: 'D',
    speed: 'S',
  };
  return map[key] || '';
}
