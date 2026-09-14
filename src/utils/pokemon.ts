import type { Language } from '../context/AppContext';

export const TYPES = [
  'normal',
  'fire',
  'water',
  'grass',
  'electric',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
];

export const typeTranslations: Record<string, Record<Language, string>> = {
  normal: {
    ja: 'ノーマル',
    en: 'Normal',
    ko: '노말',
    'zh-Hant': '一般',
    'zh-Hans': '一般',
  },
  fire: {
    ja: 'ほのお',
    en: 'Fire',
    ko: '불꽃',
    'zh-Hant': '火',
    'zh-Hans': '火',
  },
  water: {
    ja: 'みず',
    en: 'Water',
    ko: '물',
    'zh-Hant': '水',
    'zh-Hans': '水',
  },
  grass: {
    ja: 'くさ',
    en: 'Grass',
    ko: '풀',
    'zh-Hant': '草',
    'zh-Hans': '草',
  },
  electric: {
    ja: 'でんき',
    en: 'Electric',
    ko: '전기',
    'zh-Hant': '電',
    'zh-Hans': '电',
  },
  ice: {
    ja: 'こおり',
    en: 'Ice',
    ko: '얼음',
    'zh-Hant': '冰',
    'zh-Hans': '冰',
  },
  fighting: {
    ja: 'かくとう',
    en: 'Fighting',
    ko: '격투',
    'zh-Hant': '格鬥',
    'zh-Hans': '格斗',
  },
  poison: {
    ja: 'どく',
    en: 'Poison',
    ko: '독',
    'zh-Hant': '毒',
    'zh-Hans': '毒',
  },
  ground: {
    ja: 'じめん',
    en: 'Ground',
    ko: '땅',
    'zh-Hant': '地面',
    'zh-Hans': '地面',
  },
  flying: {
    ja: 'ひこう',
    en: 'Flying',
    ko: '비행',
    'zh-Hant': '飛行',
    'zh-Hans': '飞行',
  },
  psychic: {
    ja: 'エスパー',
    en: 'Psychic',
    ko: '에스퍼',
    'zh-Hant': '超能力',
    'zh-Hans': '超能力',
  },
  bug: { ja: 'むし', en: 'Bug', ko: '벌레', 'zh-Hant': '蟲', 'zh-Hans': '虫' },
  rock: {
    ja: 'いわ',
    en: 'Rock',
    ko: '바위',
    'zh-Hant': '岩石',
    'zh-Hans': '岩石',
  },
  ghost: {
    ja: 'ゴースト',
    en: 'Ghost',
    ko: '고스트',
    'zh-Hant': '幽靈',
    'zh-Hans': '幽灵',
  },
  dragon: {
    ja: 'ドラゴン',
    en: 'Dragon',
    ko: '드래곤',
    'zh-Hant': '龍',
    'zh-Hans': '龙',
  },
  dark: { ja: 'あく', en: 'Dark', ko: '악', 'zh-Hant': '惡', 'zh-Hans': '恶' },
  steel: {
    ja: 'はがね',
    en: 'Steel',
    ko: '강철',
    'zh-Hant': '鋼',
    'zh-Hans': '钢',
  },
  fairy: {
    ja: 'フェアリー',
    en: 'Fairy',
    ko: '페어리',
    'zh-Hant': '妖精',
    'zh-Hans': '妖精',
  },
};

export const typeColors: Record<string, string> = {
  normal: 'bg-slate-400 text-slate-900',
  fire: 'bg-red-500 text-white',
  water: 'bg-blue-500 text-white',
  grass: 'bg-green-500 text-white',
  electric: 'bg-yellow-400 text-slate-900',
  ice: 'bg-cyan-400 text-slate-900',
  fighting: 'bg-amber-700 text-white',
  poison: 'bg-purple-500 text-white',
  ground: 'bg-amber-600 text-white',
  flying: 'bg-indigo-300 text-slate-900',
  psychic: 'bg-pink-500 text-white',
  bug: 'bg-lime-500 text-slate-900',
  rock: 'bg-yellow-600 text-white',
  ghost: 'bg-violet-700 text-white',
  dragon: 'bg-indigo-700 text-white',
  dark: 'bg-slate-800 text-white',
  steel: 'bg-zinc-500 text-white',
  fairy: 'bg-rose-400 text-slate-900',
};

