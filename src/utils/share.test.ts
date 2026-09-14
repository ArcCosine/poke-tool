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
    abilityIndex: 1, // マルチスケイル
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

  it('decodes an alphanumeric string back to original pokemon config with abilityIndex', () => {
    const encoded = encodePokemonConfig(sampleConfig);
    const decoded = decodePokemonConfig(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.pokemonId).toBe(149);
    expect(decoded?.nature).toBe('adamant');
    expect(decoded?.itemId).toBe(191);
    expect(decoded?.abilityIndex).toBe(1);
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

  it('supports backward compatibility with legacy 19-byte share strings (abilityIndex defaults to 0)', () => {
    // 19-byte legacy encoded string
    const legacy19Bytes = new Uint8Array(19);
    const view = new DataView(legacy19Bytes.buffer);
    view.setUint16(0, 149, false); // pokemonId 149
    view.setUint8(2, 5); // nature
    view.setUint16(3, 191, false); // itemId 191
    view.setUint8(5, 16); // hp step
    view.setUint8(6, 32); // attack step
    const legacyEncoded = base62Encode(legacy19Bytes);

    const decoded = decodePokemonConfig(legacyEncoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.pokemonId).toBe(149);
    expect(decoded?.abilityIndex).toBe(0); // Safely defaulted to 0
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
        abilityIndex: 1,
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
        abilityIndex: 2,
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

  it('decodes an alphanumeric party string back to original party config with abilityIndex', () => {
    const encoded = encodePartyConfig(sampleParty);
    const decoded = decodePartyConfig(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.members.length).toBe(2);
    expect(decoded?.members[0].pokemonId).toBe(149);
    expect(decoded?.members[0].nature).toBe('adamant');
    expect(decoded?.members[0].abilityIndex).toBe(1);
    expect(decoded?.members[0].evs.attack).toBe(32);
    expect(decoded?.members[1].pokemonId).toBe(9);
    expect(decoded?.members[1].nature).toBe('modest');
    expect(decoded?.members[1].abilityIndex).toBe(2);
  });

  it('gracefully handles empty party or corrupted party string', () => {
    expect(decodePartyConfig('')).toBeNull();
    expect(decodePartyConfig('abc$%')).toBeNull();
  });

  it('accurately encodes and decodes pure EV steps without traditional 0-255 conversions', () => {
    const stepEvs = {
      hp: 32,
      attack: 32,
      defense: 0,
      sp_attack: 0,
      sp_defense: 0,
      speed: 2,
    };

    const code = encodePartyConfig({
      members: [
        {
          pokemonId: 149,
          nature: 'adamant',
          itemId: 0,
          abilityIndex: 0,
          evs: stepEvs,
          moves: [1, 2, 0, 0],
        },
      ],
    });

    const decoded = decodePartyConfig(code);
    expect(decoded).not.toBeNull();
    expect(decoded!.members[0].evs).toEqual(stepEvs);
  });

  it('clamps over-limit EVs (e.g. sum 76) to max 66 when encoding and decoding', () => {
    const overLimitEvs = {
      hp: 32,
      attack: 32,
      defense: 0,
      sp_attack: 0,
      sp_defense: 0,
      speed: 12, // sum = 76
    };

    const code = encodePokemonConfig({
      pokemonId: 149,
      nature: 'adamant',
      itemId: 0,
      abilityIndex: 0,
      evs: overLimitEvs,
      moves: [0, 0, 0, 0],
    });

    const decoded = decodePokemonConfig(code);
    expect(decoded).not.toBeNull();
    const sum = Object.values(decoded!.evs).reduce((a, b) => a + b, 0);
    expect(sum).toBe(66);
    expect(decoded!.evs.speed).toBe(2);
  });
});

