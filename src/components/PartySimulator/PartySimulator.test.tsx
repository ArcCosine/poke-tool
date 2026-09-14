import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
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
            abilities: [
              { ja: 'せいしんりょく', en: 'inner-focus' },
              { ja: 'マルチスケイル', en: 'multiscale' },
            ],
            regulations: ['M-A'],
            learnable_moves: [14, 53],
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
        moves: [
          {
            id: 14,
            name: { ja: 'つるぎのまい', en: 'Swords Dance' },
            type: 'normal',
            category: 'status',
            power: 0,
            accuracy: 100,
            pp: 20,
          },
          {
            id: 53,
            name: { ja: 'かえんほうしゃ', en: 'Flamethrower' },
            type: 'fire',
            category: 'special',
            power: 90,
            accuracy: 100,
            pp: 15,
          },
        ],
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
    expect(await screen.findByText(/編集中のパーティ/)).toBeDefined();

    // 1. Initial state: Trigger button shows placeholder
    const triggerBtn = screen.getByRole('button', {
      name: /ポケモン名 #1を選択/i,
    });
    expect(triggerBtn).toBeDefined();

    // 2. Click trigger to open search modal
    fireEvent.click(triggerBtn);

    // Search input should appear and be focused
    const searchInput =
      screen.getByPlaceholderText(/名前、ひらがな、カタカナ、ローマ字/i);
    expect(searchInput).toBeDefined();
    // In happy-dom, document.activeElement might not be fully simulated, but we'll test the input presence

    // Pokemon list should show all mocked pokemons with images
    expect(screen.getByText('カイリュー')).toBeDefined();
    expect(screen.getByText('ピカチュウ')).toBeDefined();
    expect(screen.getByText('カイリキー')).toBeDefined();

    // Check search list has pokemon images
    const searchImages = screen.getAllByRole('img') as HTMLImageElement[];
    const pikachuSearchImg = searchImages.find((img) =>
      img.src.includes('assets/pokemon-sprites/25.png')
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
    expect(
      screen.queryByPlaceholderText(/名前、ひらがな、カタカナ、ローマ字/i)
    ).toBeNull();

    // Pikachu should now be selected and trigger button displays its name, and sprite icon is displayed
    const updatedTriggerBtn = screen.getByRole('button', {
      name: /ピカチュウ/i,
    });
    expect(updatedTriggerBtn).toBeDefined();

    const triggerImages = screen.getAllByRole('img') as HTMLImageElement[];
    const pikachuTriggerImg = triggerImages.find((img) =>
      img.src.includes('assets/pokemon-sprites/25.png')
    );
    expect(pikachuTriggerImg).toBeDefined();

    // The slot should display the type with icon (electric.svg)
    const slotTypeIcon = triggerImages.find((img) =>
      img.src.includes('type-icons/electric.svg')
    );
    expect(slotTypeIcon).toBeDefined();

    expect(await screen.findByText(/せいでんき/)).toBeDefined();

    // Check copy button has new text
    const copyBtn = screen.getByRole('button', {
      name: /クリップボードにコピー/i,
    });
    expect(copyBtn).toBeDefined();
  });

  it('should auto-focus on ability select when auto-advance is enabled', async () => {
    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    expect(await screen.findByText(/編集中のパーティ/)).toBeDefined();

    // Click trigger
    const triggerBtn = screen.getByRole('button', {
      name: /ポケモン名 #1を選択/i,
    });
    fireEvent.click(triggerBtn);

    // Enable auto-advance checkbox
    const autoAdvanceCheckbox = screen.getByLabelText(
      /連続入力/i
    ) as HTMLInputElement;
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

    expect(await screen.findByText(/編集中のパーティ/)).toBeDefined();

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

    expect(await screen.findByText(/編集中のパーティ/)).toBeDefined();

    // Click trigger to open modal
    const triggerBtn = screen.getByRole('button', {
      name: /ポケモン名 #1を選択/i,
    });
    fireEvent.click(triggerBtn);

    // Select Mega Venusaur (メガフシギバナ)
    const megaVenusaurRow = screen.getByRole('button', {
      name: /メガフシギバナ/i,
    });
    fireEvent.click(megaVenusaurRow);

    // The item input should be auto-filled with "フシギバナイト" and be disabled
    const itemInput = screen.getByRole('textbox', {
      name: /持ち物/i,
    }) as HTMLInputElement;
    expect(itemInput.value).toBe('フシギバナイト');
    expect(itemInput.disabled).toBe(true);
  });

  it('should render EV step numeric inputs without buttons or conversion, and update EV values', async () => {
    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    expect(await screen.findByText(/編集中のパーティ/)).toBeDefined();

    // 1. Select Pikachu
    const triggerBtn = screen.getByRole('button', {
      name: /ポケモン名 #1を選択/i,
    });
    fireEvent.click(triggerBtn);

    const pikachuRow = screen.getByRole('button', { name: /ピカチュウ/i });
    fireEvent.click(pikachuRow);

    // 2. EV Section should appear with 6 stat inputs (H, A, B, C, D, S)
    expect(screen.getByText(/努力値/i)).toBeDefined();

    const hpInput = screen.getByLabelText(/H|HP/i) as HTMLInputElement;
    const speedInput = screen.getByLabelText(/S|素早さ/i) as HTMLInputElement;
    expect(hpInput).toBeDefined();
    expect(hpInput.type).toBe('number');
    expect(speedInput).toBeDefined();
    expect(speedInput.type).toBe('number');

    // 3. No buttons (+1, -1, 32, etc.) for EV adjustment
    expect(screen.queryByRole('button', { name: '+1' })).toBeNull();
    expect(screen.queryByRole('button', { name: '-1' })).toBeNull();

    // 4. No conversion labels (like "EV: 252" or "/ 252")
    expect(screen.queryByText(/EV:\s*\d+/i)).toBeNull();
    expect(screen.queryByText(/\/ 252/)).toBeNull();

    // 5. Initial value is 0 and initial calculated stats are displayed above inputs
    expect(hpInput.value).toBe('0');
    // Pikachu Lv.50: HP=110 (base 35, step 0), Speed=110 (base 90, step 0), Attack=75 (base 55, step 0)
    expect(screen.queryByText(/実数値\s*Lv\.?50/i)).toBeNull();
    expect(screen.getAllByText('努力値').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('110').length).toBe(2);
    expect(screen.getByText('75')).toBeDefined();

    // 6. Change H to 32
    fireEvent.change(hpInput, { target: { value: '32' } });
    expect(hpInput.value).toBe('32');

    // 7. HP stat should update to 142 (base 35, step 32)
    expect(screen.getByText('142')).toBeDefined();
    expect(screen.getAllByText('110').length).toBe(1); // Speed is still 110

    // 8. Total steps display should reflect the change (e.g. 32/66)
    expect(screen.getByText(/32\s*\/\s*66/)).toBeDefined();
  });

  it('should render party search and party controls stacked vertically', async () => {
    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    const nameInput = await screen.findByLabelText(/^パーティ名$/i);
    expect(nameInput).toBeDefined();

    // Verify PartySearch and PartyControls are rendered as sibling stacked cards
    const searchCard = nameInput.closest('.card-premium');
    expect(searchCard).not.toBeNull();

    const controlsContainer = searchCard?.nextElementSibling;
    expect(controlsContainer).not.toBeNull();

    // Buttons within PartyControls should be rendered
    const withinControls = within(controlsContainer as HTMLElement);
    expect(
      withinControls.getByRole('button', { name: /クリップボードにコピー/i })
    ).toBeDefined();
    expect(
      withinControls.getByRole('button', { name: /新規作成/i })
    ).toBeDefined();
    expect(withinControls.getByRole('button', { name: /削除/i })).toBeDefined();
    expect(withinControls.getByRole('button', { name: /保存/i })).toBeDefined();
  });

  it('should show learnable move suggestions dropdown when move input is focused', async () => {
    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    expect(await screen.findByText(/編集中のパーティ/)).toBeDefined();

    // Select Dragonite (カイリュー)
    const triggerBtn = screen.getByRole('button', {
      name: /ポケモン名 #1を選択/i,
    });
    fireEvent.click(triggerBtn);

    const dragoniteRow = screen.getByRole('button', { name: /カイリュー/i });
    fireEvent.click(dragoniteRow);

    // Find move 1 input
    const move1Input = screen.getByLabelText(/技を選択 1/i);
    expect(move1Input).toBeDefined();

    // Focus move 1 input to open dropdown suggestions
    fireEvent.focus(move1Input);

    // Verify move suggestions appear (Swords Dance and Flamethrower)
    expect(
      await screen.findByRole('button', { name: /つるぎのまい/i })
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: /かえんほうしゃ/i })
    ).toBeDefined();
  });

  it('should set zIndex stacking order (10 - mIdx) for move selector wrappers', async () => {
    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    expect(await screen.findByText(/編集中のパーティ/)).toBeDefined();

    // Select Dragonite (カイリュー)
    const triggerBtn = screen.getByRole('button', {
      name: /ポケモン名 #1を選択/i,
    });
    fireEvent.click(triggerBtn);

    const dragoniteRow = screen.getByRole('button', { name: /カイリュー/i });
    fireEvent.click(dragoniteRow);

    const move1Input = screen.getByLabelText(/技を選択 1/i);
    const move2Input = screen.getByLabelText(/技を選択 2/i);
    const move3Input = screen.getByLabelText(/技を選択 3/i);
    const move4Input = screen.getByLabelText(/技を選択 4/i);

    // Each move input should be inside a wrapper with relative and zIndex = 10 - mIdx
    const wrapper1 = move1Input.closest('[style*="z-index"]');
    const wrapper2 = move2Input.closest('[style*="z-index"]');
    const wrapper3 = move3Input.closest('[style*="z-index"]');
    const wrapper4 = move4Input.closest('[style*="z-index"]');

    expect(wrapper1).not.toBeNull();
    expect(wrapper2).not.toBeNull();
    expect(wrapper3).not.toBeNull();
    expect(wrapper4).not.toBeNull();

    expect((wrapper1 as HTMLElement).style.zIndex).toBe('10');
    expect((wrapper2 as HTMLElement).style.zIndex).toBe('9');
    expect((wrapper3 as HTMLElement).style.zIndex).toBe('8');
    expect((wrapper4 as HTMLElement).style.zIndex).toBe('7');
  });

  it('should show Dialog when party is saved and close on confirm', async () => {
    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    expect(await screen.findByText(/編集中のパーティ/)).toBeDefined();

    // Click "パーティを保存" button
    const saveBtn = screen.getByRole('button', { name: /パーティを保存/i });
    fireEvent.click(saveBtn);

    // Dialog should be displayed with dialog role
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeDefined();
    expect(screen.getByText('パーティを保存しました！')).toBeDefined();

    // Click OK button inside dialog
    const okBtn = screen.getByRole('button', { name: 'OK' });
    fireEvent.click(okBtn);

    // Dialog should be closed
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should open share dialog with alphanumeric URL when party share button is clicked', async () => {
    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    expect(await screen.findByText(/編集中のパーティ/)).toBeDefined();

    // Select Dragonite
    const triggerBtn = screen.getByRole('button', {
      name: /ポケモン名 #1を選択/i,
    });
    fireEvent.click(triggerBtn);

    const dragoniteRow = screen.getByRole('button', { name: /カイリュー/i });
    fireEvent.click(dragoniteRow);

    // Click "シェア" button
    const shareBtn = screen.getByRole('button', { name: /シェア/i });
    fireEvent.click(shareBtn);

    // Dialog should be open
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeDefined();
    expect(screen.getByText('パーティをシェア')).toBeDefined();

    // Check share URL input value is alphanumeric without %
    const shareUrlInput = screen.getByDisplayValue(
      /https?:\/\/.*[?&]p=[0-9a-zA-Z]+/
    );
    expect(shareUrlInput).toBeDefined();
  });

  it('should restore shared party from URL with empty party name without auto-saving, and restore EV steps accurately', async () => {
    // Encode a party with Dragonite (masterId: 149), H=32 (EV 252), A=32 (EV 252), S=2 (EV 12)
    const { encodePartyConfig } = await import('../../utils/share');
    const code = encodePartyConfig({
      members: [
        {
          pokemonId: 149,
          nature: 'adamant',
          itemId: 0,
          abilityIndex: 1, // multiscale
          evs: {
            hp: 32,
            attack: 32,
            defense: 0,
            sp_attack: 0,
            sp_defense: 0,
            speed: 2,
          },
          moves: [0, 0, 0, 0],
        },
      ],
    });

    window.history.pushState({}, '', `?p=${code}`);
    localStorage.removeItem('saved_parties');

    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    // Wait for master data and shared party to load
    const partyNameInput = (await screen.findByLabelText(
      /^パーティ名$/i
    )) as HTMLInputElement;

    // 1. Party name should be empty (Plan C)
    await waitFor(() => {
      expect(partyNameInput.value).toBe('');
    });

    // 2. Should allow typing a new party name directly and update value
    fireEvent.change(partyNameInput, { target: { value: '伝説のパーティ' } });
    expect(partyNameInput.value).toBe('伝説のパーティ');

    // 3. Should NOT auto-save to localStorage
    const savedPartiesRaw = localStorage.getItem('saved_parties');
    if (savedPartiesRaw) {
      const parsed = JSON.parse(savedPartiesRaw);
      expect(
        parsed.some((p: { name: string }) => p.name === 'パーティをシェア')
      ).toBe(false);
    }

    // 4. EV steps should accurately be H=32, A=32, S=2, and ability should be restored
    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
      expect(inputs[0].value).toBe('32');
      expect(inputs[1].value).toBe('32');
      expect(inputs[5].value).toBe('2');

      const abilitySelect = document.getElementById('ability-select-0') as HTMLSelectElement;
      expect(abilitySelect.value).toBe('マルチスケイル');
    });

    // Clean up URL
    window.history.pushState({}, '', '/');
  });

  it('should show validation dialog when saving with empty party name and focus input on OK', async () => {
    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    expect(await screen.findByText(/編集中のパーティ/)).toBeDefined();

    const partyNameInput = screen.getByLabelText(
      /^パーティ名$/i
    ) as HTMLInputElement;
    fireEvent.change(partyNameInput, { target: { value: '' } });
    expect(partyNameInput.value).toBe('');

    // Focus spy on partyNameInput
    const focusSpy = vi.spyOn(partyNameInput, 'focus');

    // Click "保存" button
    const saveBtn = screen.getByRole('button', { name: /保存/i });
    fireEvent.click(saveBtn);

    // Dialog "パーティ名を入力してください" should be visible
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeDefined();
    expect(screen.getByText('パーティ名を入力してください')).toBeDefined();

    // Click OK in dialog
    const okBtn = screen.getByRole('button', { name: 'OK' });
    fireEvent.click(okBtn);

    // Dialog should be closed and input focused
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => {
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  it('should restrict manual EV inputs so total does not exceed 66 and single stat does not exceed 32', async () => {
    render(
      <AppProvider>
        <PartySimulator />
      </AppProvider>
    );

    // Add Dragonite (masterId: 149)
    await screen.findByText(/編集中のパーティ/);
    const selectPokeBtn = screen.getByRole('button', {
      name: /ポケモン名 #1を選択/i,
    });
    fireEvent.click(selectPokeBtn);

    const dragonite = await screen.findByText('カイリュー');
    fireEvent.click(dragonite);

    await waitFor(() => {
      expect(screen.getByText('カイリュー')).toBeDefined();
    });

    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    // Set HP to 32
    fireEvent.change(inputs[0], { target: { value: '32' } });
    expect(inputs[0].value).toBe('32');

    // Set Attack to 32
    fireEvent.change(inputs[1], { target: { value: '32' } });
    expect(inputs[1].value).toBe('32');

    // Currently HP(32) + Atk(32) = 64. Remaining is 2.
    // Defense max attribute should be 2
    expect(inputs[2].max).toBe('2');

    // Try setting Defense to 10. Should be clamped to 2.
    fireEvent.change(inputs[2], { target: { value: '10' } });
    expect(inputs[2].value).toBe('2');

    // Total EV display should show 66 / 66
    expect(screen.getByText(/66 \/ 66/)).toBeDefined();
  });
});
