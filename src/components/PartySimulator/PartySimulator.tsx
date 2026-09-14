import type React from 'react';
import { useEffect, useState } from 'react';
import { type Language, useApp } from '../../context/AppContext';
import {
  db,
  type ItemMaster,
  type MoveMaster,
  type PokemonMaster,
} from '../../utils/db';
import {
  analyzePartyDefense,
  analyzePartyOffense,
  evToStep,
  generatePartyPokesolText,
  getCalculatedStat,
  NATURES,
  type PokemonInstance,
  stepToEv,
} from '../../utils/party';
import { megaStoneMap, TYPES, typeTranslations } from '../../utils/pokemon';
import { decodePartyConfig, encodePartyConfig } from '../../utils/share';
import { Autocomplete } from '../common/Autocomplete';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { NatureSelect } from '../common/NatureSelect';
import { Select } from '../common/Select';
import { ShareDialog } from '../common/ShareDialog';
import { TypeBadge } from '../common/TypeBadge';
import { PartyControls } from './PartyControls';
import { PartySearch } from './PartySearch';
import { PokemonSearchModal } from './PokemonSearchModal';

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

const EV_STATS: {
  key: StatKey;
  short: string;
  label: Record<Language, string>;
}[] = [
  {
    key: 'hp',
    short: 'H',
    label: { ja: 'HP', en: 'HP', ko: 'HP', 'zh-Hant': 'HP', 'zh-Hans': 'HP' },
  },
  {
    key: 'attack',
    short: 'A',
    label: {
      ja: '攻撃',
      en: 'Attack',
      ko: '공격',
      'zh-Hant': '攻擊',
      'zh-Hans': '攻击',
    },
  },
  {
    key: 'defense',
    short: 'B',
    label: {
      ja: '防御',
      en: 'Defense',
      ko: '방어',
      'zh-Hant': '防禦',
      'zh-Hans': '防御',
    },
  },
  {
    key: 'sp_attack',
    short: 'C',
    label: {
      ja: '特攻',
      en: 'Sp. Atk',
      ko: '특공',
      'zh-Hant': '特攻',
      'zh-Hans': '特攻',
    },
  },
  {
    key: 'sp_defense',
    short: 'D',
    label: {
      ja: '特防',
      en: 'Sp. Def',
      ko: '특방',
      'zh-Hant': '特防',
      'zh-Hans': '特防',
    },
  },
  {
    key: 'speed',
    short: 'S',
    label: {
      ja: '素早さ',
      en: 'Speed',
      ko: '스피드',
      'zh-Hant': '速度',
      'zh-Hans': '速度',
    },
  },
];

