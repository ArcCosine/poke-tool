import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { CookieBanner } from './CookieBanner';

describe('CookieBanner Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders cookie banner when consent is not yet accepted', () => {
    render(
      <AppProvider>
        <CookieBanner />
      </AppProvider>
    );

    // Should display cookie title and description
    expect(screen.getByText(/Cookieの使用について/i)).toBeTruthy();
    expect(
      screen.getByText(/ログイン状態の維持およびセキュリティ向上のために/i)
    ).toBeTruthy();

    // Should display privacy policy link
    const policyLink = screen.getByRole('link', {
      name: /プライバシーポリシー/i,
    });
    expect(policyLink).toBeTruthy();
    expect(policyLink.getAttribute('href')).toBe('/privacy.html');

    // Should display accept button
    expect(
      screen.getByRole('button', { name: /同意する/i })
    ).toBeTruthy();
  });

  it('hides banner and sets localStorage when accept button is clicked', () => {
    render(
      <AppProvider>
        <CookieBanner />
      </AppProvider>
    );

    const acceptButton = screen.getByRole('button', { name: /同意する/i });
    fireEvent.click(acceptButton);

    // localStorage should have consent recorded
    expect(localStorage.getItem('poke_cookie_consent')).toBe('accepted');

    // Banner should disappear
    expect(screen.queryByText(/Cookieの使用について/i)).toBeNull();
  });

  it('does not render banner if consent was already accepted in localStorage', () => {
    localStorage.setItem('poke_cookie_consent', 'accepted');

    render(
      <AppProvider>
        <CookieBanner />
      </AppProvider>
    );

    expect(screen.queryByText(/Cookieの使用について/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /同意する/i })).toBeNull();
  });
});
