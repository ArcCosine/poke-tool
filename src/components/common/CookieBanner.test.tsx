import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { CookieBanner } from './CookieBanner';

describe('CookieBanner Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders cookie banner when consent is not yet decided', () => {
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

    // Should display accept and reject buttons
    expect(
      screen.getByRole('button', { name: /受け入れる/i })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /受け入れない/i })
    ).toBeTruthy();

    // Should be positioned at bottom center
    const banner = screen.getByRole('complementary');
    expect(banner.className).toContain('bottom-20');
    expect(banner.className).toContain('sm:left-1/2');
    expect(banner.className).toContain('sm:-translate-x-1/2');
  });

  it('hides banner and sets localStorage to accepted when accept button is clicked', () => {
    render(
      <AppProvider>
        <CookieBanner />
      </AppProvider>
    );

    const acceptButton = screen.getByRole('button', { name: /受け入れる/i });
    fireEvent.click(acceptButton);

    // localStorage should have consent recorded as accepted
    expect(localStorage.getItem('poke_cookie_consent')).toBe('accepted');

    // Banner should disappear
    expect(screen.queryByText(/Cookieの使用について/i)).toBeNull();
  });

  it('hides banner and sets localStorage to rejected when reject button is clicked', () => {
    render(
      <AppProvider>
        <CookieBanner />
      </AppProvider>
    );

    const rejectButton = screen.getByRole('button', { name: /受け入れない/i });
    fireEvent.click(rejectButton);

    // localStorage should have consent recorded as rejected
    expect(localStorage.getItem('poke_cookie_consent')).toBe('rejected');

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
    expect(screen.queryByRole('button', { name: /受け入れる/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /受け入れない/i })).toBeNull();
  });

  it('does not render banner if consent was already rejected in localStorage', () => {
    localStorage.setItem('poke_cookie_consent', 'rejected');

    render(
      <AppProvider>
        <CookieBanner />
      </AppProvider>
    );

    expect(screen.queryByText(/Cookieの使用について/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /受け入れる/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /受け入れない/i })).toBeNull();
  });

  it('re-opens banner when poke:open-cookie-settings event is dispatched', () => {
    localStorage.setItem('poke_cookie_consent', 'rejected');

    render(
      <AppProvider>
        <CookieBanner />
      </AppProvider>
    );

    // Initially hidden
    expect(screen.queryByText(/Cookieの使用について/i)).toBeNull();

    // Dispatch event to open settings
    fireEvent(window, new CustomEvent('poke:open-cookie-settings'));

    // Should now be visible
    expect(screen.getByText(/Cookieの使用について/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /受け入れる/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /受け入れない/i })).toBeTruthy();
  });
});
