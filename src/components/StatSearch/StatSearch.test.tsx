import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { StatSearch } from './StatSearch';

// Mock DB because tests run in Node/happy-dom without IndexedDB
vi.mock('../../utils/db', () => {
  return {
    db: {
      loadMasterData: vi.fn().mockResolvedValue({
        pokemon: [
          {
            id: 1,
            name: { ja: 'フシギダネ', en: 'Bulbasaur' },
            types: ['grass', 'poison'],
            base_stats: {
              hp: 45,
              attack: 49,
              defense: 49,
              sp_attack: 65,
              sp_defense: 65,
              speed: 45,
            },
            abilities: [{ ja: 'しんりょく', en: 'Overgrow' }],
            regulations: ['M-A', 'M-B'],
            learnable_moves: [],
          },
          {
            id: 150,
            name: { ja: 'ミュウツー', en: 'Mewtwo' },
            types: ['psychic'],
            base_stats: {
              hp: 106,
              attack: 110,
              defense: 90,
              sp_attack: 154,
              sp_defense: 90,
              speed: 130,
            },
            abilities: [{ ja: 'プレッシャー', en: 'Pressure' }],
            regulations: ['M-C'], // M-C (今後のレギュレーション) でのみ解禁される想定のテストデータ
            learnable_moves: [],
          },
          {
            id: 979,
            name: { ja: 'コノヨザル', en: 'Annihilape' },
            types: ['fighting', 'ghost'],
            base_stats: {
              hp: 110,
              attack: 115,
              defense: 80,
              sp_attack: 50,
              sp_defense: 90,
              speed: 90,
            },
            abilities: [{ ja: 'やるき', en: 'Vital Spirit' }],
            regulations: ['M-B'], // M-Bで追加されたポケモンの想定
            learnable_moves: [],
          },
        ],
        moves: [],
        items: [],
      }),
    },
  };
});

// Mock regulations.json to test future regulation compatibility
vi.mock('../../data/regulations.json', () => {
  return {
    default: [
      { id: 'M-A', name: { ja: 'レギュレーションM-A', en: 'Regulation M-A' } },
      { id: 'M-B', name: { ja: 'レギュレーションM-B', en: 'Regulation M-B' } },
      { id: 'M-C', name: { ja: 'レギュレーションM-C', en: 'Regulation M-C' } },
    ],
  };
});

describe('StatSearch Ranking Display and Filters', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should NOT render regulation filter dropdown', async () => {
    render(
      <AppProvider>
        <StatSearch />
      </AppProvider>
    );

    // Wait for loader to disappear
    expect(await screen.findByText('フシギダネ')).toBeDefined();

    // Regulation filter should be removed
    const regSelect = screen.queryByLabelText(/レギュレーション|regulation/i);
    expect(regSelect).toBeNull();
  });

  it('should display all pokemons including MC additions without regulation filtering', async () => {
    render(
      <AppProvider>
        <StatSearch />
      </AppProvider>
    );

    expect(await screen.findByText('フシギダネ')).toBeDefined();

    // All pokemons regardless of regulations should be present in the ranking
    expect(screen.getByText('フシギダネ')).toBeDefined();
    expect(screen.getByText('コノヨザル')).toBeDefined();
    expect(screen.getByText('ミュウツー')).toBeDefined();
  });
});
