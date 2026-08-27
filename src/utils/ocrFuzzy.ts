/**
 * Visually similar Japanese characters that are frequently confused by OCR models.
 */
const OCR_CONFUSABLE_PAIRS = [
  ['ハ', 'リ'],
  ['ハ', '八'],
  ['リ', '八'],
  ['ソ', 'ン'],
  ['ソ', 'リ'],
  ['ン', 'リ'],
  ['ツ', 'シ'],
  ['ク', 'ケ'],
  ['ク', 'タ'],
  ['タ', 'ケ'],
  ['フ', 'ウ'],
  ['フ', 'ワ'],
  ['ウ', 'ワ'],
  ['ア', 'マ'],
  ['マ', 'ム'],
  ['チ', 'テ'],
  ['コ', 'ユ'],
  ['ニ', '三'],
  ['ニ', '二'],
];

/**
 * Calculates custom substitution cost based on visual similarities.
 * Voicing mark differences cost 0.3, highly confusable shape pairs cost 0.25, normal cost is 1.0.
 */
function getSubstitutionCost(charA: string, charB: string): number {
  if (charA === charB) return 0;

  // 1. Check for Dakuten / Handakuten voicing mark differences (e.g. ハ <-> バ <-> パ)
  const normA = charA.normalize('NFD');
  const normB = charB.normalize('NFD');
  if (normA[0] === normB[0]) {
    return 0.3; // Small cost for voicing differences
  }

  // 2. Check for visually similar Katakana shape pairs
  for (const pair of OCR_CONFUSABLE_PAIRS) {
    if (
      (charA === pair[0] && charB === pair[1]) ||
      (charA === pair[1] && charB === pair[0])
    ) {
      return 0.25; // Small cost for visual shape confusion
    }
  }

  return 1.0;
}

/**
 * Calculates the Weighted Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = getSubstitutionCost(a[i - 1], b[j - 1]);
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1, // deletion
        tmp[i][j - 1] + 1, // insertion
        tmp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return tmp[a.length][b.length];
}

/**
 * Normalizes Japanese text for robust OCR matching by converting common 
 * OCR misreads (Katakana vs Kanji), stripping punctuation, middle-dots, and space.
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    // Convert Full-width alphanumeric to Half-width lowercase
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    // Convert Hiragana to Katakana
    .replace(/[\u3041-\u3096]/g, (s) => String.fromCharCode(s.charCodeAt(0) + 0x60))
    // Convert common OCR misread characters between Katakana and Kanji
    .replace(/口/g, 'ロ') // Kanji mouth -> Katakana Ro
    .replace(/工/g, 'エ') // Kanji work -> Katakana E
    .replace(/二/g, 'ニ') // Kanji two -> Katakana Ni
    .replace(/卜/g, 'ト') // Kanji divination -> Katakana To
    .replace(/夕/g, 'タ') // Kanji evening -> Katakana Ta
    .replace(/ハ/g, '八') // Normalize Katakana Ha/Kanji Eight (often confused)
    // Normalize dashes and prolong symbols to standard Katakana prolonged sound mark
    .replace(/[一\-\u2010\u2011\u2012\u2013\u2014\u2015\u2212\_]/g, 'ー')
    // Remove space, middle dots, periods, commas, exclamations, brackets, and parenthesis
    .replace(/[\s・\.\,\:\;\!\?\"\'\`\+\-\=]/g, '')
    .replace(/[()（）\[\]【】]/g, '');
}

/**
 * Finds the closest matching string in a list using normalized strings,
 * length-dependent dynamic Levenshtein distance thresholds, and substring overlap detection.
 */
