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
        items: [],
      }),
    },
  };
});

describe('Poke-Tool Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    window.location.hash = '';
  });

  it('should render application dashboard and support tabs switching', async () => {
    render(<App />);

    // Dashboard initial title
    expect(
      screen.getByText(/Poke-Toolへようこそ|Welcome to the Poke-Tool/i)
    ).toBeDefined();

    // Switch to Stat Search tab
    const tabStatSearch = screen.getAllByText('火力・耐久')[0];
    act(() => {
      tabStatSearch.click();
    });

    // Wait for the async loaded content to appear
    expect(await screen.findByText('検索項目')).toBeDefined();

    // Switch to Party Simulator tab
    const tabParty = screen.getAllByText('パーティ編成')[0];
    act(() => {
      tabParty.click();
    });

    expect(await screen.findByText(/編集中のパーティ/)).toBeDefined();
  });

  it('should switch languages successfully using LanguageSelector', () => {
    render(<App />);

    const trigger = screen.getByTestId('language-selector-trigger');
    act(() => {
      trigger.click();
    });

    const englishOption = screen.getByText('English');
    act(() => {
      englishOption.click();
    });

    // Should now display English label on trigger
    expect(screen.getByTestId('language-selector-trigger').textContent).toContain('English');
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

  it('should render legal page links in dashboard with correct hrefs', () => {
    render(<App />);

    // Dashboard should contain the three legal links
    const privacyLink = screen.getByRole('link', {
      name: 'プライバシーポリシー',
    });
    const disclaimerLink = screen.getByRole('link', { name: '免責事項' });
    const termsLink = screen.getByRole('link', { name: '利用規約' });

    expect(privacyLink).toBeDefined();
    expect(disclaimerLink).toBeDefined();
    expect(termsLink).toBeDefined();

    expect(privacyLink.getAttribute('href')).toBe('/privacy.html');
    expect(disclaimerLink.getAttribute('href')).toBe('/disclaimer.html');
    expect(termsLink.getAttribute('href')).toBe('/terms.html');
  });

  it('renders dashboard feature link cards with high contrast text for dark mode', () => {
    render(<App />);

    // 機能リンクの説明文要素を取得
    const descElement = screen.getByText(/レベル50固定時の物理耐久/);
    expect(descElement.className).toContain('dark:text-slate-300');

    // 機能リンクのタイトル要素を取得
    const titleElement = screen.getByRole('heading', { name: /火力・耐久/ });
    expect(titleElement.className).toContain('dark:text-slate-100');
  });
});