export const megaStoneMap: Record<string, Record<Language, string>> = {
  メガフシギバナ: {
    ja: 'フシギバナイト',
    en: 'Venusaurite',
    ko: '이상해꽃나이트',
    'zh-Hant': '妙蛙花進化石',
    'zh-Hans': '妙蛙花进化石',
  },
  メガリザードンX: {
    ja: 'リザードナイトX',
    en: 'Charizardite X',
    ko: '리자몽나이트X',
    'zh-Hant': '噴火龍進化石X',
    'zh-Hans': '喷火龙进化石X',
  },
  メガリザードンY: {
    ja: 'リザードナイトY',
    en: 'Charizardite Y',
    ko: '리자몽나이트Y',
    'zh-Hant': '噴火龍進化石Y',
    'zh-Hans': '喷火龙进化石Y',
  },
  メガカメックス: {
    ja: 'カメックスナイト',
    en: 'Blastoisinite',
    ko: '거북왕나이트',
    'zh-Hant': '水箭龜進化石',
    'zh-Hans': '水箭龟进化石',
  },
  メガスピアー: {
    ja: 'スピアーナイト',
    en: 'Beedrillite',
    ko: '독침붕나이트',
    'zh-Hant': '大針蜂進化石',
    'zh-Hans': '大针蜂进化石',
  },
  メガピジョット: {
    ja: 'ピジョットナイト',
    en: 'Pidgeotite',
    ko: '피죤투나이트',
    'zh-Hant': '大比鳥進化石',
    'zh-Hans': '大比鸟进化石',
  },
  メガフーディン: {
    ja: 'フーディナイト',
    en: 'Alakazite',
    ko: '후딘나이트',
    'zh-Hant': '胡地進化石',
    'zh-Hans': '胡地进化石',
  },
  メガヤドラン: {
    ja: 'ヤドランナイト',
    en: 'Slowbronite',
    ko: '야도란나이트',
    'zh-Hant': '呆殼獸進化石',
    'zh-Hans': '呆壳兽进化石',
  },
  メガゲンガー: {
    ja: 'ゲンガナイト',
    en: 'Gengarite',
    ko: '팬텀나이트',
    'zh-Hant': '耿鬼進化石',
    'zh-Hans': '耿鬼进化石',
  },
  メガガルーラ: {
    ja: 'ガルーラナイト',
    en: 'Kangaskhanite',
    ko: '캥카나이트',
    'zh-Hant': '袋獸進化石',
    'zh-Hans': '袋兽进化石',
  },
  メガカイロス: {
    ja: 'カイロスナイト',
    en: 'Pinsirite',
    ko: '쁘사이저나이트',
    'zh-Hant': '大甲進化石',
    'zh-Hans': '凯罗斯进化石',
  },
  メガギャラドス: {
    ja: 'ギャラドスナイト',
    en: 'Gyaradosite',
    ko: '갸라도스나이트',
    'zh-Hant': '暴鯉龍進化石',
    'zh-Hans': '暴鲤龙进化石',
  },
  メガプテラ: {
    ja: 'プテラナイト',
    en: 'Aerodactylite',
    ko: '프테라나이트',
    'zh-Hant': '化石翼龍進化石',
    'zh-Hans': '化石翼龙进化石',
  },
  メガデンリュウ: {
    ja: 'デンリュウナイト',
    en: 'Ampharosite',
    ko: '전룡나이트',
    'zh-Hant': '電龍進化石',
    'zh-Hans': '电龙进化石',
  },
  メガハッサム: {
    ja: 'ハッサムナイト',
    en: 'Scizorite',
    ko: '핫삼나이트',
    'zh-Hant': '巨鉗螳螂進化石',
    'zh-Hans': '巨钳螳螂进化石',
  },
  メガヘラクロス: {
    ja: 'ヘラクロスナイト',
    en: 'Heracronite',
    ko: '헤라크로스나이트',
    'zh-Hant': '赫拉克羅斯進化石',
    'zh-Hans': '赫拉克罗斯进化石',
  },
  メガヘルガー: {
    ja: 'ヘルガナイト',
    en: 'Houndoominite',
    ko: '헬가나이트',
    'zh-Hant': '黑魯加進化石',
    'zh-Hans': '黑鲁加进化石',
  },
  メガバンギラス: {
    ja: 'バンギラスナイト',
    en: 'Tyranitarite',
    ko: '마기라스나이트',
    'zh-Hant': '班基拉斯進化石',
    'zh-Hans': '班基拉斯进化石',
  },
  メガジュカイン: {
    ja: 'ジュカインナイト',
    en: 'Sceptilite',
    ko: '나무킹나이트',
    'zh-Hant': '蜥蜴王進化石',
    'zh-Hans': '蜥蜴王进化石',
  },
  メガバシャーモ: {
    ja: 'バシャーモナイト',
    en: 'Blazikenite',
    ko: '번치코나이트',
    'zh-Hant': '火焰雞進化石',
    'zh-Hans': '火焰鸡进化石',
  },
  メガラグラージ: {
    ja: 'ラグラージナイト',
    en: 'Swampertite',
    ko: '대짱이나이트',
    'zh-Hant': '巨沼怪進化石',
    'zh-Hans': '巨沼怪进化石',
  },
  メガサーナイト: {
    ja: 'サーナイトナイト',
    en: 'Gardevoirite',
    ko: '가디안나이트',
    'zh-Hant': '沙奈朵進化石',
    'zh-Hans': '沙奈朵进化石',
  },
  メガヤミラミ: {
    ja: 'ヤミラミナイト',
    en: 'Sablenite',
    ko: '깜까미나이트',
    'zh-Hant': '勾魂眼進化石',
    'zh-Hans': '勾魂眼进化石',
  },
  メガクチート: {
    ja: 'クチートナイト',
    en: 'Mawilite',
    ko: '입치트나이트',
    'zh-Hant': '大嘴娃進化石',
    'zh-Hans': '大嘴娃进化石',
  },
  メガボスゴドラ: {
    ja: 'ボスゴドラナイト',
    en: 'Aggronite',
    ko: '보스로라나이트',
    'zh-Hant': '波士可多拉進化石',
    'zh-Hans': '波士可多拉进化石',
  },
  メガチャーレム: {
    ja: 'チャーレムナイト',
    en: 'Medichamite',
    ko: '요가램나이트',
    'zh-Hant': '恰雷姆進化石',
    'zh-Hans': '恰雷姆进化石',
  },
  メガライボルト: {
    ja: 'ライボルトナイト',
    en: 'Manectrite',
    ko: '썬더볼트나이트',
    'zh-Hant': '雷電獸進化石',
    'zh-Hans': '雷电兽进化石',
  },
  メガサメハダー: {
    ja: 'サメハダナイト',
    en: 'Sharpedonite',
    ko: '샤크니아나이트',
    'zh-Hant': '巨牙鯊進化石',
    'zh-Hans': '巨牙鲨进化石',
  },
  メガバクーダ: {
    ja: 'バクーダナイト',
    en: 'Cameruptite',
    ko: '폭타나이트',
    'zh-Hant': '噴火駝進化石',
    'zh-Hans': '喷火驼进化石',
  },
  メガチルタリス: {
    ja: 'チルタリスナイト',
    en: 'Altarianite',
    ko: '파비코리나이트',
    'zh-Hant': '七夕青鳥進化石',
    'zh-Hans': '七夕青鸟进化石',
  },
  メガジュペッタ: {
    ja: 'ジュペッタナイト',
    en: 'Banettite',
    ko: '다크펫나이트',
    'zh-Hant': '詛咒娃娃進化石',
    'zh-Hans': '诅咒娃娃进化石',
  },
  メガアブソル: {
    ja: 'アブソルナイト',
    en: 'Absolite',
    ko: '앱솔나이트',
    'zh-Hant': '阿勃梭魯進化石',
    'zh-Hans': '阿勃梭鲁进化石',
  },
  メガオニゴーリ: {
    ja: 'オニゴーリナイト',
    en: 'Glalitite',
    ko: '얼음귀신나이트',
    'zh-Hant': '冰鬼護進化石',
    'zh-Hans': '冰鬼护进化石',
  },
  メガボーマンダ: {
    ja: 'ボーマンダナイト',
    en: 'Salamencite',
    ko: '보만다나이트',
    'zh-Hant': '暴飛龍進化石',
    'zh-Hans': '暴飞龙进化石',
  },
  メガメタグロス: {
    ja: 'メタグロスナイト',
    en: 'Metagrossite',
    ko: '메타그로스나이트',
    'zh-Hant': '巨金怪進化石',
    'zh-Hans': '巨金怪进化石',
  },
  メガレックウザ: {
    ja: 'なし (画竜点睛が必要)',
    en: 'None (Dragon Ascent required)',
    ko: '없음 (화룡점정 필요)',
    'zh-Hant': '無 (需學會畫龍點睛)',
    'zh-Hans': '无 (需学会画龙点睛)',
  },
  メガラティアス: {
    ja: 'ラティアスナイト',
    en: 'Latiasite',
    ko: '라티아스나이트',
    'zh-Hant': '拉帝亞斯進化石',
    'zh-Hans': '拉帝亚斯进化石',
  },
  メガラティオス: {
    ja: 'ラティオスナイト',
    en: 'Latiosite',
    ko: '라티오스나이트',
    'zh-Hant': '拉帝歐斯進化石',
    'zh-Hans': '拉帝欧斯进化石',
  },
  メガディアンシー: {
    ja: 'ディアンシナイト',
    en: 'Diancite',
    ko: '디안시나이트',
    'zh-Hant': '蒂安希進化石',
    'zh-Hans': '蒂安希进化石',
  },
  メガエルレイド: {
    ja: 'エルレイドナイト',
    en: 'Galladite',
    ko: '엘레이드나이트',
    'zh-Hant': '艾路雷朵進化石',
    'zh-Hans': '艾路雷朵进化石',
  },
  メガタブンネ: {
    ja: 'タブンネナイト',
    en: 'Audinite',
    ko: '다부니나이트',
    'zh-Hant': '差不多娃娃進化石',
    'zh-Hans': '差不多娃娃进化石',
  },
  メガミミロップ: {
    ja: 'ミミロップナイト',
    en: 'Lopunnite',
    ko: '이어롭나이트',
    'zh-Hant': '長耳兔進化石',
    'zh-Hans': '长耳兔进化石',
  },
  メガハガネール: {
    ja: 'ハガネールナイト',
    en: 'Steelixite',
    ko: '강철톤나이트',
    'zh-Hant': '大鋼蛇進化石',
    'zh-Hans': '大钢蛇进化石',
  },
  メガユキノオー: {
    ja: 'ユキノオナイト',
    en: 'Abomasnowite',
    ko: '눈설왕나이트',
    'zh-Hant': '暴雪王進化石',
    'zh-Hans': '暴雪王进化石',
  },
  メガアブソルZ: {
    ja: 'アブソルナイトZ',
    en: 'Absolite Z',
    ko: '앱솔나이트Z',
    'zh-Hant': '阿勃梭魯進化石Z',
    'zh-Hans': '阿勃梭鲁进化石Z',
  },
  メガガブリアスZ: {
    ja: 'ガブリアスナイトZ',
    en: 'Garchompite Z',
    ko: '한카리아스나이트Z',
    'zh-Hant': '烈咬陸鯊進化石Z',
    'zh-Hans': '烈咬陆鲨进化石Z',
  },
  メガルカリオZ: {
    ja: 'ルカリオナイトZ',
    en: 'Lucarionite Z',
    ko: '루카리오나이트Z',
    'zh-Hant': '路卡利歐進化石Z',
    'zh-Hans': '路卡利欧进化石Z',
  },
  メガグソクムシャ: {
    ja: 'グソクムシャナイト',
    en: 'Golisopodite',
    ko: '갑주무사나이트',
    'zh-Hant': '具甲武者進化石',
    'zh-Hans': '具甲武者进化石',
  },
  メガセグレイブ: {
    ja: 'セグレイブナイト',
    en: 'Baxcaliburite',
    ko: '드닐레이브나이트',
    'zh-Hant': '戟脊龍進化石',
    'zh-Hans': '戟脊龙进化石',
  },
};

