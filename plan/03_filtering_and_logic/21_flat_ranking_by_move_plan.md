# 21_ポケモン×技のフラット展開による火力ランキング表示計画

本計画は、火力ランキングにおいて、各ポケモンの上位6つの技をテーブルの個別の行としてフラットに展開し、全体のダメージ指数降順で一覧表示する手順を定義します。

---

## 1. 実装要件

* **データのフラット展開**:
  * これまでの「1行＝1ポケモン（セル内に6つの技を内包）」という表示形式から、**「1行＝1つの（ポケモン × 技）の組み合わせ」**へとデータをフラットに展開します。
  * `calculateMaxDamage` で得られた各ポケモンの上位6技（配列）を、それぞれ独立したランキング行（`FlatRankingItem`）としてマッピングします。
* **フィルタリングとソート順の適正化**:
  * ポケモンタイプ、わざタイプ、物理/特殊分類、レギュレーションによるフィルターは、フラット展開された各行に対して個別に適用します。
  * フィルタリング適用後の全組み合わせリストを、**ダメージ指数の降順で一括ソート**します。
  * ソート後に上位 **300 件**をスライスし、順位（`rank`）を割り当てます。
* **テーブルUIの再修正**:
  * 1行に1つの技と特性、ダメージ指数を表示するシンプルなテーブル構造に戻します。
  * 各行には、順位、ポケモン名、適用特性、ポケモンのタイプ、使用技（物理/特殊マーク＋技名）、およびその技のダメージ指数を表示します。

---

## 2. 設計詳細

### (1) UIコンポーネントの修正 (`src/components/StatSearch/StatSearch.tsx`)

#### ① `RankingItem` の再定義
```typescript
interface RankingItem {
  rank: number;
  pokemon: PokemonMaster;
  value: number; // ダメージ指数または耐久指数
  // 火力検索時のみ使用
  moveName?: { ja: string; en: string };
  category?: string;
  moveType?: string;
  abilityName?: { ja: string; en: string };
}
```

#### ② データ処理ロジックの修正
```typescript
  // 1. 全ポケモンに対して計算を行い、フラットなリストを作成
  const flatList: Omit<RankingItem, 'rank'>[] = [];

  pokemonData.forEach((poke) => {
    if (searchTarget === 'damage') {
      const dmgMoves = calculateMaxDamage(poke, movesData);
      dmgMoves.forEach((move) => {
        flatList.push({
          pokemon: poke,
          value: move.value,
          moveName: move.moveName,
          category: move.category,
          moveType: move.moveType,
          abilityName: move.abilityName,
        });
      });
    } else {
      const durInfo = calculateMaxDurability(poke);
      flatList.push({
        pokemon: poke,
        value: searchTarget === 'physical' ? durInfo.physical : durInfo.special,
      });
    }
  });

  // 2. フィルターの適用
  const rankingList: RankingItem[] = flatList
    // (A) レギュレーションフィルター
    .filter(
      (item) =>
        selectedReg === 'all' || item.pokemon.regulations.includes(selectedReg)
    )
    // (B) ポケモンのタイプフィルター
    .filter(
      (item) =>
        selectedType === 'all' || item.pokemon.types.includes(selectedType)
    )
    // (C) わざタイプフィルター (火力検索時のみ)
    .filter((item) => {
      if (searchTarget !== 'damage' || selectedMoveType === 'all') return true;
      return item.moveType === selectedMoveType;
    })
    // (D) 分類フィルター (火力検索時のみ)
    .filter((item) => {
      if (searchTarget !== 'damage' || selectedCategory === 'all') return true;
      return item.category === selectedCategory;
    })
    // 3. 全体ソート (ダメージ指数/耐久指数の降順)
    .sort((a, b) => b.value - a.value)
    // 4. 上位300位をスライスし、順位をマッピング
    .slice(0, 300)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
```

#### ③ レンダリングの修正
* テーブルの「使用技」カラム、「特性」カラムを、単一の技および特性を表示するシンプルな形式に戻します。

---

## 3. 開発および検証ステップ

### ステップ 1: 計画の合意
* 本計画についてユーザーと合意します。

### ステップ 2: 実装
* `StatSearch.tsx` のデータ展開ロジック、フィルタリング、およびテーブルレンダリングを変更します。

### ステップ 3: ビルドおよび動作確認
* `npm run build` でビルドが正常に通ることを確認します。
* テスト `npx vitest run` がすべて Green でパスすることを確認します。
* 実際にブラウザで火力ランキングを表示し、同じポケモンであっても複数の異なる技がそれぞれの順位で独立してランクインしていることを確認します。

---

## 4. 実行結果 (2026-08-15 完了)

ユーザーの合意のもと、以下の通り実施しました：

1. **データのフラット展開とフォールバック処理の実装**:
   * [`src/components/StatSearch/StatSearch.tsx`](file:///home/arccosine/poke-tool/src/components/StatSearch/StatSearch.tsx#L99-L122) において、各ポケモンの上位最大6技をそれぞれ独立した `RankingItem` 行としてフラットに展開するデータマッピングに変更しました。
   * テストデータの互換性維持（技を1つも習得していないモックポケモンを正しく描画するため）として、覚える技が0件のポケモンに対しては、従来同様「なし（None）」というダミーの技でダメージ指数0として1行展開するフォールバック処理を実装しました。
2. **フィルタリングおよびソートロジックの修正**:
   * わざタイプフィルターおよび分類フィルターが、フラット展開された各行（各技）に対して直接条件判定を行うように修正しました。
   * フィルター後のリストを、技個別ダメージ指数 `value` の降順で一括ソートし、順位（`rank`）を振るように再構成しました。
3. **テーブルUIの単一表示化**:
   * 1行に1つの技・適用特性・ダメージ指数を表示するシンプルなテーブル構造に差し戻しました。
   * これにより、同じポケモンであっても複数の高火力技がそれぞれ別の行としてランキング一覧に並ぶようになりました。
4. **動作およびビルド検証**:
   * `npx vitest run` を実行し、全てのテストスイート（全45件）が正常に Green でパスすることを確認しました。
   * `npm run build` を実行し、TypeScriptのコンパイルおよびViteのプロダクションビルドが警告やエラーなく正常に完了することを確認しました。
