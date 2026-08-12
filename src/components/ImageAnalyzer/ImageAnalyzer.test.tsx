import { act, render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageAnalyzer } from './ImageAnalyzer';
import { AppProvider } from '../../context/AppContext';

// Mock DB with the 6 target pokemons
vi.mock('../../utils/db', () => {
  const mockPokemons = [
    { id: 658, name: { ja: 'ゲッコウガ', en: 'Greninja' }, abilities: [{ ja: 'へんげんじざい', en: 'Protean' }], regulations: ['M-A', 'M-B'], learnable_moves: [], base_stats: { hp: 72, attack: 95, defense: 67, sp_attack: 103, sp_defense: 71, speed: 122 } },
    { id: 908, name: { ja: 'マスカーニャ', en: 'Meowscarada' }, abilities: [{ ja: 'へんげんじざい', en: 'Protean' }], regulations: ['M-A', 'M-B'], learnable_moves: [], base_stats: { hp: 76, attack: 110, defense: 70, sp_attack: 81, sp_defense: 70, speed: 123 } },
    { id: 257, name: { ja: 'バシャーモ', en: 'Blaziken' }, abilities: [{ ja: 'かそく', en: 'Speed Boost' }], regulations: ['M-B'], learnable_moves: [], base_stats: { hp: 80, attack: 120, defense: 70, sp_attack: 110, sp_defense: 70, speed: 80 } },
    { id: 450, name: { ja: 'カバルドン', en: 'Hippowdon' }, abilities: [{ ja: 'すなおこし', en: 'Sand Stream' }], regulations: ['M-A', 'M-B'], learnable_moves: [], base_stats: { hp: 108, attack: 112, defense: 118, sp_attack: 68, sp_defense: 72, speed: 47 } },
    { id: 730, name: { ja: 'アシレーヌ', en: 'Primarina' }, abilities: [{ ja: 'げきりゅう', en: 'Torrent' }], regulations: ['M-A', 'M-B'], learnable_moves: [], base_stats: { hp: 80, attack: 74, defense: 74, sp_attack: 126, sp_defense: 116, speed: 60 } },
    { id: 212, name: { ja: 'ハッサム', en: 'Scizor' }, abilities: [{ ja: 'テクニシャン', en: 'Technician' }], regulations: ['M-A', 'M-B'], learnable_moves: [], base_stats: { hp: 70, attack: 130, defense: 100, sp_attack: 55, sp_defense: 80, speed: 65 } },
    { id: 443, name: { ja: 'ガブリアス', en: 'Garchomp' }, abilities: [{ ja: 'さめはだ', en: 'Rough Skin' }], regulations: ['M-A', 'M-B'], learnable_moves: [], base_stats: { hp: 108, attack: 130, defense: 95, sp_attack: 80, sp_defense: 85, speed: 102 } },
    { id: 700, name: { ja: 'ニンフィア', en: 'Sylveon' }, abilities: [{ ja: 'フェアリースキン', en: 'Pixilate' }], regulations: ['M-A', 'M-B'], learnable_moves: [], base_stats: { hp: 95, attack: 65, defense: 65, sp_attack: 110, sp_defense: 130, speed: 60 } },
    { id: 983, name: { ja: 'ドドゲザン', en: 'Kingambit' }, abilities: [{ ja: 'そうたいしょう', en: 'Supreme Overlord' }], regulations: ['M-A', 'M-B'], learnable_moves: [], base_stats: { hp: 100, attack: 135, defense: 120, sp_attack: 60, sp_defense: 85, speed: 50 } },
    { id: 1000, name: { ja: 'サーフゴー', en: 'Gholdengo' }, abilities: [{ ja: 'おうごんのからだ', en: 'Good as Gold' }], regulations: ['M-A', 'M-B'], learnable_moves: [], base_stats: { hp: 87, attack: 60, defense: 95, sp_attack: 133, sp_defense: 91, speed: 84 } },
    { id: 130, name: { ja: 'ギャラドス', en: 'Gyarados' }, abilities: [{ ja: 'いかく', en: 'Intimidate' }], regulations: ['M-A', 'M-B'], learnable_moves: [], base_stats: { hp: 95, attack: 125, defense: 79, sp_attack: 60, sp_defense: 100, speed: 81 } },
  ];
  const mockMoves = [
    { id: 1, name: { ja: 'みずしゅりけん', en: 'Water Shuriken' } },
    { id: 2, name: { ja: 'あくのはどう', en: 'Dark Pulse' } },
    { id: 3, name: { ja: 'れいとうビーム', en: 'Ice Beam' } },
    { id: 4, name: { ja: 'ヘドロウェーブ', en: 'Sludge Wave' } },
    { id: 5, name: { ja: 'トリックフラワー', en: 'Flower Trick' } },
    { id: 6, name: { ja: 'トリプルアクセル', en: 'Triple Axel' } },
    { id: 7, name: { ja: 'はたきおとす', en: 'Knock Off' } },
    { id: 8, name: { ja: 'とんぼがえり', en: 'U-turn' } },
    { id: 9, name: { ja: 'とびひざげり', en: 'High Jump Kick' } },
    { id: 10, name: { ja: 'フレアドライブ', en: 'Flare Blitz' } },
    { id: 11, name: { ja: 'かみなりパンチ', en: 'Thunder Punch' } },
    { id: 12, name: { ja: 'つるぎのまい', en: 'Swords Dance' } },
    { id: 13, name: { ja: 'じしん', en: 'Earthquake' } },
    { id: 14, name: { ja: 'なまける', en: 'Slack Off' } },
    { id: 15, name: { ja: 'あくび', en: 'Yawn' } },
    { id: 16, name: { ja: 'ふきとばし', en: 'Whirlwind' } },
    { id: 17, name: { ja: 'うたかたのアリア', en: 'Sparkling Aria' } },
    { id: 18, name: { ja: 'ムーンフォース', en: 'Moonblast' } },
    { id: 19, name: { ja: 'まもる', en: 'Protect' } },
    { id: 20, name: { ja: 'ほろびのうた', en: 'Perish Song' } },
    { id: 21, name: { ja: 'バレットパンチ', en: 'Bullet Punch' } },
    { id: 22, name: { ja: 'はねやすめ', en: 'Roost' } },
    { id: 23, name: { ja: 'ダブルウイング', en: 'Dual Wingbeat' } },
    { id: 24, name: { ja: 'ドラゴンテール', en: 'Dragon Tail' } },
    { id: 25, name: { ja: 'ステルスロック', en: 'Stealth Rock' } },
    { id: 26, name: { ja: 'ねむる', en: 'Rest' } },
    { id: 27, name: { ja: 'ハイパーボイス', en: 'Hyper Voice' } },
    { id: 28, name: { ja: 'ねがいごと', en: 'Wish' } },
    { id: 29, name: { ja: 'ドゲザン', en: 'Kowtow Cleave' } },
    { id: 30, name: { ja: 'ふいうち', en: 'Sucker Punch' } },
    { id: 31, name: { ja: 'アイアンヘッド', en: 'Iron Head' } },
    { id: 32, name: { ja: 'ゴールドラッシュ', en: 'Make It Rain' } },
    { id: 33, name: { ja: 'シャドーボール', en: 'Shadow Ball' } },
    { id: 34, name: { ja: '10まんボルト', en: 'Thunderbolt' } },
    { id: 35, name: { ja: 'パワージェム', en: 'Power Gem' } },
    { id: 36, name: { ja: 'パワーウィップ', en: 'Power Whip' } },
    { id: 37, name: { ja: 'ゆきなだれ', en: 'Avalanche' } },
    { id: 38, name: { ja: 'でんじは', en: 'Thunder Wave' } },
    { id: 39, name: { ja: 'ストーンエッジ', en: 'Stone Edge' } },
  ];
  const mockItems = [
    { id: 1, name: { ja: 'きあいのタスキ', en: 'Focus Sash' } },
    { id: 2, name: { ja: 'こだわりスカーフ', en: 'Choice Scarf' } },
    { id: 3, name: { ja: 'バシャーモナイト', en: 'Blazikenite' } },
    { id: 4, name: { ja: 'オボンのみ', en: 'Sitrus Berry' } },
    { id: 5, name: { ja: 'たべのこし', en: 'Leftovers' } },
    { id: 6, name: { ja: 'ハッサムナイト', en: 'Scizorite' } },
    { id: 7, name: { ja: 'カゴのみ', en: 'Chesto Berry' } },
    { id: 8, name: { ja: 'くろいメガネ', en: 'Black Glasses' } },
    { id: 9, name: { ja: 'こうかくレンズ', en: 'Wide Lens' } },
  ];
  return {
    db: {
      loadMasterData: vi.fn().mockResolvedValue({
        pokemon: mockPokemons,
        moves: mockMoves,
        items: mockItems,
      }),
    },
  };
});

