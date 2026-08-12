import { act, render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageAnalyzer } from './ImageAnalyzer';
import { AppProvider } from '../../context/AppContext';

// Mock DB with the 6 target pokemons
vi.mock('../../utils/db', () => {
  const mockPokemons = [
    { id: 658, name: { ja: 'ゲッコウガ', en: 'Greninja' }, abilities: [{ ja: 'へんげんじざい', en: 'Protean' }], regulations: ['M-A', 'M-B'], learnable_moves: [] },
    { id: 908, name: { ja: 'マスカーニャ', en: 'Meowscarada' }, abilities: [{ ja: 'へんげんじざい', en: 'Protean' }], regulations: ['M-A', 'M-B'], learnable_moves: [] },
    { id: 257, name: { ja: 'バシャーモ', en: 'Blaziken' }, abilities: [{ ja: 'かそく', en: 'Speed Boost' }], regulations: ['M-B'], learnable_moves: [] },
    { id: 450, name: { ja: 'カバルドン', en: 'Hippowdon' }, abilities: [{ ja: 'すなおこし', en: 'Sand Stream' }], regulations: ['M-A', 'M-B'], learnable_moves: [] },
    { id: 730, name: { ja: 'アシレーヌ', en: 'Primarina' }, abilities: [{ ja: 'げきりゅう', en: 'Torrent' }], regulations: ['M-A', 'M-B'], learnable_moves: [] },
    { id: 212, name: { ja: 'ハッサム', en: 'Scizor' }, abilities: [{ ja: 'テクニシャン', en: 'Technician' }], regulations: ['M-A', 'M-B'], learnable_moves: [] },
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
  ];
  return {
    db: {
      loadMasterData: vi.fn().mockResolvedValue({
        pokemon: mockPokemons,
        moves: mockMoves,
      }),
    },
  };
});

describe('ImageAnalyzer component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(window, 'setTimeout').mockImplementation((fn: any) => {
      fn();
      return 0 as any;
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
    expect(savedParty.members[0].evs.sp_attack).toBe(32);
    expect(savedParty.members[0].evs.speed).toBe(32);
  });
});


