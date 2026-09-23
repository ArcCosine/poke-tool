# 計画書: PWAマルチページオフラインルーティングおよびポケモンアイコンキャッシュの改修

## 1. 現状の課題と原因の分析

ユーザーからの問い合わせ：
> 「オフラインで表示したいのですが、アイコンが表示されません。
> 複数ページに渡ってオフラインで表示するようにしたいです。今はdashboardしかオフライン表示に対応していないようです。」

コードベースおよびビルド生成物（`dist/sw.js`）の精査により、以下の明確な原因が判明しました。

### 課題 1: ダッシュボードしかオフラインで表示できない問題
- **原因**: 
  - `vite.config.ts` の `VitePWA` 設定において、Workbox のデフォルト動作により `navigateFallback` が `'index.html'` に設定されていた。
  - これにより、`dist/sw.js` に `registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")))` が生成され、ユーザーがブラウザで別ページ（`/party.html`、`/ranking.html`、`/ev-calculator.html`、`/party-ranking.html` 等）に遷移・直接アクセス・リロードした際、**Service Worker がすべての画面遷移リクエストを横取りして `index.html`（ダッシュボード）を返却してしまっていた**。
  - 本アプリは MPA（マルチページアプリケーション）構成であり、各 HTML ファイルはビルド時にすでに Pre-cache 対象としてキャッシュに含まれているため、`navigateFallback: null` に設定（および拡張子なし URL へのマッピング対応）を行うことで、オフライン時でも各個別ページが正しく表示されるようになる。

### 課題 2: オフライン時にポケモンのアイコン（画像）が表示されない問題
- **原因**:
  - `src/utils/offline.ts` 内の `downloadAllOfflineData` において、ダウンロード対象のポケモンIDが `Array.from({ length: 341 }, (_, i) => i + 1)`（1〜341の連番）としてハードコードされていた。
  - しかし実際のポケモンマスターデータ（`pokemon_master.json`）の ID は、`id: 3`（フシギバナ）から始まり、メガシンカポケモンは `id: 10008` 等、リージョンフォームは `id: 10033` 等の PokeAPI 準拠 ID となっている。
  - その結果、「オフライン用に全データ保存」を実行しても、存在しない ID への無駄なリクエスト（404）が発生し、メガシンカやリージョンフォームを含む実際の全341匹のスプライト画像がキャッシュされていなかった。
  - また、ダッシュボード画面では `loadMasterData()` が実行されておらず、マスターデータが IndexedDB に未保存のままだった。

### 課題 3: アセットキャッシュ定義の不備
- `vite.config.ts` の `includeAssets` に `assets/type-icons/*.png` と記述されていたが、実際のタイプアイコンファイルは `.svg`（`public/assets/type-icons/*.svg`）である。

### 課題 5: オフライン時にポケモンの画像が表示されない問題の完全解決
- **原因**:
  - `globIgnores: ['**/assets/pokemon-sprites/**']` により、ポケモンスプライト画像が事前キャッシュ（Pre-cache）から除外されており、ダッシュボードの保存ボタンを押さない限り端末に一切画像が存在しない設計になっていた。
### 課題 7: 全画面のすべての画像（タイプアイコン、技分類、PWAアイコン、アバター、フォールバック画像）のオフライン対応
- **原因**:
  - ポケモンスプライト以外の画像（タイプアイコン18種、物理/特殊アイコン2種、ファビコン・PWAアイコン、アバター画像など）についても、オフラインモード時に読み込めない、または外部URLアバターが壊れたアイコンになる懸念があった。
  - `downloadAllOfflineData` がポケモンスプライトのみを対象としており、タイプアイコンや技分類アイコン、フォールバック画像（`0.png`）をキャッシュ対象に含めていなかった。
  - 一部のUIコンポーネントで画像ロードエラー時のフォールバック先が `0.png` に統一されていなかったり、無限ループ防止策が不十分だった。
- **解決策**:
  - `src/utils/offline.ts` の `downloadAllOfflineData` に、全ポケモンスプライト・`0.png`・全18タイプアイコン・技分類アイコン（物理/特殊）・PWA各種アイコン・マスターデータJSONをすべて含め、オフライン一括保存でアプリ全体の画像が端末内に100%揃うようにする。
  - `src/components/common/AuthButton.tsx` にアバター画像のエラーハンドリングを追加し、オフライン時に外部アバターが読み込めない場合はローカルのSVGユーザーアイコンを美しく表示する。
  - 各画面（`EvCalculator`, `PartySimulator`, `PokemonSearchModal`, `StatSearch`, `PartyCard`）の画像エラーハンドラにおいて、`/assets/pokemon-sprites/0.png` への安全なフォールバック（無限ループ防止ガード付き）を徹底する。

