# 計画書: 不足している全性格の追加と計算ロジック対応 (82_add_missing_pokemon_natures_plan.md)

本計画は、ユーザーからの要望に基づき、現在13種類しか登録されていない性格定義（`src/utils/party.ts` の `NATURES`）に、「うっかりや」をはじめとする未登録の性格（12種類）を追加し、ポケットモンスター全25種類の性格を完全に網羅・サポートする計画です。

---

## 1. 背景と要件

### ユーザー要望
> 「性格選択のところにうっかりやなどの性格がほしいです。足りない性格を追加してください。」

### 現状分析
- 現在 `src/utils/party.ts` 内の `NATURES` には、対戦で特に使用頻度の高い13種類の性格（いじっぱり、ようき、おくびょう、ひかえめ、ずぶとい、わんぱく、おだやか、しんちょう、れいせい、ゆうかん、のんき、なまいき、まじめ）のみが登録されています。
- 両刀型や特殊アタッカー等で使われる「うっかりや」「おっとり」「せっかち」「むじゃき」「やんちゃ」「さみしがり」などの性格や、その他の無補正性格が不足しています。

---

## 2. 追加する性格の定義（全25種類網羅）

### 2.1. 登録済み（13種類）
- `adamant` (いじっぱり): +攻撃, -特攻
- `jolly` (ようき): +素早さ, -特攻
- `timid` (おくびょう): +素早さ, -攻撃
- `modest` (ひかえめ): +特攻, -攻撃
- `bold` (ずぶとい): +防御, -攻撃
- `impish` (わんぱく): +防御, -特攻
- `calm` (おだやか): +特防, -攻撃
- `careful` (しんちょう): +特防, -特攻
- `quiet` (れいせい): +特攻, -素早さ
- `brave` (ゆうかん): +攻撃, -素早さ
- `relaxed` (のんき): +防御, -素早さ
- `sassy` (なまいき): +特防, -素早さ
- `neutral` (まじめ): 無補正

### 2.2. 新規追加する性格（12種類）
1. **`rash` (うっかりや)**: `plus: 'sp_attack'`, `minus: 'sp_defense'` （★ユーザー指定）
2. **`mild` (おっとり)**: `plus: 'sp_attack'`, `minus: 'defense'`
3. **`hasty` (せっかち)**: `plus: 'speed'`, `minus: 'defense'`
4. **`naive` (むじゃき)**: `plus: 'speed'`, `minus: 'sp_defense'`
5. **`naughty` (やんちゃ)**: `plus: 'attack'`, `minus: 'sp_defense'`
6. **`lonely` (さみしがり)**: `plus: 'attack'`, `minus: 'defense'`
7. **`lax` (のうてんき)**: `plus: 'defense'`, `minus: 'sp_defense'`
8. **`gentle` (おとなしい)**: `plus: 'sp_defense'`, `minus: 'defense'`
9. **`hardy` (がんばりや)**: 無補正
10. **`docile` (すなお)**: 無補正
11. **`bashful` (てれや)**: 無補正
12. **`quirky` (きまぐれ)**: 無補正

---

## 3. 影響範囲と動作確認

### 影響範囲
- `src/utils/party.ts`:
  - `NATURES` 定数の配列（13件 → 25件）
  - `getCalculatedStat`: 補正計算（1.1倍 / 0.9倍 / 1.0倍）は `nat.plus` / `nat.minus` に基づいて自動適用
  - `generatePokesolText`: ポケソルの性格名出力も自動適用
- `src/components/EvCalculator/EvCalculator.tsx`:
  - 性格選択セレクトボックスに自動反映
  - ステータス行の性格補正色（赤/青）および記号（+ / -）に自動反映
- `src/components/PartySimulator/PartySimulator.tsx`:
  - ポケモン個別設定の性格選択セレクトボックスに自動反映
  - 実数値・努力値表示の性格補正色に自動反映

---

## 4. TDD (テスト駆動開発) 実行計画

### Step 1: 単体テストの作成・更新 (`party.test.ts`) (Red)
1. `NATURES` の長さが 25件 であることを検証。
2. 「うっかりや (`rash`)」が存在し、`plus === 'sp_attack'`, `minus === 'sp_defense'` であることを検証。
3. `getCalculatedStat` において、「うっかりや」指定時に特攻が 1.1倍、特防が 0.9倍で計算されることを検証。
4. 全25性格が漏れなく重複なく定義されていることを検証。
5. テストを実行し、未追加による失敗（Red）を確認。

### Step 2: 実装 (`src/utils/party.ts`) (Green)
1. `NATURES` に未定義の12性格を追加。
2. テストを実行し、成功（Green）を確認。

### Step 3: リファクタリングと全体検証 (Refactor)
1. Vitest による全テスト実行。
2. `npm run build` によるビルド確認。
3. Biome によるコード整形とリントチェック。

---

## 5. 実装結果と検証

### 実施内容
- `src/utils/party.ts`:
  - `NATURES` 配列に未定義だった12種類の性格（うっかりや、おっとり、せっかち、むじゃき、やんちゃ、さみしがり、のうてんき、おとなしい、がんばりや、すなお、てれや、きまぐれ）を追加し、全25性格を完全網羅。
  - 各性格の上昇・下降ステータス（`plus` / `minus`）を正確に定義。
  - 「うっかりや (`rash`)」について `plus: 'sp_attack'`, `minus: 'sp_defense'` を設定。
  - `EvCalculator.tsx` および `PartySimulator.tsx` の性格選択肢、ステータス計算、性格補正色（赤/青）、耐久調整、ポケソル出力テキストすべてに連動して正常に動作することを確認。
- `src/utils/party.test.ts`:
  - 全25性格の定義数と重複なし検証、および「うっかりや」指定時の実数値補正（特攻1.1倍、特防0.9倍）を検証する単体テストを追加・パス。
- コード品質と検証:
  - Vitest: 全21ファイル、128テストすべてパス。
  - `npm run build`: 型エラーなく正常完了。
  - Biome フォーマット適用済み。

### 完了ステータス
- **完了 (Completed)**
