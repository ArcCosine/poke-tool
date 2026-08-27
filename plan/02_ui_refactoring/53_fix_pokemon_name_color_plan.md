# ポケモン名選択トリガーの文字色修正計画

## 概要
パーティ編成画面において、選択されたポケモンの名前のテキストカラーが `text-slate-800`（ほぼ黒）になっており、背景色（`bg-slate-900/50`）とのコントラストが低く見づらくなっています。他の入力フィールド（`input-premium`）の文字色（`text-slate-200`）と統一し、明るい白（または白に近い灰色）に変更します。

---

## 提案する実装アプローチ
`PartySimulator.tsx` 内のポケモン名表示部分の `className` を修正します。

### 修正箇所:
[src/components/PartySimulator/PartySimulator.tsx](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx#L345)
- **修正前**:
  ```tsx
  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
    {currentPoke.name[language]}
  </span>
  ```
- **修正後**:
  ```tsx
  <span className="text-sm font-semibold text-slate-200 truncate">
    {currentPoke.name[language]}
  </span>
  ```
  （`input-premium` クラスが指定されている入力コントロール全体の文字色 `text-slate-200` と同一に統一します）

---

## 開発ロードマップ (TDDの遵守)

### ステップ 1: 実装の修正
- `PartySimulator.tsx` の該当行の文字色クラスを修正します。

### ステップ 2: 動作確認とテストの実行
- `npx vitest run` を走らせて、テストに影響がないことを確認します。
- `npm run build` でビルドにエラーがないことを確認します。
