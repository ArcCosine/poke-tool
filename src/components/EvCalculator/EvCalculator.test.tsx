import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { EvCalculator } from './EvCalculator';

// Mock DB loader
vi.mock('../../utils/db', async () => {
  const actual = await vi.importActual<any>('../../utils/db');
  return {
    ...actual,
    db: {
      ...actual.db,
      loadMasterData: vi.fn().mockResolvedValue({
        pokemon: [
          {
            id: 9,
            name: { ja: 'カメックス', en: 'Blastoise' },
            types: ['water'],
            base_stats: {
              hp: 79,
              attack: 83,
              defense: 100,
              sp_attack: 85,
              sp_defense: 105,
              speed: 78,
            },
            abilities: [
              { ja: 'げきりゅう', en: 'Torrent' },
              { ja: 'あめうけざら', en: 'Rain Dish' },
            ],
            regulations: ['M-A'],
            learnable_moves: [1, 2],
          },
        ],
        moves: [
          {
            id: 1,
            name: { ja: 'ハイドロポンプ', en: 'Hydro Pump' },
            type: 'water',
            category: 'special',
            power: 110,
          },
          {
            id: 2,
            name: { ja: 'れいとうビーム', en: 'Ice Beam' },
            type: 'ice',
            category: 'special',
            power: 90,
          },
        ],
        items: [{ id: 1, name: { ja: 'たべのこし', en: 'Leftovers' } }],
      }),
    },
  };
});

describe('EvCalculator', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render loading state initially', async () => {
    render(
      <AppProvider>
        <EvCalculator />
      </AppProvider>
    );

    expect(screen.getByText(/データを読み込み中/i)).toBeDefined();
  });

  it('should render search prompts once data is loaded', async () => {
    await act(async () => {
      render(
        <AppProvider>
          <EvCalculator />
        </AppProvider>
      );
    });

    // Check for search button
    expect(screen.getAllByText(/ポケモンを選択/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('努力値と実数値')).toBeNull();
  });

  it('should render detailed stats and fields after selecting a pokemon', async () => {
    await act(async () => {
      render(
        <AppProvider>
          <EvCalculator />
        </AppProvider>
      );
    });

    // Open search modal
    const searchBtn = screen.getAllByText(/ポケモンを選択/i)[0];
    await act(async () => {
      fireEvent.click(searchBtn);
    });

    // Click on Blastoise (カメックス) in the list
    const pokeRow = screen.getByText('カメックス');
    await act(async () => {
      fireEvent.click(pokeRow);
    });

    // Verified fields rendered
    expect(screen.getByText('HP')).toBeDefined();
    expect(screen.getByText('特性')).toBeDefined();
    expect(screen.getByText('性格')).toBeDefined();
  });
});
