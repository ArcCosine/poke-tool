# 計画書: 努力値計算調整におけるHBD最適配分計算および耐久調整機能の追加 (77_hbd_durability_optimization_plan.md)

本計画は、努力値計算調整ツール（`EvCalculator.tsx`）に、Pokemonote（`https://pokemonote.com/calc-stats`）に準拠した**「耐久指数のリアルタイム表示」および「HBDへの最適配分を計算する耐久調整機能」**を追加する計画です。ユーザー要望に基づき、技構成コンポーネントの直下に配置します。

---

## 1. 背景と要件

### ユーザー要望
> 「https://pokemonote.com/calc-stats このページになる、HBDへの最適配分を計算機能を努力値計算調整に追加してください。技構成コンポーネントの下にボタン類を配置してください。」

### 主要要件
1. **耐久指数のリアルタイム算出と表示**:
   - **物理耐久指数**: $H \times \lfloor B \times \text{防御倍率} \rfloor$
   - **特殊耐久指数**: $H \times \lfloor D \times \text{特防倍率} \rfloor$
   - **総合耐久指数**: 物理耐久指数 + 特殊耐久指数
   - 3桁カンマ区切り（`12,345` 形式）でリアルタイムに表示。
2. **耐久調整パラメータの設定**:
   - **倍率選択**:
     - 防御倍率: `1.0`（等倍）, `1.5`（1.5倍）, `2.0`（2.0倍）（デフォルト: `1.0`）
     - 特防倍率: `1.0`（等倍）, `1.5`（1.5倍）, `2.0`（2.0倍）（デフォルト: `1.0`）
   - **スタイル選択**:
     - `バランス (HBD/(B+D))`（デフォルト）: 指標 $\frac{H \times \text{effB} \times \text{effD}}{\text{effB} + \text{effD}}$ を最大化
     - `総合重視 (H=B+D)`: 指標 $H \times (\text{effB} + \text{effD})$ を最大化
     - ※タイブレーク（総合重視において同スコアかつ同H実数値の場合）：$|\text{effB} - \text{effD}|$ が最小となる配分を選択。
3. **「HBDへの最適配分を計算」実行機能**:
   - 残り利用可能努力値ステップ $R = \max(0, 66 - (\text{Aステップ} + \text{Cステップ} + \text{Sステップ}))$ を計算。
   - $R$ のステップを H, B, D（各ステータス 0〜32 ステップ）に振り分けるすべての組み合わせの中から、指定されたスタイルの評価スコアを最大化する最適な配分 $(h, b, d)$ を瞬時に全探索。
   - 計算された最適努力値（ステップ）を H, B, D の入力値に自動反映。
4. **配置場所**:
   - 努力値計算調整画面の右カラムにある「技構成（Moves）」コンポーネントの直下に配置。
5. **プロジェクトルール遵守 (`AGENTS.md`)**:
   - **換算表示の排除**: 0〜252への換算表示は一切出さず、本ツールのステップ値（0〜32）および実数値のみで完結。
   - **UIアクセシビリティ**: ライト・ダークモード双方で高コントラストを維持（`text-slate-800 dark:text-slate-100`、ラベル `text-slate-700 dark:text-slate-300` など）。
   - **TDD (テスト駆動開発)**: ロジック関数およびコンポーネントの単体テストを先に作成（Red）→ 実装（Green）→ リファクタリング（Refactor）。

---

## 2. アーキテクチャとコンポーネント設計

### 2.1. ロジックモジュール (`src/utils/durability.ts`)
計算ロジックを UI から完全に独立させ、単体テストを容易にします。

```typescript
export interface DurabilityModifier {
  defense: number;   // 1.0, 1.5, 2.0
  spDefense: number; // 1.0, 1.5, 2.0
  style: 'balance' | 'performance';
}

export interface DurabilityIndices {
  physical: number;
  special: number;
  total: number;
}

// 耐久指数の計算
export function calculateDurabilityIndices(
  hp: number,
  defense: number,
  spDefense: number,
  defenseMultiplier = 1,
  spDefenseMultiplier = 1
): DurabilityIndices;

// HBD最適配分の探索
export function optimizeHbdEvs(params: {
  baseStats: { hp: number; defense: number; sp_defense: number };
  nature: string;
  otherEvsTotal: number; // A + C + S のステップ合計
  modifier: DurabilityModifier;
}): { hp: number; defense: number; sp_defense: number };
```

### 2.2. UIコンポーネント (`src/components/EvCalculator/DurabilityOptimizer.tsx`)
技構成コンポーネントの下に配置されるカードコンポーネント。

#### UI構造
```text
┌─────────────────────────────────────────────────────────┐
│ 🛡️ 耐久指数                                            │
│ ┌───────────────┬───────────────┬─────────────────────┐ │
│ │ 物理: 20,470  │ 特殊: 20,470  │ 総合: 40,940        │ │
│ └───────────────┴───────────────┴─────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ ⚙️ 耐久調整                                             │
│                                                         │
│ 倍率:                                                   │
│ [ 防御 1.0 ▼ ]  [ 特防 1.0 ▼ ]                          │
│                                                         │
│ スタイル:                                               │
│ (o) バランス (HBD/(B+D))                                │
│ ( ) 総合重視 (H=B+D)                                    │
│                                                         │
│ [ ✨ HBDへの最適配分を計算 ]                            │
└─────────────────────────────────────────────────────────┘
```

