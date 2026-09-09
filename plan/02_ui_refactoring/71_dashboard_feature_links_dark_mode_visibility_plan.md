# 計画書: ダッシュボード機能リンクのダークモード視認性改善 (71_dashboard_feature_links_dark_mode_visibility_plan.md)

本計画は、ダッシュボード (`DashboardContent`) における各機能へのリンクカード（実数値ランキング、努力値計算ツール、パーティ編成）がダークモード時に視認性が低下している問題を調査し、テキストコントラストおよびカードUIの視認性を抜本的に改善する計画です。

---

## 1. 背景と課題の調査結果

### 課題の特定
`src/App.tsx` 内の `DashboardContent` コンポーネントにおける3つの機能リンクカード（`<button type="button" onClick={() => setActiveTab(...)}>`）を調査した結果、以下の原因が特定されました：

1. **説明文のテキストコントラスト不足**:
   - 現在: `<p className="text-sm text-slate-500">{t('statSearchDesc')}</p>`
   - `dark:text-` クラスが未指定で、暗いグレー（`text-slate-500`）のまま固定されています。
   - ダークモードの背景（`dark:bg-slate-950` / `dark:bg-slate-900`）に対してコントラスト比が約 2.8:1 しかなく、WCAG基準（推奨 4.5:1）を下回っており、薄暗くて非常に読みにくい状態です。
2. **タイトル文字色の明示指定の欠如**:
   - 現在: `<h3 className="font-semibold mb-2">{t('statSearch')}</h3>`
   - 明示的なテキストカラーが設定されておらず、視認性の強弱がついていません。
3. **カード背景・境界線の視認性**:
   - `card-premium` は `dark:bg-slate-900/30`（透明度70%）と非常に薄く、背景色と同化してカードの輪郭やクリック可能領域が分かりにくくなっています。
4. **リンクとしての誘導性**:
   - 単なるテキストとアイコンの配置にとどまっており、ホバー時の視覚的フィードバックや誘導アイコン（矢印など）が不足しています。

---

## 2. 改善方針と設計

### 2.1. テキストとカードのスタイリング改善
各機能リンクカード（`statSearch`, `evCalculator`, `partySimulator`）を以下のようにリッチかつ高コントラストに刷新します：

1. **説明文 (`p`)**:
   - `text-slate-600 dark:text-slate-300` に変更。
   - ダークモード時でも背景に対して十分な明るさ（`slate-300`）を確保し、スムーズに読めるようにします。
2. **タイトル (`h3`)**:
   - `text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-between` に変更。
3. **アイコンバッジの導入**:
   - アイコンを単体で置くのではなく、角丸コンテナ（`w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center mb-4`）内に配置し、暗所でもシンボルが鮮明に浮かび上がるようにします。
4. **カード背景とボーダー**:
   - `bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/50 dark:hover:border-indigo-500/50`
   - ダークモードでもしっかりとしたカード面として認識できるようにします。
5. **インタラクティブ矢印**:
   - タイトル横またはカード右下に、リンクを示す矢印アイコン（`i-lucide-arrow-right`）を配置し、ホバー時に少し右へスライドするマイクロインタラクションを追加します。

---

## 3. TDD (テスト駆動開発) 計画

### Step 1: テストの作成 (`src/App.test.tsx`) (Red)
1. ダッシュボードの機能リンクカードがレンダリングされた際、説明文に `dark:text-slate-300` 等の高コントラストクラスが適用されていることを検証するテストを作成。
2. タイトルに `dark:text-slate-100` が適用されていることを検証するテストを作成。
3. テストを実行し、失敗することを確認。

### Step 2: 実装 (`src/App.tsx`) (Green)
1. `DashboardContent` のカードUIを新設計に合わせて修正。
2. テストを実行し、パスすることを確認。

### Step 3: 全体検証とリファクタリング (Refactor)
1. `vitest run` で全テストがパスすることを確認。
2. `tsc -b && vite build` でビルドが通ることを確認。
3. Biome によるコード整形とリント確認。

---

## 4. 検証と実装結果
- **TDD 単体テスト (`App.test.tsx`)**: 機能リンクカードの説明文の `dark:text-slate-300` およびタイトルの `dark:text-slate-100` のクラス検証テストを追加し、パスを確認。
- **全体テスト (`vitest`)**: 18ファイル、104件すべてのテストが正常にパス。
- **ビルド検証 (`tsc -b && vite build`)**: エラーなく正常に完了。
- ダークモード時のダッシュボードカードにおいて、アイコンバッジ・高コントラストなタイトル・くっきりとした説明文・リンク矢印が整い、視認性と操作性が劇的に改善されました。

