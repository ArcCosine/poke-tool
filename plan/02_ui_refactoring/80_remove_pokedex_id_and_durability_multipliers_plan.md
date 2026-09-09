# 計画書: ポケモン番号の非表示化および耐久指数の倍率選択UI削除 (80_remove_pokedex_id_and_durability_multipliers_plan.md)

本計画は、ユーザーからのフィードバックに基づき、以下の2点のUI簡素化・改善を行う計画です：
1. ポケモン選択モーダル（`PokemonSearchModal.tsx`）において、ポケモンの名前の前にある「ポケモン番号（例: `#149`）」を非表示にする。
2. 努力値調整の耐久指数コンポーネント（`DurabilityOptimizer.tsx`）において、「防御倍率」「特防倍率」の選択UIを削除し、常に等倍（1.0倍）として計算をシンプル化する。

---

## 1. 背景と要件

### ユーザー要望
> 「ポケモン選択画面のポケモンの名前の前にある、ポケモン番号は消してください。
> また、努力値調整の耐久指数で、防御倍率、特防倍率の選択部分は機能として使いそうにないので削除してください。」

### 変更箇所の詳細

#### 1. ポケモン選択画面のポケモン番号非表示化
- **対象ファイル**: `src/components/PartySimulator/PokemonSearchModal.tsx`
- **内容**:
  - ポケモン一覧の各アイテム内で、ポケモン名（`{poke.name[language]}`）の直前にある `<span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">#{poke.id}</span>` を削除。
  - アイコン画像とポケモン名、タイプバッジのみのクリーンな表示とする。

#### 2. 耐久指数・調整における倍率選択部分の削除
- **対象ファイル**: `src/components/EvCalculator/DurabilityOptimizer.tsx`
- **内容**:
  - 防御倍率・特防倍率のドロップダウン（`Select`）を削除。
  - 耐久指数（物理・特殊・総合）および最適配分計算は、等倍（`defense: 1.0`, `spDefense: 1.0`）固定で実行。
  - 耐久調整セクションは「スタイル（バランス / 総合重視）」の選択と「HBDへの最適配分を計算」ボタンのみのシンプルなUIとする。

---

## 2. コンポーネント設計

### 2.1. `PokemonSearchModal.tsx`
```tsx
{/* 変更前 */}
<div className="flex items-center gap-1.5 flex-wrap">
  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
    #{poke.id}
  </span>
  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
    {poke.name[language]}
  </span>
</div>

{/* 変更後 */}
<div className="flex items-center gap-1.5 flex-wrap">
  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
    {poke.name[language]}
  </span>
</div>
```

### 2.2. `DurabilityOptimizer.tsx`
- 倍率選択用 state（`modifier.defense`, `modifier.spDefense`）の可変操作を撤廃し、定数 `1.0` または `style` のみの state に整理。
- UIから「防御倍率」「特防倍率」の `Select` 要素を削除。
- 耐久調整セクションの構造：
  - タイトル: `耐久調整`
  - スタイル選択: `バランス (HBD/(B+D))` / `総合重視 (H=B+D)`
  - アクション: `HBDへの最適配分を計算` ボタン

---

## 3. TDD (テスト駆動開発) 実行計画

### Step 1: 単体テストの更新 (Red)
1. `src/components/PartySimulator/PokemonSearchModal.test.tsx`:
   - `#149` が表示されないこと（`expect(screen.queryByText(/#\d+/)).toBeNull()`）を検証。
2. `src/components/EvCalculator/DurabilityOptimizer.test.tsx`:
   - 防御倍率・特防倍率の選択要素が存在しないこと（`queryByLabelText(/防御倍率/i)` が null）を検証。
   - 等倍前提で耐久指数が正しく計算・表示されることを検証。
3. テストを実行し、既存コードとの差異で失敗（Red）することを確認。

### Step 2: 実装 (Green)
1. `PokemonSearchModal.tsx` から `#{poke.id}` のレンダリングを削除。
2. `DurabilityOptimizer.tsx` から倍率選択 UI を削除し、等倍固定で計算。
3. テストを実行し、成功（Green）を確認。

### Step 3: リファクタリングと全体検証 (Refactor)
1. Vitest による全テスト実行。
2. `npm run build` によるビルド確認。
3. Biome によるコード整形とリントチェック。

---

## 4. 実装結果と検証

### 実施内容
1. **ポケモン選択モーダルにおけるポケモン番号の非表示化**:
   - `src/components/PartySimulator/PokemonSearchModal.tsx`:
     - ポケモン名の前にあった `#{poke.id}` を削除し、アイコン、ポケモン名、特性、タイプバッジのみのシンプルなレイアウトに変更。
   - `src/components/PartySimulator/PokemonSearchModal.test.tsx`:
     - ポケモン番号が非表示であること（`queryByText(/#\d+/) === null`）を検証する単体テストに更新・パス。
2. **耐久調整における倍率選択UIの削除**:
   - `src/components/EvCalculator/DurabilityOptimizer.tsx`:
     - 防御倍率・特防倍率の選択用 `Select` 要素および可変倍率 state を削除。
     - 耐久指数（物理・特殊・総合）および HBD 最適配分探索を等倍（1.0倍）固定でシンプルに計算。
     - 耐久調整エリアを「スタイル選択（バランス / 総合重視）」と「HBDへの最適配分を計算」ボタンのみのクリーンなUIに変更。
   - `src/components/EvCalculator/DurabilityOptimizer.test.tsx`:
     - 倍率選択UIが存在しないこと（`queryByLabelText` が null）を検証する単体テストに更新・パス。
3. **コード品質と検証**:
   - Vitest: 全21ファイル、125テストすべてパス。
   - `npm run build`: 型エラーなく正常完了。
   - Biome フォーマット適用済み。

### 完了ステータス
- **完了 (Completed)**
