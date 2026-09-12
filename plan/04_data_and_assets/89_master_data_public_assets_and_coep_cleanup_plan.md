# 計画89: マスターデータの public/data/ 配置移行およびCOEPヘッダークリーンアップ計画

## 1. 概要と背景
Cloudflare Pages へのデプロイ後、本番環境においてポケモンの画像およびデータが一切表示されない問題が発生しました。
調査の結果、以下の原因が特定されました：
1. **本番環境でのマスターデータ 404 エラー**:
   - `src/utils/db.ts` が `/src/data/pokemon_master.json` 等を `fetch()` していたが、Vite の本番ビルドでは `src/` 配下のファイルは静的アセットとして出力されない。
   - その結果、Cloudflare Pages 上で 404（SPA の `index.html`）が返り、JSON パースエラーにより全画面でデータが空配列となっていた。
2. **不要な COEP ヘッダーによるサブリソース制約リスク**:
   - `public/_headers` に設定されている `Cross-Origin-Embedder-Policy: require-corp`（旧 OCR 機能向け）が残存しており、ブラウザの画像読み込みを阻害するリスクがある。

ユーザーからの指定に基づき、マスターデータを **`public/data/`** 配下に配置し、Web アプリケーションから `/data/...` として静的配信・取得する構成へ移行します。

---

## 2. 設計方針

### ① マスターデータの `public/data/` への配置
- 以下のマスターデータ JSON を `public/data/` に配置します：
  - `public/data/pokemon_master.json`
  - `public/data/moves_master.json`
  - `public/data/items_master.json`
  - `public/data/version.json`
  - `public/data/regulations.json`
- `src/data/` の既存ファイルを `public/data/` に移行（または同期維持）します。
- `src/data/` を直接 `import` しているコンポーネント・ユーティリティ（`regulations.json` を import している箇所等）との互換性を確認・調整します。

### ② `src/utils/db.ts` の取得パス修正
`loadMasterData()` 内の `fetch` パスを `/src/data/...` から `/data/...` に修正：
```ts
// 修正前:
const resVersion = await fetch('/src/data/version.json');
const resPokemon = await fetch('/src/data/pokemon_master.json');
const resMoves = await fetch('/src/data/moves_master.json');
const resItems = await fetch('/src/data/items_master.json');

// 修正後:
const resVersion = await fetch('/data/version.json');
const resPokemon = await fetch('/data/pokemon_master.json');
const resMoves = await fetch('/data/moves_master.json');
const resItems = await fetch('/data/items_master.json');
```

### ③ `public/_headers` のクリーンアップ
OCR（WASM/SharedArrayBuffer）削除に伴い不要となった COEP/COOP ヘッダーを削除し、純粋なセキュリティヘッダーおよび静的アセット長期キャッシュ構成へ最適化：
```http
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

# 静的アセット（JS/CSS/画像/データ）の長期キャッシュ
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# データJSONおよびHTMLは最新性を維持
/data/*
  Cache-Control: public, max-age=0, must-revalidate

/*.html
  Cache-Control: public, max-age=0, must-revalidate
```

---

## 3. 実施手順（TDDによる段階的実装ロードマップ）

### フェーズ 1: テストコードの作成・更新 (Red)
1. `src/utils/db.test.ts`:
   - `loadMasterData` が `/data/...` から正常にデータを fetch して IndexedDB キャッシュを行う挙動の検証テストを追加・更新。
   - `/src/data/...` を期待しているテストがあれば修正し、未配置状態で実行して Red を確認。

### フェーズ 2: `public/data/` へのファイル配置と `db.ts` の更新 (Green)
1. `src/data/` 内の全 JSON ファイルを `public/data/` にコピー・配置。
2. `src/utils/db.ts` の fetch パスを `/data/...` に更新。
3. `db.test.ts` を実行し、Green になることを確認。

### フェーズ 3: `public/_headers` のクリーンアップ
1. `public/_headers` から不要な `Cross-Origin-Embedder-Policy` および `Cross-Origin-Opener-Policy` を除去。
2. `/data/*` のキャッシュコントロールルールを追加。

### フェーズ 4: 全体検証とビルド
1. `npm test`（全23テストスイート）を実行し、全件パスを確認。
2. `npm run build` を実行し、`dist/data/` に全 JSON ファイルが出力されていることを確認。

### フェーズ 5: Cloudflare Pages への再デプロイと動作検証
1. `npm run deploy` を実行し、Cloudflare Pages へ最新バンドルをデプロイ。
2. 公開環境（`https://poke-tool.pages.dev`）にて、以下を検証：
   - `/data/pokemon_master.json` が `200 application/json` で返ること
   - 火力・耐久検索、パーティシミュレータ、努力値計算機でポケモンおよびスプライト画像が正常に表示されること

---

## 4. 実装完了サマリー
- [x] **フェーズ 1 & 2: `public/data/` への配置と `db.ts` の更新**
  - `public/data/` に全マスターデータ（`pokemon_master.json`, `moves_master.json`, `items_master.json`, `version.json`, `regulations.json`）を配置。
  - `src/utils/db.ts` の `loadMasterData()` での fetch パスを `/data/...` に更新。
  - `src/utils/db.test.ts` で fetch URL 検証テストを実装し、Green を確認。
- [x] **フェーズ 3: `public/_headers` および `vite.config.ts` のクリーンアップ**
  - 不要となった `Cross-Origin-Embedder-Policy: require-corp` および `Cross-Origin-Opener-Policy` を除去。
  - `/data/*` のキャッシュ制御（`max-age=0, must-revalidate`）を追加。
- [x] **フェーズ 4: 全体テストとビルド検証**
  - Vitest: 全23テストスイート、全144テストすべてパス（Green）。
  - Vite 本番ビルド: `dist/data/` に全マスターデータが出力されることを確認。
- [x] **フェーズ 5: Cloudflare Pages への再デプロイと動作検証**
  - `wrangler pages deploy` でデプロイ完了。
  - 公開URLにて `/data/pokemon_master.json` が `HTTP/2 200`（`application/json`）で返ること、画像が正常に配信されることを確認。
