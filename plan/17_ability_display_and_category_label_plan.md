# 17_火力ランキングにおける適用特性と技分類の表示計画

本計画は、最大火力ランキングにおいて「最大火力を引き出した適用特性」をポケモンの隣（テーブルカラム）に表示し、さらに「使用技の分類（物理/特殊）」を技名の横にテキスト表記する手順を定義します。

---

## 1. 実装要件

### (1) 適用特性の記録と表示
現在、最大火力計算ロジック（`calculateMaxDamage`）は、最も火力が高くなる特性を自動選択して計算していますが、適用された特性の情報は返されていません。
* **ロジック修正**: 計算結果の戻り値に、最大火力を引き出した特性情報 `abilityName: { ja: string; en: string }` を追加します。
* **UI表示**: ランキングテーブルに「特性 (Ability)」カラムを新規追加します。
  * 最大火力ランキングの時のみ、適用された特性を表示します。
  * 物理・特殊耐久ランキングの時は、このカラムは空欄（または「-」）とします。

### (2) 使用技の分類（物理/特殊）テキスト表記の追加
現在、最大火力ランキングの使用技の横には物理（オレンジ）/特殊（紫）のカラー丸印が表示されていますが、より分かりやすくするために「(物理)」または「(特殊)」という翻訳テキスト表記を技名の横に追加します。
* **UI表示**: `{技名} ({分類テキスト})` の形式で表示します。
  * 例: `バレットパンチ (物理)` / `Bullet Punch (Physical)`

---

## 2. 設計詳細

### (1) 計算ロジックとテストの修正 (`src/utils/calculator.ts` および `src/utils/calculator.test.ts`)
1. **`calculateMaxDamage` の戻り値の拡張**:
   ```typescript
   ): {
     value: number;
     moveName: { ja: string; en: string };
     category: string;
     moveType: string;
     abilityName: { ja: string; en: string };
   }
   ```
2. **特性ループでの記録**:
   * ループ内で最大火力を更新した際、その時の `ability`（オブジェクト `{ ja, en }`）を `bestAbility` として保持し、関数の最後で返します。
3. **テストの追加 (TDD)**:
   * テストコード（`calculator.test.ts`）に、メガハッサムやマリルリを計算した際、戻り値の `abilityName` がそれぞれ「テクニシャン」「ちからもち」となっていることを確認するアサーションを追加します。

### (2) UIと翻訳の修正
1. **多言語辞書の修正 (`src/context/AppContext.tsx`)**:
   * `ability` キー（`ja: '特性', en: 'Ability'`）を追加します。
2. **テーブル UI の修正 (`src/components/StatSearch/StatSearch.tsx`)**:
   * テーブルヘッダーに「特性」のカラムを追加します。位置は「ポケモン」と「タイプ」の間、または「タイプ」の隣とします（「ポケモン」の隣に「特性」を追加）。
   * `rankingList` のマップ処理で、適用特性 `abilityName` を UI の表示項目（`RankingItem`）にバインドします。
   * 使用技の表示箇所において、既存のカラー丸印に加え、`t(item.category)` を使って `(物理)` / `(特殊)` というテキスト表記を追加します。

---

## 3. 開発および検証ステップ (TDDの遵守)

### ステップ 1: 計画の合意
* 本計画についてユーザーと合意します。

### ステップ 2: 単体テストの追加・更新（Red）
* `src/utils/calculator.test.ts` の既存の特性テストケースにおいて、期待される `abilityName.ja` や `abilityName.en` を検証するアサーションを追加し、テストが一時的に失敗することを確認します。

### ステップ 3: 計算ロジックの実装（Green）
* `src/utils/calculator.ts` の `calculateMaxDamage` を修正し、`bestAbility` を追跡・返却するように実装します。
* `npx vitest run` を実行し、テストがすべて正常にパスすることを確認します。

### ステップ 4: UIと多言語辞書の修正
* `src/context/AppContext.tsx` に `ability` の翻訳を追加します。
* `src/components/StatSearch/StatSearch.tsx` のテーブル表示、技名表示を修正します。

### ステップ 5: ビルドおよび動作確認
* `npm run build` でビルドが通ることを確認します。
* ローカルでランキングを表示し、「特性」カラムに計算に用いられた特性（ハッサムならテクニシャン、マリルリならちからもち等）が表示され、技名の横に `(物理)` 等の表記があることを確認します。

---

## 4. 実行結果 (2026-08-15 完了)

ユーザーの合意のもと、以下の通り実施しました：

1. **テストコードの更新 (TDDの遵守)**:
   * [`src/utils/calculator.test.ts`](file:///home/arccosine/poke-tool/src/utils/calculator.test.ts) にて、火力計算の戻り値に含まれる `abilityName` が各テストケース（テクニシャン、ちからもち、てきおうりょく等）に対応する正しい特性オブジェクトであることを検証するアサーションを追加しました（テストが一時的に失敗する状態を確認）。
2. **適用特性の追跡と返却**:
   * [`src/utils/calculator.ts`](file:///home/arccosine/poke-tool/src/utils/calculator.ts) の `calculateMaxDamage` を修正し、最大火力を達成した特性 `bestAbility` を追跡して戻り値に含めるよう実装しました。
   * テストを実行し、すべてのテストが Green でパスすることを確認しました。
3. **多言語辞書の拡張**:
   * [`src/context/AppContext.tsx`](file:///home/arccosine/poke-tool/src/context/AppContext.tsx) に `ability`（`ja: '特性', en: 'Ability'`）の翻訳を追加しました。
4. **UI表示の追加**:
   * [`src/components/StatSearch/StatSearch.tsx`](file:///home/arccosine/poke-tool/src/components/StatSearch/StatSearch.tsx) のランキングテーブルに「特性（Ability）」カラムを新規追加し、最大火力決定に適用された特性をバインドして表示するようにしました（耐久計算時は `'-'` を表示）。
   * 使用技の表示カラムにおいて、技名の横に `(物理)` または `(特殊)` の分類テキスト（多言語翻訳適用）を併記するように変更しました。
   * カラムの追加に伴い、エラー判定を避けるためテーブル全体の `colSpan` を `6`（耐久時 `5`）に拡張しました。
5. **ビルド検証**:
   * `npm run build` および `npx vitest run` を実行し、すべてのコンパイル、プロダクションビルド、テストスイートが正常にパスすることを確認しました。
