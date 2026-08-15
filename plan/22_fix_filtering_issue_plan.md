# 22_火力ランキングのフィルタリング不具合修正計画

本計画は、火力ランキングにおいて「わざタイプ」や「物理/特殊分類」のフィルターを適用した際、ポケモンが習得するすべての技から該当条件に合う技を正しく抽出・計算し、期待通りのランキング結果が表示されるようにフィルタリングロジックを修正する手順を定義します。

---

## 1. 現状分析と課題

### 課題
現在、最大火力ランキングでは：
1. ポケモンごとに、全習得技の中から無条件で「上位6技」を抽出する。
2. その後、抽出された上位6技に対して「わざタイプ」や「分類」のフィルターを適用する。

この順序になっているため、例えば「ほのお」タイプでフィルタリングした際、そのポケモンがほのおタイプの技（例: ほのおのパンチ）を習得可能であっても、その技のダメージ指数がそのポケモンの全習得技の「上位6技」に入っていなかった場合、ランキングからそのポケモンおよび技が完全に消えてしまいます。
その結果、特定のタイプや分類で絞り込んだときに、本来表示されるべきポケモンがほとんど表示されなくなったり、計算結果が正しくなくなる不具合が発生しています。

### 解決策
「わざタイプ」および「分類」のフィルター処理を、**上位6技の決定プロセスよりも前段（`calculateMaxDamage` に技データを渡す段階）に移動**します。
* 選択されたわざタイプ・分類で技マスターデータを事前に絞り込みます。
* 絞り込まれた技データを用いて各ポケモンの火力計算を行うことで、そのタイプ・分類の技の中での最大火力（上位6技）が正しく計算・抽出されるようになります。

---

## 2. 設計詳細

### (1) UIコンポーネントの修正 (`src/components/StatSearch/StatSearch.tsx`)

#### ① 事前フィルタリングの導入とフラット展開の修正
```typescript
  // 1. Calculate and flatten all pokemon and moves
  const flatList: Omit<RankingItem, 'rank'>[] = [];

  // わざタイプおよび分類で技データを事前に絞り込む
  const filteredMoves = movesData.filter((m) => {
    if (selectedMoveType !== 'all' && m.type !== selectedMoveType) return false;
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    return true;
  });

  pokemonData.forEach((poke) => {
    if (searchTarget === 'damage') {
      const dmgMoves = calculateMaxDamage(poke, filteredMoves);
      if (dmgMoves.length > 0) {
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
        // 元々技を1つも持っておらず、かつフィルターが適用されていない初期状態のモックテスト対策
        const originalLearnableCount = movesData.filter((m) =>
          poke.learnable_moves.includes(m.id)
        ).length;
        if (originalLearnableCount === 0 && selectedMoveType === 'all' && selectedCategory === 'all') {
          flatList.push({
            pokemon: poke,
            value: 0,
            moveName: { ja: 'なし', en: 'None' },
            category: 'status',
            moveType: 'normal',
            abilityName: { ja: 'なし', en: 'None' },
          });
        }
      }
    } else {
      const durInfo = calculateMaxDurability(poke);
      flatList.push({
        pokemon: poke,
        value: searchTarget === 'physical' ? durInfo.physical : durInfo.special,
      });
    }
  });
```

#### ② 後段のフィルター処理の整理
* すでに `filteredMoves` の段階で「わざタイプ」および「分類」の絞り込みが行われているため、後段の `.filter()` チェインからはそれらの判定コードを取り除き、処理を簡素化します。

---

## 3. 開発および検証ステップ

### ステップ 1: 計画の合意
* 本計画についてユーザーと合意します。

### ステップ 2: 実装
* `StatSearch.tsx` のデータ処理ループを上記の設計通りに変更し、後段の重複するフィルター処理を削除します。

### ステップ 3: ビルドおよび動作確認
* `npm run build` でビルドが正常に通ることを確認します。
* テスト `npx vitest run` がすべて Green でパスすることを確認します（テスト用のモックデータに対する表示互換性が維持されていることを確認）。
* 実際にブラウザで「わざタイプ」や「分類」フィルターを切り替え、各タイプにおける高火力技のランキングが欠損なく正しく表示されることを確認します。

---

## 4. 実行結果 (2026-08-15 完了)

ユーザーの合意のもと、以下の通り実施しました：

1. **技の事前フィルタリングの導入**:
   * [`src/components/StatSearch/StatSearch.tsx`](file:///home/arccosine/poke-tool/src/components/StatSearch/StatSearch.tsx#L99-L135) において、各ポケモンの上位6技を抽出する前に、あらかじめ「わざタイプ」および「分類」フィルターの条件に合致する技のみに `movesData` を絞り込んでから計算を走らせるように修正しました。
   * これにより、特定のタイプや分類（例: ほのお物理）で絞り込んだときにも、その条件内での高火力な技が全習得技から正しく算出・抽出されるようになり、情報の欠損が解消されました。
2. **後段フィルターの削除と整理**:
   * データ生成前段で既に絞り込みが行われているため、後段のフィルターチェインから不要となった「わざタイプ」と「分類」の条件判定を取り除き、処理をシンプルにしました。
3. **ビルドおよびテスト検証**:
   * `npx vitest run` を実行し、テストデータの互換性（技を持たないモックポケモンに対する「なし」フォールバック）を含め、全45件のテストスイートが正常に Green でパスすることを確認しました。
   * `npm run build` を実行し、TypeScript警告によるコンパイルエラー等なくビルドが正常完了することを確認しました。
