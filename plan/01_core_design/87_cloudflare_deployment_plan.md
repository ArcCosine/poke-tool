# 計画書: Cloudflare Pagesへの本番デプロイ計画 (poke-tool)

## 1. 概要
本ツール（ポケモンチャンピオンズ向けデータ分析・パーティシミュレータWebアプリ）の本番リリースに伴い、Cloudflare上にプロジェクト名 **`poke-tool`** としてWebサイトを公開・デプロイするための計画です。

---

## 2. デプロイ基盤の選定: Cloudflare Pages

### 選定理由
- **静的SPA（Vite + React）との完全な親和性**:
  - 本ツールはクライアントサイドで完結するSPA（Single Page Application）であり、Cloudflare PagesのグローバルエッジCDNによる高速配信と相性が極めて良好。
- **WASM / マルチスレッド・ヘッダー制御**:
  - `_headers` ファイルを配置することで、`Cross-Origin-Opener-Policy` (COOP) や `Cross-Origin-Embedder-Policy` (COEP) を本番環境でも確実に制御可能。
- **デプロイの柔軟性**:
  - Wrangler CLIを用いた直接デプロイ（Direct Upload）および GitHub 連携による自動CI/CDの両方に対応。

---

## 3. 必要な改修・追加ファイル

### ① `package.json` のメタデータ及びスクリプト更新
- `name`: `"tmp-vite"` → `"poke-tool"` に修正。
- `scripts`:
  - `"test": "vitest run"` の追加（現状未定義だったため）。
  - `"deploy": "wrangler pages deploy dist --project-name poke-tool"` の追加。

### ② セキュリティ＆キャッシュヘッダー定義 (`public/_headers`)
Cloudflare Pagesでは `dist/_headers`（`public/_headers` からビルド時に自動コピー）によってHTTPレスポンスヘッダーを指定します。
```http
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp

# 静的アセット（JS/CSS/画像）の長期キャッシュ
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# HTMLドキュメントは常に最新を検証
/*.html
  Cache-Control: public, max-age=0, must-revalidate
```

### ③ Wrangler 設定ファイル (`wrangler.jsonc`)
デプロイ構成をコードとして明示・一元管理します。
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "poke-tool",
  "pages_build_output_dir": "dist",
  "compatibility_date": "2026-09-12"
}
```

---

## 4. 実施手順（ロードマップ）

### フェーズ1: デプロイ用設定の作成とローカル検証
1. `package.json` の更新（プロジェクト名、scripts）
2. `public/_headers` の作成
3. `wrangler.jsonc` の作成
4. ローカルでの全テスト実行 (`npm test`)
5. 本番用ビルドの実行 (`npm run build`)
6. ビルド成果物 (`dist/`) 内のファイル整合性およびヘッダーファイルの存在確認

### フェーズ2: Cloudflare Pages プロジェクトの作成と初回デプロイ
1. Wrangler CLI によるプロジェクト作成:
   ```bash
   wrangler pages project create poke-tool --production-branch main
   ```
2. 本番環境へのデプロイ実行:
   ```bash
   wrangler pages deploy dist --project-name poke-tool
   ```
3. 公開URL (`https://poke-tool.pages.dev`) の取得

### フェーズ3: 公開後の動作検証
1. **画面・主要機能**:
   - ダッシュボード、ステータス絞り込み検索、パーティシミュレータ、努力値計算機が正常に動作するか
2. **多言語切替**:
   - 日・英・韓・繁の4言語が正しく切り替わるか
3. **テーマ切替**:
   - ダークモード/ライトモードの表示・コントラストが維持されているか
4. **リーガルページ**:
   - 利用規約 (`/terms.html`)、プライバシーポリシー (`/privacy.html`)、免責事項 (`/disclaimer.html`) へのアクセスと表示
5. **ヘッダー確認**:
   - レスポンスヘッダー（COOP / COEP / Cache-Control 等）が期待通り適用されているか

---

## 5. リスクと対策
- **リスク1: 外部画像ブロック**:
  - COEP/COOPヘッダーにより外部ドメインの画像がブロックされる可能性。
  - **対策**: ポケモンアイコンやカテゴリ画像等はすべて `public/assets/` にローカルバンドルされているため影響なし。
- **リスク2: プロジェクト名の重複**:
  - Cloudflareアカウント内で同名のプロジェクトが存在するか、または globally unique 制約があるか。
  - **対策**: Cloudflare Pagesのプロジェクト名はアカウント毎の名前空間で管理されるため、アカウント内に重複がなければ問題なく作成可能。
