import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProvider, useApp } from './AppContext';

// Helper component to test AppContext hooks
const TestComponent = () => {
  const { language, toggleLanguage, theme, toggleTheme, t } = useApp();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="theme">{theme}</span>
      <span data-testid="translated">{t('dashboard')}</span>
      <button type="button" onClick={toggleLanguage} data-testid="btn-lang">
        Toggle Lang
      </button>
      <button type="button" onClick={toggleTheme} data-testid="btn-theme">
        Toggle Theme
      </button>
    </div>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should initialize with default values (ja, dark)', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('lang').textContent).toBe('ja');
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByTestId('translated').textContent).toBe('ダッシュボード');
  });

  it('should toggle language and persist in localStorage', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    const btnLang = screen.getByTestId('btn-lang');
    act(() => {
      btnLang.click();
    });

    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(localStorage.getItem('lang')).toBe('en');
    expect(screen.getByTestId('translated').textContent).toBe('Dashboard');
  });

  it('should toggle theme and update html class and localStorage', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    const btnTheme = screen.getByTestId('btn-theme');
    act(() => {
      btnTheme.click();
    });

    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
