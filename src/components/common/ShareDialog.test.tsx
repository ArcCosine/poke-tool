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

  it('renders copy button and share buttons for X, Bluesky, LINE, WhatsApp, Weibo, and KakaoTalk when isOpen is true', () => {
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

    // Check WhatsApp share link
    const whatsAppLink = screen.getByRole('link', { name: /WhatsAppで送る/i });
    expect(whatsAppLink).toBeDefined();
    expect(whatsAppLink.getAttribute('href')).toContain(
      'https://api.whatsapp.com/send'
    );
    expect(whatsAppLink.getAttribute('href')).toContain(
      encodeURIComponent(
        'ポケモン調整テスト https://example.com/share?s=abc123'
      )
    );

    // Check Weibo share link
    const weiboLink = screen.getByRole('link', { name: /Weiboで共有/i });
    expect(weiboLink).toBeDefined();
    expect(weiboLink.getAttribute('href')).toContain(
      'https://service.weibo.com/share/share.php'
    );
    expect(weiboLink.getAttribute('href')).toContain(
      encodeURIComponent('https://example.com/share?s=abc123')
    );
    expect(weiboLink.getAttribute('href')).toContain(
      encodeURIComponent('ポケモン調整テスト')
    );

    // Check KakaoTalk share link
    const kakaoLink = screen.getByRole('link', { name: /KakaoTalkで送る/i });
    expect(kakaoLink).toBeDefined();
    expect(kakaoLink.getAttribute('href')).toContain(
      'https://story.kakao.com/s/share'
    );
    expect(kakaoLink.getAttribute('href')).toContain(
      encodeURIComponent('https://example.com/share?s=abc123')
    );
    expect(kakaoLink.getAttribute('href')).toContain(
      encodeURIComponent('ポケモン調整テスト')
    );
  });

  it('renders Web Share API button when navigator.share is available and calls navigator.share on click', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
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

    const webShareBtn = screen.getByRole('button', {
      name: /端末の機能で共有/i,
    });
    expect(webShareBtn).toBeDefined();

    fireEvent.click(webShareBtn);

    expect(shareMock).toHaveBeenCalledWith({
      title: '設定をシェア',
      text: 'ポケモン調整テスト',
      url: 'https://example.com/share?s=abc123',
    });
  });

  it('does not render Web Share API button when navigator.share is undefined', () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
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

    expect(
      screen.queryByRole('button', { name: /端末の機能で共有/i })
    ).toBeNull();
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
