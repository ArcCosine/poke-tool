# 計画書: 削除ボタンの背景色・視認性改善 (79_danger_button_contrast_and_visibility_plan.md)

本計画は、共通UIコンポーネントである削除ボタン（`Button.tsx` の `danger` バリアント）において、通常モード・ダークモード双方で背景色および境界線の視認性が低く背景と同化している問題を解消し、十分なコントラストと危険色としての明瞭な視認性を確保する計画です。

---

## 1. 背景と課題分析

### ユーザー要望
> 「削除ボタンの背景色の視認性が悪いです（通常モード、ダークモード共に）。背景色を調整してください。」

### 現状のスタイリングと問題点
現在 `src/components/common/Button.tsx` の `danger` バリアントは以下のクラスが適用されています：
```tsx
case 'danger':
  variantStyle =
    'p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 text-xs';
  break;
```

#### 問題点
1. **通常モード（ライトモード）での視認性不足**:
   - 背景色に `bg-white/50`（半透明の白）、ボーダーに `border-slate-200`（薄いグレー）が使われているため、カード背景や白背景の上でボタンの輪郭と面が同化してしまい、ボタンの存在が認識しにくい。
2. **ダークモードでの視認性不足**:
   - 背景色に `dark:bg-slate-900/50`、ボーダーに `dark:border-slate-800` が使われているため、ダークモードの暗いカード背景と同化してボタンの境界が見えず、文字（`text-red-400`）だけが浮いて見える。
3. **セカンダリボタンとの対比**:
   - 隣接する「新規作成」「クリップボードにコピー」等のセカンダリボタンは `bg-slate-200 dark:bg-slate-800` とソリッドな背景色を持っており、削除ボタンだけが半透明で引っ込んだ印象になっている。

---

## 2. 改善方針とスタイル設計

### 2.1. スタイル定義
削除・危険アクション（Danger）として明確に認識できるよう、赤系統の面（背景色）と境界線（ボーダー）をしっかり持たせます。

| モード | 背景色 | ボーダー色 | テキスト色 |
| :--- | :--- | :--- | :--- |
| **通常モード (Light)** | `bg-red-100 hover:bg-red-200` | `border-red-300 hover:border-red-400` | `text-red-700 hover:text-red-800` |
| **ダークモード (Dark)** | `dark:bg-red-950/60 dark:hover:bg-red-900/70` | `dark:border-red-800 dark:hover:border-red-700` | `dark:text-red-300 dark:hover:text-red-200` |

- **効果**:
  - 通常モード: 薄い赤（`bg-red-100`）の背景と明確な赤ボーダー（`border-red-300`）、濃い赤文字（`text-red-700`）により、白背景やカード上ではっきりとボタンの面と境界が認識できる。
  - ダークモード: 深みのある赤（`dark:bg-red-950/60`）の背景と赤ボーダー（`dark:border-red-800`）、明るい赤文字（`dark:text-red-300`）により、暗い背景上でもボタンの面と境界がくっきりと浮かび上がる。
  - ホバー時: 背景色とボーダーが一段濃くなり、自然なフィードバックを提供。

---

## 3. TDD (テスト駆動開発) 実行計画

### Step 1: 単体テスト更新・追加 (`src/components/common/Button.test.tsx`) (Red)
1. `Button` の `variant="danger"` をレンダリングした際、新しい視認性クラス（`bg-red-100`, `dark:bg-red-950/60`, `border-red-300`, `dark:border-red-800` など）が含まれていることを検証するテストを追加。
2. テストを実行し、古いスタイルによる不一致で失敗（Red）することを確認。

### Step 2: 実装 (`src/components/common/Button.tsx`) (Green)
1. `Button.tsx` の `danger` バリアント定義を新しい視認性スタイルに更新。
2. `Button.test.tsx` を実行し、合格（Green）を確認。

### Step 3: 全体検証とリファクタリング (Refactor)
1. `PartySimulator.tsx` 上のパーティ削除ボタンおよび各ポケモンスロットの削除ボタンの表示確認。
2. Vitest による全テスト実行（全125テストパス確認）。
3. `npm run build` によるビルド確認。
4. Biome によるコード整形とリントチェック。

---

## 4. 実装結果と検証

### 実施内容
- `src/components/common/Button.tsx`:
  - `danger` バリアントのスタイルを、通常モード・ダークモード双方で高コントラストな赤系統の面・境界線・テキストに刷新：
    - 通常モード: `bg-red-100 hover:bg-red-200 border-red-300 hover:border-red-400 text-red-700 hover:text-red-800`
    - ダークモード: `dark:bg-red-950/60 dark:hover:bg-red-900/70 dark:border-red-800 dark:hover:border-red-700 dark:text-red-300 dark:hover:text-red-200`
  - 白背景や暗いカード背景の上でもボタンの面と境界線が一目で認識できるようになり、危険アクションとしての視認性が大幅に向上。
- `src/components/common/Button.test.tsx`:
  - `danger` バリアントにおける新スタイルの各クラス（背景色・ボーダー・文字色）を検証する単体テストを追加・更新。
- コード品質と検証:
  - Vitest: 全21ファイル、125テストすべてパス。
  - `npm run build`: 型エラーなく正常完了。
  - Biome フォーマット適用済み。

### 完了ステータス
- **完了 (Completed)**
