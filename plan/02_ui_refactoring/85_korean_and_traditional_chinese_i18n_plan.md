# 計画85: 韓国語 (ko) および中国語繁体字 (zh-Hant) の多言語対応計画

## 1. 概要と目的
現在、本アプリケーションは日本語 (`ja`) と英語 (`en`) の2言語に対応していますが、ユーザーからの要望に基づき、新たに**韓国語 (`ko`)** および **中国語（繁体字） (`zh-Hant`)** の2言語を追加し、計4言語に対応した国際化（i18n）環境を構築します。

---

## 2. 言語コードと表示名の定義

| 言語コード | 言語名（現地表記） | 日本語表記 | 英語表記 |
| :--- | :--- | :--- | :--- |
| `ja` | 日本語 | 日本語 | Japanese |
| `en` | English | 英語 | English |
| `ko` | 한국어 | 韓国語 | Korean |
| `zh-Hant` | 繁體中文 | 中国語（繁体字） | Traditional Chinese |

※ 中国語繁体字の言語コードには、PokeAPI および BCP 47 国際標準に準拠した `zh-Hant` を採用します。

---

## 3. 設計方針

### ① `Language` 型の拡張と `AppContext`
- `export type Language = 'ja' | 'en' | 'ko' | 'zh-Hant';` へ拡張。
- `setLanguage: (lang: Language) => void` を追加し、直接言語を指定可能にします。
- 従来の `toggleLanguage` は4言語を巡回切り替え、またはドロップダウンからの直接選択へ対応。
- `localStorage` に保存された `'lang'` キーから復元（`ko`, `zh-Hant` も有効な値として認識）。
- `t(key, params)` 関数：
  - 現在の言語 JSON（`ko.json` や `zh-Hant.json`）を参照。
  - キーが存在しない場合は英語（`en`）、さらに見つからない場合はキー自身へフォールバック。

### ② UI 文言辞書 JSON の新規作成
- `src/locales/ko.json`: 韓国語の完全なUI文言辞書
- `src/locales/zh-Hant.json`: 中国語繁体字の完全なUI文言辞書
- `ja.json` / `en.json` と 100% 同一のキー構造（階層ネスト）を維持し、`src/locales/i18n.test.ts` にて4言語すべての相互対称性（キーの過不足がないこと）を自動検証。

### ③ ヘッダーの言語セレクター UI（UI/UX改善）
- 現在のトグルボタン（クリックするたびに切替）は2言語向けだったため、4言語では目的の言語に切り替えるのに複数回クリックが必要となります。
- そのため、地球儀/言語アイコン付きの**言語選択ドロップダウン（またはセレクトメニュー）**を実装します：
  - 現在選択中の言語を表示（例: 「🌐 日本語 ▾」）
  - クリックで「日本語」「English」「한국어」「繁體中文」のリストが表示され、1クリックで目的の言語へ切り替え可能。
  - ダークモード・アクセシビリティ（フォーカス・コントラスト・ESCキー閉じ）に対応。

### ④ ポケモン共通データ（タイプ・性格・メガストーン）の多言語化
- `src/utils/pokemon.ts`:
  - `typeTranslations`: 18タイプすべての `ko`（노말, 불꽃, 물, 풀...）および `zh-Hant`（一般, 火, 水, 草...）の公式名称を追加。
  - `megaStoneMap`: メガストーン名の `ko`, `zh-Hant` 対応を追加。
- `src/utils/party.ts`:
  - `NATURES`: 全25性格の `ko`（고집, 명랑, 조심, 겁쟁い...）および `zh-Hant`（固執, 爽朗, 内斂, 膽小...）の公式名称を追加。

### ⑤ マスターデータ（ポケモン・技・特性・持ち物）の多言語化方針
- 現在のマスターデータ (`pokemon_master.json`, `moves_master.json`, `items_master.json`) は `name: { ja: string; en: string }` 形式となっています。
- **安全な表示フォールバックの導入**:
  - UI 側で `poke.name[language] || poke.name.en || poke.name.ja` のように安全にフォールバック参照するヘルパー関数（例: `getLocalizedName(item, language)`）を導入。
- **マスターデータの一括拡充 (スクリプト処理)**:
  - PokeAPI より公式の韓国語 (`ko`) および中国語繁体字 (`zh-hant`) のポケモン名、技名、特性名、持ち物名を取得し、マスターデータ JSON に `ko` と `zh-Hant` を補完する更新スクリプトを実行。

