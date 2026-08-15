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
    statSearch: '火力・耐久',
    partySimulator: 'パーティ編成',
    searchType: '検索項目',
    damage: '最大火力',
    phyDef: '物理耐久',
    speDef: '特殊耐久',
    type: 'タイプ',
    allTypes: 'すべてのタイプ',
    moveType: 'わざタイプ',
    allMoveTypes: 'すべてのわざタイプ',
    ability: '特性',
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
    uploadPrompt:
      '画像をドラッグ＆ドロップするか、クリックしてファイルを選択してください',
    analyze: '画像を解析する',
    importToParty: 'パーティにインポート',
    analysisResult: '解析結果',
    detectedPokemon: '検出されたポケモン',
    radarChartStats: '努力値グラフ解析値',
    importSuccess: 'パーティの空きスロットにインポートしました！',
    noEmptySlot:
      'パーティに空きスロットがありません（最大6匹）。先にスロットを空けてください。',
    dashboardDesc:
      'Poke-Toolへようこそ！このツールはポケモンチャンピオンズ向けのデータ分析とパーティシミュレーションをサポートします。',
    imageAnalyzerDesc:
      'スクリーンショット画像をローカルの ONNX OCR / WASM で解析し、ポケモンの努力値を読み込みます。',
    statSearchDesc:
      'レベル50固定時の物理耐久、特殊耐久、最大火力指数のランキングと詳細検索を行います。',
    partySimulatorDesc:
      'パーティの相性・弱点の一貫性、攻撃範囲のカバー率、レギュレーションの適合性を分析します。',
    analyzing: '解析中...',
    uploadInstruction:
      '画像をアップロードし、解析を実行すると、認識されたポケモンのステータスが表示されます。',
    partySaved: 'パーティを保存しました！',
    defaultPartyName: 'マイチャンピオンズパーティ',
    hp: 'HP',
    attack: '攻撃',
    defense: '防御',
    sp_attack: '特攻',
    sp_defense: '特防',
    speed: '素早さ',
    uploadPreview: 'アップロードプレビュー',
    privacyPolicy: 'プライバシーポリシー',
    disclaimer: '免責事項',
    termsOfService: '利用規約',
    backToDashboard: 'ダッシュボードへ戻る',
    privacyPolicyText: `【はじめに】
当ツール（以下「本ツール」）は、ユーザーのプライバシー情報の保護に最大限努めています。

【データのローカル処理と管理】
本ツールにおいて行われる以下の処理およびデータ管理は、すべてユーザーのブラウザ上（ローカル環境）で完結して実行されます。
1. アップロードされたゲームスクリーンショット画像の解析（努力値の読み取り等）
2. ダメージ計算および火力・耐久指数の算出
3. 作成されたパーティデータの保存（IndexedDBおよびlocalStorageへの保存）

お客様の画像データや入力されたパラメータが外部のサーバーに送信、蓄積、または処理されることは一切ありません。本ツールは完全にローカルで動作する「ローカルファースト」の設計を採用しています。

【外部へのデータ送信およびCookie】
本ツールでは、利便性の向上やアクセス解析のためのCookieの利用、およびサードパーティの追跡ツールの導入は行っていません。また、いかなる個人情報も取得いたしません。

【プライバシーポリシーの改定】
本ツールは、機能の追加や法改正等に伴い、本プライバシーポリシーをいつでも改定できるものとします。改定後のポリシーは本ツール上に掲載された時点で効力を生じるものとします。`,
    disclaimerText: `【公式関係者との関係】
本ツールは、任天堂株式会社、株式会社クリーチャーズ、株式会社ゲームフリーク、株式会社ポケモン、およびその他の公式関係者とは一切関係がない、ファンによる非公式の対戦データ分析支援ツールです。

【計算結果・情報の正確性】
本ツールで算出される火力指数、耐久指数、ステータス実数値、および画像解析によって得られる数値は、データ計算に基づく予測値または推定値です。ゲーム内での実際の数値、ダメージ計算結果、および挙動と完全に一致することを保証するものではありません。特に努力値のOCR読み取りやグラフ解析は、画像の解像度や状態によって誤差が生じる可能性があります。

【免責】
本ツールの利用により生じた直接的、間接的、または偶発的な損害（対戦での敗北、データ消失、ハードウェアへの影響、その他一切の不利益）について、開発者は一切の責任を負いません。本ツールのご利用は、ユーザーご自身の責任において行ってください。

【外部APIおよびリソース】
本ツールはデータの取得にサードパーティのAPI（PokeAPI等）を利用しています。これらの外部サービスの中断や仕様変更により、本ツールの一部または全部が正常に動作しなくなる場合がありますが、これに対する補償は行いません。`,
    termsOfServiceText: `【第1条（規約の適用）】
本利用規約（以下「本規約」）は、本ツールの利用者（以下「ユーザー」）と開発者との間の利用条件を定めるものです。ユーザーは、本ツールを利用することにより、本規約および免責事項のすべてに同意したものとみなされます。

【第2条（利用条件と禁止事項）】
ユーザーは、本ツールを自己の個人的な対戦データ分析およびパーティ編成シミュレーションの目的にのみ利用することができます。
ユーザーは、本ツールの利用にあたり、以下の行為を行ってはなりません。
1. 本ツールのソースコード、アルゴリズムの改ざん、または不正なリバースエンジニアリング行為
2. 商用目的での本ツールの再配布、販売、または類似サービスの構築
3. 外部APIや本ツールの提供インフラストラクチャに対するスクレイピング、過度な負荷をかけるアクセス行為
4. その他、開発者または開発元の第三者に不利益や損害を与える行為、または公序良俗に反する行為

【第3条（サービスの提供と変更・終了）】
本ツールは現状有姿で提供され、開発者は事前予告なしに本ツールの機能変更、提供の中断、一時停止、または完全な提供終了を行う権利を有します。

【第4条（準拠法と管轄）】
本規約の解釈および適用にあたっては、日本法を準拠法とします。本ツールに関する紛争については、日本の裁判所を第一審の専属的合意管轄裁判所とします。`,
  },
  en: {
    dashboard: 'Dashboard',
    imageAnalyzer: 'Image Scan',
    statSearch: 'Stat Search',
    partySimulator: 'Party Sim',
    searchType: 'Search Target',
    damage: 'Max Damage',
    phyDef: 'Physical Durability',
    speDef: 'Special Durability',
    type: 'Type',
    allTypes: 'All Types',
    moveType: 'Move Type',
    allMoveTypes: 'All Move Types',
    ability: 'Ability',
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
    uploadPrompt: 'Drag & drop game screenshot here, or click to upload',
    analyze: 'Analyze Image',
    importToParty: 'Import to Party',
    analysisResult: 'Analysis Result',
    detectedPokemon: 'Detected Pokémon',
    radarChartStats: 'Radar Chart EVs',
    importSuccess: 'Imported to the first available slot in your party!',
    noEmptySlot:
      'No empty slot available in your party. Please remove a Pokémon first.',
    dashboardDesc:
      'Welcome to the Poke-Tool! This tool will support your Pokémon Champions data analysis.',
    imageAnalyzerDesc: 'Analyze party images using Onnx OCR and WASM locally.',
    statSearchDesc: 'Search maximum damage and durability rankings.',
    partySimulatorDesc: 'Analyze party weaknesses and type balances.',
    analyzing: 'Analyzing...',
    uploadInstruction:
      'Upload an image and run analysis to view the recognized Pokémon statistics.',
    partySaved: 'Party saved successfully!',
    defaultPartyName: 'My Champions Party',
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    sp_attack: 'Sp. Attack',
    sp_defense: 'Sp. Defense',
    speed: 'Speed',
    uploadPreview: 'Upload preview',
    privacyPolicy: 'Privacy Policy',
    disclaimer: 'Disclaimer',
    termsOfService: 'Terms of Service',
    backToDashboard: 'Back to Dashboard',
    privacyPolicyText: `[Introduction]
This tool (hereinafter referred to as "the Tool") is highly committed to protecting the privacy of its users.

[Local Processing and Data Management]
The following operations and data storage performed within the Tool are executed entirely within your web browser (local environment):
1. Analysis of uploaded game screenshots (reading Effort Values (EVs), etc.)
2. Damage calculations and maximum durability/damage index computation
3. Storage of edited party data (stored in IndexedDB and localStorage)

Your images, processed data, and custom parameters are never uploaded, stored, or processed on any external servers. The Tool is designed as a fully local-first application.

[Data Transmission and Cookies]
We do not use cookies, tracking pixels, or third-party analytics tools. The Tool does not collect, track, or share any personally identifiable information.

[Changes to this Policy]
We reserve the right to modify this Privacy Policy at any time to reflect updates to the Tool or changes in legal regulations. The updated policy becomes effective immediately upon publication within the Tool.`,
    disclaimerText: `[Affiliation]
The Tool is an unofficial, fan-made helper tool. It is not affiliated with, endorsed by, or associated with Nintendo, Creatures Inc., GAME FREAK inc., The Pokémon Company, or any of their associates.

[Accuracy of Information]
The statistics, damage indexes, durability values, and image OCR analysis results calculated by the Tool are estimates based on numerical algorithms. We do not guarantee absolute accuracy or 100% agreement with actual in-game stats, damage outcomes, or mechanics. In particular, OCR effort value detection may carry errors depending on image quality, crop size, and compression.

[Limitation of Liability]
Under no circumstances shall the developer be liable for any direct, indirect, incidental, or consequential damages (including, but not limited to, loss of game progress, hardware issues, or any game-related disadvantage) arising from the use or inability to use the Tool. The use of this Tool is at your own risk.

[External Resources]
The Tool relies on third-party APIs (such as PokeAPI) to obtain game data. We are not responsible for any issues arising from service disruptions, performance issues, or specification changes of these external services.`,
    termsOfServiceText: `[Article 1 - Applicability]
These Terms of Service (hereinafter "Terms") govern the relationship between users (hereinafter "User" or "you") and the developer. By accessing or using the Tool, you agree to be fully bound by these Terms and the Disclaimer.

[Article 2 - Permitted Use & Prohibitions]
You may use the Tool solely for personal, non-commercial purposes, such as analyzing competitive stats and simulating team synergy.
You shall not engage in any of the following activities:
1. Modifying, tampering with, or reverse-engineering the Tool's source code or underlying algorithms.
2. Redistributing, selling, or utilizing the Tool or its compiled components for commercial purposes.
3. Performing data scraping or sending automated requests that cause excessive load on the Tool's components or external APIs.
4. Any other activity that causes damage to the developer or third parties, or violates public order.

[Article 3 - Service Modifications and Termination]
The Tool is provided on an "as-is" and "as-available" basis. The developer reserves the right to modify, suspend, or terminate the Tool or its features at any time without prior notice.

[Article 4 - Governing Law & Jurisdiction]
These Terms shall be governed by and construed in accordance with the laws of Japan. Any disputes arising out of or in connection with the Tool shall be subject to the exclusive jurisdiction of the courts of Japan in the first instance.`,
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
