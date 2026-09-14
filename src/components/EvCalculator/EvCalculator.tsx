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
import { getCalculatedStat, NATURES } from '../../utils/party';
import {
  MAX_SINGLE_EV,
  MAX_TOTAL_EVS,
  megaStoneMap,
  normalizeEvs,
  type StatKey,
  STAT_KEYS,
  typeTranslations,
} from '../../utils/pokemon';
import {
  decodePokemonConfig,
  encodePokemonConfig,
  type SharedPokemonConfig,
} from '../../utils/share';
import { Autocomplete } from '../common/Autocomplete';
import { Button } from '../common/Button';
import { NatureSelect } from '../common/NatureSelect';
import { Select } from '../common/Select';
import { ShareDialog } from '../common/ShareDialog';
import { TypeBadge } from '../common/TypeBadge';
import { PokemonSearchModal } from '../PartySimulator/PokemonSearchModal';
import { DurabilityOptimizer } from './DurabilityOptimizer';
import { EvStatInput } from './EvStatInput';

interface EvCalculatorProps {
  onImportComplete?: () => void;
}

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

  // Share dialog state
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

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

  // Restore configuration from URL query (?s=...) or hash (#s=...)
  useEffect(() => {
    if (pokemonData.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const code =
      params.get('s') ||
      window.location.hash.replace('#s=', '').replace('#', '');
    if (!code) return;
    const decoded = decodePokemonConfig(code);
    if (!decoded) return;
    const poke = pokemonData.find((p) => p.id === decoded.pokemonId);
    if (!poke) return;

    setSelectedPoke(poke);
    const abilityIdx = decoded.abilityIndex ?? 0;
    setAbility(poke.abilities[abilityIdx]?.ja || poke.abilities[0]?.ja || '');
    setNature(decoded.nature);
    setEvs(normalizeEvs(decoded.evs));
    setMoves(decoded.moves);
    const it = itemsData.find((i) => i.id === decoded.itemId);
    setItem(it ? it.name[language] || it.name.ja : '');
  }, [pokemonData, itemsData, language]);

  const handleShare = () => {
    if (!selectedPoke) return;
    const currentItemObj = itemsData.find(
      (i) =>
        i.name[language] === item ||
        Object.values(i.name).some((n) => n === item)
    );
    const abilityIdx = selectedPoke.abilities.findIndex(
      (a) => a.ja === ability || Object.values(a).some((n) => n === ability)
    );
    const config: SharedPokemonConfig = {
      pokemonId: selectedPoke.id,
      nature,
      itemId: currentItemObj ? currentItemObj.id : 0,
      abilityIndex: abilityIdx >= 0 ? abilityIdx : 0,
      evs,
      moves,
    };
    const code = encodePokemonConfig(config);
    const url = `${window.location.origin}${window.location.pathname}?s=${code}`;
    setShareUrl(url);
    setIsShareDialogOpen(true);
  };

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
        initialItem = mapped[language];
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
    const cleanStep = Math.max(0, Math.min(MAX_SINGLE_EV, stepVal));
    setEvs((prev) => {
      const otherTotal = Object.entries(prev)
        .filter(([k]) => k !== stat)
        .reduce((sum, [_, v]) => sum + v, 0);

      const allowedMax = Math.max(
        0,
        Math.min(MAX_SINGLE_EV, MAX_TOTAL_EVS - otherTotal)
      );
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
        hp: evs.hp,
        attack: evs.attack,
        defense: evs.defense,
        sp_attack: evs.sp_attack,
        sp_defense: evs.sp_defense,
        speed: evs.speed,
      },
    };

    if (parties.length > 0) {
      setPendingInstanceToAdd(instance);
      setIsPartySelectOpen(true);
    } else {
      createNewParty(t('evCalculator.myParty'), [instance]);
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
        t('evCalculator.partyWithPokemon', { name: pendingPokemonToAdd.id }),
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
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
            <span className="i-lucide-calculator text-indigo-500" />
            {t('evCalculator.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('evCalculator.subdescription')}
          </p>
        </div>
        {selectedPoke ? (
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Button
              onClick={handleAdd}
              variant="primary"
              icon="i-lucide-plus"
              className="shadow-md shadow-indigo-500/20 whitespace-nowrap"
            >
              {t('evCalculator.addToParty')}
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setIsSearchOpen(true)}
            icon="i-lucide-search"
            className="w-full sm:w-auto shrink-0 justify-center whitespace-nowrap"
          >
            {t('evCalculator.selectPokemon')}
          </Button>
        )}
      </div>

      {selectedPoke ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="card-premium relative z-30 overflow-visible p-5 border-l-4 border-l-indigo-500 dark:border-l-indigo-600 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition duration-200 group flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center"
            title={t('evCalculator.changePokemonTooltip')}
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
              <NatureSelect
                id="ev-nature-select"
                label={t('evCalculator.nature')}
                value={nature}
                onChange={(val) => setNature(val)}
              />

              {/* Ability Select */}
              <div className="space-y-1">
                <label
                  htmlFor="ev-ability-select"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block"
                >
                  {t('evCalculator.ability')}
                </label>

                <Select
                  id="ev-ability-select"
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
                  label={t('evCalculator.item')}
                  value={item}
                  suggestions={itemsData.map(
                    (i) => i.name[language] || i.name.ja
                  )}
                  onChange={(val) => setItem(val)}
                  placeholder={t('evCalculator.itemPlaceholder')}
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
                  {t('evCalculator.evAndStats')}
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">
                    EV Total:{' '}
                    <span
                      className={
                        totalEv > MAX_TOTAL_EVS
                          ? 'text-red-500'
                          : 'text-indigo-600 dark:text-indigo-400'
                      }
                    >
                      {totalEv}
                    </span>{' '}
                    / {MAX_TOTAL_EVS}
                  </span>
                </div>
              </div>

              {/* Compact Stat Table Headers */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 select-none">
                <div className="col-span-3">
                  {t('evCalculator.statTableStat')}
                </div>
                <div className="col-span-2 text-center">
                  {t('evCalculator.statTableBase')}
                </div>
                <div className="col-span-5 text-center">
                  {t('evCalculator.statTableEv')}
                </div>
                <div className="col-span-2 text-right">
                  {t('evCalculator.statTableFinal')}
                </div>
              </div>

              {/* Stat Row Grid */}
              <div className="space-y-2 sm:space-y-1.5">
                {STAT_KEYS.map((stat) => {
                  const base = selectedPoke.base_stats[stat];
                  const ev = evs[stat];
                  const calcStat = getCalculatedStat(
                    stat,
                    base,
                    ev,
                    nature
                  );
                  const isHp = stat === 'hp';
                  const natureColor = isHp ? '' : getNatureColorClass(stat);
                  const natureSymbol = isHp ? '' : getNatureSymbol(stat);

                  const otherTotal = Object.entries(evs)
                    .filter(([k]) => k !== stat)
                    .reduce((sum, [_, v]) => sum + v, 0);
                  const allowedMax = Math.max(
                    0,
                    Math.min(MAX_SINGLE_EV, MAX_TOTAL_EVS - otherTotal)
                  );

                  return (
                    <div
                      key={stat}
                      className="flex flex-wrap items-center justify-between sm:grid sm:grid-cols-12 sm:gap-2 px-3 py-2.5 sm:py-2 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition duration-150 border-b border-slate-100/60 dark:border-slate-800/40 last:border-0"
                    >
                      {/* Stat Label & Nature Modifier */}
                      <div className="flex items-center gap-1.5 min-w-0 sm:col-span-3">
                        <span
                          className={`text-sm font-bold uppercase tracking-wide truncate ${natureColor || 'text-slate-800 dark:text-slate-100'}`}
                        >
                          {stat === 'hp' ? 'HP' : t(stat)}
                        </span>
                        {natureSymbol && (
                          <span
                            className={`text-xs font-black shrink-0 ${natureColor}`}
                          >
                            {natureSymbol}
                          </span>
                        )}
                      </div>

                      {/* Base Stat */}
                      <div className="text-center sm:col-span-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <span className="sm:hidden text-[10px] mr-1">
                            {t('evCalculator.statTableBase')}:
                          </span>
                          {base}
                        </span>
                      </div>

                      {/* Final Stat Output */}
                      <div className="text-right sm:col-span-2 sm:order-last">
                        <span
                          className={`text-base sm:text-lg font-black ${natureColor || 'text-slate-800 dark:text-slate-100'}`}
                        >
                          <span className="sm:hidden text-xs font-semibold text-slate-400 dark:text-slate-500 mr-1">
                            {t('evCalculator.statTableFinal')}:
                          </span>
                          {calcStat}
                        </span>
                      </div>

                      {/* EV Stepper Inputs */}
                      <div className="w-full sm:w-auto mt-2 sm:mt-0 flex items-center justify-center sm:col-span-5">
                        <EvStatInput
                          stat={stat}
                          value={ev}
                          maxAllowed={allowedMax}
                          onChange={(newVal) => handleEvChange(stat, newVal)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details Column */}
            <div className="space-y-6">
              {/* Moves Selector */}
              <div className="card-premium relative z-20 space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="i-lucide-swords text-indigo-500" />
                  {t('evCalculator.moves')}
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
                      <div
                        key={idx}
                        className="relative"
                        style={{ zIndex: 10 - idx }}
                      >
                        <Autocomplete
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
                                  typeTranslations[m.type]?.[language] ||
                                  m.type;
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
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Durability Optimizer & Indices */}
              <DurabilityOptimizer
                baseStats={{
                  hp: selectedPoke.base_stats.hp,
                  defense: selectedPoke.base_stats.defense,
                  sp_defense: selectedPoke.base_stats.sp_defense,
                }}
                currentEvs={evs}
                nature={nature}
                onApplyHbdEvs={(hbd) => {
                  setEvs((prev) =>
                    normalizeEvs({
                      ...prev,
                      hp: hbd.hp,
                      defense: hbd.defense,
                      sp_defense: hbd.sp_defense,
                    })
                  );
                }}
              />

              {/* Action Buttons: Add to Party & Share Configuration */}
              <div className="space-y-2 pt-1">
                <Button
                  onClick={handleAdd}
                  variant="primary"
                  icon="i-lucide-plus"
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold shadow-md shadow-indigo-500/20 rounded-xl"
                >
                  {t('evCalculator.addToParty')}
                </Button>

                <Button
                  onClick={handleShare}
                  variant="secondary"
                  icon="i-lucide-share-2"
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-xl shadow-xs"
                  title={t('share.button')}
                >
                  {t('share.button')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-premium py-20 text-center space-y-4">
          <span className="i-lucide-help-circle text-5xl text-slate-300 dark:text-slate-700 block mx-auto" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            {t('evCalculator.selectPokemonAbovePrompt')}
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
                {t('evCalculator.partyFull')}
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                {t('evCalculator.partyFullDesc')}
              </p>
            </div>

            {/* List of members to replace */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t('evCalculator.selectSlotToReplace')}
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
                {t('evCalculator.createNewPartyAndAdd')}
              </Button>
              <Button
                onClick={() => setPendingPokemonToAdd(null)}
                variant="secondary"
                className="w-full md:w-auto"
              >
                {t('common.cancel')}
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
                {t('evCalculator.selectTargetParty')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t('evCalculator.selectTargetPartyDesc')}
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
                    className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition cursor-pointer flex items-center justify-between outline-none font-sans"
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
                  if (pendingInstanceToAdd) {
                    createNewParty(t('evCalculator.myParty'), [
                      pendingInstanceToAdd,
                    ]);
                    setIsPartySelectOpen(false);
                    setPendingInstanceToAdd(null);
                    if (onImportComplete) onImportComplete();
                  }
                }}
                className="w-full transition duration-200 cursor-pointer font-semibold flex items-center justify-center gap-2 btn-secondary py-2.5 text-sm"
              >
                <span className="i-lucide-plus" />
                {t('evCalculator.createNewPartyAndAdd')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPartySelectOpen(false);
                  setPendingInstanceToAdd(null);
                }}
                className="w-full transition duration-200 cursor-pointer font-semibold flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        title={t('share.shareTitle')}
        description={t('share.shareDesc')}
        shareUrl={shareUrl}
        shareText={
          selectedPoke
            ? t('share.tweetTextPokemon', {
                name: selectedPoke.name[language] || selectedPoke.name.ja,
              })
            : ''
        }
      />
    </div>
  );
};
