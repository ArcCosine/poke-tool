import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { PokemonInstance } from '../utils/party';
import { createEmptyInstance } from '../utils/party';

export type Language = 'ja' | 'en' | 'ko' | 'zh-Hant';
export type Theme = 'light' | 'dark';

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'zh-Hant', label: '繁體中文' },
];

export interface SavedParty {
  id: string;
  name: string;
  members: PokemonInstance[];
}

interface AppContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  theme: Theme;
  toggleTheme: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  // Parties state and methods
  parties: SavedParty[];
  currentPartyId: string;
  partyName: string;
  partyMembers: PokemonInstance[];
  setPartyName: (name: string) => void;
  updateMember: (index: number, fields: Partial<PokemonInstance>) => void;
  updateMove: (memberIndex: number, moveIndex: number, moveId: number) => void;
  addPokemonToPartyDirectly: (
    poke: PokemonInstance,
    targetPartyId?: string
  ) => boolean;
  replacePokemonInParty: (index: number, poke: PokemonInstance) => void;
  removePokemonFromParty: (index: number) => void;
  createNewParty: (name?: string, initialMembers?: PokemonInstance[]) => string;
  deleteParty: (id: string) => void;
  selectParty: (id: string) => void;
  saveCurrentParty: () => void;
  pendingPokemonToAdd: PokemonInstance | null;
  setPendingPokemonToAdd: (poke: PokemonInstance | null) => void;
  addEmptySlotToParty: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

import enTranslations from '../locales/en.json';
import jaTranslations from '../locales/ja.json';
import koTranslations from '../locales/ko.json';
import zhHantTranslations from '../locales/zh-Hant.json';

const translations: Record<Language, any> = {
  ja: jaTranslations,
  en: enTranslations,
  ko: koTranslations,
  'zh-Hant': zhHantTranslations,
};

