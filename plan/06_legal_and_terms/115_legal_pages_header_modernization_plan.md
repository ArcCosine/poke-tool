# 115. 法的ページ（プライバシーポリシー・免責事項・利用規約）ヘッダーの最新共通ヘッダーへの刷新計画

## 1. 概要と背景
現在、法的ページ（プライバシーポリシー `/privacy.html`、免責事項 `/disclaimer.html`、利用規約 `/terms.html`）で使用されている `LegalLayout.tsx` のヘッダーが旧仕様のままであり、メインツール群（ダッシュボード、ステータス計算、努力値計算、パーティ構築、パーティランキング）で使用されている最新ヘッダーとデザイン・機能に乖離が生じている。

### 現状と最新仕様の差異
| 項目 | 旧ヘッダー (`LegalLayout.tsx`) | 最新ヘッダー (`Layout.tsx`) |
| :--- | :--- | :--- |
| **ロゴ・アイコン** | `i-lucide-sword`（剣アイコン） | `AppIcon`（モンスターボール型公式アイコン） |
| **アプリタイトル** | 通常のプレーンテキスト | グラデーションテキスト (`bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600`) |
| **リンク先** | `<button onClick={() => window.location.href = '/'}>` | `<a href="/index.html">` |
| **認証ボタン** | なし | `<AuthButton />`（ログイン/アバター/ログアウト） |
| **言語セレクタ** | `<LanguageSelector />` | `<LanguageSelector />` |
| **テーマ切替** | 素の `<button>` | 共通コンポーネント `<Button variant="secondary">` |
| **ナビゲーション** | なし | ボトムナビゲーションバー（全画面共通） |
| **フッターリンク** | なし | 法的ページ相互リンクフッター |

---

## 2. 改修方針と設計詳細

### A. 共通レイアウトコンポーネントの再利用 (DRY原則・UI抽象化)
- `src/components/common/Layout.tsx` の `PageId` 型に `'legal'` を追加（またはオプショナル化）。
  - `activePage="legal"` の場合、ボトムナビゲーションの特定タブをアクティブ化せず、全リンクが中立表示される。
- `src/components/Legal/LegalLayout.tsx` を `Layout.tsx` を活用する構成へリファクタリング。
  - `<AppProvider>` および `<AuthProvider>` でラップし、`<Layout activePage="legal">{children}</Layout>` を描画。
  - これにより、ヘッダーの重複実装を完全撤廃し、将来的なヘッダー改修時も自動で法的ページに最新UIが反映される。

### B. 認証およびアクセシビリティの統一
- 法的ページ内でもログイン状態（`AuthButton`）が表示・操作可能となり、ユーザー体験の一貫性を確保。
- ダークモード時のコントラスト比およびタッチターゲットサイズもメイン画面と完全統一。

---

## 3. TDD (テスト駆動開発) と実装ステップ

### Step 1: 単体テストの作成・改修 (Red)
- `src/components/common/Layout.test.tsx`:
  - `activePage="legal"` を渡した場合でもエラーなく描画され、最新ヘッダー（ロゴ、AuthButton、LanguageSelector、テーマ切替）が存在することのテスト。
- `src/components/Legal/LegalPages.test.tsx`:
  - 最新のヘッダー要素（`AppIcon`、`Poke-Tool`、`AuthButton`、テーマ切替）が `LegalLayout` 経由で正常に描画されることのテスト。

### Step 2: 実装 (Green)
- `src/components/common/Layout.tsx`:
  - `PageId` に `'legal'` を追加。
- `src/components/Legal/LegalLayout.tsx`:
  - `<AuthProvider>` と `<Layout activePage="legal">` を用いた構成に刷新。

### Step 3: 全体検証とビルド (Refactor)
- `npm test`（全47テストスイート・270+テストすべてパス）。
- `npm run build` による本番ビルドの成功確認。

### Step 4: 本番デプロイと確認
- Cloudflare Pages へのデプロイ。
- `/privacy.html`, `/disclaimer.html`, `/terms.html` にて最新ヘッダーが表示されることを確認。
