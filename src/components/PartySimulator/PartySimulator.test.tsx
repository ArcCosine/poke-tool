import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { PartySimulator } from './PartySimulator';

// Mock DB because tests run in Node/happy-dom without IndexedDB
vi.mock('../../utils/db', () => {
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
            regulations: ['M-A'],
            learnable_moves: [],
          },
          {
            id: 25,
            name: { ja: 'ピカチュウ', en: 'Pikachu' },
            types: ['electric'],
            base_stats: {
              hp: 35,
              attack: 55,
              defense: 40,
              sp_attack: 50,
              sp_defense: 50,
              speed: 90,
            },
            abilities: [{ ja: 'せいでんき', en: 'static' }],
            regulations: ['M-A'],
            learnable_moves: [],
          },
          {
            id: 68,
            name: { ja: 'カイリキー', en: 'Machamp' },
            types: ['fighting'],
            base_stats: {
              hp: 90,
              attack: 130,
              defense: 80,
              sp_attack: 65,
              sp_defense: 85,
              speed: 55,
            },
            abilities: [{ ja: 'ノーガード', en: 'no-guard' }],
            regulations: ['M-A'],
            learnable_moves: [],
          },
          {
            id: 10033,
            name: { ja: 'メガフシギバナ', en: 'Mega Venusaur' },
            types: ['grass', 'poison'],
            base_stats: {
              hp: 80,
              attack: 100,
              defense: 123,
              sp_attack: 122,
              sp_defense: 120,
              speed: 80,
            },
            abilities: [{ ja: 'あついしぼう', en: 'thick-fat' }],
            regulations: ['M-A'],
            learnable_moves: [],
          },
        ],
        moves: [],
        items: [
          { id: 1, name: { ja: 'こだわりスカーフ', en: 'Choice Scarf' } },
          { id: 2, name: { ja: 'こだわりハチマキ', en: 'Choice Band' } },
          { id: 3, name: { ja: 'とつげきチョッキ', en: 'Assault Vest' } },
        ],
      }),
    },
  };
});

describe('PartySimulator Pokémon Search Modal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should open modal on trigger click, allow romaji/kana search, select pokemon, and support auto-advance', async () => {
    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    // Wait for the loading to complete
    expect(await screen.findByText('パーティ名')).toBeDefined();

    // 1. Initial state: Trigger button shows placeholder
    const triggerBtn = screen.getByRole('button', { name: /ポケモン名 #1を選択/i });
    expect(triggerBtn).toBeDefined();

    // 2. Click trigger to open search modal
    fireEvent.click(triggerBtn);

    // Search input should appear and be focused
    const searchInput = screen.getByPlaceholderText(/名前、ひらがな、カタカナ、ローマ字/i);
    expect(searchInput).toBeDefined();
    // In happy-dom, document.activeElement might not be fully simulated, but we'll test the input presence

    // Pokemon list should show all mocked pokemons with images
    expect(screen.getByText('カイリュー')).toBeDefined();
    expect(screen.getByText('ピカチュウ')).toBeDefined();
    expect(screen.getByText('カイリキー')).toBeDefined();

    // Check search list has pokemon images
    const searchImages = screen.getAllByRole('img') as HTMLImageElement[];
    const pikachuSearchImg = searchImages.find((img) =>
      img.src.includes('sprites/pokemon/25.png')
    );
    expect(pikachuSearchImg).toBeDefined();

    // 3. Search by Romaji "kai" (should match カイリュー and カイリキー)
    fireEvent.change(searchInput, { target: { value: 'kai' } });
    expect(screen.getByText('カイリュー')).toBeDefined();
    expect(screen.getByText('カイリキー')).toBeDefined();
    expect(screen.queryByText('ピカチュウ')).toBeNull();

    // 4. Search by Hiragana "ぴか" (should match ピカチュウ)
    fireEvent.change(searchInput, { target: { value: 'ぴか' } });
    expect(screen.queryByText('カイリュー')).toBeNull();
    expect(screen.getByText('ピカチュウ')).toBeDefined();

    // 5. Select Pikachu
    const pikachuRow = screen.getByRole('button', { name: /ピカチュウ/i });
    fireEvent.click(pikachuRow);

    // Modal should be closed (search input gone)
    expect(screen.queryByPlaceholderText(/名前、ひらがな、カタカナ、ローマ字/i)).toBeNull();

    // Pikachu should now be selected and trigger button displays its name, and sprite icon is displayed
    const updatedTriggerBtn = screen.getByRole('button', { name: /ピカチュウ/i });
    expect(updatedTriggerBtn).toBeDefined();

    const triggerImages = screen.getAllByRole('img') as HTMLImageElement[];
    const pikachuTriggerImg = triggerImages.find((img) =>
      img.src.includes('sprites/pokemon/25.png')
    );
    expect(pikachuTriggerImg).toBeDefined();

    // The slot should display the type with icon (electric.svg)
    const slotTypeIcon = triggerImages.find((img) =>
      img.src.includes('type-icons/electric.svg')
    );
    expect(slotTypeIcon).toBeDefined();

    expect(await screen.findByText(/せいでんき/)).toBeDefined();

    // Check copy button has new text
    const copyBtn = screen.getByRole('button', { name: /クリップボードにコピー/i });
    expect(copyBtn).toBeDefined();
  });

  it('should auto-focus on ability select when auto-advance is enabled', async () => {
    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    expect(await screen.findByText('パーティ名')).toBeDefined();

    // Click trigger
    const triggerBtn = screen.getByRole('button', { name: /ポケモン名 #1を選択/i });
    fireEvent.click(triggerBtn);

    // Enable auto-advance checkbox
    const autoAdvanceCheckbox = screen.getByLabelText(/連続入力/i) as HTMLInputElement;
    fireEvent.click(autoAdvanceCheckbox);
    expect(autoAdvanceCheckbox.checked).toBe(true);

    // Select Pikachu
    const pikachuRow = screen.getByRole('button', { name: /ピカチュウ/i });
    fireEvent.click(pikachuRow);

    // The ability select element should be focused
    const abilitySelect = screen.getByRole('combobox', { name: /特性/i });
    await waitFor(() => {
      expect(document.activeElement).toBe(abilitySelect);
    });
  });

  it('should render type icons in the defense synergy matrix', async () => {
    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    expect(await screen.findByText('パーティ名')).toBeDefined();

    // Check that at least 18 type icon images are rendered (one for each type)
    const images = screen.getAllByRole('img') as HTMLImageElement[];
    const typeIcons = images.filter((img) =>
      img.src.includes('/assets/type-icons/')
    );
    expect(typeIcons.length).toBeGreaterThanOrEqual(18);
    expect(screen.getAllByText('くさ').length).toBeGreaterThanOrEqual(1);
  });

  it('should auto-fill and disable item input when a mega pokemon is selected', async () => {
    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    expect(await screen.findByText('パーティ名')).toBeDefined();

    // Click trigger to open modal
    const triggerBtn = screen.getByRole('button', { name: /ポケモン名 #1を選択/i });
    fireEvent.click(triggerBtn);

    // Select Mega Venusaur (メガフシギバナ)
    const megaVenusaurRow = screen.getByRole('button', { name: /メガフシギバナ/i });
    fireEvent.click(megaVenusaurRow);

    // The item input should be auto-filled with "フシギバナイト" and be disabled
    const itemInput = screen.getByRole('combobox', { name: /持ち物/i }) as HTMLSelectElement;
    expect(itemInput.value).toBe('フシギバナイト');
    expect(itemInput.disabled).toBe(true);
  });
});

