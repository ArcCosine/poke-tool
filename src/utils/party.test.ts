import { describe, expect, it } from 'vitest';
import type { MoveMaster, PokemonMaster } from './db';
import {
  analyzePartyDefense,
  analyzePartyOffense,
  getTypeMatchup,
  type PokemonInstance,
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
});
