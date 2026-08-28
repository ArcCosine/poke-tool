import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProvider, useApp } from './AppContext';

let appInstance: any;
const TestComponent = () => {
  appInstance = useApp();
  const { language, toggleLanguage, theme, toggleTheme, t } = appInstance;
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
    appInstance = null;
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

  it('should initialize with a default party', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(appInstance.parties.length).toBe(1);
    expect(appInstance.partyName).toBe('マイチャンピオンズパーティ');
    expect(appInstance.partyMembers.length).toBe(1); // starts with 1 empty slot
  });

  it('should create and switch to a new party', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    let newPartyId: string;
    act(() => {
      newPartyId = appInstance.createNewParty('テストパーティ');
    });

    expect(appInstance.parties.length).toBe(2);
    expect(appInstance.currentPartyId).toBe(newPartyId!);
    expect(appInstance.partyName).toBe('テストパーティ');
  });

  it('should rename the current party', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      appInstance.setPartyName('名前変更パーティ');
    });

    expect(appInstance.partyName).toBe('名前変更パーティ');
    // Ensure it updates inside the parties array too
    const current = appInstance.parties.find(
      (p: any) => p.id === appInstance.currentPartyId
    );
    expect(current.name).toBe('名前変更パーティ');
  });

  it('should delete a party and fallback to another party', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    const initialId = appInstance.currentPartyId;
    let newPartyId: string;
    act(() => {
      newPartyId = appInstance.createNewParty('パーティ2');
    });

    expect(appInstance.currentPartyId).toBe(newPartyId!);

    // Delete the new party
    act(() => {
      appInstance.deleteParty(newPartyId);
    });

    expect(appInstance.parties.length).toBe(1);
    expect(appInstance.currentPartyId).toBe(initialId);
  });

  it('should handle adding pokemons and prompt for replace if full (6 members)', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Initial has 1 empty slot (member)
    // Add 6 members to reach 6 (1 replacement + 5 additions)
    for (let i = 0; i < 6; i++) {
      act(() => {
        appInstance.addPokemonToPartyDirectly({
          id: `poke-${i}`,
          masterId: 10 + i,
          ability: 'test-ability',
          nature: 'neutral',
          moves: [0, 0, 0, 0],
          evs: {
            hp: 0,
            attack: 0,
            defense: 0,
            sp_attack: 0,
            sp_defense: 0,
            speed: 0,
          },
        });
      });
    }

    expect(appInstance.partyMembers.length).toBe(6);

    // Try adding a 7th pokemon, which should fail directly and set pendingPokemonToAdd
    const seventhPoke = {
      id: 'poke-7',
      masterId: 99,
      ability: 'test-ability',
      nature: 'neutral',
      moves: [0, 0, 0, 0],
      evs: {
        hp: 0,
        attack: 0,
        defense: 0,
        sp_attack: 0,
        sp_defense: 0,
        speed: 0,
      },
    };

    let added: boolean = false;
    act(() => {
      added = appInstance.addPokemonToPartyDirectly(seventhPoke);
    });

    expect(added).toBe(false);
    expect(appInstance.pendingPokemonToAdd).toEqual(seventhPoke);

    // Replace the 2nd member (index 1) with the seventh poke
    act(() => {
      appInstance.replacePokemonInParty(1, seventhPoke);
    });

    expect(appInstance.partyMembers[1]).toEqual(seventhPoke);
    expect(appInstance.pendingPokemonToAdd).toBeNull();
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
