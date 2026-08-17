# 計画：パーティシミュレーターのUI調整（タイプ表記のアイコン化、コピーテキスト修正、ポケモンアイコンの表示、持ち物入力幅調整）

## 概要
パーティシミュレーターの利便性と視認性を高めるため、以下のUI変更・不具合調整を実施します。

1. **ポケモンスロット内のタイプ表記のアイコン化**
   - 火力ランキング（`StatSearch`）と同様の形式（アイコン画像 ＋ テキストラベル）に変更。
2. **コピーボタンのテキスト変更**
   - 「ポケソル形式でコピー」から「クリップボードにコピー」に変更。
3. **ポケモン選択モーダルへのアイコン表示**
   - リストアイテムの左側に PokeAPI ホスティングのドット絵アイコン（`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`）を表示。
4. **選択後のスロットへのポケモンアイコン表示**
   - 選択されたポケモンの名前の横/上に同様のドット絵アイコンを表示。
5. **持ち物入力フィールドの幅調整**
   - グリッドからはみ出さないよう、入力要素に `w-full` を適用して横幅を適切にフィットさせます。

---

## 要件定義と詳細設計

### 1. タイプ表記のアイコン＋テキスト化
- [`PartySimulator.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx) 内の選択されたポケモンのタイプ表示部分から背景色バッジを廃止し、`/assets/type-icons/{typeKey}.svg` を用いた横並び表示にします。

### 2. コピーテキストの修正
- 「ポケソル形式でコピー」および「コピーしました！」というテキストを「クリップボードにコピー」および「コピーしました！」に変更します。

### 3. ポケモン選択モーダルでのアイコン表示
- [`PokemonSearchModal.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PokemonSearchModal.tsx) のリストアイテム内に画像要素を追加します。
- `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{pokeId}.png` を取得。
- 画像取得エラー（`onError`）の際は `style.display = 'none'` を施すことで、フォールバックを行います。

### 4. 選択後のポケモンスロットでのアイコン表示
- [`PartySimulator.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx) のポケモン選択トリガーボタン（またはカード）の中にドット絵画像を組み込みます。

### 5. 持ち物入力フィールドの幅調整
- 持ち物の `input` 要素に `w-full` クラスを追加して、グリッドの列幅に自動フィットさせます。

---

## 開発ロードマップ (TDDステップ)

### Step 1: テストコードの作成・修正 (Red)
1. `PartySimulator.test.tsx` のコピーボタンに関するテストやボタンテキストの変更に合わせてアサーションを更新。
2. ポケモン選択トリガー、および検索モーダル内にドット絵画像（PokeAPI URLを含むもの）が存在することを検証するアサーションを追加。

### Step 2: 実装 (Green)
1. [`PokemonSearchModal.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PokemonSearchModal.tsx) でリストに `<img>` タグを追加。
2. [`PartySimulator.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx) で：
   - タイプバッジのアイコン＋テキスト化。
   - 選択トリガー内に `<img>` タグを追加。
   - コピーボタンのテキスト変更。
   - 持ち物入力フィールドの `className` に `w-full` を追加。

### Step 3: リファクタリング & ビルド確認 (Refactor)
1. スタイリング（余白やサイズ調整）を美しく整えます。
2. `npm run build` を実行して、ビルドに失敗しないことを確認します。
