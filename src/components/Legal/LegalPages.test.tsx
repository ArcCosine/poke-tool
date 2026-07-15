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

    expect(screen.getByText('プライバシーポリシー')).toBeDefined();
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

    expect(screen.getByText('免責事項')).toBeDefined();
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

    expect(screen.getByText('利用規約')).toBeDefined();
    expect(screen.getByText(/本利用規約（以下「本規約」）は/)).toBeDefined();

    const backBtn = screen.getByRole('button', {
      name: 'ダッシュボードへ戻る',
    });
    act(() => {
      backBtn.click();
    });

    expect(window.location.href).toBe('/');
  });
});
