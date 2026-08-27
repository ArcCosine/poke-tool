# 23_スキン特性対応および完全なタイプ・分類フィルターの実装計画

本計画は、スキン特性によるわざタイプの変化（例: ノーマル技がひこう技へ変化）を考慮し、かつ各ポケモンが該当タイプ・分類で出せる高火力技がランキングに欠損なく表示されるよう、フィルタリングおよびソート、ポケモンごとの表示上限（最大6技）の処理順序を根本から適正化する手順を定義します。

---

## 1. 現状分析と課題

### 課題
現在、わざの事前フィルタリングを導入したことで、技が元々持っているタイプ（例: ギガインパクトの「ノーマル」）で判定されてしまい、以下の不具合が発生しています。
1. スカイスキン等の特性で技のタイプが「ひこう」などに変化するポケモン（例: カイロス）が、わざタイプ「ひこう」で絞り込んだ時にギガインパクトを表示できない（元タイプがノーマルのため事前フィルターで除外される）。
2. わざタイプ「ノーマル」で絞り込んだ時に、ひこうタイプに変化したギガインパクトが表示されてしまう。

また、以前の「事後フィルタリング」では、全技から上位6つを選んだ後にフィルターをかけるため、特定タイプでの高火力技が上位6つから漏れてランキングからポケモンごと消えてしまう問題がありました。

### 解決策
以下の順序で処理をパイプライン化します。
1. **全技の計算**: `calculateMaxDamage` はソートのみを行い、**スライスせず全件**を返すように変更します。
2. **フラットリストの生成**: 全ポケモン・全習得技の組み合わせ（変化後の正確な `moveType` や `category` を含む）を一括でフラットな巨大リスト（`allFlatList`）に展開します。
3. **フィルターの適用**: レギュレーション、ポケモンタイプ、変化後のわざタイプ、分類の各フィルターをフラットリスト全体に適用します。
4. **一括ソート**: フィルターを通過した全組み合わせを、ダメージ指数の降順でソートします。
5. **ポケモンごとの表示制限 (最大6技)**: ソート済みのリストを上から走査し、**同一ポケモンについては上位6技までのみを通過**させ、7技目以降は除外します。
6. **300件スライスと順位付け**: 制限適用後のリストから上位300件をスライスし、順位（`rank`）を振ります。

これにより、すべての不具合が完全に解決し、スキン特性のタイプ変化も100%正しくフィルターされるようになります。

---

## 2. 設計詳細

### (1) 火力計算ロジックの修正 (`src/utils/calculator.ts` および `src/utils/calculator.test.ts`)

#### ① `calculateMaxDamage`
* ソート後の `.slice(0, 6)` を削除し、計算された全技の配列をそのまま返すように変更します。

#### ② テストコードの修正
* `calculator.test.ts` 内の `should return up to 6 moves sorted by damage descending` テストを、全件（7つの技）がソートされて返ってくることをアサートする内容に修正します。
  * `expect(res.length).toBe(7);`

### (2) UIコンポーネントの修正 (`src/components/StatSearch/StatSearch.tsx`)

#### ① データ処理パイプラインの修正
```typescript
  // 1. 全ポケモン・全技のダメージ計算結果をフラットに展開 (フィルターなしの全データ)
  const allFlatList: Omit<RankingItem, 'rank'>[] = [];

  pokemonData.forEach((poke) => {
    if (searchTarget === 'damage') {
      const dmgMoves = calculateMaxDamage(poke, movesData);
      if (dmgMoves.length > 0) {
        dmgMoves.forEach((move) => {
          allFlatList.push({
            pokemon: poke,
            value: move.value,
            moveName: move.moveName,
            category: move.category,
            moveType: move.moveType,
            abilityName: move.abilityName,
          });
        });
      } else {
        allFlatList.push({
          pokemon: poke,
          value: 0,
          moveName: { ja: 'なし', en: 'None' },
          category: 'status',
          moveType: 'normal',
          abilityName: { ja: 'なし', en: 'None' },
        });
      }
    } else {
      const durInfo = calculateMaxDurability(poke);
      allFlatList.push({
        pokemon: poke,
        value: searchTarget === 'physical' ? durInfo.physical : durInfo.special,
      });
    }
  });

  // 2. 各種フィルターの適用 (わざタイプ・分類は変化後の値で判定)
  const filteredList = allFlatList
    .filter(
      (item) =>
        selectedReg === 'all' || item.pokemon.regulations.includes(selectedReg)
    )
    .filter(
      (item) =>
        selectedType === 'all' || item.pokemon.types.includes(selectedType)
    )
    .filter((item) => {
      if (searchTarget !== 'damage' || selectedMoveType === 'all') return true;
      return item.moveType === selectedMoveType;
    })
    .filter((item) => {
      if (searchTarget !== 'damage' || selectedCategory === 'all') return true;
      return item.category === selectedCategory;
    });

  // 3. 全体をダメージ指数/耐久指数の降順でソート
  const sortedList = filteredList.sort((a, b) => b.value - a.value);

  // 4. 上位300件をスライスし、順位をマッピング
  const rankingList: RankingItem[] = sortedList
    .slice(0, 300)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
```

