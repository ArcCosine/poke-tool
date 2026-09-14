import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { Layout } from './Layout';

describe('Layout Component', () => {
  it('renders children with header and navigation links', () => {
    render(
      <AppProvider>
        <Layout activePage="ranking">
          <div>Ranking Page Content</div>
        </Layout>
      </AppProvider>
    );

    expect(screen.getByText('Ranking Page Content')).toBeTruthy();
    expect(screen.getByText('Poke-Tool')).toBeTruthy();

    // Check that navigation links exist with correct hrefs
    const rankingLinks = screen.getAllByRole('link', {
      name: /火力・耐久検索|statSearch/i,
    });
    expect(
      rankingLinks.some((l) => l.getAttribute('href') === '/ranking.html')
    ).toBe(true);

    // Verify bottom navigation bar is rendered
    const bottomNav = screen.getByRole('navigation', {
      name: 'Bottom Navigation',
    });
    expect(bottomNav).toBeTruthy();

    // Verify footer navigation labels match requested texts
    const evCalcLinks = screen.getAllByRole('link', { name: /努力値計算/i });
    expect(evCalcLinks.length).toBeGreaterThan(0);
    expect(
      evCalcLinks.some((l) => l.getAttribute('href') === '/ev-calculator.html')
    ).toBe(true);

    const partyLinks = screen.getAllByRole('link', { name: /パーティ編成/i });
    expect(partyLinks.length).toBeGreaterThan(0);
    expect(
      partyLinks.some((l) => l.getAttribute('href') === '/party.html')
    ).toBe(true);

    // Verify legal footer links are present
    expect(screen.getByText('利用規約')).toBeTruthy();
    expect(screen.getByText('プライバシーポリシー')).toBeTruthy();
    expect(screen.getByText('免責事項')).toBeTruthy();
  });
});
