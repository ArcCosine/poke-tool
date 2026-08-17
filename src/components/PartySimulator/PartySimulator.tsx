import type React from 'react';
import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db, type MoveMaster, type PokemonMaster, type ItemMaster } from '../../utils/db';
import { PokemonSearchModal } from './PokemonSearchModal';
import {
  analyzePartyDefense,
  analyzePartyOffense,
  generatePartyPokesolText,
  NATURES,
  type PokemonInstance,
  TYPES,
} from '../../utils/party';

// Simple default blank PokemonInstance
const createEmptyInstance = (): PokemonInstance => ({
  id: Math.random().toString(36).substring(2, 9),
  masterId: 0,
  ability: '',
  nature: 'neutral',
  item: '',
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

const megaStoneMap: Record<string, { ja: string; en: string }> = {
  'メガフシギバナ': { ja: 'フシギバナイト', en: 'Venusaurite' },
  'メガリザードンX': { ja: 'リザードナイトX', en: 'Charizardite X' },
  'メガリザードンY': { ja: 'リザードナイトY', en: 'Charizardite Y' },
  'メガカメックス': { ja: 'カメックスナイト', en: 'Blastoisinite' },
  'メガスピアー': { ja: 'スピアーナイト', en: 'Beedrillite' },
  'メガピジョット': { ja: 'ピジョットナイト', en: 'Pidgeotite' },
  'メガフーディン': { ja: 'フーディナイト', en: 'Alakazite' },
  'メガヤドラン': { ja: 'ヤドランナイト', en: 'Slowbronite' },
  'メガゲンガー': { ja: 'ゲンガナイト', en: 'Gengarite' },
  'メガガルーラ': { ja: 'ガルーラナイト', en: 'Kangaskhanite' },
  'メガカイロス': { ja: 'カイロスナイト', en: 'Pinsirite' },
  'メガギャラドス': { ja: 'ギャラドスナイト', en: 'Gyaradosite' },
  'メガプテラ': { ja: 'プテラナイト', en: 'Aerodactylite' },
  'メガデンリュウ': { ja: 'デンリュウナイト', en: 'Ampharosite' },
  'メガハッサム': { ja: 'ハッサムナイト', en: 'Scizorite' },
  'メガヘラクロス': { ja: 'ヘラクロスナイト', en: 'Heracronite' },
  'メガヘルガー': { ja: 'ヘルガナイト', en: 'Houndoominite' },
  'メガバンギラス': { ja: 'バンギラスナイト', en: 'Tyranitarite' },
  'メガジュカイン': { ja: 'ジュカインナイト', en: 'Sceptilite' },
  'メガバシャーモ': { ja: 'バシャーモナイト', en: 'Blazikenite' },
  'メガラグラージ': { ja: 'ラグラージナイト', en: 'Swampertite' },
  'メガサーナイト': { ja: 'サーナイトナイト', en: 'Gardevoirite' },
  'メガヤミラミ': { ja: 'ヤミラミナイト', en: 'Sablenite' },
  'メガクチート': { ja: 'クチートナイト', en: 'Mawilite' },
  'メガボスゴドラ': { ja: 'ボスゴドラナイト', en: 'Aggronite' },
  'メガチャーレム': { ja: 'チャーレムナイト', en: 'Medichamite' },
  'メガライボルト': { ja: 'ライボルトナイト', en: 'Manectrite' },
  'メガサメハダー': { ja: 'サメハダナイト', en: 'Sharpedonite' },
  'メガバクーダ': { ja: 'バクーダナイト', en: 'Cameruptite' },
  'メガチルタリス': { ja: 'チルタリスナイト', en: 'Altarianite' },
  'メガジュペッタ': { ja: 'ジュペッタナイト', en: 'Banettite' },
  'メガアブソル': { ja: 'アブソルナイト', en: 'Absolite' },
  'メガオニゴーリ': { ja: 'オニゴーリナイト', en: 'Glalitite' },
  'メガボーマンダ': { ja: 'ボーマンダナイト', en: 'Salamencite' },
  'メガメタグロス': { ja: 'メタグロスナイト', en: 'Metagrossite' },
  'メガレックウザ': { ja: 'なし (画竜点睛が必要)', en: 'None (Dragon Ascent required)' },
  'メガラティアス': { ja: 'ラティアスナイト', en: 'Latiasite' },
  'メガラティオス': { ja: 'ラティオスナイト', en: 'Latiosite' },
  'メガディアンシー': { ja: 'ディアンシナイト', en: 'Diancite' },
  'メガエルレイド': { ja: 'エルレイドナイト', en: 'Galladite' },
  'メガタブンネ': { ja: 'タブンネナイト', en: 'Audinite' },
  'メガミミロップ': { ja: 'ミミロップナイト', en: 'Lopunnite' },
  'メガハガネール': { ja: 'ハガネールナイト', en: 'Steelixite' },
  'メガユキノオー': { ja: 'ユキノオナイト', en: 'Abomasnowite' },
};

export const PartySimulator: React.FC = () => {
  const { language, t } = useApp();
  const [loading, setLoading] = useState(true);
  const [pokemonData, setPokemonData] = useState<PokemonMaster[]>([]);
  const [movesData, setMovesData] = useState<MoveMaster[]>([]);
  const [itemsData, setItemsData] = useState<ItemMaster[]>([]);

  // Party State
  const [partyName, setPartyName] = useState('');
  const [party, setParty] = useState<PokemonInstance[]>([
    createEmptyInstance(),
  ]);
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
    if (poke && poke.name.ja.startsWith('メガ') && poke.name.ja !== 'メガレックウザ') {
      const mapped = megaStoneMap[poke.name.ja];
      if (mapped) {
        initialItem = language === 'ja' ? mapped.ja : mapped.en;
      } else {
        initialItem = poke.name.ja.replace('メガ', '') + 'ナイト';
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

  // Load master data and saved party
  useEffect(() => {
    db.loadMasterData()
      .then((data) => {
        setPokemonData(data.pokemon);
        setMovesData(data.moves);
        setItemsData(data.items);

        // Load saved party if any
        const saved = localStorage.getItem('saved_party');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.name) setPartyName(parsed.name);
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
      members: party,
    };
    localStorage.setItem('saved_party', JSON.stringify(payload));
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
              placeholder={t('defaultPartyName')}
              onChange={(e) => setPartyName(e.target.value)}
              className="input-premium py-2 text-sm font-semibold"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={copyPokesolText}
            disabled={activeParty.length === 0}
            className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="i-lucide-clipboard" />
            {copied ? 'コピーしました！' : 'クリップボードにコピー'}
          </button>
          <button
            type="button"
            onClick={saveParty}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 font-semibold"
          >
            <span className="i-lucide-save" />
            {t('saveParty')}
          </button>
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
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    {/* 専用のアイコン表記部分とタイプ表示の横並び */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* ポケモンアイコン */}
                      <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {currentPoke ? (
                          <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${currentPoke.id}.png`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
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
                            <span
                              key={typeKey}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 select-none"
                            >
                              <img
                                src={`/assets/type-icons/${typeKey}.svg`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                                alt={typeTranslations[typeKey]?.[language] || typeKey}
                                className="w-4 h-4 object-contain shrink-0"
                                loading="lazy"
                              />
                              <span>
                                {typeTranslations[typeKey]?.[language] || typeKey}
                              </span>
                            </span>
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
                        {language === 'ja' ? `ポケモン名 #${index + 1}` : `Pokémon Name #${index + 1}`}
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
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {currentPoke.name[language]}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500 truncate">
                            {language === 'ja' ? 'ポケモン名を選択' : 'Select Pokémon'}
                          </span>
                        )}
                        <span className="i-lucide-chevron-down text-slate-400 text-base shrink-0" />
                      </button>
                    </div>
                  </div>

                  {currentPoke && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* 特性選択 */}
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
                          className="input-premium py-2 text-sm cursor-pointer w-full box-border"
                        >
                          {currentPoke.abilities.map((a) => (
                            <option key={a.ja} value={a.ja}>
                              {a[language]}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 能力補正 */}
                      <div>
                        <label
                          htmlFor={`nature-select-${index}`}
                          className="block text-xs font-semibold text-slate-500 mb-1"
                        >
                          {language === 'ja' ? '能力補正' : 'Nature'}
                        </label>
                        <select
                          id={`nature-select-${index}`}
                          value={member.nature || 'neutral'}
                          onChange={(e) =>
                            updateMember(index, { nature: e.target.value })
                          }
                          className="input-premium py-2 text-sm cursor-pointer w-full box-border"
                        >
                          {NATURES.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.name[language]}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 持ち物 */}
                      <div>
                        <label
                          htmlFor={`item-select-${index}`}
                          className="block text-xs font-semibold text-slate-500 mb-1"
                        >
                          {language === 'ja' ? '持ち物' : 'Held Item'}
                        </label>
                        <select
                          id={`item-select-${index}`}
                          value={member.item || ''}
                          disabled={currentPoke.name.ja.startsWith('メガ') && currentPoke.name.ja !== 'メガレックウザ'}
                          onChange={(e) =>
                            updateMember(index, { item: e.target.value })
                          }
                          className="input-premium py-2 text-sm cursor-pointer w-full box-border disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="">{language === 'ja' ? '-- 持ち物なし --' : '-- No Item --'}</option>
                          {currentPoke.name.ja.startsWith('メガ') && currentPoke.name.ja !== 'メガレックウザ' ? (
                            <option value={member.item}>{member.item}</option>
                          ) : (
                            itemsData.map((item) => (
                              <option key={item.id} value={language === 'ja' ? item.name.ja : item.name.en}>
                                {language === 'ja' ? item.name.ja : item.name.en}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

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
                      className="inline-flex items-center justify-center gap-1.5 px-1.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 select-none w-full mb-2"
                    >
                      <img
                        src={`/assets/type-icons/${type}.svg`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        alt={typeTranslations[type]?.[language] || type}
                        className="w-4 h-4 object-contain shrink-0"
                        loading="lazy"
                      />
                      <span>
                        {typeTranslations[type]?.[language] || type}
                      </span>
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
