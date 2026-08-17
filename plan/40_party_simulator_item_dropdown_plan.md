# 計画：持ち物のドロップダウン（セレクトボックス）選択化

## 概要
現在、自由入力（テキストインプット）になっている「持ち物」の入力を、他の特性や能力補正と同様にドロップダウン（`<select>`）形式のUIへと移行します。
これにより、ユーザーの入力揺れをなくし、存在する持ち物データのみを選択できるよう使いやすさを向上させます。

---

## 詳細設計

### 1. 持ち物マスターデータの読み込み (`PartySimulator.tsx`)
- `db.loadMasterData()` の返り値（`data.items`）から持ち物の一覧を取得します。
- `itemsData` 状態を定義し、ロードしたデータを格納します。

```typescript
import { db, type MoveMaster, type PokemonMaster, type ItemMaster } from '../../utils/db';

const [itemsData, setItemsData] = useState<ItemMaster[]>([]);

// ... (useEffect 内)
db.loadMasterData()
  .then((data) => {
    setPokemonData(data.pokemon);
    setMovesData(data.moves);
    setItemsData(data.items); // ロード
  });
```

### 2. 持ち物入力UIのドロップダウン化
- 持ち物の `input` を `select` に変更します。
- **非メガポケモンの場合**: `itemsData` に定義された持ち物リストを選択肢として表示します。
- **メガポケモンの場合**（ロック時）: 自動入力されたメガストーン（例: `フシギバナイト`）のみを選択肢に表示し、`disabled` にします。

```html
{/* 持ち物 */}
<div>
  <label
    htmlFor={`item-select-${index}`}
    className="block text-xs font-semibold text-slate-500 mb-1"
  >
    {language === 'ja' ? '持ち物' : 'Held Item'}
  </label>
  <select
    id={`item-select-${index}`}
    value={member.item || ''}
    disabled={currentPoke.name.ja.startsWith('メガ') && currentPoke.name.ja !== 'メガレックウザ'}
    onChange={(e) =>
      updateMember(index, { item: e.target.value })
    }
    className="input-premium py-2 text-sm cursor-pointer w-full box-border disabled:opacity-60 disabled:cursor-not-allowed"
  >
    <option value="">{language === 'ja' ? '-- 持ち物なし --' : '-- No Item --'}</option>
    {currentPoke.name.ja.startsWith('メガ') && currentPoke.name.ja !== 'メガレックウザ' ? (
      <option value={member.item}>{member.item}</option>
    ) : (
      itemsData.map((item) => (
        <option key={item.id} value={language === 'ja' ? item.name.ja : item.name.en}>
          {language === 'ja' ? item.name.ja : item.name.en}
        </option>
      ))
    )}
  </select>
</div>
```

---

## 開発ロードマップ (TDDステップ)

### Step 1: テストコードの修正 (Red)
1. `PartySimulator.test.tsx` の mockSetup で `items` のモックデータ（こだわりスカーフなど）を追加します。
2. テストケースの `screen.getByRole('textbox', { name: /持ち物/i })` を `screen.getByRole('combobox', { name: /持ち物/i })` に変更し、ドロップダウンが機能することをテストで確認します。

### Step 2: 実装 (Green)
1. [`PartySimulator.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx) に `ItemMaster` 型をインポートし、`itemsData` ステートをロード。
2. 持ち物インプットを `select` に書き換え。
3. テストを実行し、Greenになることを確認。

### Step 3: リファクタリング & ビルド確認 (Refactor)
1. `npm run build` を実行し、プロダクションビルドが正常に完了することを確認します。
