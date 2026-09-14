import { normalizeEvs } from './pokemon';

export interface SharedPokemonConfig {
  pokemonId: number;
  nature: string;
  itemId: number;
  abilityIndex?: number;
  evs: {
    hp: number;
    attack: number;
    defense: number;
    sp_attack: number;
    sp_defense: number;
    speed: number;
  };
  moves: number[];
}

export interface SharedPartyConfig {
  members: SharedPokemonConfig[];
}

const BASE62_ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const NATURE_LIST: string[] = [
  'neutral',
  'hardy',
  'lonely',
  'brave',
  'adamant',
  'naughty',
  'bold',
  'docile',
  'relaxed',
  'impish',
  'lax',
  'timid',
  'hasty',
  'serious',
  'jolly',
  'naive',
  'modest',
  'mild',
  'quiet',
  'bashful',
  'rash',
  'calm',
  'gentle',
  'sassy',
  'careful',
  'quirky',
];

const BYTES_PER_POKEMON = 20;
const LEGACY_BYTES_PER_POKEMON = 19;

/**
 * Encodes Uint8Array into an alphanumeric Base62 string
 */
export function base62Encode(data: Uint8Array): string {
  if (data.length === 0) return '';

  let leadingZeros = 0;
  while (leadingZeros < data.length && data[leadingZeros] === 0) {
    leadingZeros++;
  }

  // Convert remaining bytes to BigInt
  let num = 0n;
  for (let i = leadingZeros; i < data.length; i++) {
    num = (num << 8n) | BigInt(data[i]);
  }

  let result = '';
  while (num > 0n) {
    const rem = Number(num % 62n);
    result = BASE62_ALPHABET[rem] + result;
    num /= 62n;
  }

  // Prepend '0' for leading zero bytes
  return '0'.repeat(leadingZeros) + result;
}

/**
 * Decodes Base62 string back into Uint8Array with expected length
 */
export function base62Decode(str: string, expectedLength?: number): Uint8Array {
  if (!str) return new Uint8Array(0);

  // Validate only alphanumeric characters
  if (!/^[0-9a-zA-Z]+$/.test(str)) {
    throw new Error('Invalid Base62 string');
  }

  let leadingZeros = 0;
  while (leadingZeros < str.length && str[leadingZeros] === '0') {
    leadingZeros++;
  }

  let num = 0n;
  for (let i = leadingZeros; i < str.length; i++) {
    const char = str[i];
    const idx = BASE62_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error('Invalid character in Base62');
    num = num * 62n + BigInt(idx);
  }

  // Convert BigInt to byte array
  const byteList: number[] = [];
  while (num > 0n) {
    byteList.push(Number(num & 0xffn));
    num >>= 8n;
  }
  byteList.reverse();

  const totalLength = expectedLength ?? leadingZeros + byteList.length;
  const result = new Uint8Array(totalLength);
  const targetOffset = totalLength - byteList.length;
  result.set(byteList, targetOffset);

  return result;
}

/**
 * Serializes a single Pokemon config into 20 bytes
 */
function serializePokemon(
  config: SharedPokemonConfig,
  buffer: Uint8Array,
  offset: number
) {
  const view = new DataView(
    buffer.buffer,
    buffer.byteOffset + offset,
    BYTES_PER_POKEMON
  );

  // pokemonId (Uint16, 2 bytes, 0..1)
  view.setUint16(0, config.pokemonId, false);

  // nature (Uint8, 1 byte, 2)
  const natIdx = NATURE_LIST.indexOf(config.nature);
  view.setUint8(2, natIdx >= 0 ? natIdx : 0);

  // itemId (Uint16, 2 bytes, 3..4)
  view.setUint16(3, config.itemId || 0, false);

  // evs steps (6 bytes, 5..10)
  const normalizedEvs = normalizeEvs(config.evs);
  view.setUint8(5, normalizedEvs.hp);
  view.setUint8(6, normalizedEvs.attack);
  view.setUint8(7, normalizedEvs.defense);
  view.setUint8(8, normalizedEvs.sp_attack);
  view.setUint8(9, normalizedEvs.sp_defense);
  view.setUint8(10, normalizedEvs.speed);

  // moves (4 x Uint16 = 8 bytes, 11..18)
  for (let m = 0; m < 4; m++) {
    const moveId = config.moves && config.moves[m] ? config.moves[m] : 0;
    view.setUint16(11 + m * 2, moveId, false);
  }

  // abilityIndex (Uint8, 1 byte, 19)
  view.setUint8(19, config.abilityIndex ?? 0);
}

