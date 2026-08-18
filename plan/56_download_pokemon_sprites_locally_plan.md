# ポケモン画像のローカル同梱（完全オフライン化）計画

## 概要
ポケモンのドット絵アイコン画像を GitHub Raw からオンラインで都度取得する方式は、API レートリミット制限（HTTP 429 エラー）に遭遇するリスクが常にあります。プロジェクトの「ローカルファースト」方針を徹底するため、マスターデータに定義されている全ポケモンの画像アセットをローカル（`/public/assets/pokemon-sprites/`）にダウンロードして同梱し、オフライン環境でも動作するように改善します。

---

## 提案する実装アプローチ

### 1. スプライト画像ダウンロードスクリプトの作成
Node.js で動作する使い捨てのダウンロードスクリプト `src/scripts/download_sprites.js` を作成します。
- **仕様**:
  - `src/data/pokemon_master.json` をロードし、全ポケモンの `id` を走査します（約288件）。
  - `public/assets/pokemon-sprites/` フォルダを自動作成し、画像をダウンロードして保存します。
  - すでにローカルに保存されている画像ファイルはスキップします（冪等性・再開の高速化）。
  - レートリミット（429）を回避するため、リクエスト間に 100ms のウェイトを挟み、失敗時には最大3回のリトライ処理（2秒ディレイ）を行います。

### 2. UIコードでの画像パス書き換え
以下の画像パス指定をローカルアセットパスに変更します。
- `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
  ⬇️
- `/assets/pokemon-sprites/${id}.png`

対象ファイル:
- `PartySimulator.tsx` (L300付近)
- `PokemonSearchModal.tsx` (L143付近)
- `StatSearch.tsx` (L332付近)

---

## 開発ロードマップ (TDDの遵守)

### ステップ 1: ダウンロードスクリプトの作成と実行
- `src/scripts/download_sprites.js` を作成します。
- `node src/scripts/download_sprites.js` を実行し、アセットを `public/assets/pokemon-sprites/` に全件保存します。

### ステップ 2: 画像パスの書き換え
- 対象の React コンポーネント（3ファイル）の画像 URL 生成部分を `/assets/pokemon-sprites/${id}.png` へ書き換えます。

### ステップ 3: 動作確認とテストの実行
- `npx vitest run` を走らせて、既存のすべてのテスト（92件）が正常にパスすることを確認します。
- `npm run build` で本番ビルドが正常に完了することを確認します。
