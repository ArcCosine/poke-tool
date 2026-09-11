import { describe, expect, it } from 'vitest';
import type { MoveMaster, PokemonMaster } from './db';
import {
  analyzePartyDefense,
  analyzePartyOffense,
  evToStep,
  getCalculatedStat,
  getTypeMatchup,
  NATURES,
  type PokemonInstance,
  stepToEv,
} from './party';

describe('party simulation utilities', () => {
  // Mock Pokemon Master list
  const mockPokemonMaster: PokemonMaster[] = [
    {
      id: 9,
      name: { ja: 'カメックス', en: 'Blastoise' },
      types: ['water'],
      base_stats: {
        hp: 79,
        attack: 83,
        defense: 100,
        sp_attack: 85,
        sp_defense: 105,
        speed: 78,
      },
      abilities: [],
      regulations: ['M-A'],
      learnable_moves: [1, 2],
    },
    {
      id: 6,
      name: { ja: 'リザードン', en: 'Charizard' },
      types: ['fire', 'flying'],
      base_stats: {
        hp: 78,
        attack: 84,
        defense: 78,
        sp_attack: 109,
        sp_defense: 85,
        speed: 100,
      },
      abilities: [],
      regulations: ['M-A', 'M-B'], // Charizard is Gen 1, so fits in M-B too
      learnable_moves: [3],
    },
    {
      id: 150,
      name: { ja: 'ミュウツー', en: 'Mewtwo' },
      types: ['psychic'],
      base_stats: {
        hp: 106,
        attack: 110,
        defense: 90,
        sp_attack: 154,
        sp_defense: 90,
        speed: 130,
      },
      abilities: [],
      regulations: [], // Mewtwo is banned in M-A and M-B
      learnable_moves: [],
    },
  ];

  // Mock Moves Master list
  const mockMovesMaster: MoveMaster[] = [
    {
      id: 1,
      name: { ja: 'ハイドロポンプ', en: 'Hydro Pump' },
      type: 'water',
      category: 'special',
      power: 110,
      accuracy: 80,
      pp: 5,
    },
    {
      id: 2,
      name: { ja: 'れいとうビーム', en: 'Ice Beam' },
      type: 'ice',
      category: 'special',
      power: 90,
      accuracy: 100,
      pp: 10,
    },
    {
      id: 3,
      name: { ja: 'かえんほうしゃ', en: 'Flamethrower' },
      type: 'fire',
      category: 'special',
      power: 90,
      accuracy: 100,
      pp: 15,
    },
  ];

  describe('getTypeMatchup', () => {
    it('should calculate matchups for single type correctly', () => {
      // Water weaknesses/resistances
      const waterMatchups = getTypeMatchup(['water']);
      expect(waterMatchups.grass).toBe(2.0);
      expect(waterMatchups.electric).toBe(2.0);
      expect(waterMatchups.fire).toBe(0.5);
      expect(waterMatchups.water).toBe(0.5);
      expect(waterMatchups.normal).toBe(1.0);
    });

    it('should calculate matchups for dual types correctly (with overlapping modifiers)', () => {
      // Fire/Flying weaknesses/resistances
      // Flying makes Grass: 0.5 -> 0.25 (with Fire 0.5)
      // Flying makes Rock: 2.0 -> 4.0 (with Fire 2.0)
      // Flying makes Ground: 1.0 -> 0 (immunity)
      const fireFlying = getTypeMatchup(['fire', 'flying']);
      expect(fireFlying.rock).toBe(4.0);
      expect(fireFlying.grass).toBe(0.25);
      expect(fireFlying.ground).toBe(0);
      expect(fireFlying.water).toBe(2.0);
    });
  });

  describe('analyzePartyDefense', () => {
    it('should count weaknesses and resistances across the party', () => {
      const party: PokemonInstance[] = [
        {
          id: '1',
          masterId: 9,
          moves: [],
          evs: {
            hp: 0,
            attack: 0,
            defense: 0,
            sp_attack: 0,
            sp_defense: 0,
            speed: 0,
          },
          nature: 'neutral',
          ability: '',
        },
        {
          id: '2',
          masterId: 6,
          moves: [],
          evs: {
            hp: 0,
            attack: 0,
            defense: 0,
            sp_attack: 0,
            sp_defense: 0,
            speed: 0,
          },
          nature: 'neutral',
          ability: '',
        },
      ];

      const defenseAnalysis = analyzePartyDefense(party, mockPokemonMaster);
      // Grass: Blastoise is weak (2.0), Charizard double-resists (0.25).
      // Weaknesses count for Grass = 1, Resistances = 1
      expect(defenseAnalysis.grass.weaknesses).toBe(1);
      expect(defenseAnalysis.grass.resistances).toBe(1);

      // Water: Blastoise resists (0.5), Charizard is weak (2.0).
      expect(defenseAnalysis.water.weaknesses).toBe(1);
      expect(defenseAnalysis.water.resistances).toBe(1);

      // Electric: Blastoise is weak (2.0), Charizard is weak (2.0).
      expect(defenseAnalysis.electric.weaknesses).toBe(2);
      expect(defenseAnalysis.electric.resistances).toBe(0);

      // Ground: Blastoise is neutral (1.0), Charizard is immune (0).
      expect(defenseAnalysis.ground.immunities).toBe(1);
    });
  });

  describe('analyzePartyOffense', () => {
    it('should analyze type coverage for super-effective attacks', () => {
      const party: PokemonInstance[] = [
        {
          id: '1',
          masterId: 9,
          moves: [1, 2],
          evs: {
            hp: 0,
            attack: 0,
            defense: 0,
            sp_attack: 0,
            sp_defense: 0,
            speed: 0,
          },
          nature: 'neutral',
          ability: '',
        }, // Water, Ice moves
      ];

      const coverage = analyzePartyOffense(party, mockMovesMaster);
      // Ice is super effective against: Grass, Ground, Flying, Dragon
      // Water is super effective against: Fire, Ground, Rock
      // Covered types: Fire, Grass, Ground, Flying, Rock, Dragon
      expect(coverage).toContain('fire');
      expect(coverage).toContain('grass');
      expect(coverage).toContain('dragon');
      expect(coverage).not.toContain('water'); // Ice/Water doesn't hit Water super-effectively
    });
  });

  describe('getCalculatedStat', () => {
    it('should calculate HP with EVs correctly', () => {
      // Blastoise base HP: 79. EV: 252. Expected L50 HP: 186
      const hp = getCalculatedStat('hp', 79, 252, 'neutral');
      expect(hp).toBe(186);
    });

    it('should calculate stats with positive and negative nature correction and EVs correctly', () => {
      // Blastoise base Sp.Atk: 85. EV: 252. Nature: Modest (plus sp_attack) -> Expected L50 Sp.Atk: 151
      const positiveSpAtk = getCalculatedStat('sp_attack', 85, 252, 'modest');
      expect(positiveSpAtk).toBe(151);

      // Blastoise base Attack: 83. EV: 4. Nature: Modest (minus attack) -> Expected L50 Attack: 94
      const negativeAttack = getCalculatedStat('attack', 83, 4, 'modest');
      expect(negativeAttack).toBe(94);
    });
  });

  describe('evToStep & stepToEv conversion', () => {
    it('should convert traditional EV values to step values (0-32) correctly', () => {
      expect(evToStep(0)).toBe(0);
      expect(evToStep(4)).toBe(1);
      expect(evToStep(12)).toBe(2);
      expect(evToStep(20)).toBe(3);
      expect(evToStep(252)).toBe(32);
      // boundary rounding check
      expect(evToStep(10)).toBe(1); // 4 + 8*0 = 4, 10 is closest to step 1 (down)
    });

    it('should convert step values (0-32) to traditional EV values correctly', () => {
      expect(stepToEv(0)).toBe(0);
      expect(stepToEv(1)).toBe(4);
      expect(stepToEv(2)).toBe(12);
      expect(stepToEv(3)).toBe(20);
      expect(stepToEv(32)).toBe(252);
    });
  });

  describe('NATURES', () => {
    it('should define all 25 pokemon natures without duplicates', () => {
      expect(NATURES.length).toBe(25);
      const ids = NATURES.map((n) => n.id);
      expect(new Set(ids).size).toBe(25);
    });

    it('should correctly define rash (うっかりや) with +sp_attack and -sp_defense', () => {
      const rash = NATURES.find((n) => n.id === 'rash');
      expect(rash).toBeDefined();
      expect(rash?.name.ja).toBe('うっかりや');
      expect(rash?.name.en).toBe('Rash');
      expect((rash?.name as any).ko).toBe('덜렁');
      expect((rash?.name as any)['zh-Hant']).toBe('馬虎');
      expect(rash?.plus).toBe('sp_attack');
      expect(rash?.minus).toBe('sp_defense');

      // Test stat calculation with rash: Sp.Atk 1.1x, Sp.Def 0.9x
      // Blastoise base Sp.Atk: 85, EV: 0 -> (85 + 20.5) * 1.1 = 105.5 * 1.1 = 116.05 -> floor = 116
      const rashSpAtk = getCalculatedStat('sp_attack', 85, 0, 'rash');
      expect(rashSpAtk).toBe(116);

      // Blastoise base Sp.Def: 105, EV: 0 -> neutral: 125, 125 * 0.9 = 112
      const rashSpDef = getCalculatedStat('sp_defense', 105, 0, 'rash');
      expect(rashSpDef).toBe(112);
    });
  });
});
