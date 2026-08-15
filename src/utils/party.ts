import type { MoveMaster, PokemonMaster } from './db';

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

export const TYPES = [
  'normal',
  'fire',
  'water',
  'grass',
  'electric',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
];

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
  name: { ja: string; en: string };
  plus?: 'attack' | 'defense' | 'sp_attack' | 'sp_defense' | 'speed';
  minus?: 'attack' | 'defense' | 'sp_attack' | 'sp_defense' | 'speed';
}

export const NATURES: NatureDefinition[] = [
  {
    id: 'adamant',
    name: { ja: 'いじっぱり', en: 'Adamant' },
    plus: 'attack',
    minus: 'sp_attack',
  },
  {
    id: 'jolly',
    name: { ja: 'ようき', en: 'Jolly' },
    plus: 'speed',
    minus: 'sp_attack',
  },
  {
    id: 'timid',
    name: { ja: 'おくびょう', en: 'Timid' },
    plus: 'speed',
    minus: 'attack',
  },
  {
    id: 'modest',
    name: { ja: 'ひかえめ', en: 'Modest' },
    plus: 'sp_attack',
    minus: 'attack',
  },
  {
    id: 'bold',
    name: { ja: 'ずぶとい', en: 'Bold' },
    plus: 'defense',
    minus: 'attack',
  },
  {
    id: 'impish',
    name: { ja: 'わんぱく', en: 'Impish' },
    plus: 'defense',
    minus: 'sp_attack',
  },
  {
    id: 'calm',
    name: { ja: 'おだやか', en: 'Calm' },
    plus: 'sp_defense',
    minus: 'attack',
  },
  {
    id: 'careful',
    name: { ja: 'しんちょう', en: 'Careful' },
    plus: 'sp_defense',
    minus: 'sp_attack',
  },
  {
    id: 'quiet',
    name: { ja: 'れいせい', en: 'Quiet' },
    plus: 'sp_attack',
    minus: 'speed',
  },
  {
    id: 'brave',
    name: { ja: 'ゆうかん', en: 'Brave' },
    plus: 'attack',
    minus: 'speed',
  },
  {
    id: 'relaxed',
    name: { ja: 'のんき', en: 'Relaxed' },
    plus: 'defense',
    minus: 'speed',
  },
  {
    id: 'sassy',
    name: { ja: 'なまいき', en: 'Sassy' },
    plus: 'sp_defense',
    minus: 'speed',
  },
  { id: 'neutral', name: { ja: 'まじめ', en: 'Serious' } },
];

export const getCalculatedStat = (
  statName: 'hp' | 'attack' | 'defense' | 'sp_attack' | 'sp_defense' | 'speed',
  base: number,
  ev: number,
  natureId: string
): number => {
  const level = 50;
  const iv = 31;

  if (statName === 'hp') {
    const baseHp = Math.floor(((base * 2 + iv) * level) / 100) + level + 10;
    return baseHp + ev;
  }

  const baseVal = Math.floor(((base * 2 + iv) * level) / 100) + 5;
  const valWithEv = baseVal + ev;

  let multiplier = 1.0;
  const nat = NATURES.find((n) => n.id === natureId);
  if (nat) {
    if (nat.plus === statName) multiplier = 1.1;
    if (nat.minus === statName) multiplier = 0.9;
  }

  return Math.floor(valWithEv * multiplier);
};

export const generatePokesolText = (
  member: PokemonInstance,
  pokemonList: PokemonMaster[],
  movesList: MoveMaster[],
  language: 'ja' | 'en'
): string => {
  const master = pokemonList.find((p) => p.id === member.masterId);
  if (!master) return '';

  const name = master.name[language];
  const ability = member.ability || master.abilities[0]?.ja || '';
  const item = member.item ? ` @ ${member.item}` : '';

  const nat =
    NATURES.find((n) => n.id === member.nature) ||
    NATURES.find((n) => n.id === 'neutral')!;
  const natureName = nat.name[language];

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
    .map((id) => movesList.find((m) => m.id === id)?.name[language])
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
  language: 'ja' | 'en'
): string => {
  return party
    .filter((m) => m.masterId > 0)
    .map((m) => generatePokesolText(m, pokemonList, movesList, language))
    .join('\n\n');
};
