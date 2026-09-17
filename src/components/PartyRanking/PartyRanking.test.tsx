import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { AuthProvider } from '../../context/AuthContext';
import { encodePartyConfig } from '../../utils/share';
import { PartyRanking } from './PartyRanking';

// Create a dummy Base62 party code
const samplePartyData = encodePartyConfig({
  members: [
    {
      pokemonId: 3, // フシギバナ
      nature: 'modest',
      itemId: 1,
      abilityIndex: 0,
      evs: {
        hp: 0,
        attack: 0,
        defense: 0,
        sp_attack: 32,
        sp_defense: 0,
        speed: 32,
      },
      moves: [1, 2, 3, 4],
    },
    {
      pokemonId: 6, // リザードン
      nature: 'timid',
      itemId: 2,
      abilityIndex: 0,
      evs: {
        hp: 0,
        attack: 0,
        defense: 0,
        sp_attack: 32,
        sp_defense: 0,
        speed: 32,
      },
      moves: [5, 6, 7, 8],
    },
  ],
});

const mockParties = [
  {
    id: 'party-1',
    user_id: 'user-1',
    title: '最強バランス構築',
    regulation: 'all',
    party_data: samplePartyData,
    rental_code: 'ABCD-1234-EFGH',
    article_url: 'https://note.com/trainer/p/12345',
    description: '基本選出と立ち回りの解説です。',
    likes_count: 42,
    ranking_score: 42.0,
    views_count: 150,
    created_at: 1700000000,
    updated_at: 1700000000,
    author_name: 'サトシ',
    author_avatar: 'https://example.com/avatar.png',
  },
  {
    id: 'party-2',
    user_id: 'user-2',
    title: '対面重視スタン',
    regulation: 'reg-h',
    party_data: samplePartyData,
    rental_code: null,
    article_url: null,
    description: 'シンプルな対面構築。',
    likes_count: 10,
    ranking_score: 10.0,
    views_count: 50,
    created_at: 1700001000,
    updated_at: 1700001000,
    author_name: null,
    author_avatar: null,
  },
];

describe('PartyRanking component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    // Mock clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
      writable: true,
      configurable: true,
    });

    // Default fetch mock
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/ranking')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ parties: mockParties, page: 1, limit: 20 }),
        } as any);
      }
      if (urlStr.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: null }),
        } as any);
      }
      if (urlStr.includes('/data/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as any);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as any);
    });
  });

  const renderComponent = () => {
    return render(
      <AppProvider>
        <AuthProvider>
          <PartyRanking />
        </AuthProvider>
      </AppProvider>
    );
  };

  it('renders party cards with title, author, and descriptions', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('最強バランス構築')).toBeDefined();
      expect(screen.getByText('サトシ')).toBeDefined();
      expect(screen.getByText('基本選出と立ち回りの解説です。')).toBeDefined();
      expect(screen.getByText('対面重視スタン')).toBeDefined();
      expect(screen.getByText('名無しのトレーナー')).toBeDefined();
    });

    // Author icons/avatars should NOT be rendered
    expect(screen.queryByAltText('https://example.com/avatar.png')).toBeNull();
    const userIcons = document.querySelectorAll('.i-lucide-user');
    expect(userIcons.length).toBe(0);
  });

  it('allows sorting between score and newest', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('最強バランス構築')).toBeDefined();
    });

    const newestTab = screen.getByText('新着順');
    fireEvent.click(newestTab);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=newest')
      );
    });
  });

  it('copies rental code to clipboard when clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('ABCD-1234-EFGH')).toBeDefined();
    });

    const copyBtn = screen.getByLabelText('レンタルコードをコピー');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'ABCD-1234-EFGH'
    );
    await waitFor(() => {
      expect(
        screen.getByText('レンタルコードをコピーしました！')
      ).toBeDefined();
    });
  });

  it('renders article link with secure attributes', async () => {
    renderComponent();

    await waitFor(() => {
      const articleLink = screen.getByText('構築記事を開く').closest('a');
      expect(articleLink).toBeDefined();
      expect(articleLink?.getAttribute('href')).toBe(
        'https://note.com/trainer/p/12345'
      );
      expect(articleLink?.getAttribute('target')).toBe('_blank');
      expect(articleLink?.getAttribute('rel')).toContain('noopener');
      expect(articleLink?.getAttribute('rel')).toContain('noreferrer');
      expect(articleLink?.getAttribute('rel')).toContain('nofollow');
    });
  });

  it('links import button to party.html with party_data', async () => {
    renderComponent();

    await waitFor(() => {
      const importLinks = screen.getAllByText('このパーティを読み込む');
      expect(importLinks.length).toBe(2);
      const firstLink = importLinks[0].closest('a');
      expect(firstLink?.getAttribute('href')).toBe(
        `/party.html?p=${samplePartyData}`
      );
    });
  });

  it('handles like toggle when like button is clicked', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/parties/party-1/like')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              isLiked: true,
              likesCount: 43,
              rankingScore: 43.0,
            }),
        } as any);
      }
      if (urlStr.includes('/api/ranking')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ parties: mockParties, page: 1, limit: 20 }),
        } as any);
      }
      if (urlStr.includes('/data/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as any);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as any);
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('42')).toBeDefined();
    });

    const likeButtons = screen.getAllByRole('button', { name: /いいね/ });
    fireEvent.click(likeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('43')).toBeDefined();
    });
  });

  it('displays empty state when no parties exist', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/ranking')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ parties: [], page: 1, limit: 20 }),
        } as any);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as any);
    });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('公開されたパーティがまだありません')
      ).toBeDefined();
      expect(screen.getByText('パーティを作成して公開する')).toBeDefined();
    });
  });
});