---

## 3. 開発および検証ステップ (TDDの遵守)

### ステップ 1: 計画の合意
* 本計画についてユーザーと合意します。

### ステップ 2: 単体テストの修正（Red）
* `calculator.test.ts` 内のソートテストの期待値を 6 から 7 に変更し、テストが一時的に失敗することを確認します。

### ステップ 3: ロジックの実装（Green）
* `calculator.ts` の `calculateMaxDamage` から `.slice(0, 6)` を削除します。
* `npx vitest run` を実行し、全テストがパスすることを確認します。

### ステップ 4: UIコンポーネントの修正
* `StatSearch.tsx` に上記のパイプライン処理（全フラット展開 -> フィルタリング -> ソート -> 同一ポケモン上限6件制限）を実装します。

### ステップ 5: ビルドおよび動作確認
* `npm run build` でビルドが正常に通ることを確認します。
* ブラウザで、ポケモンタイプ、わざタイプ、分類、レギュレーションの各フィルターがスキン特性の有無に関わらず期待通りに完璧に機能することを確認します。

---

## 4. 実行結果 (2026-08-15 完了)

ユーザーの合意（ポケモンごとの表示制限カウントの解除を含む）のもと、以下の通り実施しました：

1. **計算ロジック側のスライス削除**:
   * [`src/utils/calculator.ts`](file:///home/arccosine/poke-tool/src/utils/calculator.ts#L250-L256) の `calculateMaxDamage` から、上位6件に制限していた `.slice(0, 6)` を削除し、計算されたすべての技の最大ダメージデータを返すように拡張しました。
   * [`src/utils/calculator.test.ts`](file:///home/arccosine/poke-tool/src/utils/calculator.test.ts#L396-L422) の単体テストにおいて、スライスが解除され、登録された全7件の技がソートされて正しく返ってくることを期待する内容にアサーションを更新しました（Green）。
2. **UIデータパイプラインの全面適正化**:
   * [`src/components/StatSearch/StatSearch.tsx`](file:///home/arccosine/poke-tool/src/components/StatSearch/StatSearch.tsx#L98-L166) にて、フィルタリングの処理順序を根本から適正化しました。
     * すべてのポケモンについて、すべての習得技のダメージ計算結果をフラットなリスト `flatList` に展開します。
     * 展開後のリストに対して、ポケモンのタイプ（`selectedType`）だけでなく、スキン特性適用後の最終的なわざのタイプ（`selectedMoveType`）や物理/特殊分類（`selectedCategory`）の条件フィルターを適用するように変更しました。
     * これにより、スカイスキンで「ひこう」タイプに変化したノーマル技（ギガインパクト等）が「ひこう」フィルターで正しく合致し、逆に「ノーマル」フィルター時には除外されるという、ゲーム本来の挙動に完全に合致する動きになりました。
     * フィルター通過後のリストを一括でソートし、上位300件を切り出します。
3. **ビルドおよびテスト検証**:
   * `npx vitest run` を実行し、モックデータに対する表示互換テストを含む全45件のテストスイートが正常に Green でパスすることを確認しました。
   * `npm run build` を実行し、TypeScriptのビルドとViteプロダクションビルドがコンパイル警告やエラーなく正常に完了することを確認しました。
