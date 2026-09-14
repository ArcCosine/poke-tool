import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import DashboardApp from './main';

describe('Dashboard MPA Page', () => {
  it('renders all tool cards with valid links to separate HTML pages', () => {
    render(
      <AppProvider>
        <DashboardApp />
      </AppProvider>
    );

    // Ranking links exist and contain /ranking.html
    const rankingLinks = screen.getAllByRole('link', {
      name: /火力・耐久検索/i,
    });
    expect(
      rankingLinks.some((l) => l.getAttribute('href') === '/ranking.html')
    ).toBe(true);

    // EV Calculator links exist and contain /ev-calculator.html
    const evLinks = screen.getAllByRole('link', {
      name: /努力値計算ツール/i,
    });
    expect(
      evLinks.some((l) => l.getAttribute('href') === '/ev-calculator.html')
    ).toBe(true);

    // Party Simulator links exist and contain /party.html
    const partyLinks = screen.getAllByRole('link', {
      name: /パーティ編成シミュレーター/i,
    });
    expect(
      partyLinks.some((l) => l.getAttribute('href') === '/party.html')
    ).toBe(true);
  });
});
