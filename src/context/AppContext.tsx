import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'ja' | 'en';
export type Theme = 'light' | 'dark';

interface AppContextProps {
  language: Language;
  toggleLanguage: () => void;
  theme: Theme;
  toggleTheme: () => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const uiTranslations: Record<Language, Record<string, string>> = {
  ja: {
    dashboard: 'ダッシュボード',
    imageAnalyzer: '画像分析',
    statSearch: '火力・耐久検索',
    partySimulator: 'パーティシミュレーター',
    searchType: '検索項目',
    damage: '最大火力',
    phyDef: '物理耐久',
    speDef: '特殊耐久',
    type: 'タイプ',
    allTypes: 'すべてのタイプ',
    category: '分類',
    allCategories: 'すべての分類',
    physical: '物理',
    special: '特殊',
    regulation: 'レギュレーション',
    allRegulations: '制限なし (全ポケモン)',
    loading: 'データを読み込み中...',
    rank: '順位',
    pokemon: 'ポケモン',
    value: '指数',
    move: '使用技',
    addPokemon: 'ポケモンを追加',
    remove: '削除',
    selectPokemon: 'ポケモンを選択',
    selectAbility: '特性を選択',
    selectMove: '技を選択',
    defenseAnalysis: '防御相性一貫性',
    offenseAnalysis: '攻撃カバー率',
    warnings: '警告・アドバイス',
    noWarnings: '警告はありません。良好なバランスです！',
    regValid: 'レギュレーション適合',
    regInvalid: 'レギュレーション不適合',
    saveParty: 'パーティを保存',
    loadParty: 'パーティを読み込み',
    partyName: 'パーティ名',
    weakness: '弱点',
    resistance: '耐性',
    immunity: '無効',
  },
  en: {
    dashboard: 'Dashboard',
    imageAnalyzer: 'Image Analyzer',
    statSearch: 'Stat Search',
    partySimulator: 'Party Simulator',
    searchType: 'Search Target',
    damage: 'Max Damage',
    phyDef: 'Physical Durability',
    speDef: 'Special Durability',
    type: 'Type',
    allTypes: 'All Types',
    category: 'Category',
    allCategories: 'All Categories',
    physical: 'Physical',
    special: 'Special',
    regulation: 'Regulation',
    allRegulations: 'No Limit (All Pokémon)',
    loading: 'Loading data...',
    rank: 'Rank',
    pokemon: 'Pokémon',
    value: 'Value',
    move: 'Best Move',
    addPokemon: 'Add Pokémon',
    remove: 'Remove',
    selectPokemon: 'Select Pokémon',
    selectAbility: 'Select Ability',
    selectMove: 'Select Move',
    defenseAnalysis: 'Defensive Synergy',
    offenseAnalysis: 'Offense Coverage',
    warnings: 'Warnings & Advice',
    noWarnings: 'No warnings. Good synergy!',
    regValid: 'Regulation Pass',
    regInvalid: 'Regulation Banned',
    saveParty: 'Save Party',
    loadParty: 'Load Party',
    partyName: 'Party Name',
    weakness: 'Weak',
    resistance: 'Resist',
    immunity: 'Immune',
  },
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize language from localStorage or default to 'ja'
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('lang') as Language;
    return saved === 'ja' || saved === 'en' ? saved : 'ja';
  });

  // Initialize theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  // Apply theme class to document element on mount and theme change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === 'ja' ? 'en' : 'ja';
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

  const t = (key: string): string => {
    return uiTranslations[language][key] || key;
  };

  return (
    <AppContext.Provider
      value={{ language, toggleLanguage, theme, toggleTheme, t }}
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
