import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { EvCalculator } from './EvCalculator';

// Mock DB loader
vi.mock('../../utils/db', async () => {
  const actual = await vi.importActual<any>('../../utils/db');
  return {
    ...actual,
    db: {
      ...actual.db,
      loadMasterData: vi.fn().mockResolvedValue({
        pokemon: [
          {
            id: 9,
            name: { ja: 'カメックス', en: 'Blastoise' },
            types: ['water'],
            base_stats: {
              hp: 79,
              attack: 83,
              defense: 100,
              sp_attack: 85,
              sp_defense: 105,
              speed: 78,
            },
            abilities: [
              { ja: 'げきりゅう', en: 'Torrent' },
              { ja: 'あめうけざら', en: 'Rain Dish' },
            ],
            regulations: ['M-A'],
            learnable_moves: [1, 2],
          },
        ],
        moves: [
          {
            id: 1,
            name: { ja: 'ハイドロポンプ', en: 'Hydro Pump' },
            type: 'water',
            category: 'special',
            power: 110,
          },
          {
            id: 2,
            name: { ja: 'れいとうビーム', en: 'Ice Beam' },
            type: 'ice',
            category: 'special',
            power: 90,
          },
        ],
        items: [{ id: 1, name: { ja: 'たべのこし', en: 'Leftovers' } }],
      }),
    },
  };
});

