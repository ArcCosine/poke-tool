import fs from 'node:fs';
import path from 'node:path';
import { megaStoneMap } from '../src/utils/pokemon';

const DATA_DIR = path.resolve(import.meta.dirname, '../public/data');
const CACHE_DIR = path.resolve(import.meta.dirname, './cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

async function fetchJsonCached(url: string, cacheFilename: string): Promise<any> {
  const filepath = path.join(CACHE_DIR, cacheFilename);
  if (fs.existsSync(filepath)) {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  }
  console.log(`Fetching from PokeAPI: ${url}`);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'poke-tool-crawler/1.0' },
    });
    if (!res.ok) {
      console.warn(`Failed to fetch ${url}: ${res.status}`);
      return null;
    }
    const data = await res.json();
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    // small delay to be polite to PokeAPI
    await new Promise((resolve) => setTimeout(resolve, 100));
    return data;
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    return null;
  }
}

function getZhHansFromNames(names: any[]): string | undefined {
  if (!names || !Array.isArray(names)) return undefined;
  const zhHansObj = names.find(
    (n: any) =>
      n.language?.name === 'zh-hans' ||
      n.language?.name === 'zh-Hans'
  );
  return zhHansObj?.name;
}

// Mega stone mapping from ja name to zh-Hans
const itemCustomZhHans: Record<string, string> = {
  'なし': '无',
  'ノーマルジュエル': '一般宝石',
  'ヒメリのみ': '苹野果',
  'オレンのみ': '橙橙果',
  'ナモのみ': '芭亚果',
};

// Populate mega stones from megaStoneMap
for (const [_megaPoke, stoneObj] of Object.entries(megaStoneMap)) {
  if (stoneObj.ja && (stoneObj as any)['zh-Hans']) {
    itemCustomZhHans[stoneObj.ja] = (stoneObj as any)['zh-Hans'];
  }
}

// Special regional / form names mapping for Pokemon
const customPokemonZhHans: Record<string, string> = {
  // Rotom forms
  '加熱洛托姆': '加热洛托姆',
  '清洗洛托姆': '清洗洛托姆',
  '結冰洛托姆': '结冰洛托姆',
  '旋轉洛托姆': '旋转洛托姆',
  '切割洛托姆': '切割洛托姆',
  // Special Megas
  '超級阿勃梭魯Z': '超级阿勃梭鲁Z',
  '超級烈咬陸鯊Z': '超级烈咬陆鲨Z',
  '超級路卡利歐Z': '超级路卡利欧Z',
  '超級具甲武者': '超级具甲武者',
  '超級戟脊龍': '超级戟脊龙',
  // Specific gender / forms
  'ストリンダー(ハイ)': '颤弦蝾螈 (高调的样子)',
  'ストリンダー(ロー)': '颤弦蝾螈 (低调的样子)',
  'イエッサン(オス)': '爱管侍 (雄性)',
  'イエッサン(メス)': '爱管侍 (雌性)',
  'イキリンコ': '怒鹦哥',
  'イキリンコ(ブルー)': '怒鹦哥 (蓝羽毛)',
  'イキリンコ(イエロー)': '怒鹦哥 (黄羽毛)',
  'イキリンコ(ホワイト)': '怒鹦哥 (白羽毛)',
  'ニャイキング': '喵头目',
  'ネギガナイト': '葱游兵',
};

// Abilities custom mappings
const customAbilityZhHans: Record<string, string> = {
  'きれあじ': '锋锐',
  'ふゆう': '飘浮',
  'はどうのぼうご': '波导守护',
  'かたいツメ': '硬爪',
  'ねつこうかん': '热交换',
};

