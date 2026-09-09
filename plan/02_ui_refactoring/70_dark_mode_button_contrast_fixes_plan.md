# 計画書: ダークモード時のボタン視認性・コントラスト不具合の調査と改善 (70_dark_mode_button_contrast_fixes_plan.md)

本計画は、ダークモードにおいて文字が背景と同化して読めなくなる、または視認性が著しく低下しているボタンについて、原因の特定と一括改善を行う計画です。

---

## 1. 背景と課題の調査結果

コードベース全体のボタン実装（`<Button>`, `<button>`）およびスタイリングクラスを調査した結果、ダークモードで読めなくなる主な原因として以下のボタン群が特定されました。

### ① `Button.tsx` の `variant="danger"`（削除ボタン等）
- **現在のスタイル**:
  `p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 text-xs`
- **問題点**:
  非ホバー時の文字色（`text-`）が指定されていません。そのため、ダークモード時に親要素やブラウザ既定の文字色（暗い色）のまま暗い背景に乗る場合があり、「削除」ボタンの文字が消えたり読めなくなります。
- **改善案**:
  通常時の文字色として `text-red-600 dark:text-red-400` を明示的に追加します。

### ② `Button.tsx` の `variant="dashed"`（「ポケモンを追加」ボタン）
- **現在のスタイル**:
  `w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-600 rounded-2xl text-slate-500 hover:text-indigo-500`
- **問題点**:
  ダークモードの背景（`dark:bg-slate-950`）に対して、テキストカラーが `text-slate-500` の固定値となっており、`dark:text-` の指定がありません。コントラスト比が低く文字が沈んで読めません。
- **改善案**:
  `text-slate-600 dark:text-slate-300 dark:border-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400` に修正します。

### ③ `PartySimulator.tsx` の「ポケモン名を選択」ボタン（未選択スロット）
- **現在のスタイル**:
  `input-premium`（`dark:bg-slate-950/50`）内に、`<span className="text-sm text-slate-400 dark:text-slate-500 truncate">ポケモン名を選択</span>`
- **問題点**:
  真っ黒に近い背景に対して `dark:text-slate-500` が指定されており、コントラスト不足で「ポケモン名を選択」という文字がほとんど読めません。
- **改善案**:
  `dark:text-slate-400` または `dark:text-slate-300` に明るさを引き上げます。

### ④ `LegalLayout.tsx` の言語切り替えボタン・テーマ切り替えボタン
- **現在のスタイル**:
  `<button className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-sm cursor-pointer font-sans">`
- **問題点**:
  テキストカラーが未指定です。ブラウザのユーザーエージェントスタイル（ボタン既定値: 黒）により、ダークモード（`dark:bg-slate-800`）で黒文字になり「English / 日本語」が読めなくなります。
- **改善案**:
  共通コンポーネント `Button`（`variant="secondary"`）を使用するか、`text-slate-800 dark:text-slate-200` を明示します。

### ⑤ `EvCalculator.tsx` のモーダル内ボタン（キャンセルボタン・パーティ選択ボタン）
- **現在のスタイル**:
  - キャンセルボタン: `bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400`
  - パーティ選択ボタン: `dark:border-slate-855 dark:bg-slate-955/20`（無効なUnoCSSクラス指定あり）
- **問題点**:
  ダークモードでの文字色が暗く、無効なクラス指定も存在します。
- **改善案**:
  キャンセルボタンを `btn-secondary` や `text-slate-700 dark:text-slate-200` に統一し、無効クラスを `dark:border-slate-800 dark:bg-slate-800/40` に修正します。

### ⑥ `StatSearch.tsx` のソートボタンの矢印アイコン
- **現在のスタイル**:
  `<span className="i-lucide-arrow-down text-slate-400/60 dark:text-slate-500/60 text-sm w-4 h-4" />`
- **問題点**:
  ダークモードで透明度60%（`/60`）が適用され、暗いヘッダー背景と同化して矢印が見えません。
- **改善案**:
  `text-slate-400 dark:text-slate-300` に修正し、はっきりと矢印が認識できるようにします。

---

## 2. 改善方針と設計

1. **共通ボタンスタイル (`Button.tsx`) の堅牢化**:
   - `variant="danger"`: 通常時に `text-red-600 dark:text-red-400` を適用。
   - `variant="dashed"`: ダークモード時に `dark:text-slate-300 dark:border-slate-700` を適用。
   - `variant="ghost"`: ホバー時・通常時のコントラストを調整。
2. **各個別画面のボタンスタイルの統一**:
   - 素の `<button>` でテキストカラーが未定義な箇所に `dark:text-slate-200` または適切なクラスを付与。
   - プレースホルダーの薄すぎる文字色を改善。
   - 無効なクラス指定（`slate-855` 等）の解消。

---

## 3. TDD (テスト駆動開発) 計画

### Step 1: テストの作成 (`Button.test.tsx` 等) (Red)
1. `Button.test.tsx` に、`variant="danger"` のレンダリング時に `text-red-600` および `dark:text-red-400` が適用されることを検証するテストを追加。
2. `Button.test.tsx` に、`variant="dashed"` のレンダリング時に `dark:text-slate-300` 等のダークモード文字色が適用されることを検証するテストを追加。
3. テストを実行し、失敗することを確認。

### Step 2: 実装 (Green)
1. `src/components/common/Button.tsx` を修正。
2. `src/components/PartySimulator/PartySimulator.tsx` を修正。
3. `src/components/Legal/LegalLayout.tsx` を修正。
4. `src/components/EvCalculator/EvCalculator.tsx` を修正。
5. `src/components/StatSearch/StatSearch.tsx` を修正。
6. テストを実行し、パスすることを確認。

### Step 3: リファクタリングと全体検証 (Refactor)
1. Biome によるコード整形・リントチェック。
2. Vitest による全テスト実行。
3. プロダクションビルド（`tsc -b && vite build`）での確認。

---

## 4. 検証と実装結果
- **TDD 単体テスト (`Button.test.tsx`)**: `danger` および `dashed` のダークモード文字色検証テストを追加し、9件すべてパス。
- **全体テスト (`vitest`)**: 18ファイル、103件すべてのテストがパス。
- **ビルド検証 (`tsc -b && vite build`)**: エラーなく正常に完了。
- ダークモード時の背景に対してコントラスト不足・文字色未定義だったボタン群の視認性が完全に改善されました。

