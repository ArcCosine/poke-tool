# 計画84: 文言管理の共通JSON化および一元管理（多言語対応 i18n）計画

## 1. 背景と課題
現在、各コンポーネント（`App.tsx`、`EvCalculator.tsx`、`DurabilityOptimizer.tsx`、`PartySimulator.tsx`、`StatSearch.tsx`、`PokemonSearchModal.tsx`、法的ページ等）において、UIテキストが以下のようにコンポーネント内に三項演算子等で直接ハードコードされています：
```tsx
{language === 'ja' ? '努力値計算ツール' : 'EV Calculator'}
```
また、`src/context/AppContext.tsx` 内にも一部の翻訳テキスト（`uiTranslations`）が直接記述されており、文言の追加・変更・修正が複数のファイルに分散して保守性が低下しています。

本計画では、共通ディレクトリ配下に文言管理用の JSON ファイル（`ja.json`、`en.json`）を配置し、すべてのコンポーネントがこの一元管理された文言リソースを参照するようにリファクタリングします。

---

## 2. 設計方針

### ① 文言用 JSON ファイルの配置場所
`src/locales/` ディレクトリを新設し、言語ごとの JSON ファイルを作成します：
- `src/locales/ja.json`: 日本語UI文言
- `src/locales/en.json`: 英語UI文言

※ `src/data/locales/` ではなく `src/locales/` とすることで、ポケモンのマスターデータ（`src/data/`）とアプリケーションのUI文言（`src/locales/`）の関心を分離し、見通しを良くします。

### ② JSON の構造設計
文言の衝突を防ぎ、各機能の文言を把握しやすくするため、カテゴリ・機能ごとの階層構造（ネストオブジェクト）を採用します。また、既存のフラットキーとも後方互換性を維持します。

```json
{
  "common": {
    "cancel": "キャンセル",
    "ok": "OK",
    "close": "閉じる",
    "save": "保存",
    "delete": "削除",
    "loading": "データを読み込み中...",
    "search": "検索",
    "select": "選択",
    "all": "すべて"
  },
  "nav": {
    "dashboard": "ダッシュボード",
    "statSearch": "火力・耐久",
    "partySimulator": "パーティ編成",
    "evCalculator": "努力値調整"
  },
  "dashboard": {
    "title": "Poke-Tool",
    "welcome": "Poke-Toolへようこそ！このツールはポケモンチャンピオンズ向けのデータ分析とパーティシミュレーションをサポートします。",
    "statSearchDesc": "レベル50固定時の物理耐久、特殊耐久、最大火力指数のランキングと詳細検索を行います。",
    "partySimulatorDesc": "パーティの相性・弱点の一貫性、攻撃範囲のカバー率、レギュレーションの適合性を分析します。",
    "evCalculatorDesc": "性格や努力値をカスタマイズし、レベル50時の実数値を確認・編成へインポートします。"
  },
  "evCalculator": {
    "title": "努力値計算ツール",
    "description": "性格や努力値をカスタマイズし、レベル50時の実数値を確認・編成へインポートします。",
    "addToParty": "パーティに追加",
    "selectPokemon": "ポケモンを選択",
    "nature": "性格",
    "ability": "特性",
    "item": "持ち物",
    "itemPlaceholder": "持ち物を選択...",
    "moves": "技構成",
    "partyFull": "パーティが満杯です",
    "durability": {
      "index": "耐久指数",
      "physical": "物理",
      "special": "特殊",
      "total": "総合",
      "tuning": "耐久調整",
      "style": "スタイル",
      "overall": "総合重視 (H=B+D)",
      "optimizeButton": "HBDへの最適配分を計算"
    }
  },
  "partySimulator": {
    "title": "パーティシミュレーター",
    "defenseAnalysis": "防御相性一貫性",
    "offenseAnalysis": "攻撃カバー率",
    "saveParty": "パーティを保存",
    "loadParty": "パーティを読み込み",
    "partySaved": "パーティを保存しました！",
    "warnings": "警告・アドバイス",
    "noWarnings": "警告はありません。良好なバランスです！"
  },
  "statSearch": {
    "title": "ステータス検索",
    "searchType": "検索項目",
    "damage": "最大火力",
    "phyDef": "物理耐久",
    "speDef": "特殊耐久"
  },
  "legal": {
    "privacyPolicy": "プライバシーポリシー",
    "disclaimer": "免責事項",
    "termsOfService": "利用規約",
    "backToDashboard": "ダッシュボードへ戻る",
    "privacyPolicyText": "...",
    "disclaimerText": "...",
    "termsOfServiceText": "..."
  }
}
```

