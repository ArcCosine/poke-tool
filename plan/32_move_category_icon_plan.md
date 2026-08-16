# 計画書：わざ分類アイコン（ローカル画像アセット版）の導入計画

本計画は、現在テキスト表示（例: `(物理)` `(特殊)`) になっている「わざの分類」について、GameWith等で使われているアイコン画像をローカルアセットとして読み込み、表示するための計画です。
外部ネットワークへのアクセスを行わず、ローカルから直接読み込んで高速に動作させます。

## 1. 背景と目的
現在、使用技の分類はテキストのみで表示されています。
より直感的な視覚認識と、GAMEWITH等と同等のプレミアムなデザインを実現するため、物理および特殊の専用アイコン画像をローカルに配備して表示します。
また、モバイルでのテキストの折り返しを減らすため、モバイル時はアイコンのみ表示し、PC時はアイコン＋テキストを併記するレスポンシブデザインにします。

## 2. 仕様定義

### 2.1. 画像アセットの配置
以下の画像を、プロジェクトローカルの `public/assets/categories/` ディレクトリにダウンロードし、配置しました。
- **物理 (Physical)**:
  - ファイルパス: `/assets/categories/physical.jpg`
  - 元画像: `https://img.gamewith.jp/article_tools/pokemon-champions/gacha/buturi.jpg`
- **特殊 (Special)**:
  - ファイルパス: `/assets/categories/special.jpg`
  - 元画像: `https://img.gamewith.jp/article_tools/pokemon-champions/gacha/tokusyu.jpg`

### 2.2. レイアウトのレスポンシブ設計
使用技セル（`td`）内の分類表示部分に適用します。

#### PC表示（タブレット以上）
- デザイン: `[分類アイコン] (分類テキスト)`
- 例: `[物理アイコン] (物理)`、`[特殊アイコン] (特殊)`
- 配置: `inline-flex items-center gap-1` により横一列に綺麗に並べます。
- 画像サイズ: `w-6.5 h-4` (アスペクト比を維持し、カプセル型のアイコン画像が美しく見えるように設定)。

#### モバイル表示（スマホサイズ）
- デザイン: `[分類アイコン]` のみ表示し、テキストは非表示。
- 配置: これにより、モバイルでわざセルの「わざ名」「わざタイプ」「分類」が並んだ際の縦の占有スペースを最小化します。

---

## 3. 実装手順

### 3.1. `StatSearch.tsx` の `MoveCategoryIcon` コンポーネントの修正
ダウンロードしたローカル画像を `<img>` タグで表示するコンポーネントに変更します。

```typescript
const MoveCategoryIcon = ({ category }: { category: string }) => {
  if (category === 'physical') {
    return (
      <span className="inline-flex items-center shrink-0 select-none" title="物理 / Physical">
        <img
          src="/assets/categories/physical.jpg"
          alt="物理"
          className="w-7 h-4.5 object-contain rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </span>
    );
  }
  if (category === 'special') {
    return (
      <span className="inline-flex items-center shrink-0 select-none" title="特殊 / Special">
        <img
          src="/assets/categories/special.jpg"
          alt="特殊"
          className="w-7 h-4.5 object-contain rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </span>
    );
  }
  return null;
};
```

### 3.2. 検証とビルド
1. `npm run build` を実行し、TypeScriptなどの不具合がないか検証します。
2. `npx vitest run` にて、既存の全てのユニットテストに影響がないか検証します。

---

上記の実装計画について問題がなければ、「進めてください」などのご指示をお願いいたします。
指示をいただいた後、実装に着手します。
