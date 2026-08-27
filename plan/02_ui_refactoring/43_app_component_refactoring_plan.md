# App.tsx 共通コンポーネント反映計画

## 概要
[src/App.tsx](file:///home/arccosine/poke-tool/src/App.tsx) 内で使用されている素の `<button>` 要素を、`src/components/common/Button.tsx` の共通 `Button` コンポーネントに置き換えます。これにより、UIパーツの抽象化を一貫させ、全体の保守性を向上させます。

---

## 置き換え対象の箇所

1. **ダッシュボードのカードボタン**
   - 対象: `DashboardContent` 内の3つのタブ切替ボタン。
   - `variant` を使用せずに `className` でカード風のスタイル（`card-premium hover:border-indigo-500/50 text-left ...`）を渡し、`Button` を適用します。

2. **ヘッダー内のボタン**
   - ロゴ（Poke-Tool）ボタン: 共通 `Button` に置き換えます。
   - 言語切替（Language Toggle）ボタン: 共通 `Button` に置き換え、アイコンも指定可能な形式へ適用します。
   - テーマ切替（Theme Toggle）ボタン: 共通 `Button` に置き換えます。

3. **下部ナビゲーションバーのボタン**
   - 各タブの切替ボタン: 共通 `Button` に置き換えます。

---

## 開発ロードマップ (TDDの遵守)

すでに `Button` コンポーネントおよびそのテストコードは完成しているため、今回は以下の手順で適用・検証を行います。

### ステップ 1: インポートの追加と置き換え
- `src/App.tsx` に `import { Button } from './components/common/Button';` を追加。
- 各対象ボタンを `Button` へ置き換えます。
- 独自のレイアウトやUnoCSSクラスを維持しつつ、共通 `Button` の `baseStyle` とマージされるように `className` を適切に受け渡します。

### ステップ 2: 動作検証とテスト実行
- `npx vitest run` を実行し、既存のテスト（特に `App.test.tsx`）がすべて正常に動作することを確認します。
- `npm run build` を実行し、コンパイルエラーなどがないことを確認します。