describe('EvCalculator', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render loading state initially', async () => {
    render(
      <AppProvider>
        <EvCalculator />
      </AppProvider>
    );

    expect(screen.getByText(/データを読み込み中/i)).toBeDefined();
  });

  it('should render search prompts once data is loaded', async () => {
    await act(async () => {
      render(
        <AppProvider>
          <EvCalculator />
        </AppProvider>
      );
    });

    // Check for search button
    expect(screen.getAllByText(/ポケモンを選択/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('努力値と実数値')).toBeNull();
  });

  it('should render detailed stats and fields after selecting a pokemon', async () => {
    await act(async () => {
      render(
        <AppProvider>
          <EvCalculator />
        </AppProvider>
      );
    });

    // Open search modal
    const searchBtn = screen.getAllByText(/ポケモンを選択/i)[0];
    await act(async () => {
      fireEvent.click(searchBtn);
    });

    // Click on Blastoise (カメックス) in the list
    const pokeRow = screen.getByText('カメックス');
    await act(async () => {
      fireEvent.click(pokeRow);
    });

    // Verified fields rendered
    expect(screen.getByText('HP')).toBeDefined();
    expect(screen.getByText('特性')).toBeDefined();
    expect(screen.getByText('性格')).toBeDefined();
  });

  it('should adjust EV using stepper buttons (+1, 32, 0) and update calculated stats without conversion labels', async () => {
    await act(async () => {
      render(
        <AppProvider>
          <EvCalculator />
        </AppProvider>
      );
    });

    // Open search modal and select Blastoise
    const searchBtn = screen.getAllByText(/ポケモンを選択/i)[0];
    await act(async () => {
      fireEvent.click(searchBtn);
    });
    const pokeRow = screen.getByText('カメックス');
    await act(async () => {
      fireEvent.click(pokeRow);
    });

    // カメックスの初期HP実数値: 154
    expect(screen.getByText('154')).toBeDefined();

    // 換算表示が存在しないことを確認
    expect(screen.queryByText(/EV:/i)).toBeNull();

    // HP行の input を取得
    const hpInput = screen.getByRole('spinbutton', {
      name: 'hp',
    }) as HTMLInputElement;
    expect(hpInput.value).toBe('0');

    // 全ての 32 ボタンのうち最初のもの（HP）をクリック
    const maxButtons = screen.getAllByRole('button', { name: '32' });
    await act(async () => {
      fireEvent.click(maxButtons[0]);
    });

    // HP実数値が 186 に更新されたことを確認
    expect(screen.getByText('186')).toBeDefined();
    expect(hpInput.value).toBe('32');

    // -1 ボタンをクリック
    const minusButtons = screen.getAllByRole('button', { name: '-1' });
    await act(async () => {
      fireEvent.click(minusButtons[0]);
    });

    // HP実数値が 185 に更新されたことを確認
    expect(screen.getByText('185')).toBeDefined();
    expect(hpInput.value).toBe('31');

    // 0 ボタンをクリック
    const zeroButtons = screen.getAllByRole('button', { name: '0' });
    await act(async () => {
      fireEvent.click(zeroButtons[0]);
    });

    // HP実数値が 154 に戻ったことを確認
    expect(screen.getByText('154')).toBeDefined();
    expect(hpInput.value).toBe('0');
  });

  it('should render compact table headers for stats, base stats, ev adjustment, and calculated stat', async () => {
    await act(async () => {
      render(
        <AppProvider>
          <EvCalculator />
        </AppProvider>
      );
    });

    // Open search modal and select Blastoise
    const searchBtn = screen.getAllByText(/ポケモンを選択/i)[0];
    await act(async () => {
      fireEvent.click(searchBtn);
    });
    const pokeRow = screen.getByText('カメックス');
    await act(async () => {
      fireEvent.click(pokeRow);
    });

    // 列ヘッダーの存在を検証
    expect(screen.getByText('ステータス')).toBeDefined();
    expect(screen.getByText('種族値')).toBeDefined();
    expect(screen.getByText('努力値 (ステップ)')).toBeDefined();
    expect(screen.getByText('実数値')).toBeDefined();
  });

  it('should render durability optimizer under moves and apply optimal HBD EVs', async () => {
    await act(async () => {
      render(
        <AppProvider>
          <EvCalculator />
        </AppProvider>
      );
    });

    // Open search modal and select Blastoise
    const searchBtn = screen.getAllByText(/ポケモンを選択/i)[0];
    await act(async () => {
      fireEvent.click(searchBtn);
    });
    const pokeRow = screen.getByText('カメックス');
    await act(async () => {
      fireEvent.click(pokeRow);
    });

    // Verify durability indices are displayed
    expect(screen.getByText('耐久指数')).toBeDefined();
    expect(screen.getByText('耐久調整')).toBeDefined();
    expect(screen.getByText('HBDへの最適配分を計算')).toBeDefined();

    // Click optimize button
    const optimizeBtn = screen.getByRole('button', {
      name: /HBDへの最適配分を計算/i,
    });
    await act(async () => {
      fireEvent.click(optimizeBtn);
    });

    // Total EV should now be 66
    expect(screen.getByText('66')).toBeDefined();
  });

  it('should apply relative z-20 to moves card and z-index to individual move selectors to prevent overlap with durability optimizer', async () => {
    await act(async () => {
      render(
        <AppProvider>
          <EvCalculator />
        </AppProvider>
      );
    });

    // Open search modal and select Blastoise
    const searchBtn = screen.getAllByText(/ポケモンを選択/i)[0];
    await act(async () => {
      fireEvent.click(searchBtn);
    });
    const pokeRow = screen.getByText('カメックス');
    await act(async () => {
      fireEvent.click(pokeRow);
    });

    // Verify moves card has relative and z-20
    const movesHeading = screen.getByText('技構成');
    const movesCard = movesHeading.closest('.card-premium');
    expect(movesCard).not.toBeNull();
    expect(movesCard?.className).toContain('relative');
    expect(movesCard?.className).toContain('z-20');

    // Verify move selectors have z-index
    const move1Input = screen.getByLabelText(/技を選択 1/i);
    const move1Wrapper = move1Input.closest('[style*="z-index"]');
    expect(move1Wrapper).not.toBeNull();
  });

  it('should open share dialog with alphanumeric URL when share button is clicked', async () => {
    await act(async () => {
      render(
        <AppProvider>
          <EvCalculator />
        </AppProvider>
      );
    });

    // Select Blastoise
    const searchBtn = screen.getAllByText(/ポケモンを選択/i)[0];
    await act(async () => {
      fireEvent.click(searchBtn);
    });
    const pokeRow = screen.getByText('カメックス');
    await act(async () => {
      fireEvent.click(pokeRow);
    });

    // Verify Share button is positioned under durability section
    const durabilityHeading = screen.getByText('耐久指数');
    const shareBtn = screen.getByRole('button', { name: /シェア/i });
    expect(durabilityHeading).toBeDefined();
    expect(shareBtn).toBeDefined();
    // shareBtn should follow durabilityHeading in DOM order
    expect(
      durabilityHeading.compareDocumentPosition(shareBtn) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    await act(async () => {
      fireEvent.click(shareBtn);
    });

    // Dialog should be open
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('設定をシェア')).toBeDefined();

    // Check share URL input value is alphanumeric without %
    const shareUrlInput = screen.getByDisplayValue(
      /https?:\/\/.*[?&]s=[0-9a-zA-Z]+/
    );
    expect(shareUrlInput).toBeDefined();
  });
});
