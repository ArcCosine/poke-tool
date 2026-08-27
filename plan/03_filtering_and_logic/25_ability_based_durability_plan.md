# 25_耐久計算における特性補正の実装計画

本計画は、物理耐久・特殊耐久の指数計算において、耐久力を上昇させる特性（ファーコート、マルチスケイル、こおりのりんぷん等）の補正効果を反映し、最大耐久を最大化する特性を自動選択して表示する手順を定義します。

---

## 1. 実装要件

* **耐久特性の補正計算**:
  * ポケモンの特性リストを走査し、物理耐久・特殊耐久それぞれを最大化する特性を自動選択します。
  * 以下の代表的な耐久特性の補正効果を実装します。
    * **物理防御（ぼうぎょ）補正**:
      * **ファーコート (Fur Coat)**: ぼうぎょステータスを **2.0倍** にする。
      * **ふしぎなうろこ (Marvel Scale)**: 状態異常想定でぼうぎょステータスを **1.5倍** にする。
    * **特殊防御（とくぼう）補正**:
      * **こおりのりんぷん (Ice Scales)**: 特殊防御ステータスを **2.0倍** にする（特殊被ダメージ0.5倍を実質特防2倍として計算）。
      * **すなおこし (Sand Stream)**: いわタイプのポケモンの場合、自身の砂嵐効果でとくぼうステータスを **1.5倍** にする。
    * **全体ダメージ軽減補正**:
      * **マルチスケイル (Multiscale)** / **ファントムガード (Shadow Shield)**: HP満タン想定で受けるダメージを0.5倍にするため、物理・特殊耐久指数をそれぞれ **2.0倍** にする。
* **UI表示の拡張**:
  * 耐久ランキング表示時、テーブルの「特性」カラムに、その耐久値を最大化するために選ばれた特性（例: ルギアなら「マルチスケイル」）を表示します。

---

## 2. 設計詳細

### (1) 耐久計算ロジックの修正 (`src/utils/calculator.ts`)

#### ① 戻り値の型拡張
```typescript
export interface MaxDurabilityInfo {
  physical: number;
  physicalAbility: { ja: string; en: string };
  special: number;
  specialAbility: { ja: string; en: string };
}

export function calculateMaxDurability(pokemon: PokemonMaster): MaxDurabilityInfo
```

#### ② 特性ループと補正処理
* ポケモンが持つ各特性について物理耐久値・特殊耐久値を計算し、最大値となる特性を `physicalAbility`, `specialAbility` としてそれぞれ記録・返却します。

### (2) UIコンポーネントの修正 (`src/components/StatSearch/StatSearch.tsx`)

#### ① データ展開ループの修正
```typescript
    } else {
      const durInfo = calculateMaxDurability(poke);
      flatList.push({
        pokemon: poke,
        value: searchTarget === 'physical' ? durInfo.physical : durInfo.special,
        abilityName: searchTarget === 'physical' ? durInfo.physicalAbility : durInfo.specialAbility,
      });
    }
```
※これにより、耐久検索の時も `abilityName` が格納され、テーブルの「特性」カラムに自動的に適用特性名が表示されるようになります。

---

## 3. 開発および検証ステップ (TDDの遵守)

### ステップ 1: 計画の合意
* 本計画についてユーザーと合意します。

### ステップ 2: 単体テストの修正・追加（Red）
* `src/utils/calculator.test.ts` 内の `calculateMaxDurability` テストケースを新形式（オブジェクトの戻り値）に修正します。
* 耐久特性（ファーコート、マルチスケイル、こおりのりんぷん、すなおこし）の適用を検証するテストケースを新たに追加します。
* `npx vitest run` を実行し、テストが一時的に失敗またはコンパイルエラーになることを確認します。

### ステップ 3: 計算ロジックの実装（Green）
* `src/utils/calculator.ts` の `calculateMaxDurability` を上記設計の通り実装します。
* `npx vitest run` を実行し、追加したテストがすべて Green でパスすることを確認します。

### ステップ 4: UIコンポーネントの修正
* `StatSearch.tsx` のデータ処理部分を修正し、耐久検索時に `abilityName` がバインドされるようにします。

### ステップ 5: ビルドおよび動作確認
* `npm run build` でビルドが正常に通ることを確認します。
* ブラウザで耐久ランキングを確認し、各ポケモンの物理・特殊耐久の最大化特性が正しく表示されていることを確認します（例: ルギアの特性列にマルチスケイルが表示され、耐久指数が従来より2倍になっていること）。

---

## 4. 実行結果 (2026-08-15 完了)

ユーザーの合意のもと、以下の通り実施しました：

1. **耐久計算への特性補正ロジックの実装 (TDD遵守)**:
   * [`src/utils/calculator.ts`](file:///home/arccosine/poke-tool/src/utils/calculator.ts#L258-L352) において、`calculateMaxDurability` を更新し、防御・特防にかかる特性補正を計算する処理を実装しました。
     * **ファーコート (Fur Coat)**: 物理防御を 2.0 倍にします。
     * **ふしぎなうろこ (Marvel Scale)**: 物理防御を 1.5 倍にします。
     * **こおりのりんぷん (Ice Scales)**: 特殊防御を 2.0 倍にします。
     * **すなおこし (Sand Stream)**: 岩タイプに限り特殊防御を 1.5 倍にします。
     * **マルチスケイル (Multiscale) / ファントムガード (Shadow Shield)**: 物理・特殊双方の被ダメージを 0.5 倍にするため、最終耐久指数をそれぞれ 2.0 倍にします。
   * 特性配列の中から物理・特殊の各耐久値を最大化する特性を自動選択し、最大耐久値とともに `physicalAbility` / `specialAbility` を返すようシグネチャを `MaxDurabilityInfo` に変更しました。
2. **単体テストの拡張・合格**:
   * [`src/utils/calculator.test.ts`](file:///home/arccosine/poke-tool/src/utils/calculator.test.ts#L444-L533) にて、Blastoise の耐久テストを新形式アサーションに更新した上で、上記で実装した耐久特性（ファーコート、こおりのりんぷん、マルチスケイル、すなおこし）の適用と値の一致を検証する4つのテストケースを追加しました。
   * `npx vitest run` を実行し、全テスト（計49件）が Green で正常パスすることを確認しました。
3. **UI表示の対応**:
   * [`src/components/StatSearch/StatSearch.tsx`](file:///home/arccosine/poke-tool/src/components/StatSearch/StatSearch.tsx#L126-L135) において、物理・特殊耐久のデータプッシュ時に、耐久を最大化する特性名（`durInfo.physicalAbility` または `durInfo.specialAbility`）を `abilityName` としてバインドするように修正しました。
   * これにより、耐久ランキングの特性列に、その耐久の最大化根拠となる特性名が自動表示されるようになりました。
4. **ビルド検証**:
   * `npm run build` を実行し、TypeScriptのビルドとViteのプロダクションビルドが警告やエラーなく正常完了することを確認しました。