const resolveTranslation = (obj: any, path: string): string | undefined => {
  if (!obj) return undefined;
  if (path in obj && typeof obj[path] === 'string') {
    return obj[path];
  }
  const val = path.split('.').reduce((acc, part) => acc?.[part], obj);
  if (typeof val === 'string') return val;

  if (obj.nav && typeof obj.nav[path] === 'string') {
    return obj.nav[path];
  }
  if (obj.common && typeof obj.common[path] === 'string') {
    return obj.common[path];
  }
  if (obj.legal && typeof obj.legal[path] === 'string') {
    return obj.legal[path];
  }
  return undefined;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize language from localStorage or default to 'ja'
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('lang') as Language;
    return (['ja', 'en', 'ko', 'zh-Hant'] as Language[]).includes(saved)
      ? saved
      : 'ja';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang);
  };

  // Initialize theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  // Load parties from localStorage with migration
  const [parties, setParties] = useState<SavedParty[]>(() => {
    const savedPartiesStr = localStorage.getItem('saved_parties');
    if (savedPartiesStr) {
      try {
        const parsed = JSON.parse(savedPartiesStr);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved_parties:', e);
      }
    }

    // Migration from old single party format
    const oldSavedStr = localStorage.getItem('saved_party');
    if (oldSavedStr) {
      try {
        const parsed = JSON.parse(oldSavedStr);
        const members = parsed.members || [createEmptyInstance()];
        const name = parsed.name || 'マイチャンピオンズパーティ';
        const migrated: SavedParty = {
          id: Math.random().toString(36).substring(2, 9),
          name,
          members,
        };
        const list = [migrated];
        localStorage.setItem('saved_parties', JSON.stringify(list));
        localStorage.removeItem('saved_party');
        return list;
      } catch (e) {
        console.error('Failed to migrate old saved_party:', e);
      }
    }

    // Fallback default party
    const defaultParty: SavedParty = {
      id: Math.random().toString(36).substring(2, 9),
      name: 'マイチャンピオンズパーティ',
      members: [createEmptyInstance()],
    };
    const list = [defaultParty];
    localStorage.setItem('saved_parties', JSON.stringify(list));
    return list;
  });

  const [currentPartyId, setCurrentPartyId] = useState<string>(() => {
    const savedId = localStorage.getItem('current_party_id');
    if (savedId && parties.some((p) => p.id === savedId)) {
      return savedId;
    }
    return parties[0]?.id || '';
  });

  const [pendingPokemonToAdd, setPendingPokemonToAdd] =
    useState<PokemonInstance | null>(null);

  const currentParty =
    parties.find((p) => p.id === currentPartyId) || parties[0];
  const partyName = currentParty?.name || '';
  const partyMembers = currentParty?.members || [];

  // Apply theme class to document element on mount and theme change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleLanguage = () => {
    setLanguageState((prev) => {
      const order: Language[] = ['ja', 'en', 'ko', 'zh-Hant'];
      const nextIndex = (order.indexOf(prev) + 1) % order.length;
      const next = order[nextIndex];
      localStorage.setItem('lang', next);
      return next;
    });
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const current = translations[language];
    let val = resolveTranslation(current, key);
    if (val === undefined) {
      val = resolveTranslation(translations.en, key);
    }
    let res = val !== undefined ? val : key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        res = res.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return res;
  };

  const getUniqueName = (
    proposedName: string,
    excludePartyId: string,
    currentParties: SavedParty[]
  ): string => {
    const baseName = proposedName.trim() || t('partySimulator.myParty');
    let uniqueName = baseName;
    let counter = 2;
    while (
      currentParties.some(
        (p) => p.id !== excludePartyId && p.name === uniqueName
      )
    ) {
      uniqueName = `${baseName} (${counter})`;
      counter++;
    }
    return uniqueName;
  };

  const setPartyName = (name: string) => {
    setParties((prev) => {
      const uniqueName = getUniqueName(name, currentPartyId, prev);
      const next = prev.map((p) =>
        p.id === currentPartyId ? { ...p, name: uniqueName } : p
      );
      localStorage.setItem('saved_parties', JSON.stringify(next));
      return next;
    });
  };

  const updateMember = (index: number, fields: Partial<PokemonInstance>) => {
    setParties((prev) => {
      const next = prev.map((p) => {
        if (p.id !== currentPartyId) return p;
        const nextMembers = [...p.members];
        nextMembers[index] = { ...nextMembers[index], ...fields };
        return { ...p, members: nextMembers };
      });
      localStorage.setItem('saved_parties', JSON.stringify(next));
      return next;
    });
  };

  const updateMove = (
    memberIndex: number,
    moveIndex: number,
    moveId: number
  ) => {
    setParties((prev) => {
      const next = prev.map((p) => {
        if (p.id !== currentPartyId) return p;
        const nextMembers = [...p.members];
        const nextMoves = [...nextMembers[memberIndex].moves];
        nextMoves[moveIndex] = moveId;
        nextMembers[memberIndex] = {
          ...nextMembers[memberIndex],
          moves: nextMoves,
        };
        return { ...p, members: nextMembers };
      });
      localStorage.setItem('saved_parties', JSON.stringify(next));
      return next;
    });
  };

  const addPokemonToPartyDirectly = (
    poke: PokemonInstance,
    targetPartyId?: string
  ): boolean => {
    const activePartyId = targetPartyId || currentPartyId;
    const activePartyObj = parties.find((p) => p.id === activePartyId);
    if (!activePartyObj) return false;

    if (currentPartyId !== activePartyId) {
      setCurrentPartyId(activePartyId);
      localStorage.setItem('current_party_id', activePartyId);
    }

    const members = activePartyObj.members;
    const emptyIndex = members.findIndex((m) => m.masterId === 0);
    if (emptyIndex !== -1) {
      setParties((prev) => {
        const next = prev.map((p) => {
          if (p.id !== activePartyId) return p;
          const nextMembers = [...p.members];
          nextMembers[emptyIndex] = { ...nextMembers[emptyIndex], ...poke };
          return { ...p, members: nextMembers };
        });
        localStorage.setItem('saved_parties', JSON.stringify(next));
        return next;
      });
      return true;
    }

    const activeMembersCount = members.filter((m) => m.masterId !== 0).length;
    if (activeMembersCount >= 6) {
      setPendingPokemonToAdd(poke);
      return false;
    }

    setParties((prev) => {
      const next = prev.map((p) => {
        if (p.id !== activePartyId) return p;
        // Strip out empty slot placeholders first to append cleanly
        const filled = p.members.filter((m) => m.masterId !== 0);
        return { ...p, members: [...filled, poke] };
      });
      localStorage.setItem('saved_parties', JSON.stringify(next));
      return next;
    });
    return true;
  };

  const replacePokemonInParty = (index: number, poke: PokemonInstance) => {
    updateMember(index, {
      id: poke.id,
      masterId: poke.masterId,
      ability: poke.ability,
      nature: poke.nature,
      item: poke.item,
      moves: poke.moves,
      evs: poke.evs,
    });
    setPendingPokemonToAdd(null);
  };

  const removePokemonFromParty = (index: number) => {
    setParties((prev) => {
      const next = prev.map((p) => {
        if (p.id !== currentPartyId) return p;
        const nextMembers = [...p.members];
        nextMembers.splice(index, 1);
        if (nextMembers.length === 0) {
          nextMembers.push(createEmptyInstance());
        }
        return { ...p, members: nextMembers };
      });
      localStorage.setItem('saved_parties', JSON.stringify(next));
      return next;
    });
  };

  const createNewParty = (
    name = '新しいパーティ',
    initialMembers?: PokemonInstance[]
  ): string => {
    const newId = Math.random().toString(36).substring(2, 9);
    const uniqueName = getUniqueName(name, '', parties);
    const newParty: SavedParty = {
      id: newId,
      name: uniqueName,
      members: initialMembers || [createEmptyInstance()],
    };
    setParties((prev) => {
      const next = [...prev, newParty];
      localStorage.setItem('saved_parties', JSON.stringify(next));
      return next;
    });
    setCurrentPartyId(newId);
    localStorage.setItem('current_party_id', newId);
    return newId;
  };

  const deleteParty = (id: string) => {
    if (parties.length <= 1) {
      const newId = Math.random().toString(36).substring(2, 9);
      const freshParty: SavedParty = {
        id: newId,
        name: t('partySimulator.myParty'),
        members: [createEmptyInstance()],
      };
      setParties([freshParty]);
      localStorage.setItem('saved_parties', JSON.stringify([freshParty]));
      setCurrentPartyId(newId);
      localStorage.setItem('current_party_id', newId);
      return;
    }
    setParties((prev) => {
      const next = prev.filter((p) => p.id !== id);
      localStorage.setItem('saved_parties', JSON.stringify(next));
      return next;
    });
    if (currentPartyId === id) {
      const remaining = parties.filter((p) => p.id !== id);
      const fallbackId = remaining[0]?.id || '';
      setCurrentPartyId(fallbackId);
      localStorage.setItem('current_party_id', fallbackId);
    }
  };

  const selectParty = (id: string) => {
    if (parties.some((p) => p.id === id)) {
      setCurrentPartyId(id);
      localStorage.setItem('current_party_id', id);
    }
  };

  const saveCurrentParty = () => {
    localStorage.setItem('saved_parties', JSON.stringify(parties));
  };

  const addEmptySlotToParty = () => {
    if (partyMembers.length >= 6) {
      alert(t('partySimulator.maxSlotsAlert'));
      return;
    }
    setParties((prev) => {
      const next = prev.map((p) => {
        if (p.id !== currentPartyId) return p;
        return { ...p, members: [...p.members, createEmptyInstance()] };
      });
      localStorage.setItem('saved_parties', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        theme,
        toggleTheme,
        t,
        parties,
        currentPartyId,
        partyName,
        partyMembers,
        setPartyName,
        updateMember,
        updateMove,
        addPokemonToPartyDirectly,
        replacePokemonInParty,
        removePokemonFromParty,
        createNewParty,
        deleteParty,
        selectParty,
        saveCurrentParty,
        pendingPokemonToAdd,
        setPendingPokemonToAdd,
        addEmptySlotToParty,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
