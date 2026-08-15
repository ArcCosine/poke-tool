import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { PartySimulator } from './PartySimulator';

// Mock DB because tests run in Node/happy-dom without IndexedDB
vi.mock('../../utils/db', () => {
  return {
    db: {
      loadMasterData: vi.fn().mockResolvedValue({
        pokemon: [
          {
            id: 149,
            name: { ja: 'カイリュー', en: 'Dragonite' },
            types: ['dragon', 'flying'],
            base_stats: {
              hp: 91,
              attack: 134,
              defense: 95,
              sp_attack: 100,
              sp_defense: 100,
              speed: 80,
            },
            abilities: [{ ja: 'マルチスケイル', en: 'multiscale' }],
            regulations: ['M-A'],
            learnable_moves: [],
          },
          {
            id: 25,
            name: { ja: 'ピカチュウ', en: 'Pikachu' },
            types: ['electric'],
            base_stats: {
              hp: 35,
              attack: 55,
              defense: 40,
              sp_attack: 50,
              sp_defense: 50,
              speed: 90,
            },
            abilities: [{ ja: 'せいでんき', en: 'static' }],
            regulations: ['M-A'],
            learnable_moves: [],
          },
          {
            id: 68,
            name: { ja: 'カイリキー', en: 'Machamp' },
            types: ['fighting'],
            base_stats: {
              hp: 90,
              attack: 130,
              defense: 80,
              sp_attack: 65,
              sp_defense: 85,
              speed: 55,
            },
            abilities: [{ ja: 'ノーガード', en: 'no-guard' }],
            regulations: ['M-A'],
            learnable_moves: [],
          },
        ],
        moves: [],
        items: [],
      }),
    },
  };
});

describe('PartySimulator Pokémon Search Filtering', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render filter input field and filter dropdown options accordingly', async () => {
    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    // Wait for the loading to complete
    expect(await screen.findByText('パーティ名')).toBeDefined();

    // Check that the filter input exists
    // The placeholder should be set
    const filterInput = screen.getByPlaceholderText(/絞り込み|Filter/);
    expect(filterInput).toBeDefined();

    // The select dropdown should exist and initially contain all options
    const select = screen.getByRole('combobox', {
      name: /^ポケモン #1$/i,
    }) as HTMLSelectElement;
    expect(select).toBeDefined();

    // Check options. Standard HTML options
    const getOptionNames = () =>
      Array.from(select.options).map((opt) => opt.textContent);

    let options = getOptionNames();
    expect(options).toContain('カイリュー');
    expect(options).toContain('ピカチュウ');
    expect(options).toContain('カイリキー');

    // 1. Filter by Japanese Katakana "カイ"
    fireEvent.change(filterInput, { target: { value: 'カイ' } });
    options = getOptionNames();
    expect(options).toContain('カイリュー');
    expect(options).toContain('カイリキー');
    expect(options).not.toContain('ピカチュウ');

    // 2. Filter by Japanese Hiragana "かい" (should automatically match Katakana "カイリュー" / "カイリキー")
    fireEvent.change(filterInput, { target: { value: 'かい' } });
    options = getOptionNames();
    expect(options).toContain('カイリュー');
    expect(options).toContain('カイリキー');
    expect(options).not.toContain('ピカチュウ');

    // 3. Filter by English "Pikachu"
    fireEvent.change(filterInput, { target: { value: 'Pikachu' } });
    options = getOptionNames();
    expect(options).not.toContain('カイリュー');
    expect(options).not.toContain('カイリキー');
    expect(options).toContain('ピカチュウ');

    // 4. Select the filtered pokemon
    fireEvent.change(select, { target: { value: '25' } });
    expect(select.value).toBe('25');

    // After selection, the pokemon details should be displayed (e.g. types or ability selector)
    expect(await screen.findByText(/せいでんき/)).toBeDefined();
  });
});
