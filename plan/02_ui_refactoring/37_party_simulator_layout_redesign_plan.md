# 計画：パーティスロットのレイアウト変更（ポケモン名ラベル化、縦積み改行、タイプ表記のアイコン横移動）

## 概要
ユーザーからの指示に基づき、パーティシミュレーターのポケモンスロット内レイアウトを以下の通り再構築します。

1. **ポケモン名表記の明確化**
   - ラベルを `ポケモン #${index + 1}` から `ポケモン名 #${index + 1}` に変更します。
   - トリガーボタン（セレクト部分）の未選択時のテキストを `-- ポケモンを選択 --` から `ポケモン名を選択`（英語では `Select Pokémon`）に変更します。
2. **タイプ表示のアイコン横移動**
   - タイプ表示をスロット最下部から、新設した「専用のポケモンアイコン枠」のすぐ右隣に移動します。
   - タイプ表示は、ランキングと同様の「タイプアイコン ＋ テキスト」の縦積みで配置します。
3. **入力項目の縦積み（改行）化**
   - 「特性選択」「能力補正」「持ち物」がPC表示で横一列に並んでいるのを廃止し、すべて縦並び（改行されたブロック）で配置するように修正します。これにより、持ち物入力幅のはみ出しを物理的に防止し、見やすさを向上させます。

---

## 詳細設計

### 1. 新しいレイアウト構造 (HTML/JSX)

```html
<div className="flex flex-col gap-4">
  {/* ポケモン選択・アイコン・タイプ表示の行 */}
  <div className="flex items-center gap-4">
    {/* 専用のアイコン枠 ＋ タイプ表示の横並び */}
    <div className="flex items-center gap-3 shrink-0">
      {/* ポケモンアイコン画像 */}
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

      {/* タイプ表示 (アイコンの右隣に縦積み) */}
      {currentPoke && (
        <div className="flex flex-col gap-1.5 shrink-0">
          {currentPoke.types.map((typeKey) => (
            <span
              key={typeKey}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 select-none"
            >
              <img
                src={`/assets/type-icons/${typeKey}.svg`}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                alt={typeTranslations[typeKey]?.[language] || typeKey}
                className="w-4 h-4 object-contain shrink-0"
                loading="lazy"
              />
              <span>
                {typeTranslations[typeKey]?.[language] || typeKey}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>

    {/* ポケモン選択トリガー（入力ボックス） */}
    <div className="flex-1 min-w-0">
      <label
        htmlFor={`pokemon-select-trigger-${index}`}
        className="block text-xs font-semibold text-slate-500 mb-1"
      >
        {language === 'ja' ? `ポケモン名 #${index + 1}` : `Pokémon Name #${index + 1}`}
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
            {language === 'ja' ? 'ポケモン名を選択' : 'Select Pokémon'}
          </span>
        )}
        <span className="i-lucide-chevron-down text-slate-400 text-base shrink-0" />
      </button>
    </div>
  </div>

  {/* 特性、能力補正、持ち物の縦積みグループ */}
  {currentPoke && (
    <div className="flex flex-col gap-4 max-w-xs sm:max-w-sm md:max-w-md">
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
</div>
```

---

## 開発ロードマップ (TDDステップ)

### Step 1: テストコードの修正 (Red)
1. `PartySimulator.test.tsx` にて、ポケモン名ラベル `ポケモン名 #1` への変更や、ボタンのプレースホルダー変更に対応するようテストアサーションを修正・更新します。

### Step 2: 実装 (Green)
1. [`PartySimulator.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx) を上記の設計通り、横並びグリッドから縦積み（`flex-col`）のマークアップに変更し、タイプ表示の移動およびラベル・プレースホルダーの修正を行います。
2. テストを実行し、Greenになることを確認します。

### Step 3: リファクタリング & ビルド確認 (Refactor)
1. 余白やレスポンシブ時の外観を調整します。
2. `npm run build` を実行し、コンパイル・ビルドが成功することを確認します。