async function processPokemonMaster() {
  console.log('--- Processing pokemon_master.json ---');
  const filepath = path.join(DATA_DIR, 'pokemon_master.json');
  const list: any[] = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

  for (const poke of list) {
    const pokeId = poke.id;
    let baseSpeciesId = pokeId;
    let isMega = false;
    let isAlola = false;
    let isGalar = false;
    let isHisui = false;
    let isPaldea = false;

    // Check if pokeId > 10000 (alternate forms in PokeAPI)
    if (pokeId >= 10000) {
      const pData = await fetchJsonCached(
        `https://pokeapi.co/api/v2/pokemon/${pokeId}/`,
        `pokemon_${pokeId}.json`
      );
      if (pData) {
        const speciesUrl = pData.species?.url;
        if (speciesUrl) {
          const parts = speciesUrl.split('/').filter(Boolean);
          baseSpeciesId = parseInt(parts[parts.length - 1], 10);
        }
        const nameSlug = pData.name || '';
        isMega = nameSlug.includes('-mega');
        isAlola = nameSlug.includes('-alola');
        isGalar = nameSlug.includes('-galar');
        isHisui = nameSlug.includes('-hisui');
        isPaldea = nameSlug.includes('-paldea');
      } else {
        // Fallback for custom Champions forms (10307, 10309, 10310, 10327, 10328)
        if (pokeId === 10307) baseSpeciesId = 359; // Absol
        else if (pokeId === 10309) baseSpeciesId = 445; // Garchomp
        else if (pokeId === 10310) baseSpeciesId = 448; // Lucario
        else if (pokeId === 10327) baseSpeciesId = 768; // Golisopod
        else if (pokeId === 10328) baseSpeciesId = 998; // Baxcalibur
        isMega = true;
      }
    }

    // Fetch species for zh-hans
    const speciesData = await fetchJsonCached(
      `https://pokeapi.co/api/v2/pokemon-species/${baseSpeciesId}/`,
      `species_${baseSpeciesId}.json`
    );
    const baseZhHans = speciesData ? getZhHansFromNames(speciesData.names) : undefined;

    // Determine Pokemon localized name
    let zhHansName = baseZhHans;
    if (customPokemonZhHans[poke.name['zh-Hant'] || '']) {
      zhHansName = customPokemonZhHans[poke.name['zh-Hant'] || ''];
    } else if (customPokemonZhHans[poke.name.ja || '']) {
      zhHansName = customPokemonZhHans[poke.name.ja || ''];
    } else if (isMega && baseZhHans) {
      if (poke.name.ja.includes('X')) {
        zhHansName = `超级${baseZhHans}X`;
      } else if (poke.name.ja.includes('Y')) {
        zhHansName = `超级${baseZhHans}Y`;
      } else if (poke.name.ja.includes('Z')) {
        zhHansName = `超级${baseZhHans}Z`;
      } else {
        zhHansName = `超级${baseZhHans}`;
      }
    } else if (isAlola && baseZhHans) {
      zhHansName = `阿罗拉${baseZhHans}`;
    } else if (isGalar && baseZhHans) {
      zhHansName = `伽勒尔${baseZhHans}`;
    } else if (isHisui && baseZhHans) {
      zhHansName = `洗翠${baseZhHans}`;
    } else if (isPaldea && baseZhHans) {
      zhHansName = `帕底亚${baseZhHans}`;
    } else if (!zhHansName && poke.name['zh-Hant']) {
      zhHansName = poke.name['zh-Hant'];
    }

    poke.name['zh-Hans'] = zhHansName || poke.name['zh-Hant'] || poke.name.en;

    // Process abilities
    for (const ab of poke.abilities || []) {
      let abZhHans: string | undefined;
      if (customAbilityZhHans[ab.ja]) {
        abZhHans = customAbilityZhHans[ab.ja];
      } else {
        // Try to find cached ability file
        const abSlug = (ab.en || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const abData = await fetchJsonCached(
          `https://pokeapi.co/api/v2/ability/${abSlug}/`,
          `ability_${abSlug}.json`
        );
        if (abData) {
          abZhHans = getZhHansFromNames(abData.names);
        }
      }
      ab['zh-Hans'] = abZhHans || ab['zh-Hant'] || ab.en;
    }
  }

  fs.writeFileSync(filepath, JSON.stringify(list, null, 2), 'utf-8');
  console.log(`Updated pokemon_master.json (${list.length} entries)`);
}

async function processMovesMaster() {
  console.log('--- Processing moves_master.json ---');
  const filepath = path.join(DATA_DIR, 'moves_master.json');
  const list: any[] = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

  for (const move of list) {
    const moveId = move.id;
    const moveData = await fetchJsonCached(
      `https://pokeapi.co/api/v2/move/${moveId}/`,
      `move_${moveId}.json`
    );
    let zhHans = moveData ? getZhHansFromNames(moveData.names) : undefined;
    if (!zhHans && move.name['zh-Hant']) {
      zhHans = move.name['zh-Hant'];
    }
    move.name['zh-Hans'] = zhHans || move.name['zh-Hant'] || move.name.en;
  }

  fs.writeFileSync(filepath, JSON.stringify(list, null, 2), 'utf-8');
  console.log(`Updated moves_master.json (${list.length} entries)`);
}

async function processItemsMaster() {
  console.log('--- Processing items_master.json ---');
  const filepath = path.join(DATA_DIR, 'items_master.json');
  const list: any[] = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

  for (const item of list) {
    const itemId = item.id;
    let zhHans: string | undefined;

    if (itemCustomZhHans[item.name.ja]) {
      zhHans = itemCustomZhHans[item.name.ja];
    } else if (itemId < 20000) {
      const itemData = await fetchJsonCached(
        `https://pokeapi.co/api/v2/item/${itemId}/`,
        `item_${itemId}.json`
      );
      if (itemData) {
        zhHans = getZhHansFromNames(itemData.names);
      }
    }

    item.name['zh-Hans'] = zhHans || item.name['zh-Hant'] || item.name.en;
  }

  fs.writeFileSync(filepath, JSON.stringify(list, null, 2), 'utf-8');
  console.log(`Updated items_master.json (${list.length} entries)`);
}

async function main() {
  await processPokemonMaster();
  await processMovesMaster();
  await processItemsMaster();
  console.log('All master data files have been updated with zh-Hans!');
}

main().catch(console.error);
