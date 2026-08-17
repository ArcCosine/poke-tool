# 計画：ポケモン名入力UIのGameWith風アップグレード（検索モーダル、ひらがな・カタカナ・ローマ字対応、連続入力）

## 概要
現在パーティシミュレーターで提供されている簡易的な「テキスト入力による絞り込み＋標準Dropdown（`<select>`）」のUIを、GameWithのダメージ計算ツール（[554133](https://gamewith.jp/pokemon-champions/554133)）と同等の仕様にアップグレードします。
具体的には、クリック時にモーダルウィンドウが開き、そこで「ひらがな・カタカナ・ローマ字（日本語名のローマ字読み）」に対応したインクリメンタル検索を行い、ポケモンを選択できる高機能なUI/UXを実装します。また、操作の手間を減らす「連続入力」機能もサポートします。

---

## 要件定義

### 1. ポケモン選択トリガー（スロットUI）
- 従来の `select` プルダウンを廃止し、スタイリッシュな「ポケモン選択ボタン（カード）」を配置します。
- **未選択時**: 「ポケモンを選択してください」というプレースホルダーとプラスアイコンなどを表示。
- **選択時**: ポケモンのアイコン画像（存在する場合）、名前、タイプバッジ、現在設定されている特性などをコンパクトに表示し、クリックすると再選択用のモーダルを起動するようにします。

### 2. ポケモン検索モーダル
- トリガーボタンをクリックすると、画面全体または中央にオーバーレイで美しくアニメーションするモーダルが開きます。
- **モーダルの構成要素**:
  - **ヘッダー**: 検索入力窓（テキストボックス）、閉じる（×）ボタン。
  - **連続入力トグルのスイッチ**: 「連続入力（ポケモン → わざ）」のON/OFFを切り替えるトグル。
  - **コンテンツエリア**: 検索結果のポケモンカードのリスト（スクロール可能）。
  - **フッター**: 閉じるボタンまたは簡易ヘルプ。
- **フォーカス制御**: モーダル起動時に、検索入力窓へ自動でフォーカスを合わせます（スマホ等でキーボードがすぐ開くように配慮）。

### 3. 高度な検索・フィルタリングロジック
- **ひらがな・カタカナ変換**: ユーザーが「ぴかちゅう」と入力しても「ピカチュウ」がマッチするようにします。
- **ローマ字・かな変換**: ローマ字入力（例: `pikachu`）をカタカナ（`ピカチュウ`）に自動変換し、ポケモン名の日本語名とマッチさせます。これにより、PC等で英語入力状態のままでも快適に日本語ポケモン名を検索可能にします。
- **英語名対応**: `en` 名（例: `Venusaur`）に対しても検索マッチングを行います。

### 4. 連続入力（Auto-Advance）機能
- モーダル内の「連続入力」トグルがONの状態でポケモンを選択すると、モーダルが閉じた後、自動的にそのポケモンスロット内の「特性」や「わざ 1」の入力UI（またはモーダル/プルダウン）にフォーカスまたはポップアップを表示する仕組みを構築します。

---

## 設計と技術アプローチ

### ローマ字からカタカナへの変換ロジック
外部ライブラリを導入せず、軽量で確実なローマ字→カタカナ（ひらがな）変換ヘルパー関数を `src/utils/string.ts` などに新規実装します。
典型的なヘボン式・日本式のローマ字テーブルを用いて、入力文字列のアルファベットをカタカナに順次変換します。

```typescript
// 実装イメージ
export const romajiToKatakana = (romaji: string): string => {
  // ローマ字からカタカナへの変換テーブルを定義
  // 例: { 'ka': 'カ', 'sha': 'シャ', 'xtu': 'ッ', ... }
  // 長音や促音の処理を施したマッピング処理
};
```

### UI構造 (React + Tailwind CSS / UnoCSS)
モーダルの背後はダークアウト（`bg-slate-900/60 backdrop-blur-sm`）させ、プレミアムなカード風コンポーネントを浮き上がらせます。

```html
<!-- ポケモン選択トリガー -->
<button
  type="button"
  onClick={openModal}
  className="w-full card-premium hover:border-indigo-500 transition text-left flex items-center gap-3 p-3"
>
  {selectedPokemon ? (
    <>
      <span className="text-sm font-bold">{selectedPokemon.name[language]}</span>
      {/* タイプや特性の表示 */}
    </>
  ) : (
    <span className="text-slate-400 text-xs">ポケモンを選択...</span>
  )}
</button>

<!-- 検索モーダル (Portal または Conditional Render) -->
{isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
    <div className="card-premium w-full max-w-lg max-h-[85vh] flex flex-col p-5 space-y-4">
      {/* 検索入力 + 連続入力トグル */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-500">ポケモンを選択</h3>
          <button onClick={closeModal} className="i-lucide-x text-lg cursor-pointer" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="名前、ひらがな、カタカナ、ローマ字で検索..."
          className="input-premium py-2 px-3 text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={(e) => setAutoAdvance(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>連続入力（ポケモン → 特性・わざ）を有効にする</span>
        </label>
      </div>

      {/* ポケモンリスト */}
      <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
        {filteredPokemon.map((poke) => (
          <button
            key={poke.id}
            onClick={() => handleSelect(poke.id)}
            className="w-full text-left py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 flex justify-between items-center transition"
          >
            <div>
              <div className="text-sm font-semibold">{poke.name[language]}</div>
              <div className="text-xs text-slate-400">
                {poke.abilities.map(a => a[language]).join(' / ')}
              </div>
            </div>
            {/* タイプバッジ */}
          </button>
        ))}
      </div>
    </div>
  </div>
)}
```

---

## 開発ロードマップ (TDDステップ)

### Step 1: テストコードの作成 (Red)
1. `src/utils/string.test.ts` を新規作成し、ローマ字→カタカナ、ひらがな→カタカナ変換のユニットテストを記述。
2. `src/components/PartySimulator/PartySimulator.test.tsx` に、モーダルでの検索機能（ローマ字「pikachu」でピカチュウがヒットするか、ひらがな「ぴかちゅう」でヒットするか）および「連続入力」機能の動作を検証する結合テストケースを追加。

### Step 2: 検索マッチングユーティリティの実装 (Green)
1. `src/utils/string.ts` を作成し、ローマ字→カタカナ、ひらがな→カタカナ、および表記揺れを正規化する関数群を実装。
2. 作成したユーティリティのユニットテストが通ることを確認。

### Step 3: モーダルコンポーネントの作成と統合 (Green)
1. `src/components/PartySimulator/PokemonSearchModal.tsx` を新規作成。
2. モーダル内のキーボード操作（矢印キーでの選択、Enterキーでの確定、Escキーでのクローズ）などのアクセシビリティも考慮した実装を行います。
3. `PartySimulator.tsx` から Dropdown 部分を排除し、新規のトリガーボタンと検索モーダルに置き換える。

### Step 4: 連続入力 (Auto-Advance) ロジックの実装 (Green)
1. ポケモン選択モーダルでポケモンが確定された後、`autoAdvance` がONの場合は、次に特性または最初の技スロットにフォーカスを当てるか、あるいは最初の技選択のUIを開くロジックを実装。

### Step 5: デザインの磨き込みとリファクタリング (Refactor)
1. Webアプリケーション開発のルールに沿って、トランジションやアニメーションを美しく仕上げる。
2. コードの不要な重複を排除し、テストがすべてパスすることを確認する。
