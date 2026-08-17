# 計画：ポケモン選択ダイアログの改善（インプットはみ出し修正、フラットデザイン化・間隔拡大）および入力項目の横一列表示化

## 概要
ユーザーからのフィードバックに基づき、以下のUI修正およびレイアウト調整を行います。

1. **ポケモン選択ダイアログの入力欄はみ出しの修正**
   - [`PokemonSearchModal.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PokemonSearchModal.tsx) の検索インプットに `box-border` クラスを明示的に指定し、パディングによるコンテナ外へのはみ出しを確実に防止します。
2. **ダイアログ内のポケモン選択ボタンをフラットデザイン化 ＋ 上下間隔拡大**
   - ボタンの角丸（`rounded-xl`）を `rounded-none`（角丸なし）に変更し、全体の影などを排除したシンプルなフラットな行にします。
   - `divide-y` による境界線で区切られた美しいリストにします。
   - ボタンの上下パディングを `py-2` から `py-3.5`（14px）に広げることで、ボタン同士の上下間隔を広げ、視認性と操作性を向上させます。
3. **「特性」「能力補正」「持ち物」の横一列化**
   - [`PartySimulator.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx) で縦積みになっていた基本情報を、`grid grid-cols-1 sm:grid-cols-3 gap-4` の3列グリッドで横一列に並ぶよう再変更します（1行目のポケモン選択行とは完全に分離されているため、はみ出しはありません）。

---

## 詳細設計

### 1. ポケモン選択モーダルの修正 (`PokemonSearchModal.tsx`)

#### 検索入力欄のはみ出し修正
```html
<input
  ref={inputRef}
  type="text"
  placeholder="..."
  className="input-premium pl-9 py-2 px-3 text-sm w-full font-medium box-border"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>
```

#### リストボタンのフラットデザイン化 ＋ 上下間隔拡大
```html
<button
  key={poke.id}
  type="button"
  onClick={() => onSelect(poke.id)}
  className="w-full text-left py-3.5 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 flex items-center justify-between transition duration-150 rounded-none cursor-pointer"
>
  ...
</button>
```

---

### 2. ポケモンスロット入力欄の横一列化 (`PartySimulator.tsx`)

特性、能力補正、持ち物を `grid-cols-3` のコンテナで囲みます。

```html
{currentPoke && (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {/* 特性選択 */}
    <div>
      <label
        htmlFor={`ability-select-${index}`}
        className="block text-xs font-semibold text-slate-500 mb-1"
      >
        {t('selectAbility')}
      </label>
      <select
        id={`ability-select-${index}`}
        value={member.ability}
        onChange={(e) =>
          updateMember(index, { ability: e.target.value })
        }
        className="input-premium py-2 text-sm cursor-pointer w-full"
      >
        {currentPoke.abilities.map((a) => (
          <option key={a.ja} value={a.ja}>
            {a[language]}
          </option>
        ))}
      </select>
    </div>

    {/* 能力補正 */}
    <div>
      <label
        htmlFor={`nature-select-${index}`}
        className="block text-xs font-semibold text-slate-500 mb-1"
      >
        {language === 'ja' ? '能力補正' : 'Nature'}
      </label>
      <select
        id={`nature-select-${index}`}
        value={member.nature || 'neutral'}
        onChange={(e) =>
          updateMember(index, { nature: e.target.value })
        }
        className="input-premium py-2 text-sm cursor-pointer w-full"
      >
        {NATURES.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name[language]}
          </option>
        ))}
      </select>
    </div>

    {/* 持ち物 */}
    <div>
      <label
        htmlFor={`item-input-${index}`}
        className="block text-xs font-semibold text-slate-500 mb-1"
      >
        {language === 'ja' ? '持ち物' : 'Held Item'}
      </label>
      <input
        id={`item-input-${index}`}
        type="text"
        value={member.item || ''}
        placeholder={
          language === 'ja'
            ? '例: こだわりスカーフ'
            : 'e.g. Choice Scarf'
        }
        onChange={(e) =>
          updateMember(index, { item: e.target.value })
        }
        className="input-premium py-2 text-sm font-semibold w-full"
      />
    </div>
  </div>
)}
```

---

## 開発ロードマップ (TDDステップ)

### Step 1: テストコードの確認 (Red)
- 今回のレイアウト変更により、既存のテスト（特にアサーションや要素の位置など）に問題がないかを検証します。
- `PartySimulator.test.tsx` のアサーションは、要素の有無や順序をチェックしているため、構造が `grid` に戻ってもテストはそのままパスする見込みです。

### Step 2: 実装 (Green)
1. [`PokemonSearchModal.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PokemonSearchModal.tsx) を編集し、`input` の `box-border` 適用と、各行の `rounded-none` および `py-3.5 px-4` へのパディング調整を行います。
2. [`PartySimulator.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx) を編集し、入力項目（特性・性格・持ち物）を横一列の `grid-cols-3` 構成に配置し直します。
3. テストを実行し、Greenになることを確認します。

### Step 3: リファクタリング & ビルド確認 (Refactor)
1. 外観の最終調整を行います。
2. `npm run build` を実行して、プロダクションビルドが成功することを確認します。
