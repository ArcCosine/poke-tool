# 26_ランキングソート方向（昇順/降順）切り替え機能の実装計画

本計画は、ランキングテーブルの「指数」列において、表示順を昇順（低い順）と降順（高い順）で切り替えられるソート方向トグルボタンを追加する手順を定義します。

---

## 1. 現状分析と課題

### 課題
現在、最大火力および耐久ランキングは常にダメージ指数/耐久指数の降順（値が高い順）で固定して並べ替えられています。
火力が最も低いポケモンや、最も脆い（耐久が低い）ポケモンを検索・比較できるようにするため、指数の昇順（値が低い順）への並べ替え切り替えボタンが必要とされています。

### 解決策
1. `StatSearch` コンポーネントにソート方向を管理するステート `sortOrder` (`'asc' | 'desc'`) を追加します（初期値は降順 `'desc'`).
2. データソートロジックを `sortOrder` に応じて昇順/降順が切り替わるように修正します。
3. テーブルの「指数」ヘッダーをクリック可能にし、ホバーエフェクトおよび現在のソート方向を示すインジケーター（矢印アイコン）を表示して、クリック時に昇順/降順をトグルできるようにします。

---

## 2. 設計詳細

### (1) ステートの追加 (`src/components/StatSearch/StatSearch.tsx`)
```typescript
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
```

### (2) ソートロジックの修正
```typescript
    // (E) Sort depending on sortOrder
    .sort((a, b) =>
      sortOrder === 'desc' ? b.value - a.value : a.value - b.value
    )
```

### (3) テーブルヘッダー UI の修正
テーブルの「指数」列ヘッダー（`<th>`）を以下のようにインタラクティブなボタンに書き換えます。
```typescript
                <th className="py-4 px-6 text-right pr-8">
                  <button
                    onClick={() =>
                      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                    }
                    className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-150 font-bold uppercase tracking-wider ml-auto"
                  >
                    {t('value')}
                    {sortOrder === 'desc' ? (
                      <span className="i-lucide-arrow-down-1-9 text-xs" />
                    ) : (
                      <span className="i-lucide-arrow-up-1-9 text-xs" />
                    )}
                  </button>
                </th>
```

---

## 3. 開発および検証ステップ

### ステップ 1: 計画の合意
* 本計画についてユーザーと合意します。

### ステップ 2: 実装
* `StatSearch.tsx` に `sortOrder` ステートを追加し、ソートロジックおよび指数ヘッダーの UI を修正します。

### ステップ 3: ビルドおよび動作確認
* `npm run build` でビルドが正常に通ることを確認します。
* テスト `npx vitest run` が正常にパスすることを確認します。
* ブラウザで指数ヘッダーをクリックし、昇順・降順がスムーズに切り替わり、ソートインジケーターが正しく変化することを確認します。

---

## 4. 実行結果 (2026-08-15 完了)

ユーザーの合意のもと、以下の通り実施しました：

1. **ソートステートの追加**:
   * [`src/components/StatSearch/StatSearch.tsx`](file:///home/arccosine/poke-tool/src/components/StatSearch/StatSearch.tsx#L77) に `sortOrder` ステート (`'asc' | 'desc'`, デフォルト `'desc'`) を追加しました。
2. **ソート条件の動的切り替え**:
   * [`src/components/StatSearch/StatSearch.tsx`](file:///home/arccosine/poke-tool/src/components/StatSearch/StatSearch.tsx#L162-L166) にて、全体のソートを `sortOrder` に基づいて `a.value - b.value` (昇順) と `b.value - a.value` (降順) に切り替えるよう変更しました。
3. **ヘッダーUIのボタン化および標準アイコンの使用**:
   * テーブルの「指数」ヘッダーをインタラクティブなボタンにし、クリックするだけでソート方向をトグルできるようにしました。
   * ホバー時のカラー変化（`hover:text-indigo-600`）および現在のアクティブな並び順を示す矢印インジケーターを追加しました。
   * インジケーターのアイコンには、UnoCSS のロード不具合を防ぐため確実に存在する標準アイコン `i-lucide-arrow-down` と `i-lucide-arrow-up` を採用しました。
4. **動作・ビルド確認**:
   * `npx vitest run` を実行し、全49件のテストが正常にパスすることを確認しました。
   * `npm run build` を実行し、ビルドが警告なしで正常完了することを確認しました。
   * これにより、ユーザーは火力指数や耐久指数が高い順・低い順をワンクリックで自由に切り替えて調査できるようになりました。
