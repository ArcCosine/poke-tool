# 計画：ポケモンスロットでのアイコン表示部分の専用化と分離

## 概要
現在、選択後のトリガーボタン（入力ボックス）の内部に直接表示しているポケモンのアイコン画像を、入力ボックスから完全に分離します。
代わりに「専用のアイコン表示枠」をトリガーボタンの左側に独立して設け、未選択時にはプレースホルダー（疑問符など）を、選択時には対応するポケモンのドット絵スプライト画像を美しく表示します。これにより、GameWithのUIスタイルと同様にビジュアルとテキスト選択UIがすっきりと整理された状態を作ります。

---

## 要件定義と詳細設計

### 1. レイアウトの変更
各メンバースロットの「ポケモン」入力セルを `flex items-center gap-3` の構成にします。
- **左側 (専用アイコンエリア)**:
  - 固定サイズ（縦横 48px / `w-12 h-12`）のプレミアムなカード枠を配置。
  - **未選択時**: 薄いグレーのはてなマーク（`i-lucide-help-circle`）等のプレースホルダーを表示。
  - **選択時**: PokeAPIのドット絵画像を枠いっぱいに表示。
- **右側 (選択トリガーボタン)**:
  - 従来の `button` から `<img>` タグを取り除き、テキストのみを表示するシンプルな入力コントロール（プレースホルダーまたはポケモン名を表示）にします。

### 2. コード設計 (`PartySimulator.tsx`)
該当するセル部分を以下のように再構築します。

```html
<div className="flex items-center gap-3">
  {/* 専用のアイコン表記部分 */}
  <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
    {currentPoke ? (
      <img
        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${currentPoke.id}.png`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
        alt={currentPoke.name[language]}
        className="w-12 h-12 object-contain"
        loading="lazy"
      />
    ) : (
      <span className="i-lucide-help-circle text-slate-400 text-xl" />
    )}
  </div>

  {/* ポケモン選択トリガー（入力ボックス） */}
  <div className="flex-1 min-w-0">
    <label
      htmlFor={`pokemon-select-trigger-${index}`}
      className="block text-xs font-semibold text-slate-500 mb-1"
    >
      {t('pokemon')} #{index + 1}
    </label>
    <button
      id={`pokemon-select-trigger-${index}`}
      type="button"
      onClick={() => setActiveSlotIndex(index)}
      className="w-full text-left input-premium py-2.5 px-3 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition font-medium"
      aria-label={
        currentPoke
          ? `${currentPoke.name[language]}`
          : `ポケモン #${index + 1}を選択`
      }
    >
      {currentPoke ? (
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
          {currentPoke.name[language]}
        </span>
      ) : (
        <span className="text-sm text-slate-400 dark:text-slate-500 truncate">
          -- {t('selectPokemon')} --
        </span>
      )}
      <span className="i-lucide-chevron-down text-slate-400 text-base shrink-0" />
    </button>
  </div>
</div>
```

---

## 開発ロードマップ (TDDステップ)

### Step 1: テストコードの修正 (Red)
1. `PartySimulator.test.tsx` の結合テストのアサーションで、画像（`sprites/pokemon/25.png`）がトリガーボタンの**内部ではなく**、独立した画像要素としてドキュメント内にレンダリングされていることを検証するテスト内容に適応させます。

### Step 2: 実装 (Green)
1. [`PartySimulator.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx) を上記の設計に従って書き換えます。
2. テストを実行し、Greenになることを確認します。

### Step 3: リファクタリング & ビルド確認 (Refactor)
1. 余白やレスポンシブ時の見栄えを確認し、調整を行います。
2. `npm run build` を実行し、プロダクションビルドが正常に完了することを確認します。
