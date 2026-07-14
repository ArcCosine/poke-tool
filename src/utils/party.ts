import type { MoveMaster, PokemonMaster } from './db';

export interface PokemonInstance {
  id: string;
  masterId: number;
  ability: string;
  nature: string;
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

// Validate party composition against selected regulation
export function validatePartyRegulation(
  party: PokemonInstance[],
  pokemonMasterList: PokemonMaster[],
  regulationName: string,
  language: 'ja' | 'en' = 'ja'
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const instance of party) {
    const master = pokemonMasterList.find((p) => p.id === instance.masterId);
    if (!master) {
      errors.push(
        language === 'ja'
          ? `不明なポケモンID: ${instance.masterId}`
          : `Unknown Pokémon ID: ${instance.masterId}`
      );
      continue;
    }

    if (!master.regulations.includes(regulationName)) {
      errors.push(
        language === 'ja'
          ? `${master.name.ja} はレギュレーション ${regulationName} では使用制限されています。`
          : `${master.name.en} is not allowed in Regulation ${regulationName}.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
