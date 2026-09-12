import { describe, expect, it } from 'vitest';
import type { ItemMaster, PokemonMaster } from './db';
import { megaStoneMap, TYPES, typeColors, typeTranslations } from './pokemon';

describe('Pokemon Common Data Utilities', () => {
  it('should define 18 types in TYPES', () => {
    expect(TYPES.length).toBe(18);
    expect(TYPES).toContain('fire');
    expect(TYPES).toContain('water');
  });

  it('should translate types correctly in all 5 languages', () => {
    expect(typeTranslations.fire.ja).toBe('ほのお');
    expect(typeTranslations.fire.en).toBe('Fire');
    expect(typeTranslations.fire.ko).toBe('불꽃');
    expect(typeTranslations.fire['zh-Hant']).toBe('火');
    expect(typeTranslations.fire['zh-Hans']).toBe('火');
    expect(typeTranslations.fairy.ja).toBe('フェアリー');
    expect(typeTranslations.fairy.ko).toBe('페어리');
    expect(typeTranslations.fairy['zh-Hant']).toBe('妖精');
    expect(typeTranslations.fairy['zh-Hans']).toBe('妖精');
  });

  it('should have color classes for types', () => {
    expect(typeColors.fire).toBe('bg-red-500 text-white');
    expect(typeColors.normal).toBe('bg-slate-400 text-slate-900');
  });

  it('should map mega evolutions to mega stones correctly', () => {
    expect(megaStoneMap.メガフシギバナ.ja).toBe('フシギバナイト');
    expect(megaStoneMap.メガレックウザ.en).toContain('Dragon Ascent');
  });

  it('should map new M-C mega evolutions to mega stones correctly', () => {
    expect(megaStoneMap.メガアブソルZ.ja).toBe('アブソルナイトZ');
    expect(megaStoneMap.メガガブリアスZ.ja).toBe('ガブリアスナイトZ');
    expect(megaStoneMap.メガルカリオZ.ja).toBe('ルカリオナイトZ');
    expect(megaStoneMap.メガグソクムシャ.ja).toBe('グソクムシャナイト');
    expect(megaStoneMap.メガセグレイブ.ja).toBe('セグレイブナイト');
    expect(megaStoneMap.メガボーマンダ.ja).toBe('ボーマンダナイト');
  });
});

