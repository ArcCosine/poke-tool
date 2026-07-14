import { describe, expect, it } from 'vitest';
import {
  calculateDamageIndex,
  calculateMaxDamage,
  calculateMaxDurability,
  calculateStat,
} from './calculator';
import type { MoveMaster, PokemonMaster } from './db';

describe('calculator utilities', () => {
  describe('calculateStat', () => {
    it('should calculate HP correctly at level 50', () => {
      // Blastoise (HP base: 79), IV: 31, EV: 252 -> Max HP
      const hp = calculateStat('hp', 79, 31, 252, 50);
      expect(hp).toBe(186); // 79 + 75 + 63 = 186
    });

    it('should calculate other stats with neutral nature correctly', () => {
      // Blastoise (Sp.Atk base: 85), IV: 31, EV: 252, Nature: 1.0
      const stat = calculateStat('sp_attack', 85, 31, 252, 50, 1.0);
      expect(stat).toBe(137); // floor(85 + 20 + 63) * 1.0 = 168 / 137?
      // Wait, let's verify formula:
      // stat = floor( (base * 2 + iv + floor(ev/4)) * level / 100 ) + 5
      // For level 50, iv 31, ev 252:
      // floor( (85 * 2 + 31 + 63) * 0.5 ) + 5 = floor( (170 + 94) * 0.5 ) + 5 = floor(264 * 0.5) + 5 = 132 + 5 = 137. Yes!
    });

    it('should calculate other stats with positive nature correctly', () => {
      // Blastoise (Sp.Atk base: 85), IV: 31, EV: 252, Nature: 1.1 (max stat)
      const stat = calculateStat('sp_attack', 85, 31, 252, 50, 1.1);
      expect(stat).toBe(150); // floor(137 * 1.1) = 150
    });
  });

  describe('calculateDamageIndex', () => {
    it('should calculate damage index with STAB', () => {
      const index = calculateDamageIndex(150, 120, true);
      expect(index).toBe(27000); // 150 * 120 * 1.5 = 27000
    });

    it('should calculate damage index without STAB', () => {
      const index = calculateDamageIndex(150, 120, false);
      expect(index).toBe(18000); // 150 * 120 * 1.0 = 18000
    });
  });

  describe('calculateMaxDamage', () => {
    it('should find maximum damage index for a pokemon based on its learnable moves', () => {
      const mockPokemon: PokemonMaster = {
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
        abilities: [{ ja: 'げきりゅう', en: 'torrent' }],
        regulations: ['M-A'],
        learnable_moves: [1, 2], // Hydro Pump (water, power 110), Ice Beam (ice, power 90)
      };

      const mockMoves: MoveMaster[] = [
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
      ];

      const maxDmg = calculateMaxDamage(mockPokemon, mockMoves);
      // Sp.Atk max is 150 (neutral 137 * 1.1).
      // Hydro Pump power 110, STAB: true -> 150 * 110 * 1.5 = 24750
      // Ice Beam power 90, STAB: false -> 150 * 90 * 1.0 = 13500
      expect(maxDmg.value).toBe(24750);
      expect(maxDmg.moveName.ja).toBe('ハイドロポンプ');
    });
  });

  describe('calculateMaxDurability', () => {
    it('should calculate maximum physical and special durability indices', () => {
      const mockPokemon: PokemonMaster = {
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
        regulations: [],
        learnable_moves: [],
      };

      const durability = calculateMaxDurability(mockPokemon);
      // Max HP: base 79 -> 186 (neutral)
      // For physical durability:
      // Max Defense: base 100 -> neutral 120, positive 120 * 1.1 = 167 (when EV: 252, nature: 1.1)
      // HP with max physical setup: EV 252 -> 186. Defense: EV 252, Nature 1.1 -> 167. Physical = 186 * 167 = 31062
      // For special durability:
      // Max SpDef: base 105 -> neutral 125, positive 125 * 1.1 = 172. Special = 186 * 172 = 31992
      expect(durability.physical).toBe(31062);
      expect(durability.special).toBe(31992);
    });
  });
});
