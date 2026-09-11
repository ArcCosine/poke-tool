import type { Language } from '../context/AppContext';
import { calculateStat } from './calculator';
import type { MoveMaster, PokemonMaster } from './db';
import { TYPES } from './pokemon';

export interface PokemonInstance {
  id: string;
  masterId: number;
  ability: string;
  nature: string;
  item?: string;
  moves: number[]; // Up to 4 moves
  evs: {
    hp: number;
    attack: number;
    defense: number;
    sp_attack: number;
    sp_defense: number;
    speed: number;
  };
}

export const createEmptyInstance = (): PokemonInstance => ({
  id: Math.random().toString(36).substring(2, 9),
  masterId: 0,
  ability: '',
  nature: 'neutral',
  item: '',
  moves: [0, 0, 0, 0],
  evs: { hp: 0, attack: 0, defense: 0, sp_attack: 0, sp_defense: 0, speed: 0 },
});

export const evToStep = (ev: number): number => {
  if (ev <= 0) return 0;
  return Math.floor((ev - 4) / 8) + 1;
};

export const stepToEv = (step: number): number => {
  if (step <= 0) return 0;
  return 4 + (step - 1) * 8;
};

const typeMatchups: Record<
  string,
  { doubleDamageTo?: string[]; halfDamageTo?: string[]; noDamageTo?: string[] }
> = {
  normal: { noDamageTo: ['ghost'], halfDamageTo: ['rock', 'steel'] },
  fire: {
    doubleDamageTo: ['grass', 'ice', 'bug', 'steel'],
    halfDamageTo: ['fire', 'water', 'rock', 'dragon'],
  },
  water: {
    doubleDamageTo: ['fire', 'ground', 'rock'],
    halfDamageTo: ['water', 'grass', 'dragon'],
  },
  grass: {
    doubleDamageTo: ['water', 'ground', 'rock'],
    halfDamageTo: [
      'fire',
      'grass',
      'poison',
      'flying',
      'bug',
      'dragon',
      'steel',
    ],
  },
  electric: {
    doubleDamageTo: ['water', 'flying'],
    halfDamageTo: ['electric', 'grass', 'dragon'],
    noDamageTo: ['ground'],
  },
  ice: {
    doubleDamageTo: ['grass', 'ground', 'flying', 'dragon'],
    halfDamageTo: ['fire', 'water', 'ice', 'steel'],
  },
  fighting: {
    doubleDamageTo: ['normal', 'ice', 'rock', 'dark', 'steel'],
    halfDamageTo: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    noDamageTo: ['ghost'],
  },
  poison: {
    doubleDamageTo: ['grass', 'fairy'],
    halfDamageTo: ['poison', 'ground', 'rock', 'ghost'],
    noDamageTo: ['steel'],
  },
  ground: {
    doubleDamageTo: ['fire', 'electric', 'poison', 'steel', 'rock'],
    halfDamageTo: ['grass', 'bug'],
    noDamageTo: ['flying'],
  },
  flying: {
    doubleDamageTo: ['grass', 'fighting', 'bug'],
    halfDamageTo: ['electric', 'rock', 'steel'],
  },
  psychic: {
    doubleDamageTo: ['fighting', 'poison'],
    halfDamageTo: ['psychic', 'steel'],
    noDamageTo: ['dark'],
  },
  bug: {
    doubleDamageTo: ['grass', 'psychic', 'dark'],
    halfDamageTo: [
      'fire',
      'fighting',
      'poison',
      'flying',
      'ghost',
      'steel',
      'fairy',
    ],
  },
  rock: {
    doubleDamageTo: ['fire', 'ice', 'flying', 'bug'],
    halfDamageTo: ['fighting', 'ground', 'steel'],
  },
  ghost: {
    doubleDamageTo: ['psychic', 'ghost'],
    halfDamageTo: ['dark'],
    noDamageTo: ['normal'],
  },
  dragon: {
    doubleDamageTo: ['dragon'],
    halfDamageTo: ['steel'],
    noDamageTo: ['fairy'],
  },
  dark: {
    doubleDamageTo: ['psychic', 'ghost'],
    halfDamageTo: ['fighting', 'dark', 'fairy'],
  },
  steel: {
    doubleDamageTo: ['ice', 'rock', 'fairy'],
    halfDamageTo: ['fire', 'water', 'electric', 'steel'],
  },
  fairy: {
    doubleDamageTo: ['fighting', 'dragon', 'dark'],
    halfDamageTo: ['fire', 'poison', 'steel'],
  },
};

// Calculate defensive matchups against all 18 types
export function getTypeMatchup(defTypes: string[]): Record<string, number> {
  const result: Record<string, number> = {};

  for (const atkType of TYPES) {
    result[atkType] = 1.0;
  }

  for (const defType of defTypes) {
    for (const atkType of TYPES) {
      const rule = typeMatchups[atkType];
      if (!rule) continue;

      if (rule.noDamageTo?.includes(defType)) {
        result[atkType] *= 0.0;
      } else if (rule.doubleDamageTo?.includes(defType)) {
        result[atkType] *= 2.0;
      } else if (rule.halfDamageTo?.includes(defType)) {
        result[atkType] *= 0.5;
      }
    }
  }

  return result;
}