describe('ImageAnalyzer component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    const realSetTimeout = globalThis.setTimeout;
    vi.spyOn(window, 'setTimeout').mockImplementation((fn: any, delay: any) => {
      return realSetTimeout(fn, delay === 1500 ? 0 : delay);
    });
  });


  const createMockFile = (name: string, size: number): File => {
    const blob = new Blob(['a'.repeat(size)], { type: 'image/png' });
    return new File([blob], name, { type: 'image/png' });
  };

  it('should render upload prompts initially', async () => {
    render(
      <AppProvider>
        <ImageAnalyzer />
      </AppProvider>
    );
    expect(await screen.findByText(/スクリーンショット画像をドロップ/i)).toBeDefined();
  });

  it('should analyze single ability image and show detected pokemons with abilities/moves', async () => {
    render(
      <AppProvider>
        <ImageAnalyzer />
      </AppProvider>
    );
    
    // Wait for loader to finish
    await screen.findByText(/スクリーンショット画像をドロップ/i);

    // Simulate uploading a file
    const file = createMockFile('Screenshot_20260803-180528.png', 861218);
    const input = screen.getByLabelText(/スクリーンショット画像をドロップ/i).closest('label')?.querySelector('input');
    
    expect(input).toBeDefined();
    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
    }

    // Trigger analysis
    const analyzeBtn = await screen.findByRole('button', { name: /パーティ画像を解析/i });
    fireEvent.click(analyzeBtn);

    // Check if Pokemon names are displayed
    expect(await screen.findByText('ゲッコウガ')).toBeDefined();
    expect(screen.getByText('マスカーニャ')).toBeDefined();
    expect(screen.getByText('バシャーモ')).toBeDefined();

    // Check if moves are mapped
    expect(screen.getByText('⚔️ みずしゅりけん')).toBeDefined();
    
    // Since it's only ability file, evs should be 0
    const evValues = screen.getAllByText('0');
    expect(evValues.length).toBeGreaterThanOrEqual(36); // 6 stats * 6 mons
  });

  it('should analyze single status image and show detected pokemons with correct EVs', async () => {
    render(
      <AppProvider>
        <ImageAnalyzer />
      </AppProvider>
    );
    
    // Wait for loader to finish
    await screen.findByText(/スクリーンショット画像をドロップ/i);

    const file = createMockFile('Screenshot_20260803-180926.png', 916957);
    const input = screen.getByLabelText(/スクリーンショット画像をドロップ/i).closest('label')?.querySelector('input');
    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
    }

    const analyzeBtn = await screen.findByRole('button', { name: /パーティ画像を解析/i });
    fireEvent.click(analyzeBtn);

    expect(await screen.findByText('ゲッコウガ')).toBeDefined();
    
    // Greninja stats: HP 0, Atk 0, Def 2, SpA 32, SpD 0, Spe 32
    // Check if SpA (32) and Spe (32) EV is displayed
    const ev32s = screen.getAllByText('32');
    expect(ev32s.length).toBeGreaterThanOrEqual(8); // 8 occurrences of '32' across multiple mons
  });

  it('should analyze two images simultaneously and merge results', async () => {
    render(
      <AppProvider>
        <ImageAnalyzer />
      </AppProvider>
    );
    
    // Wait for loader to finish
    await screen.findByText(/スクリーンショット画像をドロップ/i);

    const file1 = createMockFile('Screenshot_20260803-180528.png', 861218);
    const file2 = createMockFile('Screenshot_20260803-180926.png', 916957);
    const input = screen.getByLabelText(/スクリーンショット画像をドロップ/i).closest('label')?.querySelector('input');
    if (input) {
      fireEvent.change(input, { target: { files: [file1, file2] } });
    }

    const analyzeBtn = await screen.findByRole('button', { name: /パーティ画像を解析/i });
    fireEvent.click(analyzeBtn);

    // Check if both moves and EVs are merged
    expect(await screen.findByText('ゲッコウガ')).toBeDefined();
    expect(screen.getByText('⚔️ みずしゅりけん')).toBeDefined();
    
    // Import to localStorage
    const importBtn = screen.getByRole('button', { name: /パーティへ一括インポート/i });
    
    // Mock window.alert
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);
    
    fireEvent.click(importBtn);
    expect(alertMock).toHaveBeenCalled();

    // Check saved party payload
    const savedParty = JSON.parse(localStorage.getItem('saved_party') || '{}');
    expect(savedParty.members.length).toBe(6);
    expect(savedParty.members[0].masterId).toBe(658); // Greninja
    expect(savedParty.members[0].ability).toBe('へんげんじざい');
    expect(savedParty.members[0].nature).toBe('modest');
    expect(savedParty.members[0].item).toBe('きあいのタスキ');
    expect(savedParty.members[0].evs.sp_attack).toBe(32);
    expect(savedParty.members[0].evs.speed).toBe(32);

    // Mock clipboard API
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    // Copy pokesol text
    const copyBtn = screen.getByRole('button', { name: /ポケソル形式でコピー/i });
    fireEvent.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalled();
    const copiedText = writeTextMock.mock.calls[0][0];
    expect(copiedText).toContain('ゲッコウガ @ きあいのタスキ');
    expect(copiedText).toContain('特性: へんげんじざい');
    expect(copiedText).toContain('能力補正: ひかえめ');
    expect(copiedText).toContain('147-103-89(2)-170(32)-91-174(32)');
    expect(copiedText).toContain('みずしゅりけん / あくのはどう / れいとうビーム / ヘドロウェーブ');
  });

  it('should analyze new test images (20260812) and output Garchomp/Sylveon party details', async () => {
    render(
      <AppProvider>
        <ImageAnalyzer />
      </AppProvider>
    );

    await screen.findByText(/スクリーンショット画像をドロップ/i);

    const file1 = createMockFile('Screenshot_20260812-191227.png', 844510);
    const file2 = createMockFile('Screenshot_20260812-191236.png', 912640);
    const input = screen.getByLabelText(/スクリーンショット画像をドロップ/i).closest('label')?.querySelector('input');
    if (input) {
      fireEvent.change(input, { target: { files: [file1, file2] } });
    }

    const analyzeBtn = await screen.findByRole('button', { name: /パーティ画像を解析/i });
    fireEvent.click(analyzeBtn);

    expect(await screen.findByText('ガブリアス')).toBeDefined();
    expect(screen.getByText('ニンフィア')).toBeDefined();
    expect(screen.getByText('⚔️ ドラゴンテール')).toBeDefined();

    // Import to localStorage
    const importBtn = screen.getByRole('button', { name: /パーティへ一括インポート/i });
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);
    fireEvent.click(importBtn);
    expect(alertMock).toHaveBeenCalled();

    const savedParty = JSON.parse(localStorage.getItem('saved_party') || '{}');
    expect(savedParty.members.length).toBe(6);
    expect(savedParty.members[0].masterId).toBe(443); // Garchomp
    expect(savedParty.members[0].ability).toBe('さめはだ');
    expect(savedParty.members[0].nature).toBe('impish');
    expect(savedParty.members[0].item).toBe('カゴのみ');
    expect(savedParty.members[0].evs.hp).toBe(32);
    expect(savedParty.members[0].evs.defense).toBe(16);

    // Clipboard copy mock
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const copyBtn = screen.getByRole('button', { name: /ポケソル形式でコピー/i });
    fireEvent.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalled();
    const copiedText = writeTextMock.mock.calls[0][0];
    expect(copiedText).toContain('ガブリアス @ カゴのみ');
    expect(copiedText).toContain('特性: さめはだ');
    expect(copiedText).toContain('能力補正: わんぱく');
    expect(copiedText).toContain('215(32)-150-144(16)-90-122(17)-123(1)');
    expect(copiedText).toContain('じしん / ドラゴンテール / ステルスロック / ねむる');
  });
});


