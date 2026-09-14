# 計画書: OGP画像の作成・配置およびメタタグの埋め込み

## 1. 概要
SNS（X/Twitter、LINE、Discord、Bluesky、Facebook等）で本Webアプリケーション（Poke-Tool）のURLが共有された際に表示されるOGP（Open Graph Protocol）画像を新規作成し、各HTMLページ（ダッシュボード、パーティ編成、努力値計算、ランキング等）へ適切なOGP/Twitter Cardメタタグを埋め込みます。

---

## 2. 要件と設計方針

### 2.1 OGP画像のデザイン仕様
- **寸法・解像度**: 1200 × 630 px（アスペクト比 1.91:1、OGP推奨標準サイズ）
- **ファイル形式**: PNG（`public/ogp.png`）※クローラー互換性100%確保のため
- **ロゴ要素**:
  - `public/favicon.svg` および `AppIcon.tsx` で採用されている公式アプリアイコン（モンスターボール、スパナ＆ソード、データ六角形グリッド、外周グラデーションフレーム）を使用。
  - 左側または中央にシャープかつクッキリと描画。
- **テキスト要素**:
  - メインタイトル: **`poke-tool`**（モダンで視認性の高いボールドタイポグラフィ、ホワイト＋ハイライトアクセント）
  - サブタイトル: **`Pokémon Champions Analytics`**（ツールの目的と性格が伝わるサブコピー）
- **背景色・ダークモード視認性の担保（最重要要件）**:
  - 背景にはアプリのテーマに調和したディープスレート/インディゴ（`#0b0f19` 〜 `#1e1b4b`）を採用。
  - **コントラスト対策**:
    - XやDiscord、LINEの完全な黒背景（#000000）やダークグレー背景（#0f172a / #313338）上でも画像が埋もれないよう、外周に **繊細なインディゴ/スカイブルーの境界線（1.5px ボーダー）** と **ソフトな外周グロー/発光効果** を配置。
    - ライトモード（白背景 #ffffff）でも、ダークモード（黒/暗灰色背景）でも、カードの輪郭が明瞭に認識できる境界設計とします。
    - 中央・ロゴ背後には淡いグラデーション光彩（Cyan/Indigo）を配し、サイバーかつプレミアムな質感を演出。

---

### 2.2 画像生成の手法
- Node.js環境に既存の `sharp` ライブラリを活用したスクリプト `scripts/generate_ogp.ts` を作成。
- 1200×630pxの精密なSVGテンプレートを組み立て、`sharp` を介して高品質なPNG画像（`public/ogp.png`）を出力・保存。
- 静的アセットとして `public/ogp.png` に配置することで、Cloudflare Pages のデプロイ時に即座に全世界へ高速配信。

---

### 2.3 HTMLへのOGPメタタグ埋め込み
以下の各HTMLファイルの `<head>` にOGPおよびTwitter Cardのメタタグを追加します：
- `index.html` (ダッシュボード)
- `party.html` (パーティ編成シミュレーター)
- `ev-calculator.html` (努力値計算ツール)
- `ranking.html` (ステータスランキング)
- `privacy.html`, `terms.html`, `disclaimer.html` (規約・法的ページ)

#### 埋め込みタグの構成例:
```html
<!-- Primary Meta Tags -->
<title>Poke-Tool - Pokémon Champions Analytics</title>
<meta name="title" content="Poke-Tool - Pokémon Champions Analytics" />
<meta name="description" content="ポケモンチャンピオンズ向けのデータ分析・パーティ編成・ステータス努力値計算ツール" />

<!-- Open Graph / Facebook / LINE / Bluesky -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://poke-tool.pages.dev/" />
<meta property="og:title" content="Poke-Tool - Pokémon Champions Analytics" />
<meta property="og:description" content="ポケモンチャンピオンズ向けのデータ分析・パーティ編成・ステータス努力値計算ツール" />
<meta property="og:image" content="https://poke-tool.pages.dev/ogp.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="Poke-Tool" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="https://poke-tool.pages.dev/" />
<meta name="twitter:title" content="Poke-Tool - Pokémon Champions Analytics" />
<meta name="twitter:description" content="ポケモンチャンピオンズ向けのデータ分析・パーティ編成・ステータス努力値計算ツール" />
<meta name="twitter:image" content="https://poke-tool.pages.dev/ogp.png" />
```
※各ページ固有のタイトル（例: `パーティ編成シミュレーター - Poke-Tool` 等）に合わせて、適切なタイトル・説明文を設定します。

---

## 3. 実装ステップとTDD・検証方針

### Step 1: OGP生成スクリプト作成と画像生成
- `scripts/generate_ogp.ts` の作成
- `public/ogp.png` を生成し、解像度・レイアウト・配色・コントラストを目視及びアセット確認。

### Step 2: HTMLテンプレートへのメタタグ反映
- 各HTMLファイルにOGP・Twitter Cardタグを付加。
- 絶対パス URL（`https://poke-tool.pages.dev/ogp.png`）を指定してクローラーでの取得を確実にする。

### Step 3: 単体テストと検証
- メタタグが正しく埋め込まれているかを検証するテストコード（またはHTMLパース検証テスト）を追加。
- `npm test` による既存32テストスイートの全パスを確認。
- `npm run build` で静的出力の整合性を検証。

### Step 4: デプロイと最終確認
- コミット作成
- Cloudflare Pagesへのデプロイ（`npm run deploy`）