describe('Master Data Integrity for Rotom forms, Regulation M-C, and Items', async () => {
  const regulations = await import('../data/regulations.json');
  const pokemonMaster = await import('../data/pokemon_master.json');
  const itemsMaster = await import('../data/items_master.json');

  it('should include Regulation M-C in regulations.json', () => {
    const mcReg = regulations.default.find(
      (r: { id: string; name: { ja: string; en: string } }) => r.id === 'M-C'
    );
    expect(mcReg).toBeDefined();
    expect(mcReg?.name.ja).toBe('レギュレーションM-C');
  });

  it('should include all Rotom forms in pokemon_master.json', () => {
    const rotomNames = [
      'ロトム',
      'ヒートロトム',
      'ウォッシュロトム',
      'フロストロトム',
      'スピンロトム',
      'カットロトム',
    ];
    for (const name of rotomNames) {
      const p = (pokemonMaster.default as PokemonMaster[]).find(
        (poke) => poke.name.ja === name
      );
      expect(p, `Rotom form ${name} should exist`).toBeDefined();
      expect(p?.abilities.map((a) => a.ja)).toContain('ふゆう');
    }

    const washRotom = (pokemonMaster.default as PokemonMaster[]).find(
      (poke) => poke.name.ja === 'ウォッシュロトム'
    );
    expect(washRotom?.types).toEqual(['electric', 'water']);
    expect(washRotom?.base_stats.hp).toBe(50);
    expect(washRotom?.base_stats.sp_attack).toBe(105);

    const heatRotom = (pokemonMaster.default as PokemonMaster[]).find(
      (poke) => poke.name.ja === 'ヒートロトム'
    );
    expect(heatRotom?.types).toEqual(['electric', 'fire']);
  });

  it('should include M-C added Pokemon with proper regulation flags', () => {
    const pucker = (pokemonMaster.default as PokemonMaster[]).find(
      (poke) => poke.name.ja === 'プクリン'
    );
    expect(pucker, 'プクリン should exist in pokemon master').toBeDefined();
    expect(pucker?.regulations).toContain('M-C');
    expect(pucker?.regulations).not.toContain('M-A');
    expect(pucker?.regulations).not.toContain('M-B');

    const salamence = (pokemonMaster.default as PokemonMaster[]).find(
      (poke) => poke.name.ja === 'ボーマンダ'
    );
    expect(
      salamence,
      'ボーマンダ should exist in pokemon master'
    ).toBeDefined();
    expect(salamence?.regulations).toContain('M-C');

    const megaBax = (pokemonMaster.default as PokemonMaster[]).find(
      (poke) => poke.name.ja === 'メガセグレイブ'
    );
    expect(
      megaBax,
      'メガセグレイブ should exist in pokemon master'
    ).toBeDefined();
    expect(megaBax?.regulations).toContain('M-C');
    expect(megaBax?.abilities.map((a) => a.ja)).toContain('ねつこうかん');

    const megaAbsolZ = (pokemonMaster.default as PokemonMaster[]).find(
      (poke) => poke.name.ja === 'メガアブソルZ'
    );
    expect(
      megaAbsolZ,
      'メガアブソルZ should exist in pokemon master'
    ).toBeDefined();
    expect(megaAbsolZ?.abilities.map((a) => a.ja)).toContain('きれあじ');

    const megaGolisopod = (pokemonMaster.default as PokemonMaster[]).find(
      (poke) => poke.name.ja === 'メガグソクムシャ'
    );
    expect(
      megaGolisopod,
      'メガグソクムシャ should exist in pokemon master'
    ).toBeDefined();
    expect(megaGolisopod?.types).toEqual(['bug', 'steel']);
    expect(megaGolisopod?.learnable_moves).toContain(369); // とんぼがえり (U-turn)
    expect(megaGolisopod?.learnable_moves).toContain(453); // アクアジェット (Aqua Jet)
    expect(megaGolisopod?.learnable_moves).toContain(442); // アイアンヘッド (Iron Head)
    expect(megaGolisopod?.learnable_moves.length).toBe(67);

    const golisopod = (pokemonMaster.default as PokemonMaster[]).find(
      (poke) => poke.name.ja === 'グソクムシャ'
    );
    expect(
      golisopod,
      'グソクムシャ should exist in pokemon master'
    ).toBeDefined();
    expect(golisopod?.learnable_moves).toContain(369); // とんぼがえり (U-turn)
    expect(golisopod?.learnable_moves).toContain(453); // アクアジェット (Aqua Jet)
    expect(golisopod?.learnable_moves.length).toBe(67);
  });

  it('should refresh items_master.json to only contain valid holdable items and exclude pokeballs', () => {
    const masterBall = (itemsMaster.default as ItemMaster[]).find(
      (item) => item.name.ja === 'マスターボール'
    );
    expect(
      masterBall,
      'マスターボール should be removed from items_master'
    ).toBeUndefined();

    const leek = (itemsMaster.default as ItemMaster[]).find(
      (item) => item.name.ja === 'ながねぎ'
    );
    expect(leek, 'ながねぎ should exist in items_master').toBeDefined();

    const rockyHelmet = (itemsMaster.default as ItemMaster[]).find(
      (item) => item.name.ja === 'ゴツゴツメット'
    );
    expect(
      rockyHelmet,
      'ゴツゴツメット should exist in items_master'
    ).toBeDefined();

    const absoliteZ = (itemsMaster.default as ItemMaster[]).find(
      (item) => item.name.ja === 'アブソルナイトZ'
    );
    expect(
      absoliteZ,
      'アブソルナイトZ should exist in items_master'
    ).toBeDefined();

    const noneItem = (itemsMaster.default as ItemMaster[]).find(
      (item) => item.name.ja === 'なし'
    );
    expect(noneItem, 'なし should exist in items_master').toBeDefined();
  });
});
