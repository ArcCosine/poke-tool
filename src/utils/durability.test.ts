import { describe, expect, it } from 'vitest';
import { calculateDurabilityIndices, optimizeHbdEvs } from './durability';

describe('durability utils', () => {
  describe('calculateDurabilityIndices', () => {
    it('should calculate physical, special, and total durability with 1.0 multipliers', () => {
      const result = calculateDurabilityIndices(150, 100, 80, 1.0, 1.0);
      expect(result.physical).toBe(15000); // 150 * 100
      expect(result.special).toBe(12000); // 150 * 80
      expect(result.total).toBe(27000); // 15000 + 12000
    });

    it('should floor effective stats when multiplier is applied', () => {
      // 95 * 1.5 = 142.5 -> floor = 142
      // 85 * 1.5 = 127.5 -> floor = 127
      const result = calculateDurabilityIndices(180, 95, 85, 1.5, 1.5);
      expect(result.physical).toBe(180 * 142);
      expect(result.special).toBe(180 * 127);
      expect(result.total).toBe(180 * 142 + 180 * 127);
    });

    it('should default multipliers to 1.0', () => {
      const result = calculateDurabilityIndices(200, 120, 110);
      expect(result.physical).toBe(24000);
      expect(result.special).toBe(22000);
      expect(result.total).toBe(46000);
    });
  });

  describe('optimizeHbdEvs', () => {
    const pikachuBase = { hp: 35, defense: 40, sp_defense: 50 };

    it('should return all zeros if remaining steps is 0', () => {
      const result = optimizeHbdEvs({
        baseStats: pikachuBase,
        nature: 'neutral',
        otherEvsTotal: 66,
        modifier: {
          defense: 1.0,
          spDefense: 1.0,
          style: 'balance',
        },
      });

      expect(result).toEqual({ hp: 0, defense: 0, sp_defense: 0 });
    });

    it('should optimize HBD with balance style (HBD/(B+D)) when all 66 steps are available', () => {
      const result = optimizeHbdEvs({
        baseStats: pikachuBase,
        nature: 'neutral',
        otherEvsTotal: 0,
        modifier: {
          defense: 1.0,
          spDefense: 1.0,
          style: 'balance',
        },
      });

      // All stats must be within 0..32
      expect(result.hp).toBeGreaterThanOrEqual(0);
      expect(result.hp).toBeLessThanOrEqual(32);
      expect(result.defense).toBeGreaterThanOrEqual(0);
      expect(result.defense).toBeLessThanOrEqual(32);
      expect(result.sp_defense).toBeGreaterThanOrEqual(0);
      expect(result.sp_defense).toBeLessThanOrEqual(32);

      // Total used steps should equal 66 (since 32 * 3 = 96 > 66)
      expect(result.hp + result.defense + result.sp_defense).toBe(66);

      // Low HP pokemon should heavily invest in HP
      expect(result.hp).toBe(32);
    });

    it('should optimize HBD with performance style (H*(B+D))', () => {
      const result = optimizeHbdEvs({
        baseStats: pikachuBase,
        nature: 'neutral',
        otherEvsTotal: 0,
        modifier: {
          defense: 1.0,
          spDefense: 1.0,
          style: 'performance',
        },
      });

      expect(result.hp + result.defense + result.sp_defense).toBe(66);
      expect(result.hp).toBe(32);
    });

    it('should handle partial remaining steps correctly (e.g. 20 remaining)', () => {
      const result = optimizeHbdEvs({
        baseStats: pikachuBase,
        nature: 'neutral',
        otherEvsTotal: 46, // 66 - 46 = 20 remaining
        modifier: {
          defense: 1.0,
          spDefense: 1.0,
          style: 'balance',
        },
      });

      expect(result.hp + result.defense + result.sp_defense).toBe(20);
    });

    it('should respect nature multipliers when calculating optimal distribution', () => {
      // Bold nature: +Defense, -Attack (nature ID: 'bold')
      const result = optimizeHbdEvs({
        baseStats: { hp: 80, defense: 80, sp_defense: 80 },
        nature: 'bold',
        otherEvsTotal: 0,
        modifier: {
          defense: 1.0,
          spDefense: 1.0,
          style: 'balance',
        },
      });

      expect(result.hp + result.defense + result.sp_defense).toBe(66);
    });

    it('should take defense/spDefense multipliers into account', () => {
      const result = optimizeHbdEvs({
        baseStats: { hp: 80, defense: 80, sp_defense: 80 },
        nature: 'neutral',
        otherEvsTotal: 0,
        modifier: {
          defense: 2.0, // High defense boost (e.g. Iron Defense)
          spDefense: 1.0,
          style: 'balance',
        },
      });

      // With Defense doubled, special defense or HP should be favored
      expect(result.hp + result.defense + result.sp_defense).toBe(66);
      expect(result.sp_defense).toBeGreaterThan(result.defense);
    });
  });
});
