const romajiMap: Record<string, string> = {
  // 3文字 (長音強化版)
  tsu: 'ツ',
  kya: 'キュウ',
  kyu: 'キュウ',
  kyo: 'キョウ', // kya -> キャ だが、kyu -> キュウ
  sha: 'シャ',
  shu: 'シュウ',
  sho: 'ショウ',
  chi: 'チ',
  cha: 'チャ',
  chu: 'チュウ',
  cho: 'チョウ',
  nya: 'ニャ',
  nyu: 'ニュウ',
  nyo: 'ニョウ',
  hya: 'ヒャ',
  hyu: 'ヒュウ',
  hyo: 'ヒョウ',
  mya: 'ミャ',
  myu: 'ミュウ',
  myo: 'ミョウ',
  rya: 'リャ',
  ryu: 'リュウ',
  ryo: 'リョウ',
  gya: 'ギャ',
  gyu: 'ギュウ',
  gyo: 'ギョウ',
  ja: 'ジャ',
  ju: 'ジュウ',
  jo: 'ジョウ',
  jya: 'ジャ',
  jyu: 'ジュウ',
  jyo: 'ジョウ',
  bya: 'ビャ',
  byu: 'ビュウ',
  byo: 'ビョウ',
  pya: 'ピャ',
  pyu: 'ピュウ',
  pyo: 'ピョウ',
  dya: 'ヂャ',
  dyu: 'ヂュウ',
  dyo: 'ヂョウ',
  shi: 'シ',
  fa: 'ファ',
  fi: 'フィ',
  fe: 'フェ',
  fo: 'フォ',
  che: 'チェ',
  she: 'シェ',
  tse: 'ツェ',
  je: 'ジェ',
  // 2文字
  ka: 'カ',
  ki: 'キ',
  ku: 'ク',
  ke: 'ケ',
  ko: 'コ',
  sa: 'サ',
  si: 'シ',
  su: 'ス',
  se: 'セ',
  so: 'ソ',
  ta: 'タ',
  ti: 'チ',
  tu: 'ツ',
  te: 'テ',
  to: 'ト',
  na: 'ナ',
  ni: 'ニ',
  nu: 'ヌ',
  ne: 'ネ',
  no: 'ノ',
  ha: 'ハ',
  hi: 'ヒ',
  fu: 'フ',
  he: 'ヘ',
  ho: 'ホ',
  ma: 'マ',
  mi: 'ミ',
  mu: 'ム',
  me: 'メ',
  mo: 'モ',
  ya: 'ヤ',
  yu: 'ユ',
  yo: 'ヨ',
  ra: 'ラ',
  ri: 'リ',
  ru: 'ル',
  re: 'レ',
  ro: 'ロ',
  wa: 'ワ',
  wo: 'ヲ',
  nn: 'ン',
  xn: 'ン',
  ga: 'ガ',
  gi: 'ギ',
  gu: 'グ',
  ge: 'ゲ',
  go: 'ゴ',
  za: 'ザ',
  zi: 'ジ',
  zu: 'ズ',
  ze: 'ゼ',
  zo: 'ゾ',
  da: 'ダ',
  di: 'ジ',
  du: 'ズ',
  de: 'デ',
  do: 'ド',
  ba: 'バ',
  bi: 'ビ',
  bu: 'ブ',
  be: 'ベ',
  bo: 'ボ',
  pa: 'パ',
  pi: 'ピ',
  pu: 'プ',
  pe: 'ペ',
  po: 'ポ',
  la: 'ラ',
  li: 'リ',
  lu: 'ル',
  le: 'レ',
  lo: 'ロ',
  ca: 'カ',
  cu: 'ク',
  co: 'コ',
  qa: 'クァ',
  qi: 'クィ',
  qu: 'ク',
  qe: 'クェ',
  qo: 'クォ',
  // 1文字
  a: 'ア',
  i: 'イ',
  u: 'ウ',
  e: 'エ',
  o: 'オ',
  n: 'ン',
  '-': 'ー',
  x: 'ックス',
};

// "kya" (キャ) が "kyu" などのテーブルにあるとマッピングに失敗するため、
// 特別に "kya", "sha", "cha", "nya", "hya", "mya", "rya", "gya", "jya", "bya", "pya", "dya" は長音でなく単音に修正
romajiMap.kya = 'キャ';
romajiMap.sha = 'シャ';
romajiMap.cha = 'チャ';
romajiMap.nya = 'ニャ';
romajiMap.hya = 'ヒャ';
romajiMap.mya = 'ミャ';
romajiMap.rya = 'リャ';
romajiMap.gya = 'ギャ';
romajiMap.jya = 'ジャ';
romajiMap.bya = 'ビャ';
romajiMap.pya = 'ピャ';
romajiMap.dya = 'ヂャ';

export const romajiToKatakana = (romaji: string): string => {
  let result = '';
  let i = 0;
  const str = romaji.toLowerCase();

  while (i < str.length) {
    const char = str[i];
    const nextChar = str[i + 1];

    // 促音のチェック (同じ子音が続く、ただし nn ではない)
    if (
      char === nextChar &&
      char !== 'n' &&
      'bcdfghjklmpqrstvwxyz'.includes(char)
    ) {
      result += 'ッ';
      i++;
      continue;
    }

    // "tc" のような促音（potchama 等の 'tc' 部分で 'ッ' と 'チ' にする処理）
    if (char === 't' && nextChar === 'c' && str[i + 2] === 'h') {
      result += 'ッ';
      i++;
      continue;
    }

    // 3文字マッチ
    if (i + 2 < str.length) {
      const chunk = str.substring(i, i + 3);
      if (romajiMap[chunk]) {
        result += romajiMap[chunk];
        i += 3;
        continue;
      }
    }

    // 2文字マッチ
    if (i + 1 < str.length) {
      const chunk = str.substring(i, i + 2);
      if (romajiMap[chunk]) {
        result += romajiMap[chunk];
        i += 2;
        continue;
      }
    }

    // 1文字マッチ
    if (romajiMap[char]) {
      const isLastChar = i === str.length - 1;
      if (
        isLastChar &&
        'bcdfghjklmpqrstvwxyz'.includes(char) &&
        char !== 'n' &&
        char !== 'x'
      ) {
        // 末尾の不完全な子音は無視する
        break;
      }

      result += romajiMap[char];
      i += 1;
      continue;
    }

    i++;
  }

  return result;
};

export const normalizeSearchText = (text: string): string => {
  if (!text) return '';
  let normalized = text.trim().toLowerCase();

  // ひらがなをカタカナに変換する
  normalized = normalized.replace(/[\u3041-\u3096]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) + 0x60);
  });

  // アルファベットが含まれる場合はローマ字からカタカナに変換する
  if (/[a-z]/.test(normalized)) {
    const converted = romajiToKatakana(normalized);
    if (converted) {
      return converted;
    }
  }

  return normalized;
};

export const katakanaToHiragana = (text: string): string => {
  if (!text) return '';
  return text.replace(/[\u30a1-\u30f6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
};
