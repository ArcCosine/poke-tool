# 計画：防御相性一貫性におけるタイプ表示のアイコン＋テキスト化

## 概要
パーティシミュレーター下部の「防御相性一貫性」パネルにおいて、各タイプを表示するUIを、火力ランキング（`StatSearch`）の表示と統一します。
具体的には、従来の背景色塗りつぶしのバッジから、タイプを表すアイコン画像（SVG）とテキストを横並びにする構成へと変更し、視覚的な一貫性を向上させます。

---

## 要件定義
- **アイコンとテキストの横並び表示**:
  - 各タイプのヘッダーとして、背景色バッジの代わりに、`/assets/type-icons/{type}.svg` を読み込み、その横に日本語/英語のタイプ名をテキストで配置します。
  - アイコン画像の読み込みに失敗した場合は、画像の崩れを防ぐために非表示（`style.display = 'none'`）にするエラーハンドリングを行います。
  - 表示崩れを防ぐため、アイコンとテキストは `inline-flex` と `justify-center` を使用して中央揃えにします。

---

## 設計とコード変更箇所

### `PartySimulator.tsx` の変更箇所
該当箇所（568行目付近）のタイプヘッダー描画部分を、以下のように書き換えます。

```html
<!-- 変更前 -->
<span
  className={`px-1.5 py-0.5 text-[10px] rounded font-semibold text-center w-full mb-2 ${
    typeColors[type] || 'bg-slate-500 text-white'
  }`}
>
  {typeTranslations[type]?.[language] || type}
</span>

<!-- 変更後 -->
<span
  className="inline-flex items-center justify-center gap-1.5 px-1.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 select-none w-full mb-2"
>
  <img
    src={`/assets/type-icons/${type}.svg`}
    onError={(e) => {
      (e.target as HTMLImageElement).style.display = 'none';
    }}
    alt=""
    className="w-4 h-4 object-contain shrink-0"
    loading="lazy"
  />
  <span>
    {typeTranslations[type]?.[language] || type}
  </span>
</span>
```

---

## 開発ロードマップ (TDDステップ)

### Step 1: テストコードの作成 (Red)
1. `src/components/PartySimulator/PartySimulator.test.tsx` に、防御相性一貫性セクションでタイプアイコン画像がレンダリングされていることを検証するテストケースを追加します。

### Step 2: 実装 (Green)
1. `PartySimulator.tsx` の該当するヘッダー表示箇所を、アイコン＋テキストの記述に書き換えます。
2. テストを実行し、テストが Green になることを確認します。

### Step 3: リファクタリング & ビルド確認 (Refactor)
1. スタイルやマークアップの微調整を行います。
2. `npm run build` を実行して、プロダクションビルドが成功することを確認します。
