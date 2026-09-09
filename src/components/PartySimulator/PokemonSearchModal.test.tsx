import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import type { PokemonMaster } from '../../utils/db';
import { PokemonSearchModal } from './PokemonSearchModal';

const mockPokemonData: PokemonMaster[] = [
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
    abilities: [
      { ja: 'マルチスケイル', en: 'Multiscale' },
      { ja: 'せいしんりょく', en: 'Inner Focus' },
    ],
    regulations: ['M-A'],
    learnable_moves: [],
  },
];

describe('PokemonSearchModal', () => {
  it('renders modal with dark mode high-contrast text for title and abilities', () => {
    render(
      <AppProvider>
        <PokemonSearchModal
          isOpen={true}
          onClose={vi.fn()}
          onSelect={vi.fn()}
          pokemonData={mockPokemonData}
          autoAdvance={false}
          onToggleAutoAdvance={vi.fn()}
        />
      </AppProvider>
    );

    // タイトルのダークモード文字色検証
    const titleElement = screen.getByRole('heading', {
      name: /ポケモンを選択/,
    });
    expect(titleElement.className).toContain('dark:text-slate-100');

    // 特性テキストのダークモード文字色検証
    const abilityElement = screen.getByText(/マルチスケイル/);
    expect(abilityElement.className).toContain('dark:text-slate-300');
  });

  it('triggers onSelect when a pokemon item is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <AppProvider>
        <PokemonSearchModal
          isOpen={true}
          onClose={vi.fn()}
          onSelect={handleSelect}
          pokemonData={mockPokemonData}
          autoAdvance={false}
          onToggleAutoAdvance={vi.fn()}
        />
      </AppProvider>
    );

    const pokeButton = screen.getByText('カイリュー').closest('button');
    expect(pokeButton).not.toBeNull();
    fireEvent.click(pokeButton!);

    expect(handleSelect).toHaveBeenCalledWith(149);
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <AppProvider>
        <PokemonSearchModal
          isOpen={true}
          onClose={handleClose}
          onSelect={vi.fn()}
          pokemonData={mockPokemonData}
          autoAdvance={false}
          onToggleAutoAdvance={vi.fn()}
        />
      </AppProvider>
    );

    const closeBtn = screen.getByRole('button', { name: /閉じる|Close/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders each pokemon item as an explicit card with default background, borders, and high contrast text', () => {
    render(
      <AppProvider>
        <PokemonSearchModal
          isOpen={true}
          onClose={vi.fn()}
          onSelect={vi.fn()}
          pokemonData={mockPokemonData}
          autoAdvance={false}
          onToggleAutoAdvance={vi.fn()}
        />
      </AppProvider>
    );

    // ポケモンアイテムボタンの通常時背景・境界線検証
    const pokeButton = screen.getByText('カイリュー').closest('button');
    expect(pokeButton).not.toBeNull();
    expect(pokeButton?.className).toContain('bg-slate-50');
    expect(pokeButton?.className).toContain('dark:bg-slate-800/70');
    expect(pokeButton?.className).toContain('border');
    expect(pokeButton?.className).toContain('dark:border-slate-700');

    // ポケモン名の高コントラスト文字色検証
    const pokeName = screen.getByText('カイリュー');
    expect(pokeName.className).toContain('text-slate-900');
    expect(pokeName.className).toContain('dark:text-slate-100');

    // ポケモン番号（図鑑番号）は非表示であることを検証
    expect(screen.queryByText(/#\d+/)).toBeNull();

    // スプライト画像コンテナの専用背景・境界線検証
    const spriteImg = screen.getByAltText('カイリュー');
    const spriteContainer = spriteImg.parentElement;
    expect(spriteContainer?.className).toContain('bg-white');
    expect(spriteContainer?.className).toContain('dark:bg-slate-900');
    expect(spriteContainer?.className).toContain('border');
  });
});