### ⑥ ポケモン検索モーダル (`PokemonSearchModal.tsx`) の検索対応
- 日本語（ひらがな・カタカナ・ローマ字）、英語（アルファベット）に加え、韓国語（ハングル文字）および中国語繁体字での部分一致検索に対応。
- プレースホルダーの多言語化（`ko`: '이름으로 검색...', `zh-Hant`: '依名稱搜尋...'）。

---

## 4. 段階的実装ロードマップ (TDDの遵守)

### フェーズ 1: テストコードの拡充 (Red)
1. `src/locales/i18n.test.ts` を更新：
   - `ko.json` および `zh-Hant.json` のロード検証。
   - `ja`, `en`, `ko`, `zh-Hant` の4言語間における全キーの対称性（過不足なし）の検証。
   - 韓国語・中国語繁体字でのドット区切りパス解決およびパラメータ補間（`{name}`, `{count}`）の検証。
2. `src/context/AppContext.test.tsx` を更新：
   - 4言語の切り替え、`setLanguage`、フォールバックの動作検証。
3. テストを実行し、Red（未実装状態）を確認。

### フェーズ 2: UI 文言辞書と AppContext の実装 (Green)
1. `src/locales/ko.json` および `src/locales/zh-Hant.json` を作成。
2. `src/context/AppContext.tsx` の `Language` 型を更新し、`ko`, `zh-Hant` の辞書を結合。
3. `i18n.test.ts` および `AppContext.test.tsx` のテストを Green にする。

### フェーズ 3: タイプ・性格・メガストーン定義の拡充
1. `src/utils/pokemon.test.ts` および `src/utils/party.test.ts` に `ko` / `zh-Hant` のタイプ・性格翻訳テストを追加（Red）。
2. `src/utils/pokemon.ts`（`typeTranslations`, `megaStoneMap`）および `src/utils/party.ts`（`NATURES`）に公式訳を追加（Green）。

### フェーズ 4: 言語セレクター UI の刷新
1. ヘッダー（`src/App.tsx` および `src/components/Legal/LegalLayout.tsx`）の言語切替ボタンを、4言語選択可能なドロップダウンセレクターに刷新。
2. キーボード操作およびダークモードでの視認性を確保。

### フェーズ 5: マスターデータへの韓国語・中国語繁体字の補完
1. マスターデータ更新スクリプトを作成し、PokeAPI から `ko` および `zh-hant` のポケモン名・技名・特性名・道具名を取得してマスターデータを拡充。
2. `PokemonSearchModal` でハングルおよび漢字の検索がスムーズに行えることを確認。

### フェーズ 6: 全体回帰テストとビルド検証
1. `npx vitest run` を実行し、全テストの通過を確認。
2. `npm run build` を実行し、型チェックおよび本番ビルドの成功を確認。

---

---

## 5. 実装完了サマリー
- [x] **フェーズ 1 & 2: UI文言辞書と AppContext の拡張**
  - `src/locales/ko.json` (韓国語) および `src/locales/zh-Hant.json` (繁体字) を作成。全100+キーで完全対称性を達成。
  - `AppContext.tsx` で `Language` 型を `'ja' | 'en' | 'ko' | 'zh-Hant'` に拡張し、`setLanguage` を提供。
  - `i18n.test.ts`、`AppContext.test.tsx` で単体テスト通過。
- [x] **フェーズ 3: タイプ・性格・メガストーン・レギュレーションの多言語化**
  - `src/utils/pokemon.ts`: 18タイプおよびメガストーンの公式韓国語・繁体字翻訳を追加。
  - `src/utils/party.ts`: 全25性格の公式韓国語・繁体字名称を追加。
  - `src/data/regulations.json`: レギュレーション M-A〜M-C の韓国語・繁体字名を追加。
- [x] **フェーズ 4: 言語セレクター UI の刷新**
  - `src/components/common/LanguageSelector.tsx` を新規作成。4言語直接選択可能なドロップダウンメニューを実装。
  - `App.tsx` および `LegalLayout.tsx` に導入。
- [x] **フェーズ 5: マスターデータの一括多言語化**
  - `pokemon_master.json`（341件、特性712件）、`moves_master.json`（691件）、`items_master.json`（167件）の全件に公式の `ko` および `zh-Hant` を補完。
  - `PokemonSearchModal.tsx` で韓国語（ハングル）および中国語（漢字）でのポケモン名検索に対応。
- [x] **フェーズ 6: 全体回帰テストとビルド検証**
  - Vitest: 23テストスイート、140テストすべて通過（Green）。
  - TypeScript型チェック & Vite本番ビルド: エラーゼロで成功。