export const PartySimulator: React.FC = () => {
  const {
    language,
    t,
    parties,
    currentPartyId,
    partyName,
    partyMembers,
    setPartyName,
    updateMember,
    updateMove,
    removePokemonFromParty,
    createNewParty,
    deleteParty,
    selectParty,
    saveCurrentParty,
    addEmptySlotToParty,
  } = useApp();

  const party = partyMembers;

  const [loading, setLoading] = useState(true);
  const [pokemonData, setPokemonData] = useState<PokemonMaster[]>([]);
  const [movesData, setMovesData] = useState<MoveMaster[]>([]);
  const [itemsData, setItemsData] = useState<ItemMaster[]>([]);

  const [copied, setCopied] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(() => {
    return localStorage.getItem('auto_advance_enabled') === 'true';
  });

  const handleSelectPokemon = (masterId: number) => {
    if (activeSlotIndex === null) return;
    const index = activeSlotIndex;
    const poke = pokemonData.find((p) => p.id === masterId);

    // Auto-fill Mega Stone if it's a mega pokemon (excluding Mega Rayquaza)
    let initialItem = '';
    if (poke?.name.ja.startsWith('メガ') && poke.name.ja !== 'メガレックウザ') {
      const mapped = megaStoneMap[poke.name.ja];
      if (mapped) {
        initialItem = mapped[language];
      } else {
        initialItem = `${poke.name.ja.replace('メガ', '')}ナイト`;
      }
    }

    updateMember(index, {
      masterId,
      ability: poke?.abilities[0]?.ja || '',
      nature: 'neutral',
      item: initialItem,
      moves: [0, 0, 0, 0],
    });
    setActiveSlotIndex(null);

    // Auto-advance logic: Focus on ability select after modal close
    if (autoAdvance) {
      setTimeout(() => {
        const nextElem = document.getElementById(`ability-select-${index}`);
        nextElem?.focus();
      }, 100);
    }
  };

  const handleToggleAutoAdvance = (val: boolean) => {
    setAutoAdvance(val);
    localStorage.setItem('auto_advance_enabled', String(val));
  };

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

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Restore party from URL query (?p=...) or hash (#p=...)
  useEffect(() => {
    if (pokemonData.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const code =
      params.get('p') ||
      window.location.hash.replace('#p=', '').replace('#', '');
    if (!code) return;
    const decoded = decodePartyConfig(code);
    if (!decoded || decoded.members.length === 0) return;

    const importedMembers = decoded.members
      .map((m) => {
        const poke = pokemonData.find((p) => p.id === m.pokemonId);
        if (!poke) return null;
        const itemObj = itemsData.find((i) => i.id === m.itemId);
        return {
          id: Math.random().toString(36).substring(2, 9),
          masterId: m.pokemonId,
          nature: m.nature,
          ability: poke.abilities[0]?.ja || '',
          item: itemObj ? itemObj.name[language] || itemObj.name.ja : '',
          moves: m.moves,
          evs: m.evs,
        };
      })
      .filter(Boolean) as PokemonInstance[];

    if (importedMembers.length > 0) {
      createNewParty(t('share.sharePartyTitle'), importedMembers);
    }
  }, [pokemonData, itemsData, language]);

  const handleShareParty = () => {
    if (partyMembers.length === 0) return;
    const membersConfig = partyMembers.map((m) => {
      const itemObj = itemsData.find(
        (i) => i.name[language] === m.item || i.name.ja === m.item
      );
      return {
        pokemonId: m.masterId,
        nature: m.nature,
        itemId: itemObj ? itemObj.id : 0,
        evs: m.evs,
        moves: m.moves,
      };
    });
    const code = encodePartyConfig({ members: membersConfig });
    const url = `${window.location.origin}${window.location.pathname}?p=${code}`;
    setShareUrl(url);
    setIsShareDialogOpen(true);
  };

  const saveParty = () => {
    saveCurrentParty();
    setIsSaveDialogOpen(true);
  };

  const copyPokesolText = () => {
    const text = generatePartyPokesolText(
      party,
      pokemonData,
      movesData,
      language
    );
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error('Copy failed:', err));
  };

  const addPokemonToParty = () => {
    addEmptySlotToParty();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500">
        <span className="i-lucide-loader-2 animate-spin text-3xl mr-2" />
        {t('loading')}
      </div>
    );
  }

  // Active party filtering (remove unselected slots for calculations)
  const activeParty = party.filter((item) => item.masterId > 0);

  // Analyses
  const defenseAnalysis = analyzePartyDefense(activeParty, pokemonData);
  const offenseCoverage = analyzePartyOffense(activeParty, movesData);

  // Generate warnings
  const defenseWarnings: string[] = [];
  const coverageWarnings: string[] = [];

  for (const type of TYPES) {
    // 1. Weakness synergy warning: 3 or more Pokemon weak to the same type
    if (defenseAnalysis[type].weaknesses >= 3) {
      const typeLabel = typeTranslations[type]?.[language] || type;
      defenseWarnings.push(
        t('partySimulator.defenseWarning', {
          type: typeLabel,
          count: defenseAnalysis[type].weaknesses,
        })
      );
    }

    // 2. Offense coverage advice: no moves hit this type super-effectively
    if (!offenseCoverage.includes(type)) {
      coverageWarnings.push(type);
    }
  }

  const handleMemberEvChange = (
    memberIndex: number,
    stat: StatKey,
    stepVal: number
  ) => {
    const cleanStep = Math.max(0, Math.min(32, stepVal));
    const currentMember = party[memberIndex];
    if (!currentMember) return;

    const currentEvs = currentMember.evs || {
      hp: 0,
      attack: 0,
      defense: 0,
      sp_attack: 0,
      sp_defense: 0,
      speed: 0,
    };

    const otherStepsTotal = STAT_KEYS.filter((k) => k !== stat).reduce(
      (sum, k) => sum + evToStep(currentEvs[k] ?? 0),
      0
    );

    const allowedMax = Math.min(32, 66 - otherStepsTotal);
    const finalStep = Math.min(cleanStep, Math.max(0, allowedMax));

    const updatedEvs = {
      ...currentEvs,
      [stat]: stepToEv(finalStep),
    };

    updateMember(memberIndex, { evs: updatedEvs });
  };

  return (
    <div className="space-y-8">
      {/* Top Section: Party Search followed vertically by Party Controls */}
      <div className="space-y-4">
        <PartySearch
          partyName={partyName}
          parties={parties}
          onSelectParty={selectParty}
          onPartyNameChange={setPartyName}
        />

        <PartyControls
          onCopyPokesol={copyPokesolText}
          isCopied={copied}
          onNewParty={() =>
            createNewParty(t('partySimulator.defaultNewPartyName'))
          }
          onShareParty={handleShareParty}
          onDeleteParty={() => deleteParty(currentPartyId)}
          onSaveParty={saveParty}
          hasActiveMembers={activeParty.length > 0}
        />
      </div>

      {/* Main Grid: Left = Pokémon Slots, Right = Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Pokémon Slots (Left Column) */}
        <div className="lg:col-span-7 space-y-6">
          {party.map((member, index) => {
            const currentPoke = pokemonData.find(
              (p) => p.id === member.masterId
            );
            const learnableMoves = currentPoke
              ? movesData.filter((m) =>
                  currentPoke.learnable_moves.includes(m.id)
                )
              : [];
            return (
              <div
                key={member.id}
                className="card-premium relative border-l-4 border-l-indigo-500 dark:border-l-indigo-600 p-5 space-y-4"
                style={{ zIndex: 10 - index }}
              >
                {/* Remove button */}
                <Button
                  onClick={() => removePokemonFromParty(index)}
                  variant="danger"
                  icon="i-lucide-trash-2"
                  className="absolute top-4 right-4 cursor-pointer"
                >
                  {t('remove')}
                </Button>

                {/* Pokemon Selector & Basic Info */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    {/* 専用のアイコン表記部分とタイプ表示の横並び */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* ポケモンアイコン */}
                      <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {currentPoke ? (
                          <img
                            src={`/assets/pokemon-sprites/${currentPoke.id}.png`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                'none';
                            }}
                            alt={currentPoke.name[language]}
                            className="w-12 h-12 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="i-lucide-help-circle text-slate-400 text-xl" />
                        )}
                      </div>

                      {/* ポケモンのタイプ表示（アイコンの横に配置） */}
                      {currentPoke && (
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {currentPoke.types.map((typeKey) => (
                            <TypeBadge key={typeKey} typeKey={typeKey} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ポケモン選択トリガー（入力ボックス） */}
                    <div className="flex-1 min-w-0">
                      <button
                        id={`pokemon-select-trigger-${index}`}
                        type="button"
                        onClick={() => setActiveSlotIndex(index)}
                        className="w-full text-left input-premium py-2.5 px-3 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition font-medium"
                        aria-label={
                          currentPoke
                            ? `${currentPoke.name[language]}`
                            : t('partySimulator.selectPokemonSlot', {
                                index: index + 1,
                              })
                        }
                      >
                        {currentPoke ? (
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {currentPoke.name[language]}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-300 truncate">
                            {t('partySimulator.selectPokemonPrompt')}
                          </span>
                        )}

                        <span className="i-lucide-chevron-down text-slate-400 text-base shrink-0" />
                      </button>
                    </div>
                  </div>

                  {currentPoke && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* 特性選択 */}
                      <Select
                        id={`ability-select-${index}`}
                        label={t('selectAbility')}
                        value={member.ability}
                        onChange={(e) =>
                          updateMember(index, { ability: e.target.value })
                        }
                        className="py-2 text-sm w-full box-border"
                      >
                        {currentPoke.abilities.map((a) => (
                          <option key={a.ja} value={a.ja}>
                            {a[language]}
                          </option>
                        ))}
                      </Select>

                      {/* 能力補正 */}
                      <NatureSelect
                        id={`nature-select-${index}`}
                        label={t('partySimulator.natureLabel')}
                        value={member.nature || 'neutral'}
                        onChange={(val) => updateMember(index, { nature: val })}
                        className="py-2 text-sm w-full box-border"
                      />

                      {/* 持ち物 */}
                      <Autocomplete
                        id={`item-select-${index}`}
                        label={t('partySimulator.heldItem')}
                        value={member.item || ''}
                        disabled={
                          currentPoke.name.ja.startsWith('メガ') &&
                          currentPoke.name.ja !== 'メガレックウザ'
                        }
                        suggestions={itemsData.map(
                          (item) => item.name[language] || item.name.ja
                        )}
                        onChange={(val) => {
                          updateMember(index, { item: val });
                        }}
                        placeholder={t('partySimulator.itemSearchPlaceholder')}
                        className="py-2 text-sm w-full box-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>

                {/* EV Step Inputs (Number inputs only, no buttons, no conversion) */}
                {currentPoke && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {t('partySimulator.evs')}
                      </span>
                      {(() => {
                        const totalSteps = STAT_KEYS.reduce(
                          (sum, k) => sum + evToStep(member.evs?.[k] ?? 0),
                          0
                        );
                        return (
                          <span
                            className={`font-semibold ${
                              totalSteps === 66
                                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {t('stats.total')}: {totalSteps} / 66
                          </span>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {EV_STATS.map((s) => {
                        const currentStep = evToStep(member.evs?.[s.key] ?? 0);
                        const isHp = s.key === 'hp';
                        const nat = NATURES.find((n) => n.id === member.nature);
                        let natureClass = 'text-slate-600 dark:text-slate-400';
                        if (!isHp && nat) {
                          if (nat.plus === s.key)
                            natureClass =
                              'text-red-500 dark:text-red-400 font-bold';
                          if (nat.minus === s.key)
                            natureClass =
                              'text-blue-500 dark:text-blue-400 font-bold';
                        }

                        const calcStat = getCalculatedStat(
                          s.key,
                          currentPoke.base_stats[s.key],
                          stepToEv(currentStep),
                          member.nature
                        );

                        return (
                          <div key={s.key} className="space-y-1 text-center">
                            <label
                              htmlFor={`ev-input-${index}-${s.key}`}
                              className={`text-xs font-bold text-center block cursor-pointer ${natureClass}`}
                            >
                              {s.short}
                              <span className="text-[10px] opacity-80 font-normal ml-0.5 hidden sm:inline">
                                ({s.label[language]})
                              </span>
                            </label>

                            {/* 実数値表示（入力欄の上の部分） */}
                            <div
                              className={`text-sm font-black text-center ${natureClass || 'text-slate-800 dark:text-slate-100'}`}
                            >
                              {calcStat}
                            </div>

                            <input
                              id={`ev-input-${index}-${s.key}`}
                              type="number"
                              min="0"
                              max="32"
                              step="1"
                              value={currentStep}
                              onChange={(e) => {
                                const val = Number.parseInt(e.target.value, 10);
                                const numVal = Number.isNaN(val) ? 0 : val;
                                handleMemberEvChange(index, s.key, numVal);
                              }}
                              className="w-full text-center py-1.5 px-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 box-border"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Move Selectors */}
                {currentPoke && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {[0, 1, 2, 3].map((mIdx) => {
                      const moveId = member.moves[mIdx] || 0;
                      const currentMove = learnableMoves.find(
                        (x) => x.id === moveId
                      );
                      const currentMoveText = currentMove
                        ? `${currentMove.name[language]} (${
                            typeTranslations[currentMove.type]?.[language] ||
                            currentMove.type
                          })`
                        : '';

                      return (
                        <div
                          key={mIdx}
                          className="relative"
                          style={{ zIndex: 10 - mIdx }}
                        >
                          <Autocomplete
                            id={`move-select-${index}-${mIdx}`}
                            label={`${t('selectMove')} ${mIdx + 1}`}
                            value={currentMoveText}
                            suggestions={learnableMoves.map((m) => {
                              const nameOnly = m.name[language];
                              const typeName =
                                typeTranslations[m.type]?.[language] || m.type;
                              return `${nameOnly} (${typeName})`;
                            })}
                            onChange={(val) => {
                              if (val === '') {
                                updateMove(index, mIdx, 0);
                              } else {
                                const found = learnableMoves.find((m) => {
                                  const nameOnly = m.name[language];
                                  const typeName =
                                    typeTranslations[m.type]?.[language] ||
                                    m.type;
                                  const nameWithType = `${nameOnly} (${typeName})`;
                                  return (
                                    nameOnly === val || nameWithType === val
                                  );
                                });
                                if (found) {
                                  updateMove(index, mIdx, found.id);
                                }
                              }
                            }}
                            placeholder={t('selectMove')}
                            className="py-1.5 text-xs w-full box-border"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <Button
            onClick={addPokemonToParty}
            disabled={party.length >= 6}
            variant="dashed"
            icon="i-lucide-plus-circle text-lg"
          >
            {t('addPokemon')}
          </Button>
        </div>

        {/* Analysis Results (Right Column) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Warnings & Suggestions Panel */}
          <div className="card-premium">
            <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <span className="i-lucide-help-circle text-indigo-500" />
              {t('warnings')}
            </h3>

            {defenseWarnings.length === 0 && coverageWarnings.length === 0 ? (
              <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                {t('noWarnings')}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Defensive Warnings */}
                {defenseWarnings.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-red-500/90 flex items-center gap-1">
                      <span className="i-lucide-shield-x text-xs" />
                      {t('defenseAnalysis')}
                    </h4>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                      {defenseWarnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Offensive Coverage Alerts */}
                {coverageWarnings.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1">
                      <span className="i-lucide-sword text-xs" />
                      {t('offenseAnalysis')}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {t('partySimulator.noCoverageWarning')}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {coverageWarnings.map((typeKey) => (
                        <TypeBadge key={typeKey} typeKey={typeKey} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Defense Synergy Matrix */}
          <div className="card-premium">
            <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">
              {t('defenseAnalysis')}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TYPES.map((type) => {
                const info = defenseAnalysis[type];
                const netScore =
                  info.resistances + info.immunities - info.weaknesses;

                return (
                  <div
                    key={type}
                    className="border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/10 p-2.5 rounded-xl flex flex-col justify-between"
                  >
                    <TypeBadge
                      typeKey={type}
                      className="justify-center w-full mb-2"
                    />

                    <div className="flex justify-around text-center text-[10px] font-mono">
                      <div>
                        <div className="text-red-500 font-bold">
                          {info.weaknesses}
                        </div>
                        <div className="text-[8px] text-slate-400">
                          {t('weakness')}
                        </div>
                      </div>
                      <div>
                        <div className="text-emerald-500 font-bold">
                          {info.resistances + info.immunities}
                        </div>
                        <div className="text-[8px] text-slate-400">
                          {t('resistance')}
                        </div>
                      </div>
                      <div>
                        <div
                          className={`font-bold ${
                            netScore > 0
                              ? 'text-emerald-600'
                              : netScore < 0
                                ? 'text-red-600'
                                : 'text-slate-500'
                          }`}
                        >
                          {netScore > 0 ? `+${netScore}` : netScore}
                        </div>
                        <div className="text-[8px] text-slate-400">Score</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <PokemonSearchModal
          isOpen={activeSlotIndex !== null}
          onClose={() => setActiveSlotIndex(null)}
          onSelect={handleSelectPokemon}
          pokemonData={pokemonData}
          autoAdvance={autoAdvance}
          onToggleAutoAdvance={handleToggleAutoAdvance}
        />
        <Dialog
          isOpen={isSaveDialogOpen}
          onClose={() => setIsSaveDialogOpen(false)}
          title={
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <span className="i-lucide-check-circle text-xl" />
              {t('partySimulator.saveParty')}
            </div>
          }
          actions={
            <Button
              variant="primary"
              onClick={() => setIsSaveDialogOpen(false)}
            >
              OK
            </Button>
          }
        >
          <div className="space-y-2">
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {t('partySimulator.partySaved')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('partySimulator.partyName')}:{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {partyName}
              </span>
            </p>
          </div>
        </Dialog>
        {/* Party Share Dialog */}
        <ShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          title={t('share.sharePartyTitle')}
          description={t('share.sharePartyDesc')}
          shareUrl={shareUrl}
          shareText={t('share.tweetTextParty')}
        />
      </div>
    </div>
  );
};