export const MAX_TOTAL_EVS = 66;
export const MAX_SINGLE_EV = 32;

export const STAT_KEYS = [
  'hp',
  'attack',
  'defense',
  'sp_attack',
  'sp_defense',
  'speed',
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

/**
 * 努力値（ステップ値: 0〜32、合計最大66）の正規化とクランプ
 * - 旧仕様の努力値（32超、252等）のステップ値変換
 * - 各ステータス 0〜32 へのクランプ
 * - 全ステータス合計最大66へのクランプ
 */
export function normalizeEvs(
  evs?: Partial<Record<StatKey, number>>
): Record<StatKey, number> {
  const result: Record<StatKey, number> = {
    hp: 0,
    attack: 0,
    defense: 0,
    sp_attack: 0,
    sp_defense: 0,
    speed: 0,
  };

  if (!evs) return result;

  // 1. 各ステータスをサニタイズ（旧252スケールのマイグレーションを含む）
  for (const key of STAT_KEYS) {
    const rawVal = Number(evs[key]);
    if (!Number.isFinite(rawVal) || rawVal <= 0) {
      result[key] = 0;
    } else if (rawVal > MAX_SINGLE_EV) {
      // 旧仕様（252など）の値をステップ値へ変換 (4で1, 12で2, 252で32)
      const migrated = Math.floor((rawVal - 4) / 8) + 1;
      result[key] = Math.max(0, Math.min(MAX_SINGLE_EV, migrated));
    } else {
      result[key] = Math.max(0, Math.min(MAX_SINGLE_EV, Math.floor(rawVal)));
    }
  }

  // 2. 合計が MAX_TOTAL_EVS (66) を超えている場合は超過分を末尾ステータスから削減
  let currentTotal = Object.values(result).reduce((a, b) => a + b, 0);
  if (currentTotal > MAX_TOTAL_EVS) {
    let excess = currentTotal - MAX_TOTAL_EVS;
    for (let i = STAT_KEYS.length - 1; i >= 0 && excess > 0; i--) {
      const key = STAT_KEYS[i];
      const reduction = Math.min(result[key], excess);
      result[key] -= reduction;
      excess -= reduction;
    }
  }

  return result;
}

