import { describe, expect, it } from 'vitest';
import {
  base62Decode,
  base62Encode,
  decodePartyConfig,
  decodePokemonConfig,
  encodePartyConfig,
  encodePokemonConfig,
  type SharedPartyConfig,
  type SharedPokemonConfig,
} from './share';

describe('Base62 Encoding and Decoding', () => {
  it('encodes and decodes Uint8Array correctly without any special characters', () => {
    const data = new Uint8Array([1, 255, 0, 42, 128, 64, 15, 0]);
    const encoded = base62Encode(data);

    // Only alphanumeric characters
    expect(encoded).toMatch(/^[0-9a-zA-Z]+$/);

    const decoded = base62Decode(encoded, data.length);
    expect(Array.from(decoded)).toEqual(Array.from(data));
  });

  it('handles empty and small arrays', () => {
    const empty = new Uint8Array([]);
    expect(base62Encode(empty)).toBe('');
    expect(Array.from(base62Decode('', 0))).toEqual([]);

    const single = new Uint8Array([42]);
    const encSingle = base62Encode(single);
    expect(encSingle).toMatch(/^[0-9a-zA-Z]+$/);
    expect(Array.from(base62Decode(encSingle, 1))).toEqual([42]);
  });
});

describe('Pokemon Config Share (EV Calculator)', () => {
  const sampleConfig: SharedPokemonConfig = {
    pokemonId: 149, // カイリュー
    nature: 'adamant',
    itemId: 191, // しろいハーブ
    evs: {
      hp: 16,
      attack: 32,
      defense: 0,
      sp_attack: 0,
      sp_defense: 2,
      speed: 16,
    },
    moves: [1, 2, 3, 4],
  };

  it('encodes a pokemon config into an alphanumeric string (no %)', () => {
    const encoded = encodePokemonConfig(sampleConfig);
    expect(encoded).toBeTruthy();
    expect(encoded).toMatch(/^[0-9a-zA-Z]+$/);
    expect(encoded.includes('%')).toBe(false);
  });

  it('decodes an alphanumeric string back to original pokemon config', () => {
    const encoded = encodePokemonConfig(sampleConfig);
    const decoded = decodePokemonConfig(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.pokemonId).toBe(149);
    expect(decoded?.nature).toBe('adamant');
    expect(decoded?.itemId).toBe(191);
    expect(decoded?.evs).toEqual({
      hp: 16,
      attack: 32,
      defense: 0,
      sp_attack: 0,
      sp_defense: 2,
      speed: 16,
    });
    expect(decoded?.moves).toEqual([1, 2, 3, 4]);
  });

  it('gracefully returns null for invalid or corrupted string', () => {
    expect(decodePokemonConfig('invalid!!str%')).toBeNull();
    expect(decodePokemonConfig('0')).toBeNull();
  });
});

describe('Party Config Share (Party Simulator)', () => {
  const sampleParty: SharedPartyConfig = {
    members: [
      {
        pokemonId: 149,
        nature: 'adamant',
        itemId: 191,
        evs: {
          hp: 16,
          attack: 32,
          defense: 0,
          sp_attack: 0,
          sp_defense: 0,
          speed: 18,
        },
        moves: [100, 200, 300, 0],
      },
      {
        pokemonId: 9, // カメックス
        nature: 'modest',
        itemId: 0,
        evs: {
          hp: 32,
          attack: 0,
          defense: 4,
          sp_attack: 30,
          sp_defense: 0,
          speed: 0,
        },
        moves: [50, 60, 0, 0],
      },
    ],
  };

  it('encodes a party config into an alphanumeric string', () => {
    const encoded = encodePartyConfig(sampleParty);
    expect(encoded).toBeTruthy();
    expect(encoded).toMatch(/^[0-9a-zA-Z]+$/);
    expect(encoded.includes('%')).toBe(false);
  });

  it('decodes an alphanumeric party string back to original party config', () => {
    const encoded = encodePartyConfig(sampleParty);
    const decoded = decodePartyConfig(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.members.length).toBe(2);
    expect(decoded?.members[0].pokemonId).toBe(149);
    expect(decoded?.members[0].nature).toBe('adamant');
    expect(decoded?.members[0].evs.attack).toBe(32);
    expect(decoded?.members[1].pokemonId).toBe(9);
    expect(decoded?.members[1].nature).toBe('modest');
  });

  it('gracefully handles empty party or corrupted party string', () => {
    expect(decodePartyConfig('')).toBeNull();
    expect(decodePartyConfig('abc$%')).toBeNull();
  });
});
