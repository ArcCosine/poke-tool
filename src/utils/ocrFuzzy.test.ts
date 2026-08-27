import { describe, it, expect } from 'vitest';
import { levenshteinDistance, fuzzyMatch, parseStatValue, fuzzyMatchPokemonData } from './ocrFuzzy';

describe('OCR Fuzzy Matching Utilities', () => {
  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('ピカチュウ', 'ピカチュウ')).toBe(0);
    });

    it('should calculate correct distance for insertions, deletions, and substitutions', () => {
      expect(levenshteinDistance('ピカチュウ', 'ピカチユウ')).toBe(1); // 1 substitution
      expect(levenshteinDistance('リザードン', 'リサードン')).toBe(0.3); // 1 voicing mark difference (0.3 cost)
      expect(levenshteinDistance('ハラバリー', 'リラバリー')).toBe(0.25); // 1 confusable pair (0.25 cost)
      expect(levenshteinDistance('カイリュー', 'カイリュ')).toBe(1); // 1 deletion
      expect(levenshteinDistance('ゲンガ', 'ゲンガー')).toBe(1); // 1 insertion
      expect(levenshteinDistance('フシギバナ', 'フシギタネ')).toBe(2); // 2 substitutions
    });
  });

  describe('fuzzyMatch', () => {
    const list = ['ピカチュウ', 'リザードン', 'ゲンガー', 'カイリュー'];

    it('should find the exact match', () => {
      expect(fuzzyMatch('リザードン', list)).toBe('リザードン');
    });

    it('should find the closest match within threshold', () => {
      expect(fuzzyMatch('ピカチユウ', list)).toBe('ピカチュウ');
      expect(fuzzyMatch('カイリュ', list)).toBe('カイリュー');
    });

    it('should return null if distance exceeds threshold', () => {
      expect(fuzzyMatch('ミュウ', list)).toBeNull();
    });
  });

  describe('parseStatValue', () => {
    it('should parse clean numbers', () => {
      expect(parseStatValue('125')).toBe(125);
    });

    it('should fix common OCR reading errors for numbers', () => {
      expect(parseStatValue('I25')).toBe(125); // 'I' -> '1'
      expect(parseStatValue('l25')).toBe(125); // 'l' -> '1'
      expect(parseStatValue('o50')).toBe(50);   // 'o' -> '0'
      expect(parseStatValue('O50')).toBe(50);   // 'O' -> '0'
      expect(parseStatValue('S0')).toBe(50);    // 'S' -> '5' (if 'S0' is '50') -- actually we'll handle 'S' -> '5'
      expect(parseStatValue('B0')).toBe(80);    // 'B' -> '8'
      expect(parseStatValue('q0')).toBe(90);    // 'q' -> '9'
    });

    it('should strip non-numeric characters before parsing', () => {
      expect(parseStatValue('H:125')).toBe(125);
      expect(parseStatValue('A 95')).toBe(95);
      expect(parseStatValue('S: 1 10')).toBe(110);
    });

    it('should return null if no numbers are found', () => {
      expect(parseStatValue('unknown')).toBeNull();
    });
  });

  describe('fuzzyMatchPokemonData', () => {
    // We will test with a mock dictionary or basic setup
    const mockPokemonList = ['フシギバナ', 'リザードン', 'カメックス', 'ピカチュウ'];
    const mockAbilityList = ['しんりょく', 'もうか', 'げきりゅう', 'せいでんき'];
    const mockItemList = ['きあいのタスキ', 'こだわりハチマキ', 'こだわりメガネ', 'いのちのたま'];
    const mockMoveList = ['10まんボルト', 'かみなり', 'ボルトチェンジ', 'アイアンテール', 'かえんほうしゃ'];

    const dicts = {
      pokemon: mockPokemonList,
      abilities: mockAbilityList,
      items: mockItemList,
      moves: mockMoveList,
    };

    it('should correct full raw data inputs', () => {
      const rawOCR = {
        pokemonName: 'ピカチユウ',
        ability: 'せいでんき',
        item: 'いのちのたま',
        moves: ['10まんホルト', 'かみなリ', 'ホルトチエンジ', 'アイアンテール'],
        stats: {
          hp: 'I25',
          attack: '90',
          defense: 'S5',
          spAttack: 'O5',
          spDefense: 'B0',
          speed: 'l10',
        }
      };

      const matched = fuzzyMatchPokemonData(rawOCR, dicts);

      expect(matched.pokemonName).toBe('ピカチュウ');
      expect(matched.ability).toBe('せいでんき');
      expect(matched.item).toBe('いのちのたま');
      expect(matched.moves[0]).toBe('10まんボルト');
      expect(matched.moves[1]).toBe('かみなり');
      expect(matched.moves[2]).toBe('ボルトチェンジ');
      expect(matched.moves[3]).toBe('アイアンテール');
      expect(matched.stats.hp).toBe(125);
      expect(matched.stats.attack).toBe(90);
      expect(matched.stats.defense).toBe(55);
      expect(matched.stats.spAttack).toBe(5); // 'O5' -> 5
      expect(matched.stats.spDefense).toBe(80); // 'B0' -> 80
      expect(matched.stats.speed).toBe(110);
    });

    it('should use fallback "認識できませんでした" for fields failing match', () => {
      const rawOCR = {
        pokemonName: 'あいうえお', // Completely wrong
        ability: '???',
        item: '???',
        moves: ['???', '???', '???', '???'],
        stats: {
          hp: 'abc',
          attack: 'xyz',
          defense: '---',
          spAttack: '...',
          spDefense: '...',
          speed: '...',
        }
      };

      const matched = fuzzyMatchPokemonData(rawOCR, dicts);

      expect(matched.pokemonName).toBe('認識できませんでした');
      expect(matched.ability).toBe('認識できませんでした');
      expect(matched.item).toBe('認識できませんでした');
      expect(matched.moves[0]).toBe('認識できませんでした');
      expect(matched.stats.hp).toBeNull(); // stats can be null or fallback to 0
    });
  });
});
