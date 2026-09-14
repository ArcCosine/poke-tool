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
  });
});