/**
 * Deserializes 20 (or legacy 19) bytes into a single Pokemon config
 */
function deserializePokemon(
  buffer: Uint8Array,
  offset: number,
  bytesPerPokemon = BYTES_PER_POKEMON
): SharedPokemonConfig {
  const view = new DataView(
    buffer.buffer,
    buffer.byteOffset + offset,
    bytesPerPokemon
  );

  const pokemonId = view.getUint16(0, false);
  const natIdx = view.getUint8(2);
  const nature = NATURE_LIST[natIdx] || 'neutral';
  const itemId = view.getUint16(3, false);

  const evs = normalizeEvs({
    hp: view.getUint8(5),
    attack: view.getUint8(6),
    defense: view.getUint8(7),
    sp_attack: view.getUint8(8),
    sp_defense: view.getUint8(9),
    speed: view.getUint8(10),
  });

  const moves = [
    view.getUint16(11, false),
    view.getUint16(13, false),
    view.getUint16(15, false),
    view.getUint16(17, false),
  ];

  let abilityIndex = 0;
  if (bytesPerPokemon >= 20) {
    abilityIndex = view.getUint8(19);
  }

  return {
    pokemonId,
    nature,
    itemId,
    abilityIndex,
    evs,
    moves,
  };
}

/**
 * Encodes a Pokemon config into an alphanumeric Base62 string (EV Calculator)
 */
export function encodePokemonConfig(config: SharedPokemonConfig): string {
  const buffer = new Uint8Array(BYTES_PER_POKEMON);
  serializePokemon(config, buffer, 0);
  return base62Encode(buffer);
}

/**
 * Decodes an alphanumeric Base62 string back to a Pokemon config (supporting both 20-byte and legacy 19-byte)
 */
export function decodePokemonConfig(str: string): SharedPokemonConfig | null {
  try {
    if (!str || !/^[0-9a-zA-Z]+$/.test(str)) return null;

    // Try 20-byte format first
    try {
      const bytes = base62Decode(str, BYTES_PER_POKEMON);
      if (bytes.length === BYTES_PER_POKEMON) {
        const config = deserializePokemon(bytes, 0, BYTES_PER_POKEMON);
        if (config.pokemonId > 0) return config;
      }
    } catch {
      // ignore and try legacy
    }

    // Try legacy 19-byte format
    try {
      const bytes = base62Decode(str, LEGACY_BYTES_PER_POKEMON);
      if (bytes.length === LEGACY_BYTES_PER_POKEMON) {
        const config = deserializePokemon(bytes, 0, LEGACY_BYTES_PER_POKEMON);
        if (config.pokemonId > 0) return config;
      }
    } catch {
      // ignore
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Encodes a Party config into an alphanumeric Base62 string (Party Simulator)
 */
export function encodePartyConfig(party: SharedPartyConfig): string {
  const count = Math.min(6, party.members.length);
  const buffer = new Uint8Array(count * BYTES_PER_POKEMON);
  for (let i = 0; i < count; i++) {
    serializePokemon(party.members[i], buffer, i * BYTES_PER_POKEMON);
  }
  return base62Encode(buffer);
}

/**
 * Decodes an alphanumeric Base62 string back to a Party config (supporting 20-byte and legacy 19-byte)
 */
export function decodePartyConfig(str: string): SharedPartyConfig | null {
  try {
    if (!str || !/^[0-9a-zA-Z]+$/.test(str)) return null;

    const approxBytes = Math.round((str.length * Math.log2(62)) / 8);

    for (const bpp of [BYTES_PER_POKEMON, LEGACY_BYTES_PER_POKEMON]) {
      const count = Math.min(
        6,
        Math.max(1, Math.round(approxBytes / bpp))
      );
      const expectedLen = count * bpp;
      try {
        const bytes = base62Decode(str, expectedLen);
        if (bytes.length % bpp === 0 && bytes.length > 0) {
          const memberCount = bytes.length / bpp;
          const members: SharedPokemonConfig[] = [];
          for (let i = 0; i < memberCount; i++) {
            const p = deserializePokemon(bytes, i * bpp, bpp);
            if (p.pokemonId > 0) {
              members.push(p);
            }
          }
          if (members.length > 0) return { members };
        }
      } catch {
        continue;
      }
    }

    return null;
  } catch {
    return null;
  }
}

