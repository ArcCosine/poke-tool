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

// Calculate maximum damage index from learnable moves, factoring in abilities
export interface MaxDamageMoveInfo {
  value: number;
  moveName: { ja: string; en: string };
  category: string;
  moveType: string;
  abilityName: { ja: string; en: string };
}

export function calculateMaxDamage(
  pokemon: PokemonMaster,
  moves: MoveMaster[]
): MaxDamageMoveInfo[] {
  // Keep track of the best damage setup for each move ID
  const bestMovesMap = new Map<number, MaxDamageMoveInfo>();

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

  const abilities =
    pokemon.abilities && pokemon.abilities.length > 0
      ? pokemon.abilities
      : [{ ja: 'なし', en: 'None' }];

  for (const ability of abilities) {
    const abilityNameJa = ability.ja;
    const abilityNameEn = ability.en;

    for (const m of learnableMoves) {
      if (m.category === 'status') continue; // status moves have no damage index

      const isPhysical = m.category === 'physical';
      let offenseStat = isPhysical ? maxAttack : maxSpAttack;

      // 1. Ability-based Stat Modifiers
      if (isPhysical) {
        if (
          abilityNameJa === 'ちからもち' ||
          abilityNameJa === 'よがみ' ||
          abilityNameEn === 'Huge Power' ||
          abilityNameEn === 'Pure Power'
        ) {
          offenseStat = offenseStat * 2;
        } else if (
          abilityNameJa === 'ごりむちゅう' ||
          abilityNameEn === 'Gorilla Tactics'
        ) {
          offenseStat = Math.floor(offenseStat * 1.5);
        } else if (
          abilityNameJa === 'こんじょう' ||
          abilityNameEn === 'Guts'
        ) {
          offenseStat = Math.floor(offenseStat * 1.5);
        }
      } else {
        if (
          abilityNameJa === 'サンパワー' ||
          abilityNameEn === 'Solar Power'
        ) {
          offenseStat = Math.floor(offenseStat * 1.5);
        }
      }

      // 2. Base Power modifiers (e.g. Technician, Sand Force)
      let basePower = m.power;
      let moveType = m.type;

      // Skin abilities (normal type moves change type and get 1.2x boost)
      if (m.type === 'normal') {
        if (
          abilityNameJa === 'フェアリースキン' ||
          abilityNameEn === 'Pixilate'
        ) {
          moveType = 'fairy';
          basePower = basePower * 1.2;
        } else if (
          abilityNameJa === 'フリーズスキン' ||
          abilityNameEn === 'Refrigerate'
        ) {
          moveType = 'ice';
          basePower = basePower * 1.2;
        } else if (
          abilityNameJa === 'エレキスキン' ||
          abilityNameEn === 'Galvanize'
        ) {
          moveType = 'electric';
          basePower = basePower * 1.2;
        } else if (
          abilityNameJa === 'スカイスキン' ||
          abilityNameEn === 'Aerilate'
        ) {
          moveType = 'flying';
          basePower = basePower * 1.2;
        }
      }

      // Technician (boosts moves with base power <= 60 by 1.5x)
      if (
        abilityNameJa === 'テクニシャン' ||
        abilityNameEn === 'Technician'
      ) {
        if (m.power <= 60) {
          basePower = basePower * 1.5;
        }
      }

      // Sand Force (boosts Rock, Ground, Steel moves by 1.3x)
      if (
        abilityNameJa === 'すなのちから' ||
        abilityNameEn === 'Sand Force'
      ) {
        if (
          moveType === 'rock' ||
          moveType === 'ground' ||
          moveType === 'steel'
        ) {
          basePower = basePower * 1.3;
        }
      }

      // Transistor (boosts Electric moves by 1.3x)
      if (
        abilityNameJa === 'トランジスタ' ||
        abilityNameEn === 'Transistor'
      ) {
        if (moveType === 'electric') {
          basePower = basePower * 1.3;
        }
      }

      // Dragon's Maw (boosts Dragon moves by 1.5x)
      if (
        abilityNameJa === 'りゅうのあぎと' ||
        abilityNameEn === "Dragon's Maw"
      ) {
        if (moveType === 'dragon') {
          basePower = basePower * 1.5;
        }
      }

      // Pinch type multipliers (Swarm, Overgrow, Blaze, Torrent - 1.5x to respective types)
      if (
        (abilityNameJa === 'むしのしらせ' || abilityNameEn === 'Swarm') &&
        moveType === 'bug'
      ) {
        basePower = basePower * 1.5;
      } else if (
        (abilityNameJa === 'しんりょく' || abilityNameEn === 'Overgrow') &&
        moveType === 'grass'
      ) {
        basePower = basePower * 1.5;
      } else if (
        (abilityNameJa === 'もうか' || abilityNameEn === 'Blaze') &&
        moveType === 'fire'
      ) {
        basePower = basePower * 1.5;
      } else if (
        (abilityNameJa === 'げきりゅう' || abilityNameEn === 'Torrent') &&
        moveType === 'water'
      ) {
        basePower = basePower * 1.5;
      }

      // 3. STAB (Same Type Attack Bonus)
      const isStab = pokemon.types.includes(moveType);
      let stabMultiplier = 1.0;
      if (isStab) {
        if (
          abilityNameJa === 'てきおうりょく' ||
          abilityNameEn === 'Adaptability'
        ) {
          stabMultiplier = 2.0;
        } else {
          stabMultiplier = 1.5;
        }
      }

      // Calculate simple damage index
      const dmgIndex = Math.floor(offenseStat * basePower * stabMultiplier);

      const existing = bestMovesMap.get(m.id);
      if (!existing || dmgIndex > existing.value) {
        bestMovesMap.set(m.id, {
          value: dmgIndex,
          moveName: m.name,
          category: m.category,
          moveType: moveType,
          abilityName: ability,
        });
      }
    }
  }

  // Sort by value descending
  const sortedMoves = Array.from(bestMovesMap.values()).sort(
    (a, b) => b.value - a.value
  );

  return sortedMoves;
}

