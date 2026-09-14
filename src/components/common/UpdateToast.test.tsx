import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { UpdateToast } from './UpdateToast';

let mockNeedRefresh = false;
let mockUpdateSW: () => Promise<void>;

vi.mock('virtual:pwa-register', () => ({
  registerSW: vi.fn((options) => {
    if (mockNeedRefresh && options?.onNeedRefresh) {
      options.onNeedRefresh();
    }
    return () => mockUpdateSW();
  }),
}));

describe('UpdateToast Component', () => {
  beforeEach(() => {
    mockNeedRefresh = false;
    mockUpdateSW = vi.fn().mockResolvedValue(undefined);
  });

  it('renders nothing when no update is available', () => {
    mockNeedRefresh = false;
    render(
      <AppProvider>
        <UpdateToast />
      </AppProvider>
    );
    expect(screen.queryByText(/新しいバージョンが利用可能です/i)).toBeNull();
  });

  it('renders update toast when an update is available', () => {
    mockNeedRefresh = true;
    render(
      <AppProvider>
        <UpdateToast />
      </AppProvider>
    );
    expect(screen.getByText(/新しいバージョンが利用可能です/i)).toBeDefined();
    expect(
      screen.getByRole('button', { name: /今すぐ更新/i })
    ).toBeDefined();
  });

  it('allows user to dismiss toast with close button', () => {
    mockNeedRefresh = true;
    render(
      <AppProvider>
        <UpdateToast />
      </AppProvider>
    );

    const closeBtn = screen.getByRole('button', { name: /閉じる/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/新しいバージョンが利用可能です/i)).toBeNull();
  });
});
