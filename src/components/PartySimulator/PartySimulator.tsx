import type React from 'react';
import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
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
  NATURES,
} from '../../utils/party';
import { megaStoneMap, TYPES, typeTranslations } from '../../utils/pokemon';
import { Autocomplete } from '../common/Autocomplete';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { TypeBadge } from '../common/TypeBadge';
import { PokemonSearchModal } from './PokemonSearchModal';

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
        initialItem = language === 'ja' ? mapped.ja : mapped.en;
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

  const saveParty = () => {
    saveCurrentParty();
    alert(
      language === 'ja'
        ? 'パーティを保存しました！'
        : 'Party saved successfully!'
    );
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
        language === 'ja'
          ? `${typeLabel}タイプの攻撃が一貫しています（弱点持ちが${defenseAnalysis[type].weaknesses}匹）。`
          : `${typeLabel} type is highly effective: ${defenseAnalysis[type].weaknesses} members are weak to it.`
      );
    }

    // 2. Offense coverage advice: no moves hit this type super-effectively
    if (!offenseCoverage.includes(type)) {
      coverageWarnings.push(type);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header controls card */}
      <div className="card-premium relative z-20 flex flex-col gap-5 p-5">
        {/* Top row: Current selected party status display */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="i-lucide-users text-indigo-500 text-xl" />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'ja' ? '編集中のパーティ' : 'Editing Party'}
            </span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
              {partyName || t('defaultPartyName')}
            </span>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
              {language === 'ja'
                ? `全 ${parties.length} 個のパーティ中`
                : `${parties.length} Saved Parties`}
            </span>
          </div>
        </div>

        {/* Bottom row: Controls */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Party Name Edit Autocomplete */}
          <div className="w-full sm:w-80">
            <Autocomplete
              id="party-name-autocomplete"
              label={
                language === 'ja'
                  ? 'パーティの検索・名前変更'
                  : 'Search / Rename Party'
              }
              value={partyName}
              suggestions={parties.map((p) => p.name)}
              onChange={(val) => {
                const matched = parties.find((p) => p.name === val);
                if (matched) {
                  selectParty(matched.id);
                } else {
                  setPartyName(val);
                }
              }}
              placeholder={t('defaultPartyName')}
              className="py-2 text-sm font-semibold"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto flex-wrap">
            <Button
              onClick={copyPokesolText}
              disabled={activeParty.length === 0}
              variant="secondary"
              icon="i-lucide-clipboard"
              className="w-full sm:w-auto text-xs"
            >
              {copied ? 'コピーしました！' : 'クリップボードにコピー'}
            </Button>
            <Button
              onClick={() =>
                createNewParty(
                  language === 'ja' ? '新規のパーティ' : 'New Party'
                )
              }
              variant="secondary"
              icon="i-lucide-plus"
              className="w-full sm:w-auto text-xs"
            >
              {language === 'ja' ? '新規作成' : 'New Party'}
            </Button>
            <Button
              onClick={() => deleteParty(currentPartyId)}
              variant="danger"
              icon="i-lucide-trash-2"
              className="w-full sm:w-auto text-xs"
            >
              {language === 'ja' ? '削除' : 'Delete'}
            </Button>
            <Button
              onClick={saveParty}
              variant="primary"
              icon="i-lucide-save"
              className="w-full sm:w-auto text-xs"
            >
              {t('saveParty')}
            </Button>
          </div>
        </div>
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
                      <label
                        htmlFor={`pokemon-select-trigger-${index}`}
                        className="block text-xs font-semibold text-slate-500 mb-1"
                      >
                        {language === 'ja'
                          ? `ポケモン名 #${index + 1}`
                          : `Pokémon Name #${index + 1}`}
                      </label>
                      <button
                        id={`pokemon-select-trigger-${index}`}
                        type="button"
                        onClick={() => setActiveSlotIndex(index)}
                        className="w-full text-left input-premium py-2.5 px-3 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition font-medium"
                        aria-label={
                          currentPoke
                            ? `${currentPoke.name[language]}`
                            : `ポケモン名 #${index + 1}を選択`
                        }
                      >
                        {currentPoke ? (
                          <span className="text-sm font-semibold text-slate-200 truncate">
                            {currentPoke.name[language]}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500 truncate">
                            {language === 'ja'
                              ? 'ポケモン名を選択'
                              : 'Select Pokémon'}
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
                      <Select
                        id={`nature-select-${index}`}
                        label={language === 'ja' ? '能力補正' : 'Nature'}
                        value={member.nature || 'neutral'}
                        onChange={(e) =>
                          updateMember(index, { nature: e.target.value })
                        }
                        className="py-2 text-sm w-full box-border"
                      >
                        {NATURES.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name[language]}
                          </option>
                        ))}
                      </Select>

                      {/* 持ち物 */}
                      <Autocomplete
                        id={`item-select-${index}`}
                        label={language === 'ja' ? '持ち物' : 'Held Item'}
                        value={member.item || ''}
                        disabled={
                          currentPoke.name.ja.startsWith('メガ') &&
                          currentPoke.name.ja !== 'メガレックウザ'
                        }
                        suggestions={itemsData.map((item) =>
                          language === 'ja' ? item.name.ja : item.name.en
                        )}
                        onChange={(val) => {
                          updateMember(index, { item: val });
                        }}
                        placeholder={
                          language === 'ja'
                            ? '持ち物を検索・入力...'
                            : 'Search held item...'
                        }
                        className="py-2 text-sm w-full box-border disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>

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
                        <Autocomplete
                          key={mIdx}
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
                                return nameOnly === val || nameWithType === val;
                              });
                              if (found) {
                                updateMove(index, mIdx, found.id);
                              }
                            }
                          }}
                          placeholder={t('selectMove')}
                          className="py-1.5 text-xs w-full box-border"
                        />
                      );
                    })}
                  </div>
                )}

                {/* 努力値（能力ポイント）表示領域 */}
                {currentPoke && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="i-lucide-activity text-indigo-500 text-xs" />
                        {language === 'ja'
                          ? '努力値 (能力ポイント)'
                          : 'Capacity Points'}
                      </span>
                      <span>
                        <span
                          className={
                            Object.values(member.evs).reduce(
                              (sum, val) => sum + evToStep(val),
                              0
                            ) > 66
                              ? 'text-red-500 font-extrabold'
                              : 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                          }
                        >
                          {Object.values(member.evs).reduce(
                            (sum, val) => sum + evToStep(val),
                            0
                          )}
                        </span>{' '}
                        / 66
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {(
                        [
                          'hp',
                          'attack',
                          'defense',
                          'sp_attack',
                          'sp_defense',
                          'speed',
                        ] as const
                      ).map((statKey) => {
                        const pts = evToStep(member.evs[statKey]);
                        const isHp = statKey === 'hp';
                        // Apply nature color if not HP
                        const nat = NATURES.find((n) => n.id === member.nature);
                        let natureClass = 'text-slate-700 dark:text-slate-300';
                        if (!isHp && nat) {
                          if (nat.plus === statKey)
                            natureClass =
                              'text-red-500 dark:text-red-400 font-bold';
                          if (nat.minus === statKey)
                            natureClass =
                              'text-blue-500 dark:text-blue-400 font-bold';
                        }

                        const shortLabelMap: Record<string, string> = {
                          hp: 'H',
                          attack: 'A',
                          defense: 'B',
                          sp_attack: 'C',
                          sp_defense: 'D',
                          speed: 'S',
                        };

                        return (
                          <div
                            key={statKey}
                            className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/80 rounded-xl py-1 px-0.5 text-center"
                          >
                            <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none mb-1">
                              {shortLabelMap[statKey]}
                            </span>
                            <span
                              className={`text-xs font-black ${pts > 0 ? (pts === 32 ? 'text-amber-500 dark:text-amber-400 font-bold' : natureClass) : 'text-slate-300 dark:text-slate-700'}`}
                            >
                              {pts}
                            </span>
                          </div>
                        );
                      })}
                    </div>
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
                      {language === 'ja'
                        ? '以下のタイプに対して抜群を取れる攻撃技がありません：'
                        : 'No moves hit super-effectively against: '}
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
      </div>
    </div>
  );
};
