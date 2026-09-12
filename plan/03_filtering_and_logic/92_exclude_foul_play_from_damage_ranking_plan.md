# 計画書: 火力ランキングにおける「イカサマ」の除外対応 (92_exclude_foul_play_from_damage_ranking_plan.md)

本計画は、火力ランキング（`calculateMaxDamage` / `StatSearch.tsx`）において、相手のこうげき実数値を参照してダメージ計算を行う特殊な仕様を持つ技「イカサマ（Foul Play）」を、ランキング算出対象から特別に除外する修正をTDD（テスト駆動開発）に基づいて実施する計画です。

---

## 1. 背景と目的

### 1.1. 課題
- 技「イカサマ（ID: 492 / 威力: 95 / 物理 / あくタイプ）」は、ポケモンの実際のダメージ計算において自身の攻撃力ではなく「相手のこうげき実数値」を参照する特殊な仕様を持っています。
- 現在の火力ランキング（`calculateMaxDamage`）では、自身の攻撃力（A特化時実数値）に基づいて火力指数（実数値 × 威力 × タイプ一致・特性倍率）を算出しているため、フーディンやキュウコンなど物理攻撃力が低い特殊アタッカーや耐久ポケモンがイカサマによって上位にランクインしてしまうなどの不自然な現象が生じていました。
- ユーザーより「火力ランキングにて、イカサマは特殊な計算をするので、特別に除外するようにしてください」との要望を受け、火力ランキングの計算対象から除外します。

### 1.2. 影響範囲
- **火力ランキング (`calculateMaxDamage` / `StatSearch.tsx`)**:
  - イカサマ（ID: 492）を最大火力の算出対象から除外。
- **パーティシミュレータ (`PartySimulator.tsx`) / 努力値計算機 (`EvCalculator.tsx`)**:
  - ポケモン構築時の技選択ドロップダウン（`learnable_moves`）には影響せず、引き続き技として「イカサマ」を自由に登録・選択可能。

---

## 2. 改善方針と修正設計

### 2.1. 火力計算ロジックの修正 (`src/utils/calculator.ts`)
- `calculateMaxDamage` 内で技を走査する際、ステータス技（`m.category === 'status'`）に加え、技IDが `492`（または名称が「イカサマ」「Foul Play」）の技をスキップ（除外）する。
```ts
// Exclude status moves and special calculation moves like Foul Play (ID: 492)
if (m.category === 'status' || m.id === 492) continue;
```

---

## 3. TDD 実行計画

### Step 1: テスト作成（Red）
1. `src/utils/calculator.test.ts` に以下のテストを追加：
   - イカサマ（ID: 492）を覚えるポケモン（例: ブラッキーやキュウコンなど）において、`calculateMaxDamage` の結果に「イカサマ」が含まれないことを検証する単体テスト。
2. テストを実行し、現在はイカサマが含まれているため失敗（Red）することを確認。

### Step 2: 実装（Green）
1. `src/utils/calculator.ts` の `calculateMaxDamage` に除外条件を追加。
2. テストを実行し、テストが成功（Green）することを確認。

### Step 3: リファクタリングと本番デプロイ検証（Refactor）
1. Biome によるコード整形とリントチェック。
2. `npm test` による全テストスイートの通過確認。
3. `npm run build` によるビルド正常確認。
4. Cloudflare Pages への再デプロイ（`npm run deploy`）を実施。
5. 本番環境での表示確認。

---

## 4. 実装結果と検証

### 実施内容
- `src/utils/calculator.ts`:
  - `calculateMaxDamage` 内でステータス技に加え、「イカサマ（ID: 492）」をスキップ・除外する判定を追加。
- `src/utils/calculator.test.ts`:
  - イカサマを覚えるポケモン（ブラッキー等）において、`calculateMaxDamage` の返却リストに「イカサマ」が含まれず他の攻撃技が選択されることを検証する単体テストを追加・パス。
- テスト・ビルド・デプロイ:
  - 全23テストスイート、149テストすべてパス。
  - Biome フォーマット適用済み。
  - `npm run build` 成功。
  - Cloudflare Pages への本番デプロイ完了（`https://poke-tool.pages.dev`）。

### 完了ステータス
- **完了 (Completed)**

