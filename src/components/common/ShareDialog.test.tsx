import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { ShareDialog } from './ShareDialog';

describe('ShareDialog Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render dialog content when isOpen is false', () => {
    render(
      <AppProvider>
        <ShareDialog
          isOpen={false}
          onClose={vi.fn()}
          shareUrl="https://example.com/share?s=abc123"
          shareText="ポケモン調整テスト"
        />
      </AppProvider>
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders copy button and share buttons for X, Bluesky, and LINE when isOpen is true', () => {
    render(
      <AppProvider>
        <ShareDialog
          isOpen={true}
          onClose={vi.fn()}
          shareUrl="https://example.com/share?s=abc123"
          shareText="ポケモン調整テスト"
        />
      </AppProvider>
    );

    expect(screen.getByRole('dialog')).toBeDefined();

    // Check share URL input
    const input = screen.getByDisplayValue(
      'https://example.com/share?s=abc123'
    );
    expect(input).toBeDefined();

    // Check X share link
    const xLink = screen.getByRole('link', { name: /Xでポスト/i });
    expect(xLink).toBeDefined();
    expect(xLink.getAttribute('href')).toContain(
      'https://twitter.com/intent/tweet'
    );
    expect(xLink.getAttribute('href')).toContain(
      encodeURIComponent('ポケモン調整テスト')
    );
    expect(xLink.getAttribute('href')).toContain(
      encodeURIComponent('https://example.com/share?s=abc123')
    );

    // Check Bluesky share link
    const blueskyLink = screen.getByRole('link', { name: /Blueskyで投稿/i });
    expect(blueskyLink).toBeDefined();
    expect(blueskyLink.getAttribute('href')).toContain(
      'https://bsky.app/intent/compose'
    );
    expect(blueskyLink.getAttribute('href')).toContain(
      encodeURIComponent(
        'ポケモン調整テスト https://example.com/share?s=abc123'
      )
    );

    // Check LINE share link
    const lineLink = screen.getByRole('link', { name: /LINEで送る/i });
    expect(lineLink).toBeDefined();
    expect(lineLink.getAttribute('href')).toContain(
      'https://social-plugins.line.me/lineit/share'
    );
    expect(lineLink.getAttribute('href')).toContain(
      encodeURIComponent('https://example.com/share?s=abc123')
    );
    expect(lineLink.getAttribute('href')).toContain(
      encodeURIComponent('ポケモン調整テスト')
    );
  });

  it('copies URL to clipboard and updates button state', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(
      <AppProvider>
        <ShareDialog
          isOpen={true}
          onClose={vi.fn()}
          shareUrl="https://example.com/share?s=abc123"
          shareText="ポケモン調整テスト"
        />
      </AppProvider>
    );

    const copyBtn = screen.getByRole('button', { name: /URLをコピー/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(
      'https://example.com/share?s=abc123'
    );

    await waitFor(() => {
      expect(screen.getByText('URLをコピーしました！')).toBeDefined();
    });
  });
});
