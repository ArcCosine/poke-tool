import type { MoveMaster, PokemonMaster } from './db';

// Calculate individual stats (HP or others)
export function calculateStat(
  statName: 'hp' | 'attack' | 'defense' | 'sp_attack' | 'sp_defense' | 'speed',
  base: number,
  iv: number,
  ev: number,
  level: number,
  nature = 1.0
): number {
  if (statName === 'hp') {
    // HP calculation formula
    return (
      Math.floor(((base * 2 + iv + Math.floor(ev / 4)) * level) / 100) +
      level +
      10
    );
  }

  // Other stats calculation formula
  const baseCalculated =
    Math.floor(((base * 2 + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  return Math.floor(baseCalculated * nature);
}

// Calculate simple damage index (stat * movePower * stabMultiplier)
export function calculateDamageIndex(
  statValue: number,
  movePower: number,
  isStab: boolean
): number {
  const stabMultiplier = isStab ? 1.5 : 1.0;
  return Math.floor(statValue * movePower * stabMultiplier);
}

// Calculate maximum damage index from learnable moves
export function calculateMaxDamage(
  pokemon: PokemonMaster,
  moves: MoveMaster[]
): { value: number; moveName: { ja: string; en: string }; category: string } {
  let maxDmg = 0;
  let bestMove: MoveMaster | null = null;

  // Level 50, IV 31, EV 252, Nature 1.1 for maximizing offense
  const maxAttack = calculateStat(
    'attack',
    pokemon.base_stats.attack,
    31,
    252,
    50,
    1.1
  );
  const maxSpAttack = calculateStat(
    'sp_attack',
    pokemon.base_stats.sp_attack,
    31,
    252,
    50,
    1.1
  );

  // Filter moves that this pokemon can learn
  const learnableMoves = moves.filter((m) =>
    pokemon.learnable_moves.includes(m.id)
  );

  for (const m of learnableMoves) {
    if (m.category === 'status') continue; // status moves have no damage index

    const isPhysical = m.category === 'physical';
    const offenseStat = isPhysical ? maxAttack : maxSpAttack;
    const isStab = pokemon.types.includes(m.type);

    const dmgIndex = calculateDamageIndex(offenseStat, m.power, isStab);
    if (dmgIndex > maxDmg) {
      maxDmg = dmgIndex;
      bestMove = m;
    }
  }

  return {
    value: maxDmg,
    moveName: bestMove ? bestMove.name : { ja: 'なし', en: 'None' },
    category: bestMove ? bestMove.category : 'status',
  };
}

// Calculate maximum physical and special durability indices
export function calculateMaxDurability(pokemon: PokemonMaster): {
  physical: number;
  special: number;
} {
  // Max HP configuration (EV 252)
  const maxHp = calculateStat('hp', pokemon.base_stats.hp, 31, 252, 50);

  // Max Defense configuration (EV 252, Nature 1.1)
  const maxDefense = calculateStat(
    'defense',
    pokemon.base_stats.defense,
    31,
    252,
    50,
    1.1
  );

  // Max SpDefense configuration (EV 252, Nature 1.1)
  const maxSpDefense = calculateStat(
    'sp_defense',
    pokemon.base_stats.sp_defense,
    31,
    252,
    50,
    1.1
  );

  return {
    physical: maxHp * maxDefense,
    special: maxHp * maxSpDefense,
  };
}
