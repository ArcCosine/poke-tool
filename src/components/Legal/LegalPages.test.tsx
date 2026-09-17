import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Disclaimer } from './Disclaimer';
import { LegalLayout } from './LegalLayout';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsOfService } from './TermsOfService';

describe('Legal Pages and Layout', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // biome-ignore lint/suspicious/noExplicitAny: mock environment
    delete (window as any).location;
    // biome-ignore lint/suspicious/noExplicitAny: mock location assignment
    window.location = { ...originalLocation, href: '' } as any;
  });

  it('should render PrivacyPolicy within LegalLayout and handle back button', () => {
    render(
      <LegalLayout>
        <PrivacyPolicy
          onBack={() => {
            window.location.href = '/';
          }}
        />
      </LegalLayout>
    );

    expect(
      screen.getByRole('heading', { name: /プライバシーポリシー/i })
    ).toBeDefined();
    expect(
      screen.getByText(
        /当ツール（以下「本ツール」）は、ユーザーのプライバシー情報の保護に最大限努めています。/
      )
    ).toBeDefined();

    const backBtn = screen.getByRole('button', {
      name: 'ダッシュボードへ戻る',
    });
    act(() => {
      backBtn.click();
    });

    expect(window.location.href).toBe('/');
  });

  it('should render Disclaimer within LegalLayout and handle back button', () => {
    render(
      <LegalLayout>
        <Disclaimer
          onBack={() => {
            window.location.href = '/';
          }}
        />
      </LegalLayout>
    );

    expect(screen.getByRole('heading', { name: /免責事項/i })).toBeDefined();
    expect(
      screen.getByText(/本ツールは、任天堂株式会社、株式会社クリーチャーズ/)
    ).toBeDefined();

    const backBtn = screen.getByRole('button', {
      name: 'ダッシュボードへ戻る',
    });
    act(() => {
      backBtn.click();
    });

    expect(window.location.href).toBe('/');
  });

  it('should render TermsOfService within LegalLayout and handle back button', () => {
    render(
      <LegalLayout>
        <TermsOfService
          onBack={() => {
            window.location.href = '/';
          }}
        />
      </LegalLayout>
    );

    expect(screen.getByRole('heading', { name: /利用規約/i })).toBeDefined();
    expect(screen.getByText(/本利用規約（以下「本規約」）は/)).toBeDefined();

    const backBtn = screen.getByRole('button', {
      name: 'ダッシュボードへ戻る',
    });
    act(() => {
      backBtn.click();
    });

    expect(window.location.href).toBe('/');
  });

  it('should render legal pages in Korean when language is ko', () => {
    localStorage.setItem('lang', 'ko');
    render(
      <LegalLayout>
        <PrivacyPolicy onBack={() => {}} />
      </LegalLayout>
    );

    expect(
      screen.getByRole('heading', { name: /개인정보 처리방침/i })
    ).toBeDefined();
    expect(
      screen.getByText(
        /본 도구\(이하 "본 툴"\)는 사용자의 개인정보 보호를 위해 최선을 다하고 있습니다\./
      )
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: '대시보드로 돌아가기' })
    ).toBeDefined();
  });

  it('should render legal pages in Traditional Chinese when language is zh-Hant', () => {
    localStorage.setItem('lang', 'zh-Hant');
    render(
      <LegalLayout>
        <TermsOfService onBack={() => {}} />
      </LegalLayout>
    );

    expect(
      screen.getByRole('heading', { name: /使用條款/i })
    ).toBeDefined();
    expect(
      screen.getByText(/本使用條款（以下簡稱「本條款」）旨在規範本工具使用者/)
    ).toBeDefined();
    expect(screen.getByRole('button', { name: '返回儀表板' })).toBeDefined();
  });

  it('should render legal pages in Simplified Chinese when language is zh-Hans', () => {
    localStorage.setItem('lang', 'zh-Hans');
    render(
      <LegalLayout>
        <TermsOfService onBack={() => {}} />
      </LegalLayout>
    );

    expect(
      screen.getByRole('heading', { name: /使用条款/i })
    ).toBeDefined();
    expect(
      screen.getByText(/本使用条款（以下简称“本条款”）旨在规范本工具使用者/)
    ).toBeDefined();
    expect(screen.getByRole('button', { name: '返回仪表板' })).toBeDefined();
  });

  it('should render modern header with AppIcon, logo linking to /index.html, and AuthButton', () => {
    render(
      <LegalLayout>
        <div>Legal Body</div>
      </LegalLayout>
    );

    // Verify logo link goes to /index.html
    const logoLink = screen.getByRole('link', { name: /Poke-Tool/i });
    expect(logoLink.getAttribute('href')).toBe('/index.html');

    // Verify AuthButton is present (login button or avatar)
    const header = screen.getByRole('banner');
    expect(header).toBeDefined();

    // Verify theme toggle is present
    expect(screen.getByTestId('theme-toggle')).toBeDefined();

    // Verify sword icon is no longer used in header
    expect(header.querySelector('.i-lucide-sword')).toBeNull();
  });
});