export interface MaxDurabilityInfo {
  physical: number;
  physicalAbility: { ja: string; en: string };
  special: number;
  specialAbility: { ja: string; en: string };
}

// Calculate maximum physical and special durability indices, factoring in defensive abilities
export function calculateMaxDurability(pokemon: PokemonMaster): MaxDurabilityInfo {
  // Max HP configuration (EV 252)
  const maxHp = calculateStat('hp', pokemon.base_stats.hp, 31, 252, 50);

  // Max Defense configuration (EV 252, Nature 1.1)
  const baseDefense = calculateStat(
    'defense',
    pokemon.base_stats.defense,
    31,
    252,
    50,
    1.1
  );

  // Max SpDefense configuration (EV 252, Nature 1.1)
  const baseSpDefense = calculateStat(
    'sp_defense',
    pokemon.base_stats.sp_defense,
    31,
    252,
    50,
    1.1
  );

  const abilities =
    pokemon.abilities && pokemon.abilities.length > 0
      ? pokemon.abilities
      : [{ ja: 'なし', en: 'None' }];

  let maxPhysical = 0;
  let bestPhysicalAbility = abilities[0];
  let maxSpecial = 0;
  let bestSpecialAbility = abilities[0];

  for (const ability of abilities) {
    const nameJa = ability.ja;
    const nameEn = ability.en;

    // --- Physical Defense modifiers ---
    let def = baseDefense;
    if (nameJa === 'ファーコート' || nameEn === 'Fur Coat') {
      def = def * 2;
    } else if (nameJa === 'ふしぎなうろこ' || nameEn === 'Marvel Scale') {
      def = Math.floor(def * 1.5);
    }

    // --- Special Defense modifiers ---
    let spDef = baseSpDefense;
    if (nameJa === 'こおりのりんぷん' || nameEn === 'Ice Scales') {
      spDef = spDef * 2; // Damage halved -> Effective SpDef doubled
    } else if (
      (nameJa === 'すなおこし' || nameEn === 'Sand Stream') &&
      pokemon.types.includes('rock')
    ) {
      spDef = Math.floor(spDef * 1.5);
    }

    // --- Overall multipliers (Multiscale, Shadow Shield - 0.5x damage taken)
    let overallMultiplier = 1.0;
    if (
      nameJa === 'マルチスケイル' ||
      nameJa === 'ファントムガード' ||
      nameEn === 'Multiscale' ||
      nameEn === 'Shadow Shield'
    ) {
      overallMultiplier = 2.0;
    }

    const physDur = Math.floor(maxHp * def * overallMultiplier);
    const specDur = Math.floor(maxHp * spDef * overallMultiplier);

    if (physDur > maxPhysical) {
      maxPhysical = physDur;
      bestPhysicalAbility = ability;
    }
    if (specDur > maxSpecial) {
      maxSpecial = specDur;
      bestSpecialAbility = ability;
    }
  }

  // Fallback in case of strict inequalities not catching the first loop (e.g. all 0 / same values)
  if (maxPhysical === 0) {
    maxPhysical = Math.floor(maxHp * baseDefense);
    bestPhysicalAbility = abilities[0];
  }
  if (maxSpecial === 0) {
    maxSpecial = Math.floor(maxHp * baseSpDefense);
    bestSpecialAbility = abilities[0];
  }

  return {
    physical: maxPhysical,
    physicalAbility: bestPhysicalAbility,
    special: maxSpecial,
    specialAbility: bestSpecialAbility,
  };
}
