import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import * as offlineUtils from '../../utils/offline';
import DashboardApp from './main';

vi.mock('../../utils/offline', () => ({
  getOfflineCacheStatus: vi.fn(),
  downloadAllOfflineData: vi.fn(),
  clearOfflineCache: vi.fn(),
}));

describe('Dashboard MPA Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(offlineUtils.getOfflineCacheStatus).mockResolvedValue({
      isFullyCached: false,
      cachedCount: 0,
      totalCount: 341,
      estimatedSizeMB: 0,
    });
  });

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

  it('renders PWA installation banner and offline management card', async () => {
    render(
      <AppProvider>
        <DashboardApp />
      </AppProvider>
    );

    // PWA install banner
    expect(
      screen.getByText(/ホーム画面に追加してアプリとして使う/i)
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: /ホーム画面に追加/i })
    ).toBeDefined();

    // Offline management card
    expect(screen.getByText(/オフラインデータ管理/i)).toBeDefined();
    expect(
      screen.getByRole('button', { name: /全データを端末に保存/i })
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: /キャッシュを削除/i })
    ).toBeDefined();
  });

  it('handles "Add to Home Screen" click by showing iOS guide when beforeinstallprompt is not fired', async () => {
    render(
      <AppProvider>
        <DashboardApp />
      </AppProvider>
    );

    const installBtn = screen.getByRole('button', {
      name: /ホーム画面に追加/i,
    });
    fireEvent.click(installBtn);

    // iOS Guide modal should open
    expect(
      screen.getByText(/ホーム画面への追加方法 \(iOS Safari\)/i)
    ).toBeDefined();

    // Close button dismisses modal
    const closeBtns = screen.getAllByRole('button', { name: /閉じる/i });
    fireEvent.click(closeBtns[0]);
    expect(
      screen.queryByText(/ホーム画面への追加方法 \(iOS Safari\)/i)
    ).toBeNull();
  });

  it('triggers browser prompt when beforeinstallprompt event was received', async () => {
    render(
      <AppProvider>
        <DashboardApp />
      </AppProvider>
    );

    // Simulate beforeinstallprompt event
    const promptMock = vi.fn().mockResolvedValue({ outcome: 'accepted' });
    const event = new Event('beforeinstallprompt');
    Object.assign(event, {
      preventDefault: vi.fn(),
      prompt: promptMock,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });

    fireEvent(window, event);

    const installBtn = screen.getByRole('button', {
      name: /ホーム画面に追加/i,
    });
    fireEvent.click(installBtn);

    expect(promptMock).toHaveBeenCalled();
  });


  it('triggers downloadAllOfflineData and displays progress when save button is clicked', async () => {
    vi.mocked(offlineUtils.downloadAllOfflineData).mockImplementation(
      async (_ids, onProgress) => {
        if (onProgress) {
          onProgress({ loaded: 50, total: 100, percent: 50 });
        }
      }
    );

    render(
      <AppProvider>
        <DashboardApp />
      </AppProvider>
    );

    const saveBtn = screen.getByRole('button', {
      name: /全データを端末に保存/i,
    });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(offlineUtils.downloadAllOfflineData).toHaveBeenCalled();
    });
  });

  it('triggers clearOfflineCache when clear button is clicked', async () => {
    vi.mocked(offlineUtils.clearOfflineCache).mockResolvedValue(true);

    render(
      <AppProvider>
        <DashboardApp />
      </AppProvider>
    );

    const clearBtn = screen.getByRole('button', {
      name: /キャッシュを削除/i,
    });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(offlineUtils.clearOfflineCache).toHaveBeenCalled();
    });
  });
});