// Analyze defense weaknesses and resistances for the entire party
export function analyzePartyDefense(
  party: PokemonInstance[],
  pokemonMasterList: PokemonMaster[]
): Record<
  string,
  { weaknesses: number; resistances: number; immunities: number }
> {
  const analysis: Record<
    string,
    { weaknesses: number; resistances: number; immunities: number }
  > = {};

  for (const t of TYPES) {
    analysis[t] = { weaknesses: 0, resistances: 0, immunities: 0 };
  }

  for (const instance of party) {
    const master = pokemonMasterList.find((p) => p.id === instance.masterId);
    if (!master) continue;

    const matchups = getTypeMatchup(master.types);

    for (const atkType of TYPES) {
      const multiplier = matchups[atkType];
      if (multiplier > 1.0) {
        analysis[atkType].weaknesses += 1;
      } else if (multiplier === 0.0) {
        analysis[atkType].immunities += 1;
      } else if (multiplier < 1.0) {
        analysis[atkType].resistances += 1;
      }
    }
  }

  return analysis;
}

// Analyze super-effective attack coverage across the party's moves
export function analyzePartyOffense(
  party: PokemonInstance[],
  movesMasterList: MoveMaster[]
): string[] {
  const coveredTypes: Set<string> = new Set();

  for (const instance of party) {
    for (const moveId of instance.moves) {
      const move = movesMasterList.find((m) => m.id === moveId);
      if (!move || move.category === 'status') continue;

      // Look up what types this move hits super-effectively
      const moveType = move.type;
      const rule = typeMatchups[moveType];
      if (rule?.doubleDamageTo) {
        for (const targetType of rule.doubleDamageTo) {
          coveredTypes.add(targetType);
        }
      }
    }
  }

  return Array.from(coveredTypes);
}

export interface NatureDefinition {
  id: string;
  name: Record<Language, string>;
  plus?: 'attack' | 'defense' | 'sp_attack' | 'sp_defense' | 'speed';
  minus?: 'attack' | 'defense' | 'sp_attack' | 'sp_defense' | 'speed';
}

export const NATURES: NatureDefinition[] = [
  {
    id: 'adamant',
    name: { ja: 'いじっぱり', en: 'Adamant', ko: '고집', 'zh-Hant': '固執' },
    plus: 'attack',
    minus: 'sp_attack',
  },
  {
    id: 'jolly',
    name: { ja: 'ようき', en: 'Jolly', ko: '명랑', 'zh-Hant': '爽朗' },
    plus: 'speed',
    minus: 'sp_attack',
  },
  {
    id: 'timid',
    name: { ja: 'おくびょう', en: 'Timid', ko: '겁쟁이', 'zh-Hant': '膽小' },
    plus: 'speed',
    minus: 'attack',
  },
  {
    id: 'modest',
    name: { ja: 'ひかえめ', en: 'Modest', ko: '조심', 'zh-Hant': '內斂' },
    plus: 'sp_attack',
    minus: 'attack',
  },
  {
    id: 'bold',
    name: { ja: 'ずぶとい', en: 'Bold', ko: '대담', 'zh-Hant': '大膽' },
    plus: 'defense',
    minus: 'attack',
  },
  {
    id: 'impish',
    name: { ja: 'わんぱく', en: 'Impish', ko: '장난꾸러기', 'zh-Hant': '淘氣' },
    plus: 'defense',
    minus: 'sp_attack',
  },
  {
    id: 'calm',
    name: { ja: 'おだやか', en: 'Calm', ko: '차분', 'zh-Hant': '溫和' },
    plus: 'sp_defense',
    minus: 'attack',
  },
  {
    id: 'careful',
    name: { ja: 'しんちょう', en: 'Careful', ko: '신중', 'zh-Hant': '慎重' },
    plus: 'sp_defense',
    minus: 'sp_attack',
  },
  {
    id: 'quiet',
    name: { ja: 'れいせい', en: 'Quiet', ko: '냉정', 'zh-Hant': '冷靜' },
    plus: 'sp_attack',
    minus: 'speed',
  },
  {
    id: 'brave',
    name: { ja: 'ゆうかん', en: 'Brave', ko: '용감', 'zh-Hant': '勇敢' },
    plus: 'attack',
    minus: 'speed',
  },
  {
    id: 'relaxed',
    name: { ja: 'のんき', en: 'Relaxed', ko: '무사태평', 'zh-Hant': '悠閒' },
    plus: 'defense',
    minus: 'speed',
  },
  {
    id: 'sassy',
    name: { ja: 'なまいき', en: 'Sassy', ko: '건방', 'zh-Hant': '自大' },
    plus: 'sp_defense',
    minus: 'speed',
  },
  // 素早さ・耐久下降・両刀・変則性格
  {
    id: 'rash',
    name: { ja: 'うっかりや', en: 'Rash', ko: '덜렁', 'zh-Hant': '馬虎' },
    plus: 'sp_attack',
    minus: 'sp_defense',
  },
  {
    id: 'mild',
    name: { ja: 'おっとり', en: 'Mild', ko: '의젓', 'zh-Hant': '慢吞吞' },
    plus: 'sp_attack',
    minus: 'defense',
  },
  {
    id: 'hasty',
    name: { ja: 'せっかち', en: 'Hasty', ko: '성급', 'zh-Hant': '急躁' },
    plus: 'speed',
    minus: 'defense',
  },
  {
    id: 'naive',
    name: { ja: 'むじゃき', en: 'Naive', ko: '천진난만', 'zh-Hant': '天真' },
    plus: 'speed',
    minus: 'sp_defense',
  },
  {
    id: 'naughty',
    name: { ja: 'やんちゃ', en: 'Naughty', ko: '고집통', 'zh-Hant': '頑皮' },
    plus: 'attack',
    minus: 'sp_defense',
  },
  {
    id: 'lonely',
    name: { ja: 'さみしがり', en: 'Lonely', ko: '외로움', 'zh-Hant': '怕寂寞' },
    plus: 'attack',
    minus: 'defense',
  },
  {
    id: 'lax',
    name: { ja: 'のうてんき', en: 'Lax', ko: '촐랑', 'zh-Hant': '樂天' },
    plus: 'defense',
    minus: 'sp_defense',
  },
  {
    id: 'gentle',
    name: { ja: 'おとなしい', en: 'Gentle', ko: '얌전', 'zh-Hant': '溫順' },
    plus: 'sp_defense',
    minus: 'defense',
  },
  // 無補正性格
  { id: 'neutral', name: { ja: 'まじめ', en: 'Serious', ko: '성실', 'zh-Hant': '認真' } },
  { id: 'hardy', name: { ja: 'がんばりや', en: 'Hardy', ko: '노력', 'zh-Hant': '勤奮' } },
  { id: 'docile', name: { ja: 'すなお', en: 'Docile', ko: '온순', 'zh-Hant': '坦率' } },
  { id: 'bashful', name: { ja: 'てれや', en: 'Bashful', ko: '수줍음', 'zh-Hant': '害羞' } },
  { id: 'quirky', name: { ja: 'きまぐれ', en: 'Quirky', ko: '변덕', 'zh-Hant': '浮躁' } },
];