- **共通UIコンポーネントの活用**:
  - `Select` (`src/components/common/Select.tsx`) を倍率選択に使用。
  - `Button` (`src/components/common/Button.tsx`) を最適配分ボタンに使用。
  - スタイル選択にはアクセシブルなラジオボタン／ボタングループを使用。

---

## 3. TDD (テスト駆動開発) 実行計画

### Step 1: ロジックの単体テスト作成 (`src/utils/durability.test.ts`) (Red)
1. `calculateDurabilityIndices`:
   - 実数値 H=200, B=100, D=100, 等倍の場合: 物理 20,000, 特殊 20,000, 総合 40,000。
   - 倍率 1.5 の適用確認: `effB = floor(100 * 1.5) = 150` -> 物理 30,000。
2. `optimizeHbdEvs`:
   - A, C, S が 0（残り66ステップすべてHBDに利用可能）のケース。
   - `balance` スタイルにおける最適な配分結果の検証。
   - `performance` スタイルにおける最適な配分結果およびタイブレークの検証。
   - すでに A+C+S で 50ステップ使っており、残り16ステップしかないケースの検証。

### Step 2: ロジックの実装 (`src/utils/durability.ts`) (Green)
1. `calculateDurabilityIndices` と `optimizeHbdEvs` のロジックを実装。
2. `npx vitest run src/utils/durability.test.ts` を実行し、全テストパスを確認。

### Step 3: UIコンポーネントの単体テスト作成 (`DurabilityOptimizer.test.tsx`) (Red)
1. 耐久指数（物理、特殊、総合）が正しくフォーマット表示されること。
2. 防御・特防の倍率変更、スタイルの選択変更ができること。
3. 「HBDへの最適配分を計算」ボタンを押した際、`onApply` コールバックに最適な H, B, D ステップ値が渡されること。

### Step 4: UIコンポーネントの実装と EvCalculator への統合 (Green)
1. `src/components/EvCalculator/DurabilityOptimizer.tsx` を実装。
2. `src/components/EvCalculator/EvCalculator.tsx` の技構成コンポーネント直下に配置し、現在のポケモン情報・性格・努力値と連携。
3. `EvCalculator.test.tsx` に耐久調整機能との統合テストを追加。
4. 単体テストのパスを確認。

### Step 5: リファクタリングと全体検証 (Refactor)
1. UIコントラスト・ダークモード表示の確認（`text-slate-800 dark:text-slate-100` 等）。
2. 全テストスイート（Vitest）を実行。
3. `npm run build` による TypeScript 型チェックおよびビルド成功を確認。
4. Biome によるコード整形とリントチェック。

---

## 4. 実装結果と検証

### 実施内容
- `src/utils/durability.ts`:
  - 耐久指数計算関数 `calculateDurabilityIndices(hp, defense, spDefense, defenseMultiplier, spDefenseMultiplier)` を実装（物理・特殊・総合の算出）。
  - 最適配分探索関数 `optimizeHbdEvs` を実装。
    - `balance`: $(H \times \text{effB} \times \text{effD}) / (\text{effB} + \text{effD})$ の最大化
    - `performance`: $H \times (\text{effB} + \text{effD})$ の最大化（同点時は $|\text{effB} - \text{effD}|$ が最小となる配分を選択）
    - A, C, S の使用済みステップを差し引いた残り利用可能ステップ（各ステータス最大32、合計最大66）を全探索。
- `src/components/EvCalculator/DurabilityOptimizer.tsx`:
  - 耐久指数のリアルタイムカード表示（3桁カンマ区切り）。
  - 防御・特防の倍率セレクトボックス（1.0 / 1.5 / 2.0）。
  - スタイル切り替えラジオボタン（バランス / 総合重視）。
  - 「HBDへの最適配分を計算」ボタンの実装。
  - アクセシビリティ・ダークモード対応（`text-slate-800 dark:text-slate-100` 等）。
- `src/components/EvCalculator/EvCalculator.tsx`:
  - 技構成（Moves）コンポーネントの直下に `DurabilityOptimizer` を配置。
  - 最適配分結果を `evs` の `hp`, `defense`, `sp_defense` へ即時反映。
- テストと検証:
  - `src/utils/durability.test.ts`: ロジックの単体テスト（全5ケース）パス。
  - `src/components/EvCalculator/DurabilityOptimizer.test.tsx`: UIコンポーネントの単体テスト（全4ケース）パス。
  - `src/components/EvCalculator/EvCalculator.test.tsx`: 統合テストパス。
  - 全体テスト（全21ファイル、124テスト）すべてパス。
  - `npm run build`: 型エラーなく正常完了。
  - Biome フォーマット適用済み。

### 完了ステータス
- **完了 (Completed)**
