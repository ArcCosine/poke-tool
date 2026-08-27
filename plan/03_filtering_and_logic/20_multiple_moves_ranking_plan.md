# 20_1ポケモンあたり上位6技の火力ランキング表示計画

本計画は、火力ランキングにおいて、各ポケモンが習得する技の中からダメージ指数の高い「上位6技」を算出してテーブル内に並べて表示する手順を定義します。

---

## 1. 実装要件

* **ロジックの修正**:
  * 現在、最大火力計算ロジック（`calculateMaxDamage`）は、最も火力の高い「1つの技」のみを返しています。
  * これを、習得可能なすべての技についてダメージ指数を計算し、降順でソートした**「上位6技」のリスト（配列）**を返すように拡張します。
* **UIの修正**:
  * ランキングテーブルの「使用技」カラムに、上位6つの技を縦にリスト表示します。
  * 各技の表示には、分類カラー丸印、技名、分類テキスト `(物理)` / `(特殊)`、およびその技を繰り出した際の**個別ダメージ指数**を含めます。
  * テーブルの右端の「指数」カラムには、上位6つのうち最も高い「最大火力（1位の技の指数）」を表示し、ソート順の基準とします。
* **わざタイプフィルターの連動**:
  * わざのタイプでフィルタリング（例: 「ほのお」技で絞り込み）した際、**上位6技の中に指定されたタイプの技が含まれているポケモン**を絞り込み対象とします。
  * テーブル内では、そのポケモンの上位6技のうち**指定されたタイプに合致する技のみ**を抽出してリスト表示します（わざタイプが「すべて」のときは、上位6技すべてを表示します）。

---

## 2. 設計詳細

### (1) 火力計算ロジックの変更 (`src/utils/calculator.ts` および `src/utils/calculator.test.ts`)

#### ① `calculateMaxDamage` の戻り値の型変更
```typescript
export interface MaxDamageMoveInfo {
  value: number;
  moveName: { ja: string; en: string };
  category: string;
  moveType: string;
  abilityName: { ja: string; en: string };
}

export function calculateMaxDamage(
  pokemon: PokemonMaster,
  moves: MoveMaster[]
): MaxDamageMoveInfo[]
```

#### ② ソートとスライス
* 各（特性 × 技）の組み合わせについて、重複しない一意の技ごとに最大ダメージとなる組み合わせを計算します（同じ技で複数の特性が適用可能な場合、最も火力が高い特性のみを残します）。
* 算出したすべての技のダメージ情報を、ダメージ指数の降順でソートします。
* ソート後の配列から `.slice(0, 6)` で上位最大6件を抽出して返します。

#### ③ テストの更新 (TDD)
* `calculator.test.ts` 内の `calculateMaxDamage` に関連するテストケースを、配列を受け取る形に変更します。
* 戻り値の `[0]` （1位の技）が従来通りの最大値になっていること、および `[1]` などの後続の技も正しく降順で含まれていることを検証するテストケースを追加します。

### (2) UIコンポーネントの修正 (`src/components/StatSearch/StatSearch.tsx`)

#### ① `RankingItem` の型変更
```typescript
interface RankingItem {
  rank: number;
  pokemon: PokemonMaster;
  value: number; // 代表値（最大火力）
  moves: MaxDamageMoveInfo[]; // 上位6技のリスト
}
```

#### ② フィルタリングロジックの修正
* **わざタイプフィルター (`selectedMoveType`)**:
  * 検索対象が最大火力のとき、`selectedMoveType !== 'all'` ならば、ポケモンの上位6技のうち `moveType === selectedMoveType` となる技だけを抽出し、その該当技が1つ以上存在するポケモンのみを表示対象とします。

#### ③ レンダリングの修正
* 使用技のテーブルセル内にて、各技情報を `map` でループし、縦にコンパクトに並べます。
  * 表示項目: `分類丸印` + `技名` + `(物理/特殊)` + `[個別のダメージ指数]`
  * 例: `● シザークロス (物理) - 36,000`

---

## 3. 開発および検証ステップ (TDDの遵守)

### ステップ 1: 計画の合意
* 本計画についてユーザーと合意します。

### ステップ 2: 単体テストの修正（Red）
* `src/utils/calculator.test.ts` を修正し、`calculateMaxDamage` の戻り値が配列であること、および上位の複数の技が含まれていることをアサートするテストを記述します（テストが一時的にコンパイルエラーまたは失敗することを確認）。

### ステップ 3: 計算ロジックの実装（Green）
* `src/utils/calculator.ts` の `calculateMaxDamage` を修正し、重複排除、ソート、スライスを行い、配列を返すように実装します。
* `npx vitest run` を実行し、すべてのテストがパスすることを確認します。

### ステップ 4: UIの修正
* `src/components/StatSearch/StatSearch.tsx` の `RankingItem` 定義、フィルタリングロジック、およびテーブルレンダリングを修正します。

### ステップ 5: ビルドおよび動作確認
* `npm run build` でビルドが正常に通ることを確認します。
* ブラウザで最大火力ランキングを確認し、各ポケモンの行に最大6つの高火力技が指数とともに綺麗に並んでいること、およびわざタイプでの絞り込みが期待通りに機能することを確認します。

---

## 4. 実行結果 (2026-08-15 完了)

ユーザーの合意のもと、以下の通り実施しました：

1. **テストコードの修正 (TDDの遵守)**:
   * [`src/utils/calculator.test.ts`](file:///home/arccosine/poke-tool/src/utils/calculator.test.ts) にて、`calculateMaxDamage` のテストアサーションを、戻り値の配列インデックス `[0]` を検証する形式へと更新しました。
   * 新たに `should return up to 6 moves sorted by damage descending` テストケースを追加し、最大6つの技がダメージ指数の降順で正しく取得できることを検証しました。テストが一時的に失敗（Red）することを確認しました。
2. **計算ロジックの修正**:
   * [`src/utils/calculator.ts`](file:///home/arccosine/poke-tool/src/utils/calculator.ts) の `calculateMaxDamage` を修正し、習得可能なすべての技に対してダメージを算出した後、重複を排除し、降順でソートして上位最大6つの技の配列を返すよう実装しました（Green）。
3. **UIおよびフィルタリングの修正**:
   * [`src/components/StatSearch/StatSearch.tsx`](file:///home/arccosine/poke-tool/src/components/StatSearch/StatSearch.tsx) において `RankingItem` インターフェースを更新し、配列 `moves` を保持できるようにしました。
   * マッピング時、1位の技のダメージ値をポケモンの代表値 `value` にバインドしてランキングソート順を保証しました。
   * わざタイプ・分類フィルターが、上位6つの技のいずれかに合致する場合にポケモンを絞り込めるよう適正化しました。
   * テーブルの「使用技」カラム内に、上位6つの技を縦にコンパクトに並べて表示するようデザインを修正しました（物理/特殊マーク、技名、個別特性、および個別のダメージ指数を横並びで表示）。
4. **動作およびビルド検証**:
   * `npx vitest run` を実行し、全45件のテストスイートが正常に Green でパスすることを確認しました。
   * `npm run build` を実行し、TypeScriptのビルドとViteプロダクションビルドがコンパイル警告やエラーなく正常に完了することを確認しました。