export const getCalculatedStat = (
  statName: 'hp' | 'attack' | 'defense' | 'sp_attack' | 'sp_defense' | 'speed',
  base: number,
  ev: number,
  natureId: string
): number => {
  const level = 50;
  const iv = 31;

  let multiplier = 1.0;
  const nat = NATURES.find((n) => n.id === natureId);
  if (nat) {
    if (nat.plus === statName) multiplier = 1.1;
    if (nat.minus === statName) multiplier = 0.9;
  }

  return calculateStat(statName, base, iv, ev, level, multiplier);
};

export const generatePokesolText = (
  member: PokemonInstance,
  pokemonList: PokemonMaster[],
  movesList: MoveMaster[],
  language: Language
): string => {
  const master = pokemonList.find((p) => p.id === member.masterId);
  if (!master) return '';

  const name = master.name[language] || master.name.ja;
  const ability = member.ability || master.abilities[0]?.[language] || master.abilities[0]?.ja || '';
  const item = member.item ? ` @ ${member.item}` : '';

  const nat =
    NATURES.find((n) => n.id === member.nature) ||
    NATURES.find((n) => n.id === 'neutral')!;
  const natureName = nat.name[language] || nat.name.ja;

  const formatStat = (
    statKey: 'hp' | 'attack' | 'defense' | 'sp_attack' | 'sp_defense' | 'speed',
    base: number,
    ev: number
  ) => {
    const val = getCalculatedStat(statKey, base, ev, member.nature);
    return ev > 0 ? `${val}(${ev})` : `${val}`;
  };

  const statString = [
    formatStat('hp', master.base_stats.hp, member.evs.hp),
    formatStat('attack', master.base_stats.attack, member.evs.attack),
    formatStat('defense', master.base_stats.defense, member.evs.defense),
    formatStat('sp_attack', master.base_stats.sp_attack, member.evs.sp_attack),
    formatStat(
      'sp_defense',
      master.base_stats.sp_defense,
      member.evs.sp_defense
    ),
    formatStat('speed', master.base_stats.speed, member.evs.speed),
  ].join('-');

  const moveNames = member.moves
    .map((id) => {
      const m = movesList.find((move) => move.id === id);
      return m ? m.name[language] || m.name.ja : '';
    })
    .filter(Boolean);

  const movesString = moveNames.length > 0 ? moveNames.join(' / ') : '';

  return `${name}${item}
特性: ${ability}
能力補正: ${natureName}
${statString}
${movesString}`;
};

export const generatePartyPokesolText = (
  party: PokemonInstance[],
  pokemonList: PokemonMaster[],
  movesList: MoveMaster[],
  language: Language
): string => {
  return party
    .filter((m) => m.masterId > 0)
    .map((m) => generatePokesolText(m, pokemonList, movesList, language))
    .join('\n\n');
};
