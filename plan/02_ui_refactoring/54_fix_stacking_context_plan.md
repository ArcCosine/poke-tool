# ポケモンスロットのZ-Index重ね順不具合の修正計画

## 概要
パーティ編成画面において、技や持ち物の `Autocomplete` 候補ドロップダウン（`absolute`）を展開した際、次のポケモンのカードスロット（DOM順で下層にレンダリングされている要素）の背後に潜り込んで見えなくなってしまう不具合を修正します。

---

## 提案する実装アプローチ
CSSのスタッキングコンテキスト（Stacking Context）の仕様上、同じ階層に並んでいる `relative` 要素はDOMの記述順が後のものが前面に表示されます。
これを解決するため、各ポケモンのカードスロット（`card-premium relative`）に対し、若いインデックス（上部にあるスロット）ほど `z-index` が高くなるようにインラインスタイルで動的に設定します。

### 修正箇所:
[src/components/PartySimulator/PartySimulator.tsx](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx#L276)
- **修正前**:
  ```tsx
  <div
    key={member.id}
    className="card-premium relative border-l-4 border-l-indigo-500 dark:border-l-indigo-600 p-5 space-y-4"
  >
  ```
- **修正後**:
  ```tsx
  <div
    key={member.id}
    className="card-premium relative border-l-4 border-l-indigo-500 dark:border-l-indigo-600 p-5 space-y-4"
    style={{ zIndex: 10 - index }}
  >
  ```
  これにより、1匹目のスロットが最前面（`z-index: 10`）、2匹目がその下（`z-index: 9`）のように順に重なり、上部スロットで展開されたオートコンプリート候補が下部のスロットの上に重なって正しく表示されるようになります。

---

## 開発ロードマップ (TDDの遵守)

### ステップ 1: 実装の修正
- `PartySimulator.tsx` のカードスロットを生成している `div` に `style={{ zIndex: 10 - index }}` を設定します。

### ステップ 2: 動作確認とテストの実行
- `npx vitest run` を走らせて、既存のすべてのテスト（92件）が正常にパスすることを確認します。
- `npm run build` で本番ビルドに問題がないことを確認します。