---

## 2. 改修方針とアーキテクチャ設計

### (1) マルチページ (MPA) オフラインルーティングの修正 (`vite.config.ts`)
1. **`navigateFallback: null` の設定**:
   - 単一の `index.html` への無条件フォールバックを無効化。
   - 事前キャッシュ（Pre-cache）されている各 HTML ファイル（`index.html`, `party.html`, `ranking.html`, `ev-calculator.html`, `party-ranking.html`, `privacy.html`, `disclaimer.html`, `terms.html`）が、それぞれの URL（`/party.html` 等）に対して直接 Service Worker から返却されるようにする。
2. **クライアント即時制御 (`clientsClaim`, `skipWaiting`)**:
   - Service Worker インストール後、リロード不要で即座にページをコントロール下におく。

### (2) ポケモンスプライト・全UI画像・マスターデータの完全オフラインキャッシュ (`src/utils/offline.ts`)
1. **動的なポケモンID一覧と全UIアセットの取得**:
   - `downloadAllOfflineData()` において、メガシンカ・リージョンフォルムを含む全ポケモンスプライト（`pokemon_master.json` の全ID）に加え、以下のアセットをすべてキャッシュ：
     - フォールバック画像: `/assets/pokemon-sprites/0.png`
     - 全18タイプアイコン: `/assets/type-icons/{type}.svg`
     - 技分類アイコン: `/assets/categories/physical.jpg`, `/assets/categories/special.jpg`
     - PWA / UI アイコン: `/favicon.svg`, `/apple-touch-icon.png`, `/pwa-192x192.png`, `/pwa-512x512.png`, `/pwa-maskable-192x192.png`, `/pwa-maskable-512x512.png`, `/ogp.png`, `/icons.svg`
     - マスターデータ: `/data/pokemon_master.json`, `/data/moves_master.json`, `/data/items_master.json`, `/data/regulations.json`, `/data/version.json`
2. **画像ロード失敗時のフォールバック統一**:
   - 各画面の画像エラーハンドラで、存在しないポケモン画像は `/assets/pokemon-sprites/0.png` に差し替え、`0.png` も失敗した場合は非表示にする無限ループガードを実装。
   - 外部URLアバター（`AuthButton`）はオフライン時にローカルSVGアイコンへフォールバック。

---

## 3. 作業ロードマップと TDD 開発フロー

- [x] **Step 1: 計画書の作成とユーザー合意** (本ファイル)
- [x] **Step 2: `src/utils/offline.ts` の改修 (TDD)**
  - `src/utils/offline.test.ts` に、実際のポケモン ID リスト取得と全341匹の正確なキャッシュ取得・検証の単体テストを追加。
  - `downloadAllOfflineData` で `loadMasterData()` を連携し、実際のポケモン ID（10008等を含む）をダウンロード・キャッシュするように実装。
- [x] **Step 3: `vite.config.ts` の MPA オフラインルーティングおよびアセット設定の改修**
  - `navigateFallback: null` の設定。
  - `includeAssets` の `assets/type-icons/*.svg` 修正。
  - `globPatterns: ['**/*.{js,css,html,svg,png,jpg,json}']` による全アセットの事前キャッシュ統合。
- [x] **Step 4: 全画像（タイプ、技分類、PWAアイコン、アバター）のオフライン保護対応**
  - `offline.ts` でタイプアイコン、カテゴリ画像、フォールバック画像の一括キャッシュ対応。
  - 各種 UI コンポーネントでのフォールバックガード実装。
  - `AuthButton.tsx` での外部アバター画像オフラインフォールバック対応。
- [ ] **Step 5: 全体テストとビルド確認**
  - `npm test`（全テスト合格）
  - `npm run build`（PWA Service Worker 生成とバンドルの正常動作検証）

---

## 4. 影響範囲
- `vite.config.ts`: Service Worker の生成ルール
- `src/utils/offline.ts`: オフラインダウンロード・キャッシュ管理ロジック
- `src/utils/offline.test.ts`: 単体テスト
- `src/components/common/AuthButton.tsx`: アバターフォールバック
- `src/components/EvCalculator/EvCalculator.tsx`: ポケモン画像フォールバック
- `src/components/PartySimulator/PartySimulator.tsx`: ポケモン画像フォールバック
- `src/components/PartySimulator/PokemonSearchModal.tsx`: ポケモン画像フォールバック
- `src/components/StatSearch/StatSearch.tsx`: ポケモン画像フォールバック
- `src/components/PartyRanking/PartyCard.tsx`: ポケモン画像フォールバック

