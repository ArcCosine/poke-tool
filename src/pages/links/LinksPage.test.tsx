import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { LinksPage } from './LinksPage';

describe('LinksPage', () => {
  const renderLinksPage = () => {
    return render(
      <AppProvider>
        <LinksPage />
      </AppProvider>
    );
  };

  it('renders page header and categories in correct order with official on top', () => {
    renderLinksPage();

    // Check page title
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeTruthy();
    expect(mainHeading.textContent).toContain('ポケモン攻略リンク集');

    // Check categories order
    const mainElement = screen.getByRole('main');
    const categoryHeadings = mainElement.querySelectorAll('h2');
    expect(categoryHeadings.length).toBe(5);

    // Official info should be the first category, followed by damage calculators
    expect(categoryHeadings[0].textContent).toContain('公式情報');
    expect(categoryHeadings[1].textContent).toContain('ダメージ計算ツール');
    expect(categoryHeadings[2].textContent).toContain('対戦考察・育成論Wiki');
    expect(categoryHeadings[3].textContent).toContain(
      '環境分析・大会・構築記事'
    );
    expect(categoryHeadings[4].textContent).toContain(
      '総合データベース・百科事典'
    );
  });

  it('renders all links as anchors with security attributes and language tags', () => {
    renderLinksPage();

    // Check specific links
    const championsOfficial = screen.getByRole('link', {
      name: /ポケモンチャンピオンズ 公式サイト.*日本語/,
    });
    expect(championsOfficial).toBeTruthy();
    expect(championsOfficial.getAttribute('href')).toBe(
      'https://www.pokemonchampions.jp/ja/'
    );
    expect(championsOfficial.getAttribute('target')).toBe('_blank');
    expect(championsOfficial.getAttribute('rel')).toBe('noopener noreferrer');

    // Check pokeDB champions link
    const pokeDbLink = screen.getByRole('link', {
      name: /ポケモンバトルデータベース.*日本語/,
    });
    expect(pokeDbLink).toBeTruthy();
    expect(pokeDbLink.getAttribute('href')).toBe(
      'https://champs.pokedb.tokyo/'
    );

    // Check damage calculator links
    const yakkunCalcLink = screen.getByRole('link', {
      name: /ポケモン徹底攻略 ダメージ計算機.*日本語/,
    });
    expect(yakkunCalcLink).toBeTruthy();
    expect(yakkunCalcLink.getAttribute('href')).toBe(
      'https://yakkun.com/tool/damage.htm'
    );

    const gamewithCalcLink = screen.getByRole('link', {
      name: /GameWith ダメージ計算機.*日本語/,
    });
    expect(gamewithCalcLink).toBeTruthy();
    expect(gamewithCalcLink.getAttribute('href')).toBe(
      'https://gamewith.jp/pokemon-champions/554133'
    );

    const pokesolCalcLink = screen.getByRole('link', {
      name: /ポケソル ダメージ計算機.*日本語/,
    });
    expect(pokesolCalcLink).toBeTruthy();
    expect(pokesolCalcLink.getAttribute('href')).toBe(
      'https://pokesol.app/calc'
    );

    const showdownCalcLink = screen.getByRole('link', {
      name: /Pokémon Showdown! ダメージ計算機.*英語/,
    });
    expect(showdownCalcLink).toBeTruthy();
    expect(showdownCalcLink.getAttribute('href')).toBe(
      'https://calc.pokemonshowdown.com/'
    );

    // Check language labels are rendered in parentheses like （日本語）
    expect(screen.getAllByText(/（日本語）/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/（英語）/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/（韓国語）/).length).toBeGreaterThan(0);
  });
});
