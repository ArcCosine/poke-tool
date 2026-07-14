import type React from 'react';
import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db, type MoveMaster, type PokemonMaster } from '../../utils/db';
import {
  analyzePartyDefense,
  analyzePartyOffense,
  type PokemonInstance,
  TYPES,
  validatePartyRegulation,
} from '../../utils/party';

// Simple default blank PokemonInstance
const createEmptyInstance = (): PokemonInstance => ({
  id: Math.random().toString(36).substring(2, 9),
  masterId: 0,
  ability: '',
  nature: 'neutral',
  moves: [0, 0, 0, 0],
  evs: { hp: 0, attack: 0, defense: 0, sp_attack: 0, sp_defense: 0, speed: 0 },
});

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

export const PartySimulator: React.FC = () => {
  const { language, t } = useApp();
  const [loading, setLoading] = useState(true);
  const [pokemonData, setPokemonData] = useState<PokemonMaster[]>([]);
  const [movesData, setMovesData] = useState<MoveMaster[]>([]);

  // Party State
  const [partyName, setPartyName] = useState('My Champions Party');
  const [selectedReg, setSelectedReg] = useState('M-A');
  const [party, setParty] = useState<PokemonInstance[]>([
    createEmptyInstance(),
  ]);

  // Load master data and saved party
  useEffect(() => {
    db.loadMasterData()
      .then((data) => {
        setPokemonData(data.pokemon);
        setMovesData(data.moves);

        // Load saved party if any
        const saved = localStorage.getItem('saved_party');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.name) setPartyName(parsed.name);
            if (parsed.reg) setSelectedReg(parsed.reg);
            if (parsed.members) setParty(parsed.members);
          } catch (e) {
            console.error('Failed to parse saved party:', e);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const saveParty = () => {
    const payload = {
      name: partyName,
      reg: selectedReg,
      members: party,
    };
    localStorage.setItem('saved_party', JSON.stringify(payload));
    alert(
      language === 'ja'
        ? 'パーティを保存しました！'
        : 'Party saved successfully!'
    );
  };

  const addPokemonToParty = () => {
    if (party.length >= 6) {
      alert(
        language === 'ja'
          ? 'パーティは最大6匹です。'
          : 'Max 6 Pokémon allowed in a party.'
      );
      return;
    }
    setParty([...party, createEmptyInstance()]);
  };

  const removePokemonFromParty = (index: number) => {
    const nextParty = [...party];
    nextParty.splice(index, 1);
    // Keep at least one empty slot
    if (nextParty.length === 0) {
      nextParty.push(createEmptyInstance());
    }
    setParty(nextParty);
  };

  const updateMember = (index: number, fields: Partial<PokemonInstance>) => {
    const nextParty = [...party];
    nextParty[index] = { ...nextParty[index], ...fields };
    setParty(nextParty);
  };

  const updateMove = (
    memberIndex: number,
    moveIndex: number,
    moveId: number
  ) => {
    const nextParty = [...party];
    const nextMoves = [...nextParty[memberIndex].moves];
    nextMoves[moveIndex] = moveId;
    nextParty[memberIndex] = { ...nextParty[memberIndex], moves: nextMoves };
    setParty(nextParty);
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
  const regulationCheck = validatePartyRegulation(
    activeParty,
    pokemonData,
    selectedReg
  );

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
          : `Water type is highly effective: ${defenseAnalysis[type].weaknesses} members are weak to ${typeLabel}.`
      );
    }

    // 2. Offense coverage advice: no moves hit this type super-effectively
    if (!offenseCoverage.includes(type)) {
      const typeLabel = typeTranslations[type]?.[language] || type;
      coverageWarnings.push(typeLabel);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header controls card */}
      <div className="card-premium flex flex-col md:flex-row gap-4 items-center justify-between p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
          <div className="w-full sm:w-64">
            <label
              htmlFor="party-name-input"
              className="block text-xs font-semibold text-slate-500 mb-1"
            >
              {t('partyName')}
            </label>
            <input
              id="party-name-input"
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className="input-premium py-2 text-sm font-semibold"
            />
          </div>
          <div className="w-full sm:w-48">
            <label
              htmlFor="reg-select-input"
              className="block text-xs font-semibold text-slate-500 mb-1"
            >
              {t('regulation')}
            </label>
            <select
              id="reg-select-input"
              value={selectedReg}
              onChange={(e) => setSelectedReg(e.target.value)}
              className="input-premium py-2 text-sm cursor-pointer"
            >
              <option value="M-A">Regulation M-A</option>
              <option value="M-B">Regulation M-B</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={saveParty}
          className="btn-primary w-full md:w-auto flex items-center justify-center gap-2"
        >
          <span className="i-lucide-save" />
          {t('saveParty')}
        </button>
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
              >
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removePokemonFromParty(index)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition cursor-pointer text-xs flex items-center gap-1"
                >
                  <span className="i-lucide-trash-2" />
                  {t('remove')}
                </button>

                {/* Pokemon Selector & Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor={`pokemon-select-${index}`}
                      className="block text-xs font-semibold text-slate-500 mb-1"
                    >
                      {t('pokemon')} #{index + 1}
                    </label>
                    <select
                      id={`pokemon-select-${index}`}
                      value={member.masterId}
                      onChange={(e) => {
                        const mId = parseInt(e.target.value, 10);
                        const poke = pokemonData.find((p) => p.id === mId);
                        updateMember(index, {
                          masterId: mId,
                          ability: poke?.abilities[0]?.ja || '',
                          moves: [0, 0, 0, 0],
                        });
                      }}
                      className="input-premium py-2 text-sm cursor-pointer"
                    >
                      <option value={0}>-- {t('selectPokemon')} --</option>
                      {pokemonData.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name[language]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentPoke && (
                    <div>
                      <label
                        htmlFor={`ability-select-${index}`}
                        className="block text-xs font-semibold text-slate-500 mb-1"
                      >
                        {t('selectAbility')}
                      </label>
                      <select
                        id={`ability-select-${index}`}
                        value={member.ability}
                        onChange={(e) =>
                          updateMember(index, { ability: e.target.value })
                        }
                        className="input-premium py-2 text-sm cursor-pointer"
                      >
                        {currentPoke.abilities.map((a) => (
                          <option key={a.ja} value={a.ja}>
                            {a[language]}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Type display */}
                {currentPoke && (
                  <div className="flex gap-2">
                    {currentPoke.types.map((typeKey) => (
                      <span
                        key={typeKey}
                        className={`px-2.5 py-0.5 text-xs rounded-md font-semibold ${
                          typeColors[typeKey] || 'bg-slate-500 text-white'
                        }`}
                      >
                        {typeTranslations[typeKey]?.[language] || typeKey}
                      </span>
                    ))}
                  </div>
                )}

                {/* Move Selectors */}
                {currentPoke && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {[0, 1, 2, 3].map((mIdx) => (
                      <div key={mIdx}>
                        <label
                          htmlFor={`move-select-${index}-${mIdx}`}
                          className="block text-[10px] font-semibold text-slate-400 mb-1"
                        >
                          {t('selectMove')} {mIdx + 1}
                        </label>
                        <select
                          id={`move-select-${index}-${mIdx}`}
                          value={member.moves[mIdx] || 0}
                          onChange={(e) =>
                            updateMove(
                              index,
                              mIdx,
                              parseInt(e.target.value, 10)
                            )
                          }
                          className="input-premium py-1.5 text-xs cursor-pointer"
                        >
                          <option value={0}>-</option>
                          {learnableMoves.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name[language]} (
                              {typeTranslations[m.type]?.[language] || m.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addPokemonToParty}
            disabled={party.length >= 6}
            className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-600 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-500 transition duration-200 cursor-pointer font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="i-lucide-plus-circle text-lg" />
            {t('addPokemon')}
          </button>
        </div>

        {/* Analysis Results (Right Column) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Regulation Valid Block */}
          <div className="card-premium">
            <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">
              {t('regValid')}
            </h3>
            {regulationCheck.valid ? (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                <span className="i-lucide-check-circle2 text-lg" />
                {t('regValid')}: {selectedReg} Pass
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-500 font-semibold text-sm">
                  <span className="i-lucide-alert-triangle text-lg" />
                  {t('regInvalid')}
                </div>
                <ul className="list-disc list-inside text-xs text-red-500/90 pl-1 space-y-1">
                  {regulationCheck.errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

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
                        <span
                          key={typeKey}
                          className={`px-1.5 py-0.5 text-[10px] rounded font-semibold ${
                            typeColors[typeKey] || 'bg-slate-500 text-white'
                          }`}
                        >
                          {typeTranslations[typeKey]?.[language] || typeKey}
                        </span>
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
                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded font-semibold text-center w-full mb-2 ${
                        typeColors[type] || 'bg-slate-500 text-white'
                      }`}
                    >
                      {typeTranslations[type]?.[language] || type}
                    </span>

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
      </div>
    </div>
  );
};
