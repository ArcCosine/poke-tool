import { describe, expect, it } from 'vitest';
import {
  katakanaToHiragana,
  normalizeSearchText,
  romajiToKatakana,
} from './string';

describe('romajiToKatakana', () => {
  it('should convert basic romaji to katakana', () => {
    expect(romajiToKatakana('pikachu')).toBe('ピカチュウ');
    expect(romajiToKatakana('fushigibana')).toBe('フシギバナ');
    expect(romajiToKatakana('rizadon')).toBe('リザドン'); // ri-za-do-n without dash is fine
    expect(romajiToKatakana('kamex')).toBe('カメックス');
  });

  it('should handle long vowels with dashes or double vowels', () => {
    expect(romajiToKatakana('genga-')).toBe('ゲンガー');
    expect(romajiToKatakana('gengaa')).toBe('ゲンガア');
  });

  it('should handle double consonants (sokuon)', () => {
    expect(romajiToKatakana('pallisu')).toBe('パッリス');
    expect(romajiToKatakana('potchama')).toBe('ポッチャマ');
    expect(romajiToKatakana('pocchama')).toBe('ポッチャマ');
  });

  it('should ignore trailing incomplete consonants for search matching', () => {
    expect(romajiToKatakana('pikac')).toBe('ピカ');
    expect(romajiToKatakana('pikach')).toBe('ピカ');
    expect(romajiToKatakana('geng')).toBe('ゲン');
  });
});

describe('normalizeSearchText', () => {
  it('should convert hiragana to katakana', () => {
    expect(normalizeSearchText('ぴかちゅう')).toBe('ピカチュウ');
  });

  it('should normalize uppercase/lowercase and spaces', () => {
    expect(normalizeSearchText('  Pikachu  ')).toBe('ピカチュウ');
  });

  it('should keep katakana as is', () => {
    expect(normalizeSearchText('ピカチュウ')).toBe('ピカチュウ');
  });
});

describe('katakanaToHiragana', () => {
  it('should convert basic katakana to hiragana', () => {
    expect(katakanaToHiragana('ピカチュウ')).toBe('ぴかちゅう');
    expect(katakanaToHiragana('こだわりハチマキ')).toBe('こだわりはちまき');
  });

  it('should leave kanji and hiragana unchanged', () => {
    expect(katakanaToHiragana('くろい鉄球')).toBe('くろい鉄球');
  });
});
