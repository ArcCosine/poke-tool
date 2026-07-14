import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

// Mock DB because tests run in Node/happy-dom without IndexedDB
vi.mock('./utils/db', () => {
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
            regulations: ['M-A', 'M-B'],
            learnable_moves: [],
          },
        ],
        moves: [],
      }),
    },
  };
});

describe('Poke-Tool Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should render application dashboard and support tabs switching', async () => {
    render(<App />);

    // Dashboard initial title
    expect(screen.getByText(/Welcome to the Poke-Tool/i)).toBeDefined();

    // Switch to Stat Search tab
    const tabStatSearch = screen.getAllByText('火力・耐久検索')[0];
    act(() => {
      tabStatSearch.click();
    });

    // Wait for the async loaded content to appear
    expect(await screen.findByText('検索項目')).toBeDefined();

    // Switch to Party Simulator tab
    const tabParty = screen.getAllByText('パーティシミュレーター')[0];
    act(() => {
      tabParty.click();
    });

    expect(await screen.findByText('パーティ名')).toBeDefined();
  });

  it('should switch languages successfully', () => {
    render(<App />);

    const langBtn = screen.getByText('English');
    act(() => {
      langBtn.click();
    });

    // Should now display English button alternative text '日本語'
    expect(screen.getByText('日本語')).toBeDefined();
  });

  it('should toggle dark/light theme classes', () => {
    render(<App />);

    // Default theme is dark
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    const themeBtn = screen.getByTestId('theme-toggle');
    act(() => {
      themeBtn.click();
    });

    // Now should be light
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
