export type LinkCategory =
  | 'official'
  | 'damageCalculator'
  | 'strategy'
  | 'metagame'
  | 'database';

export type SupportedLanguageTag = 'ja' | 'en' | 'ko' | 'zhHant' | 'zhBoth';

export interface UsefulLinkItem {
  id: string;
  name: string;
  url: string;
  category: LinkCategory;
  langKey: SupportedLanguageTag;
  descriptionKey?: string;
}

export const USEFUL_LINKS: UsefulLinkItem[] = [
  // 1. 公式情報 (Official Information) - 最上位
  {
    id: 'official-champions-ja',
    name: 'ポケモンチャンピオンズ 公式サイト',
    url: 'https://www.pokemonchampions.jp/ja/',
    category: 'official',
    langKey: 'ja',
  },
  {
    id: 'official-pokemon-en',
    name: 'Pokémon Official Website',
    url: 'https://www.pokemon.com/',
    category: 'official',
    langKey: 'en',
  },
  {
    id: 'official-pokemon-ko',
    name: '포켓몬 공식 사이트',
    url: 'https://pokemonkorea.co.kr/',
    category: 'official',
    langKey: 'ko',
  },
  {
    id: 'official-pokemon-zh',
    name: '精靈寶可夢 官方網站',
    url: 'https://tw.portal-pokemon.com/',
    category: 'official',
    langKey: 'zhHant',
  },

  // 2. ダメージ計算ツール (Damage Calculators)
  {
    id: 'calc-yakkun',
    name: 'ポケモン徹底攻略 ダメージ計算機',
    url: 'https://yakkun.com/tool/damage.htm',
    category: 'damageCalculator',
    langKey: 'ja',
  },
  {
    id: 'calc-pokesol',
    name: 'ポケソル ダメージ計算機',
    url: 'https://pokesol.app/calc',
    category: 'damageCalculator',
    langKey: 'ja',
  },
  {
    id: 'calc-gamewith',
    name: 'GameWith ダメージ計算機',
    url: 'https://gamewith.jp/pokemon-champions/554133',
    category: 'damageCalculator',
    langKey: 'ja',
  },
  {
    id: 'calc-showdown',
    name: 'Pokémon Showdown! ダメージ計算機',
    url: 'https://calc.pokemonshowdown.com/',
    category: 'damageCalculator',
    langKey: 'en',
  },

  // 3. 対戦考察・育成論Wiki (Competitive Strategy & Analysis)
  {
    id: 'strategy-champions-pokewiki',
    name: 'ポケモンチャンピオンズ育成考察Wiki',
    url: 'https://champions.pokewiki.net/',
    category: 'strategy',
    langKey: 'ja',
  },
  {
    id: 'strategy-yakuwarironri',
    name: '役割論理専用wiki',
    url: 'https://w.atwiki.jp/yakuwarironri66/',
    category: 'strategy',
    langKey: 'ja',
  },
  {
    id: 'strategy-smogon',
    name: 'Smogon University',
    url: 'https://www.smogon.com/dex/',
    category: 'strategy',
    langKey: 'en',
  },
  {
    id: 'strategy-namu-battle',
    name: '나무위키 포켓몬스터 대전',
    url: 'https://namu.wiki/w/%ED%8F%AC%EC%BC%93%EB%AA%AC%EC%8A%A4%ED%84%B0/%EB%8C%80%EC%A0%84',
    category: 'strategy',
    langKey: 'ko',
  },

  // 3. 環境分析・大会・構築記事 (Metagame, Tournaments & Teams)
  {
    id: 'meta-pokedb-champs',
    name: 'ポケモンバトルデータベース',
    url: 'https://champs.pokedb.tokyo/',
    category: 'metagame',
    langKey: 'ja',
  },
  {
    id: 'meta-pokesol',
    name: 'ポケソル (POKESOL)',
    url: 'https://pokesol.app/',
    category: 'metagame',
    langKey: 'ja',
  },
  {
    id: 'meta-liberty-note',
    name: 'リバティノート (Liberty Note)',
    url: 'https://liberty-note.com/',
    category: 'metagame',
    langKey: 'ja',
  },
  {
    id: 'meta-appdate',
    name: '†APPDATE†',
    url: 'https://app-date.net/',
    category: 'metagame',
    langKey: 'ja',
  },
  {
    id: 'meta-victory-road',
    name: 'Victory Road',
    url: 'https://victoryroadvgc.com/',
    category: 'metagame',
    langKey: 'en',
  },
  {
    id: 'meta-bahamut-pokemon',
    name: '巴哈姆特 精靈寶可夢板',
    url: 'https://forum.gamer.com.tw/B.php?bsn=1647',
    category: 'metagame',
    langKey: 'zhHant',
  },
  {
    id: 'meta-dcinside-pokemon',
    name: '포켓몬 갤러리 (DC Inside)',
    url: 'https://gall.dcinside.com/board/lists/?id=pokemon',
    category: 'metagame',
    langKey: 'ko',
  },

  // 4. 総合データベース・百科事典 (Databases & Encyclopedias)
  {
    id: 'db-yakkun',
    name: 'ポケモン徹底攻略',
    url: 'https://yakkun.com/ch/',
    category: 'database',
    langKey: 'ja',
  },
  {
    id: 'db-pokemon-wiki-ja',
    name: 'ポケモンWiki',
    url: 'https://wiki.pokemonwiki.com/wiki/%E3%83%A1%E3%82%A4%E3%83%B3%E3%83%9A%E3%83%BC%E3%82%B8',
    category: 'database',
    langKey: 'ja',
  },
  {
    id: 'db-pokepedia-ja',
    name: 'ポケペディア',
    url: 'https://pokemonpedia.net/',
    category: 'database',
    langKey: 'ja',
  },
  {
    id: 'db-serebii',
    name: 'Serebii.net',
    url: 'https://www.serebii.net/',
    category: 'database',
    langKey: 'en',
  },
  {
    id: 'db-bulbapedia',
    name: 'Bulbapedia',
    url: 'https://bulbapedia.bulbagarden.net/wiki/Main_Page',
    category: 'database',
    langKey: 'en',
  },
  {
    id: 'db-52poke',
    name: '神奇寶貝百科 (52poke)',
    url: 'https://wiki.52poke.com/',
    category: 'database',
    langKey: 'zhBoth',
  },
  {
    id: 'db-pokemon-wiki-ko',
    name: '포켓몬 위키',
    url: 'https://pokemon.fandom.com/ko/wiki/',
    category: 'database',
    langKey: 'ko',
  },
];
