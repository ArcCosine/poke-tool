# ポケモンHOME画像差し替え計画 (Plan 61)

## 概要
現在 `poke-tool` 内の各コンポーネントは、ローカルにダウンロードされたポケモンのドット絵画像（`/assets/pokemon-sprites/${id}.png`）を表示しています。
本計画では、この画像を「Pokémon HOME」仕様の高精細な3Dモデル画像に差し替えます。
UIコードやテストコードはローカルパス `/assets/pokemon-sprites/${id}.png` を参照しているため、画像ファイル自体を置き換えるアプローチをとることで、ソースコードの書き換えなしに表示を更新します。

---

## 提案する実装アプローチ

### 1. ダウンロードスクリプトの修正
`src/scripts/download_sprites.js` および `src/scripts/download_sprites.cjs` 内で定義されているダウンロード元URLを変更します。

- **旧URL**:
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png` (ドット絵)
- **新URL**:
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png` (Pokémon HOME高精細画像)

### 2. 既存のドット絵アセットのクリーンアップ
新しい高精細画像を確実に保存するため、既存の `public/assets/pokemon-sprites/` フォルダの中身を一時的にクリア（削除）します。

### 3. ダウンロードスクリプトの実行
クリーンアップしたフォルダに対して、修正したスクリプトを実行して新しい高精細画像（全約288件）を再取得します。
- `node src/scripts/download_sprites.js`

---

## 開発ロードマップ (TDDの遵守)

### ステップ 1: ダウンロードスクリプトの修正
- `src/scripts/download_sprites.js` の URL 定義箇所を `other/home/` に書き換えます。
- 同様に `src/scripts/download_sprites.cjs` の URL 定義箇所も書き換えます。

### ステップ 2: 既存画像のクリーンアップ
- `public/assets/pokemon-sprites/` 内の既存の画像を削除します（新しい高精細画像とドット絵が混ざるのを防ぐため）。

### ステップ 3: ダウンロードの実行
- ターミナルで `node src/scripts/download_sprites.js` を実行し、全ポケモンのHOME画像（512x512pxの透過PNG）をダウンロードします。

### ステップ 4: 動作検証とテスト
- `npx vitest run` を実行し、既存のテスト（92件前後）がすべて Green でパスすることを確認します（画像アセットの切り替えのみのため、テストに影響はない見込みです）。
- アプリケーションを `npm run dev` でローカル起動し、UI上でアイコンが高精細画像に切り替わっていることを確認します。
