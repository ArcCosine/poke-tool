# 計画88: 中国語簡体字 (zh-Hans) の多言語対応および5言語国際化計画

## 1. 概要と目的
現在、本ツールは日本語 (`ja`)、英語 (`en`)、韓国語 (`ko`)、中国語繁体字 (`zh-Hant`) の4言語に対応しています。
今回、中国本土およびシンガポール等で広く使われる**中国語簡体字 (`zh-Hans` / 简体中文)** を新たにサポート言語として追加し、**計5言語**に対応した国際化（i18n）環境を構築します。

---

## 2. 言語コードと表示名の定義

| 言語コード | 言語名（現地表記） | 日本語表記 | 英語表記 |
| :--- | :--- | :--- | :--- |
| `ja` | 日本語 | 日本語 | Japanese |
| `en` | English | 英語 | English |
| `ko` | 한국어 | 韓国語 | Korean |
| `zh-Hant` | 繁體中文 | 中国語（繁体字） | Traditional Chinese |
| **`zh-Hans`** | **简体中文** | **中国語（簡体字）** | **Simplified Chinese** |

※ 言語コードは PokeAPI および BCP 47 国際規格に準拠した `zh-Hans` を採用します。

---

## 3. 改修設計方針

### ① `Language` 型および `AppContext` の拡張
- 型定義の拡張:
  ```ts
  export type Language = 'ja' | 'en' | 'ko' | 'zh-Hant' | 'zh-Hans';
  ```
- 言語一覧定数 `LANGUAGES` への追加:
  ```ts
  { code: 'zh-Hans', label: '简体中文' }
  ```
- `localStorage`（キー: `'lang'`）での保存・復元に `zh-Hans` を対応。
- `LocalizedName` 型の更新:
  ```ts
  export interface LocalizedName {
    ja: string;
    en: string;
    ko?: string;
    'zh-Hant'?: string;
    'zh-Hans'?: string;
  }
  ```

### ② UI 文言辞書 (`src/locales/zh-Hans.json`) の新規作成
- `ja.json` / `en.json` / `zh-Hant.json` と 100% 同一の階層・キー構造を持つ簡体字辞書を作成。
- `src/locales/i18n.test.ts` にて 5言語間すべての対称性（キーの完全一致）を自動検証。

### ③ ポケモン共通データ（タイプ・性格・メガストーン・レギュレーション）の公式簡体字追加
- `src/utils/pokemon.ts`:
  - `typeTranslations`: 18タイプの公式簡体字名称（一般, 飞行, 火, 水, 草, 电, 超能力, 冰, 龙, 恶, 格斗, 毒, 地面, 岩石, 虫, 幽灵, 钢, 妖精）
  - `megaStoneMap`: メガストーンの公式簡体字名称（妙蛙花进化石, 喷火龙进化石X, etc.）
- `src/utils/party.ts`:
  - `NATURES`: 全25性格の公式簡体字名称（固执, 爽朗, 内敛, 胆小, etc.）
- `src/data/regulations.json`:
  - レギュレーション M-A〜M-C の簡体字名称（规则 M-A, etc.）

### ④ マスターデータ（ポケモン・技・特性・道具）の簡体字補完
- PokeAPI より公式の中国語簡体字 (`zh-Hans` / `zh-hans`) データを取得し、以下マスターデータに `zh-Hans` フィールドを追加：
  - `src/data/pokemon_master.json`（ポケモン名・特性名）
  - `src/data/moves_master.json`（技名）
  - `src/data/items_master.json`（持ち物名）
- PokeAPI で未収録の新メガ進化等の特殊道具・特性についても公式簡体字に準拠した名称を設定。

### ⑤ 法務ページ（利用規約・プライバシーポリシー・免責事項）の簡体字テキスト追加
- `src/components/Legal/TermsOfService.tsx`
- `src/components/Legal/PrivacyPolicy.tsx`
- `src/components/Legal/Disclaimer.tsx`
- 各コンポーネントの言語別オブジェクトに `zh-Hans` を追加。

### ⑥ ポケモン検索モーダル (`PokemonSearchModal.tsx`) の簡体字検索対応
- 中国語簡体字（漢字）によるインクリメンタル検索に対応。
- 検索プレースホルダーの簡体字表示（`'按名称搜索...'`）。

---

## 4. 実施手順（TDDによる段階的実装ロードマップ）

