# 27_ボタンのフラットデザイン化および指数ソートボタンの偽装化計画

本計画は、全般的なボタンのフラットデザイン化を適用し、かつ「指数」ソートヘッダーのアウトライン枠を完全に除去しつつ、ユーザーがソートボタンだと気付かない（敢えてボタンらしくない）ステルスなデザインへと修正する手順を定義します。

---

## 1. 現状分析と課題

### 課題
1. 現在の primary ボタン (`btn-primary`) にはグラデーションや立体的なシャドウ、沈み込みエフェクトなどの 3D/立体的なスタイルが残っています。これらをクリーンな「フラットデザイン」に変更する必要があります。
2. テーブルの「指数」ヘッダーがソート機能を持つようになり、クリック時などにブラウザ標準のフォーカスリング（枠線）が表示されることがあります。また、ホバー時に色が変わるなど「クリック可能なボタン」としての主張が強いです。
3. 要請により、この「指数」ソート機能だけは「一見ボタンだと思わない（敢えてボタンらしくない）ステルスなデザイン」にし、かつクリック時の枠表示を完全に消去する必要があります。

### 解決策
1. **全般的なフラットデザイン化 (`uno.config.ts` の修正)**:
   * `btn-primary` から立体グラデーション、シャドウ、沈み込み(`active:scale-95`) を完全に削除し、一様なフラットカラー背景 (`bg-indigo-600`) とシンプルな色の変化のみにします。
   * `btn-secondary` の枠線や背景色も、よりフラットでシンプルな色彩に変更します。
   * `ImageAnalyzer.tsx` 内にあるインラインのグラデーションボタンも同様に、フラットな背景色に書き換えます。
2. **指数ソートボタンのステルス化と枠消去 (`StatSearch.tsx` の修正)**:
   * 指数ヘッダーボタンに `focus:outline-none focus:ring-0 focus-visible:outline-none` を指定して、クリック時等のフォーカス枠（枠表示）を完全に無効化します。
   * `cursor-default` を指定してホバー時もポインター（手の形）に変化しないようにします。
   * ホバー時のカラー変更 (`hover:text-indigo-600`) を削除し、単なる静的なヘッダーテキストと同様の淡い文字色を維持します。
   * ソートの並び順を示す矢印インジケーターの色を `text-slate-400/60`（非常に控えめな淡いグレー）にし、目立たせずに静かに変化を知らせる表示にします。

---

## 2. 設計詳細

### (1) ボタンのフラット化 (`uno.config.ts`)
```typescript
    'btn-primary': 'px-4 py-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-lg font-medium transition-colors duration-200 cursor-pointer',
    'btn-secondary': 'px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-medium border border-slate-300 dark:border-slate-700 transition-colors duration-200 cursor-pointer',
```

### (2) 指数ソートヘッダーのステルス化 (`src/components/StatSearch/StatSearch.tsx`)
```typescript
                <th className="py-4 px-6 text-right pr-8">
                  <button
                    onClick={() =>
                      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                    }
                    className="appearance-none bg-transparent border-none p-0 focus:outline-none focus:ring-0 focus-visible:outline-none select-none text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider ml-auto inline-flex items-center gap-1 cursor-default"
                  >
                    {t('value')}
                    {sortOrder === 'desc' ? (
                      <span className="i-lucide-arrow-down text-slate-400/60 dark:text-slate-500/60 text-sm w-4 h-4" />
                    ) : (
                      <span className="i-lucide-arrow-up text-slate-400/60 dark:text-slate-500/60 text-sm w-4 h-4" />
                    )}
                  </button>
                </th>
```

### (3) インライングラデーションボタンのフラット化 (`src/components/ImageAnalyzer/ImageAnalyzer.tsx`)
```typescript
                <button
                  type="button"
                  onClick={importToParty}
                  className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 font-semibold text-white"
                >
```

---

## 3. 開発および検証ステップ

### ステップ 1: 計画の合意
* 本計画についてユーザーと合意します。

### ステップ 2: 実装
* `uno.config.ts`, `StatSearch.tsx`, `ImageAnalyzer.tsx` をそれぞれ上記の設計通りに変更します。

### ステップ 3: ビルドおよび動作確認
* `npm run build` でビルドが正常に通ることを確認します。
* テスト `npx vitest run` が正常にパスすることを確認します。
* 実際にブラウザで確認し：
  * 全般的なボタンから立体的な影やグラデーションが消え、美しいフラットデザインになっていること。
  * 「指数」ヘッダーが単なるテキストに見え（枠やホバー色が無く、カーソルも手の形にならない）、クリックした時にフォーカス枠を表示せずにソート方向（矢印）のみが切り替わることを確認します。

---

## 4. 実行結果 (2026-08-15 完了)

ユーザーの要望に基づいて以下の変更を実施し、正しく適用されたことを確認しました：

1. **指数ヘッダーボタンのステルス化と枠消去**:
   * [`src/components/StatSearch/StatSearch.tsx`](file:///home/arccosine/poke-tool/src/components/StatSearch/StatSearch.tsx#L306-L320) において、ソートボタンの枠（アウトライン）表示を完全に無効化するため、`focus:outline-none focus:ring-0 focus-visible:outline-none` を指定しました。
   * ホバー時のカラー変更やアンダーライン等の装飾をすべて取り除き、`cursor-default` を設定することで、一見して通常の静的な表ヘッダーテキスト（ボタンだと思わせないデザイン）と完全に同化させました。
   * ソートの切り替えを示す矢印アイコンの色を `text-slate-400/60`（非常に控えめな淡いグレー）にし、目立たせずに静かに昇降を切り替えられるようにしました。
2. **全般的なボタンのフラット化**:
   * [`uno.config.ts`](file:///home/arccosine/poke-tool/uno.config.ts#L13-L14) の `btn-primary` と `btn-secondary` の定義を修正し、立体グラデーション、ドロップシャドウ、およびクリック時の沈み込みアニメーション（`active:scale-95`）を完全に排除しました。これにより、平坦で一様な背景色と、ホバー時の滑らかな色の遷移だけを持つモダンなフラットデザインに統一しました。
   * [`src/components/ImageAnalyzer/ImageAnalyzer.tsx`](file:///home/arccosine/poke-tool/src/components/ImageAnalyzer/ImageAnalyzer.tsx#L1241-L1250) 内にインラインで記述されていたグラデーションボタン（一括インポートボタン）も、フラットな背景色（`bg-emerald-600`）へ変更しました。
3. **ビルドおよびテスト検証**:
   * `npx vitest run` を実行し、全49件のテストが正常にパスすることを確認しました。
   * `npm run build` を実行し、TypeScriptのビルドとViteのプロダクションビルドが正常完了することを確認しました。
   * これにより、ユーザーは意図せずボタンに囲まれるノイズのない、極めてフラットで美しく洗練されたUIでの操作が可能になりました。
