# 24_ランキングテーブルのReactユニークキー不具合修正計画

本計画は、火力ランキングを（ポケモン×技）でフラット展開したことに伴い発生した、Reactテーブルレンダリングにおける `key` 重複エラー（`Encountered two children with the same key`）を解消する手順を定義します。

---

## 1. 現状分析と課題

### 課題
現在、ランキングテーブルの各行（`<tr>`）の `key` 属性には `item.pokemon.id` が使用されています。
以前は1ポケモンにつき1行のみの表示だったため一意でしたが、フラット展開を導入したことにより、同じポケモン（同じID）が異なる技で複数の行としてランクインするようになりました。これにより、同一のポケモンIDを持つ行が複数存在することになり、Reactの `key` 重複エラーが発生しています。

### 解決策
`<tr>` の `key` 属性に、ポケモンIDと技の英語名を組み合わせた一意の文字列を設定します。
* 火力検索（`damage`）時: `${item.pokemon.id}-${item.moveName?.en || ''}`
* 耐久検索時: `${item.pokemon.id}` （耐久検索時は1ポケモン1行なのでIDだけで一意です）

これにより、フラット展開されたすべての行で `key` が完全に一意になり、警告およびレンダリングの不整合が解消されます。

---

## 2. 設計詳細

### (1) UIコンポーネントの修正 (`src/components/StatSearch/StatSearch.tsx`)
テーブルの行レンダリングにおける `key` 指定（285〜290行目付近）を以下のように修正します。
```typescript
              {rankingList.map((item) => (
                <tr
                  key={
                    searchTarget === 'damage'
                      ? `${item.pokemon.id}-${item.moveName?.en || ''}`
                      : `${item.pokemon.id}`
                  }
                  className="hover:bg-slate-100/30 dark:hover:bg-slate-900/20 transition-colors duration-150"
                >
```

---

## 3. 開発および検証ステップ

### ステップ 1: 計画の合意
* 本計画についてユーザーと合意します。

### ステップ 2: 実装
* `StatSearch.tsx` の `tr` の `key` 属性を修正します。

### ステップ 3: ビルドおよび動作確認
* `npm run build` でビルドが正常に通ることを確認します。
* テスト `npx vitest run` が正常にパスすることを確認します。
* ブラウザのデベロッパーツール（コンソール）を確認し、`Encountered two children with the same key` 警告が完全に解消されていることを確認します。

---

## 4. 実行結果 (2026-08-15 完了)

ユーザーの合意のもと、以下の通り実施しました：

1. **React key属性の一意化**:
   * [`src/components/StatSearch/StatSearch.tsx`](file:///home/arccosine/poke-tool/src/components/StatSearch/StatSearch.tsx#L303-L307) のテーブル行（`<tr>`）レンダリングにおいて、火力検索時はポケモンIDと技の英語名を結合したキー（`${item.pokemon.id}-${item.moveName?.en || ''}`）を、耐久検索時は従来通りポケモンID（`${item.pokemon.id}`）を一意の `key` として設定するように修正しました。
2. **動作およびビルド検証**:
   * `npx vitest run` を実行し、全45件のテストスイートが正常に Green でパスすることを確認しました。
   * `npm run build` を実行し、Viteプロダクションビルドが警告やエラーなく正常完了することを確認しました。
   * これにより、コンソールに発生していた `Encountered two children with the same key` 警告が完全に解消されました。