### フェーズ 1: テストコードの拡充 (Red)
1. `src/locales/i18n.test.ts`:
   - 5言語間のキー完全対称性テストの追加。
   - `zh-Hans` のドット区切りパス解決およびパラメータ置換テストの追加。
2. `src/context/AppContext.test.tsx`:
   - `zh-Hans` の切り替え・永続化テストの追加。
3. `src/utils/pokemon.test.ts` & `src/utils/party.test.ts`:
   - タイプ・性格の `zh-Hans` 翻訳テストの追加。
4. `src/components/Legal/LegalPages.test.tsx`:
   - `zh-Hans` での各規約レンダリングテストの追加。
5. テストを実行し Red を確認。

### フェーズ 2: UI文言辞書と AppContext の実装 (Green)
1. `src/locales/zh-Hans.json` を作成。
2. `src/context/AppContext.tsx` を 5言語対応に拡張。
3. フェーズ1の辞書・Context テストが Green になることを確認。

### フェーズ 3: 共通データ・法務ページの簡体字実装 (Green)
1. `src/utils/pokemon.ts`, `src/utils/party.ts`, `src/data/regulations.json` に簡体字を追加。
2. `TermsOfService.tsx`, `PrivacyPolicy.tsx`, `Disclaimer.tsx` に簡体字を追加。
3. 共通データおよび法務ページのテストが Green になることを確認。

### フェーズ 4: マスターデータへの簡体字（zh-Hans）補完スクリプト実行
1. PokeAPI より `zh-Hans` データを取得・補完する更新スクリプトを作成・実行。
2. `pokemon_master.json`, `moves_master.json`, `items_master.json` に `zh-Hans` を追加。
3. `PokemonSearchModal.tsx` の検索処理およびプレースホルダーを更新。

### フェーズ 5: 全体検証と Cloudflare Pages への再デプロイ
1. `npm test`（Vitest 全テストスイート）が全てパスすることを確認。
2. `npm run build` でビルドエラー・型エラーがないことを確認。
3. `npm run deploy` で Cloudflare Pages 本番環境にデプロイし、公開サイトで簡体字の表示・切り替えを検証。

---

## 5. リスクと対策
- **PokeAPIにおける未収録データ**:
  - メガ進化追加種（メガグソクムシャ、メガセグレイブ等）や新メガストーンはPokeAPIにまだ存在しない場合がある。
  - **対策**: ポケモン公式の簡体字表記（《宝可梦大集结》や公式用語集等に準拠）を手動マッピング辞書で確実に補完。

---

## 6. 実装完了サマリー
- [x] **フェーズ 1 & 2: UI文言辞書と AppContext の拡張**
  - `src/locales/zh-Hans.json` (簡体字) を作成。全100+キーで日本語・英語・韓国語・繁体字と100%完全対称性を達成。
  - `AppContext.tsx` で `Language` 型を `'ja' | 'en' | 'ko' | 'zh-Hant' | 'zh-Hans'` に拡張し、ドロップダウンに「简体中文」を追加。
  - `i18n.test.ts`、`AppContext.test.tsx` で単体テスト通過。
- [x] **フェーズ 3: 共通データ・法務ページの簡体字対応**
  - `src/utils/pokemon.ts`: 18タイプおよび全メガストーンの公式簡体字翻訳を追加。
  - `src/utils/party.ts`: 全25性格の公式簡体字名称を追加。
  - `src/data/regulations.json`: レギュレーション M-A〜M-C の簡体字名を追加。
  - `PartySimulator.tsx`: 各ステータス（HP, 攻击, 防御, 特攻, 特防, 速度）の多言語定義に `zh-Hans` を追加。
  - `LegalPages.test.tsx`: 規約ページの簡体字レンダリングテスト通過。
- [x] **フェーズ 4: マスターデータへの簡体字補完スクリプト実行**
  - `pokemon_master.json`（341件、特性712件）、`moves_master.json`（691件）、`items_master.json`（167件）の全件に公式の `zh-Hans` を補完。
  - `PokemonSearchModal.tsx` で簡体字（漢字）でのポケモン名検索に対応。
- [x] **フェーズ 5: 全体検証と Cloudflare Pages への再デプロイ**
  - Vitest: 23テストスイート、全144テストすべて通過（Green）。
  - TypeScript型チェック & Vite本番ビルド: エラーゼロで成功。
  - Cloudflare Pages（`https://poke-tool.pages.dev`）へ再デプロイ完了。
