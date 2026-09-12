import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { LanguageSelector } from './LanguageSelector';

describe('LanguageSelector', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render the current language label', () => {
    render(
      <AppProvider>
        <LanguageSelector />
      </AppProvider>
    );

    expect(screen.getByText('日本語')).toBeDefined();
  });

  it('should open menu on click and allow selecting a new language', () => {
    render(
      <AppProvider>
        <LanguageSelector />
      </AppProvider>
    );

    const trigger = screen.getByTestId('language-selector-trigger');
    fireEvent.click(trigger);

    // Should see options
    expect(screen.getByText('한국어')).toBeDefined();
    expect(screen.getByText('繁體中文')).toBeDefined();
    expect(screen.getByText('简体中文')).toBeDefined();
    expect(screen.getByText('English')).toBeDefined();

    // Click Korean
    act(() => {
      fireEvent.click(screen.getByText('한국어'));
    });

    expect(localStorage.getItem('lang')).toBe('ko');
    expect(
      screen.getByTestId('language-selector-trigger').textContent
    ).toContain('한국어');
  });
});
