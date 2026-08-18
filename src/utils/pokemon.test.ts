import { describe, expect, it } from 'vitest';
import { megaStoneMap, TYPES, typeColors, typeTranslations } from './pokemon';

describe('Pokemon Common Data Utilities', () => {
  it('should define 18 types in TYPES', () => {
    expect(TYPES.length).toBe(18);
    expect(TYPES).toContain('fire');
    expect(TYPES).toContain('water');
  });

  it('should translate types correctly', () => {
    expect(typeTranslations.fire.ja).toBe('ほのお');
    expect(typeTranslations.fire.en).toBe('Fire');
    expect(typeTranslations.fairy.ja).toBe('フェアリー');
  });

  it('should have color classes for types', () => {
    expect(typeColors.fire).toBe('bg-red-500 text-white');
    expect(typeColors.normal).toBe('bg-slate-400 text-slate-900');
  });

  it('should map mega evolutions to mega stones correctly', () => {
    expect(megaStoneMap.メガフシギバナ.ja).toBe('フシギバナイト');
    expect(megaStoneMap.メガレックウザ.en).toContain('Dragon Ascent');
  });
});
