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
      <span data-testid="nested-translated">{t('evCalculator.title')}</span>
      <span data-testid="fallback-key">{t('missing.unknown.key')}</span>
      <span data-testid="interpolated">
        {t('evCalculator.partyWithPokemon', { name: 'ピカチュウ' })}
      </span>
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
    expect(screen.getByTestId('nested-translated').textContent).toBe(
      '努力値計算ツール'
    );
    expect(screen.getByTestId('interpolated').textContent).toBe(
      'ピカチュウ入りパーティ'
    );
    expect(screen.getByTestId('fallback-key').textContent).toBe(
      'missing.unknown.key'
    );
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

  it('should cycle through 5 languages and persist in localStorage', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    const btnLang = screen.getByTestId('btn-lang');

    // 1. ja -> en
    act(() => {
      btnLang.click();
    });
    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(localStorage.getItem('lang')).toBe('en');
    expect(screen.getByTestId('translated').textContent).toBe('Dashboard');

    // 2. en -> ko
    act(() => {
      btnLang.click();
    });
    expect(screen.getByTestId('lang').textContent).toBe('ko');
    expect(localStorage.getItem('lang')).toBe('ko');
    expect(screen.getByTestId('translated').textContent).toBe('대시보드');

    // 3. ko -> zh-Hant
    act(() => {
      btnLang.click();
    });
    expect(screen.getByTestId('lang').textContent).toBe('zh-Hant');
    expect(localStorage.getItem('lang')).toBe('zh-Hant');
    expect(screen.getByTestId('translated').textContent).toBe('儀表板');

    // 4. zh-Hant -> zh-Hans
    act(() => {
      btnLang.click();
    });
    expect(screen.getByTestId('lang').textContent).toBe('zh-Hans');
    expect(localStorage.getItem('lang')).toBe('zh-Hans');
    expect(screen.getByTestId('translated').textContent).toBe('仪表板');

    // 5. zh-Hans -> ja
    act(() => {
      btnLang.click();
    });
    expect(screen.getByTestId('lang').textContent).toBe('ja');
    expect(localStorage.getItem('lang')).toBe('ja');
    expect(screen.getByTestId('translated').textContent).toBe('ダッシュボード');
  });

  it('should allow setting language directly with setLanguage', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      appInstance.setLanguage('ko');
    });
    expect(screen.getByTestId('lang').textContent).toBe('ko');
    expect(localStorage.getItem('lang')).toBe('ko');
    expect(screen.getByTestId('nested-translated').textContent).toBe(
      '노력치 계산기'
    );

    act(() => {
      appInstance.setLanguage('zh-Hant');
    });
    expect(screen.getByTestId('lang').textContent).toBe('zh-Hant');
    expect(localStorage.getItem('lang')).toBe('zh-Hant');
    expect(screen.getByTestId('nested-translated').textContent).toBe(
      '努力值計算器'
    );

    act(() => {
      appInstance.setLanguage('zh-Hans');
    });
    expect(screen.getByTestId('lang').textContent).toBe('zh-Hans');
    expect(localStorage.getItem('lang')).toBe('zh-Hans');
    expect(screen.getByTestId('nested-translated').textContent).toBe(
      '努力值计算器'
    );
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

  it('should sanitize party member EVs on load from localStorage (clamp total to 66)', () => {
    // Simulate saved party with invalid 76 total EVs (32, 32, 12)
    const invalidParty = [
      {
        id: 'test-party-1',
        name: 'Invalid EVs Party',
        members: [
          {
            id: 'mem-1',
            masterId: 1,
            ability: 'Overgrow',
            nature: 'Hardy',
            item: '',
            moves: [0, 0, 0, 0],
            evs: {
              hp: 32,
              attack: 32,
              defense: 0,
              sp_attack: 0,
              sp_defense: 0,
              speed: 12, // 32 + 32 + 12 = 76
            },
          },
        ],
      },
    ];
    localStorage.setItem('saved_parties', JSON.stringify(invalidParty));

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    const party = appInstance.parties[0];
    const member = party.members[0];
    // Total should be clamped to 66: HP 32, Attack 32, Speed clamped from 12 down to 2
    expect(member.evs.hp).toBe(32);
    expect(member.evs.attack).toBe(32);
    expect(member.evs.speed).toBe(2);
    const totalEvs = Object.values(member.evs).reduce(
      (a: number, b: any) => a + Number(b),
      0
    );
    expect(totalEvs).toBe(66);
  });

  it('should sanitize member EVs on updateMember and addPokemonToPartyDirectly', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Test addPokemonToPartyDirectly with invalid EVs (32, 32, 12)
    act(() => {
      appInstance.addPokemonToPartyDirectly({
        id: 'new-poke',
        masterId: 25,
        ability: 'Static',
        nature: 'Jolly',
        item: '',
        moves: [0, 0, 0, 0],
        evs: {
          hp: 0,
          attack: 32,
          defense: 0,
          sp_attack: 0,
          sp_defense: 12,
          speed: 32, // 32 + 12 + 32 = 76
        },
      });
    });

    const addedMember = appInstance.partyMembers[0];
    expect(addedMember.masterId).toBe(25);
    const totalAdded = Object.values(addedMember.evs).reduce(
      (a: number, b: any) => a + Number(b),
      0
    );
    expect(totalAdded).toBe(66);

    // Test updateMember with invalid EVs
    act(() => {
      appInstance.updateMember(0, {
        evs: {
          hp: 32,
          attack: 32,
          defense: 10,
          sp_attack: 0,
          sp_defense: 0,
          speed: 0,
        },
      });
    });

    const updatedMember = appInstance.partyMembers[0];
    const totalUpdated = Object.values(updatedMember.evs).reduce(
      (a: number, b: any) => a + Number(b),
      0
    );
    expect(totalUpdated).toBe(66);
  });
});