### ③ `t()` 関数の拡張（ドット区切りパス対応）
`AppContext.tsx` の `t(key: string)` 関数を、ドット区切りパス（例: `t('evCalculator.title')`）およびトップレベルキー（例: `t('dashboard')`）の双方をシームレスに解決できるように拡張します。

```typescript
const resolveTranslation = (obj: any, path: string): string | undefined => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

const t = (key: string): string => {
  const current = translations[language];
  const val = resolveTranslation(current, key);
  if (val !== undefined && typeof val === 'string') return val;
  
  // フォールバック（英語、見つからない場合はkeyそのもの）
  const fallback = resolveTranslation(translations.en, key);
  return typeof fallback === 'string' ? fallback : key;
};
```

---

## 3. 段階的移行ロードマップ (TDDの遵守)

### フェーズ 1: テストコードの作成 (Red)
1. `src/locales/i18n.test.ts` を作成：
   - `ja.json` と `en.json` が読み込めること。
   - `ja.json` と `en.json` のキー構造に過不足がないこと（相互整合性チェック）。
   - `t('common.cancel')` や `t('evCalculator.title')` 等のドット区切りパスが日本語・英語それぞれで正しく解決されること。
   - 存在しないキーに対してフォールバックまたはキー自身が返ること。
2. テストを実行し、Red（未実装状態）を確認。

### フェーズ 2: 文言用 JSON ファイルの作成と Context の移行 (Green)
1. `src/locales/ja.json` および `src/locales/en.json` を作成。
   - 既存の `uiTranslations` に含まれるすべてのキーと長文（規約・ポリシー等）を移行。
   - 各コンポーネントで使われているハードコード文言をキーとして抽出し、JSON に登録。
2. `src/context/AppContext.tsx` を修正：
   - 巨大なインラインオブジェクト `uiTranslations` を削除し、`ja.json` / `en.json` のインポートへ切り替え。
   - `t` 関数をドット区切りパス対応に更新。
3. `i18n.test.ts` および既存の `AppContext.test.tsx` が Green になることを確認。

### フェーズ 3: 各コンポーネントのハードコード文言の置換
以下の順序で、三項演算子 `{language === 'ja' ? '...' : '...'}` を `t('...')` に置換：
1. `src/App.tsx`
2. `src/components/EvCalculator/DurabilityOptimizer.tsx`
3. `src/components/EvCalculator/EvCalculator.tsx` & `EvStatInput.tsx`
4. `src/components/PartySimulator/PartySimulator.tsx` & `PokemonSearchModal.tsx`
5. `src/components/StatSearch/StatSearch.tsx`
6. `src/components/Legal/`（各規約コンポーネント）

### フェーズ 4: 全体テストとリファクタリング
- 全コンポーネントの単体テスト（`npx vitest run`）を実行し、全テスト通過を確認。
- 不足している文言や不要になった重複ロジックのクリーンアップ。

---

## 4. 実装結果と検証状況（完了）
- **文言ファイルの作成**: `src/locales/ja.json` および `src/locales/en.json` を新設し、完全なキー対称性を確保（`src/locales/i18n.test.ts` で自動検証）。
- **`AppContext` の改修**: `AppContext.tsx` から 200 行以上のハードコード翻訳辞書を撤去し、ドットパス解決、変数埋め込み（`{name}`）、フォールバック機能付きの `t()` 関数を実装。
- **全コンポーネントの移行**:
  - `App.tsx`
  - `EvCalculator.tsx`, `DurabilityOptimizer.tsx`
  - `PartySimulator.tsx`, `PokemonSearchModal.tsx`
  - `StatSearch.tsx`
  - `LegalLayout.tsx`, `PrivacyPolicy.tsx`, `Disclaimer.tsx`, `TermsOfService.tsx`
- **検証結果**:
  - `npx vitest run`: 全 22 テストファイル、全 136 テストがパス（Green）。
  - `npm run build`: 型エラーなし、バンドル成功。