export function fuzzyMatch(text: string, list: string[]): string | null {
  if (!text) return null;
  
  const cleanText = normalizeText(text);
  if (!cleanText) return null;

  let bestMatch: string | null = null;
  let minDistance = Number.MAX_SAFE_INTEGER;
  let maxMatchRatio = 0;

  for (const candidate of list) {
    const cleanCand = normalizeText(candidate);
    if (!cleanCand) continue;

    // 1. Exact match after normalization
    if (cleanText === cleanCand) {
      return candidate;
    }

    // 2. Dynamic Levenshtein distance check
    const distance = levenshteinDistance(cleanText, cleanCand);
    
    // Dynamic threshold: strict (1) for short words, loose (3) for longer names
    const dynamicThreshold = Math.max(1, Math.min(3, Math.floor(cleanCand.length * 0.35)));

    if (distance < minDistance && distance <= dynamicThreshold) {
      minDistance = distance;
      bestMatch = candidate;
    }

    // 3. Substring overlap check (for truncated words or words with noise attached)
    if (cleanCand.length >= 3 && cleanText.length >= 3) {
      if (cleanCand.includes(cleanText) || cleanText.includes(cleanCand)) {
        const matchRatio = Math.min(cleanCand.length, cleanText.length) / Math.max(cleanCand.length, cleanText.length);
        if (matchRatio > 0.6 && matchRatio > maxMatchRatio) {
          maxMatchRatio = matchRatio;
          bestMatch = candidate;
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Pre-processes numbers by converting common OCR reading mistakes to digits,
 * stripping non-numeric noise, and returning parsed integer.
 */
export function parseStatValue(text: string): number | null {
  if (!text) return null;

  // 1. Remove status labels at the beginning (e.g., "H: 120", "S: 95", "HP 150")
  const labelRegex = /^(?:(HP|Attack|Defense|Sp\.?\s*Atk|Sp\.?\s*Def|Speed)\s*[:：]?\s*|(H|A|B|C|D|S)\s*[:：]\s*|(H|A|B|C|D|S)\s+(?=[0-9Iil|oOSBq]))/i;
  let cleaned = text.replace(labelRegex, '');

  // 2. We require the cleaned string to contain at least one actual digit [0-9] or a strong lookalike like 'I','i','l','|'.
  if (!/[0-9Iil|]/.test(cleaned)) {
    return null;
  }

  // 3. Convert common OCR errors
  let patched = cleaned
    .replace(/[Iil|]/g, '1')
    .replace(/[oO]/g, '0')
    .replace(/[S]/g, '5')
    .replace(/[B]/g, '8')
    .replace(/[q]/g, '9');

  // Strip anything that is not a digit
  patched = patched.replace(/\D/g, '');

  if (patched.length === 0) {
    return null;
  }

  const value = parseInt(patched, 10);
  return isNaN(value) ? null : value;
}

export interface RawOCRData {
  pokemonName: string;
  ability: string;
  item: string;
  moves: string[];
  stats: {
    hp: string;
    attack: string;
    defense: string;
    spAttack: string;
    spDefense: string;
    speed: string;
  };
}

export interface ProcessedOCRData {
  pokemonName: string;
  ability: string;
  item: string;
  moves: string[];
  stats: {
    hp: number | null;
    attack: number | null;
    defense: number | null;
    spAttack: number | null;
    spDefense: number | null;
    speed: number | null;
  };
}

/**
 * Fuzzy matches the raw OCR string results into corrected master data values,
 * applying the "認識できませんでした" fallback if the match fails.
 */
export function fuzzyMatchPokemonData(
  raw: RawOCRData,
  dicts: {
    pokemon: string[];
    abilities: string[];
    items: string[];
    moves: string[];
  }
): ProcessedOCRData {
  const fallbackText = '認識できませんでした';

  const pokemonName = fuzzyMatch(raw.pokemonName, dicts.pokemon) || fallbackText;
  const ability = fuzzyMatch(raw.ability, dicts.abilities) || fallbackText;
  const item = fuzzyMatch(raw.item, dicts.items) || fallbackText;

  const moves = raw.moves.map(m => fuzzyMatch(m, dicts.moves) || fallbackText);

  // Parse stats
  const stats = {
    hp: parseStatValue(raw.stats.hp),
    attack: parseStatValue(raw.stats.attack),
    defense: parseStatValue(raw.stats.defense),
    spAttack: parseStatValue(raw.stats.spAttack),
    spDefense: parseStatValue(raw.stats.spDefense),
    speed: parseStatValue(raw.stats.speed),
  };

  return {
    pokemonName,
    ability,
    item,
    moves,
    stats,
  };
}
