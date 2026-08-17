# 計画：メガポケモンの持ち物（メガストーン）固定化および入力フォームのはみ出し（box-border）修正

## 概要
ユーザーからのフィードバックに基づき、パーティシミュレーターにおいて以下の2つの不具合修正と機能追加を行います。

1. **メガポケモンの持ち物（メガストーン）固定化**
   - メンバーにメガシンカポケモン（例: メガフシギバナ、メガリザードンX等）が選択された際、そのポケモンに適合する「メガストーン（例: フシギバナイト、リザードナイトX等）」を持ち物に自動設定します。
   - メガストーンが固定された状態では、持ち物の入力インプットを `disabled`（無効化）にして、ユーザーが他の持ち物に変更できないように制限します。
   - ※メガシンカのために持ち物を必要としない「メガレックウザ」については、対象外（持ち物を自由に変更可能）とします。

2. **持ち物入力フォームのはみ出し修正 (`box-border` の適用)**
   - 持ち物の `input` 要素がグリッドセルの幅を越えてはみ出る現象を確実に防ぐため、明示的に `box-border` クラスを付与します。これにより、パディングやボーダーの幅を含めたサイズが親コンテナの100%幅に完全に収まるようになります。
   - 同様にはみ出しの懸念がある「特性選択」「能力補正」の `select` 要素にも `box-border` を付与します。

---

## 詳細設計

### 1. メガストーンのマッピングテーブルの定義
`PartySimulator.tsx` に以下の辞書を定義し、ポケモン名から対応するメガストーンを取得できるようにします。

```typescript
const megaStoneMap: Record<string, { ja: string; en: string }> = {
  'メガフシギバナ': { ja: 'フシギバナイト', en: 'Venusaurite' },
  'メガリザードンX': { ja: 'リザードナイトX', en: 'Charizardite X' },
  'メガリザードンY': { ja: 'リザードナイトY', en: 'Charizardite Y' },
  'メガカメックス': { ja: 'カメックスナイト', en: 'Blastoisinite' },
  'メガスピアー': { ja: 'スピアーナイト', en: 'Beedrillite' },
  'メガピジョット': { ja: 'ピジョットナイト', en: 'Pidgeotite' },
  'メガフーディン': { ja: 'フーディナイト', en: 'Alakazite' },
  'メガヤドラン': { ja: 'ヤドランナイト', en: 'Slowbronite' },
  'メガゲンガー': { ja: 'ゲンガナイト', en: 'Gengarite' },
  'メガガルーラ': { ja: 'ガルーラナイト', en: 'Kangaskhanite' },
  'メガカイロス': { ja: 'カイロスナイト', en: 'Pinsirite' },
  'メガギャラドス': { ja: 'ギャラドスナイト', en: 'Gyaradosite' },
  'メガプテラ': { ja: 'プテラナイト', en: 'Aerodactylite' },
  'メガデンリュウ': { ja: 'デンリュウナイト', en: 'Ampharosite' },
  'メガハッサム': { ja: 'ハッサムナイト', en: 'Scizorite' },
  'メガヘラクロス': { ja: 'ヘラクロスナイト', en: 'Heracronite' },
  'メガヘルガー': { ja: 'ヘルガナイト', en: 'Houndoominite' },
  'メガバンギラス': { ja: 'バンギラスナイト', en: 'Tyranitarite' },
  'メガジュカイン': { ja: 'ジュカインナイト', en: 'Sceptilite' },
  'メガバシャーモ': { ja: 'バシャーモナイト', en: 'Blazikenite' },
  'メガラグラージ': { ja: 'ラグラージナイト', en: 'Swampertite' },
  'メガサーナイト': { ja: 'サーナイトナイト', en: 'Gardevoirite' },
  'メガヤミラミ': { ja: 'ヤミラミナイト', en: 'Sablenite' },
  'メガクチート': { ja: 'クチートナイト', en: 'Mawilite' },
  'メガボスゴドラ': { ja: 'ボスゴドラナイト', en: 'Aggronite' },
  'メガチャーレム': { ja: 'チャーレムナイト', en: 'Medichamite' },
  'メガライボルト': { ja: 'ライボルトナイト', en: 'Manectrite' },
  'メガサメハダー': { ja: 'サメハダナイト', en: 'Sharpedonite' },
  'メガバクーダ': { ja: 'バクーダナイト', en: 'Cameruptite' },
  'メガチルタリス': { ja: 'チルタリスナイト', en: 'Altarianite' },
  'メガジュペッタ': { ja: 'ジュペッタナイト', en: 'Banettite' },
  'メガアブソル': { ja: 'アブソルナイト', en: 'Absolite' },
  'メガオニゴーリ': { ja: 'オニゴーリナイト', en: 'Glalitite' },
  'メガボーマンダ': { ja: 'ボーマンダナイト', en: 'Salamencite' },
  'メガメタグロス': { ja: 'メタグロスナイト', en: 'Metagrossite' },
  'メガラティアス': { ja: 'ラティアスナイト', en: 'Latiasite' },
  'メガラティオス': { ja: 'ラティオスナイト', en: 'Latiosite' },
  'メガディアンシー': { ja: 'ディアンシナイト', en: 'Diancite' },
  'メガエルレイド': { ja: 'エルレイドナイト', en: 'Galladite' },
  'メガtabunne': { ja: 'タブンネナイト', en: 'Audinite' },
  'メガミミロップ': { ja: 'ミミロップナイト', en: 'Lopunnite' },
  'メガハガネール': { ja: 'ハガネールナイト', en: 'Steelixite' },
  'メガユキノオー': { ja: 'ユキノオナイト', en: 'Abomasnowite' },
};
```

### 2. ポケモン決定時の持ち物自動入力処理 (`handleSelectPokemon`)
`handleSelectPokemon` の処理を拡張し、メガポケモンの場合に持ち物をセットします。

```typescript
const handleSelectPokemon = (masterId: number) => {
  if (activeSlotIndex === null) return;
  const index = activeSlotIndex;
  const poke = pokemonData.find((p) => p.id === masterId);
  
  // メガシンカポケモンの場合の持ち物自動判定
  let initialItem = '';
  if (poke && poke.name.ja.startsWith('メガ') && poke.name.ja !== 'メガレックウザ') {
    const mapped = megaStoneMap[poke.name.ja];
    initialItem = mapped ? (language === 'ja' ? mapped.ja : mapped.en) : (poke.name.ja.replace('メガ', '') + 'ナイト');
  }

  updateMember(index, {
    masterId,
    ability: poke?.abilities[0]?.ja || '',
    nature: 'neutral',
    item: initialItem,
    moves: [0, 0, 0, 0],
  });
  
  // ... (連続入力のオートアドバンス)
};
```

---

### 3. 入力項目の `box-border` 適用と無効化 (`PartySimulator.tsx`)

#### 持ち物インプットの修正
`disabled` 属性と `box-border` クラスを追加します。

```html
<input
  id={`item-input-${index}`}
  type="text"
  value={member.item || ''}
  disabled={currentPoke.name.ja.startsWith('メガ') && currentPoke.name.ja !== 'メガレックウザ'}
  placeholder={
    currentPoke.name.ja.startsWith('メガ') && currentPoke.name.ja !== 'メガレックウザ'
      ? (language === 'ja' ? 'メガストーン固定' : 'Mega Stone Fixed')
      : (language === 'ja' ? '例: こだわりスカーフ' : 'e.g. Choice Scarf')
  }
  onChange={(e) =>
    updateMember(index, { item: e.target.value })
  }
  className="input-premium py-2 text-sm font-semibold w-full box-border disabled:opacity-60 disabled:cursor-not-allowed"
/>
```

#### 特性・能力補正セレクトボックスの `box-border` 適用
同様に `box-border` を追加します。
```html
<select
  id={`ability-select-${index}`}
  ...
  className="input-premium py-2 text-sm cursor-pointer w-full box-border"
>
```
```html
<select
  id={`nature-select-${index}`}
  ...
  className="input-premium py-2 text-sm cursor-pointer w-full box-border"
>
```

---

## 開発ロードマップ (TDDステップ)

### Step 1: テストコードの作成 (Red)
1. `PartySimulator.test.tsx` に、「メガシンカポケモン（例：メガフシギバナ）を選択した際、持ち物入力が disabled になり、かつ自動的に対応するメガストーンが設定されること」を検証するテストを追加します。

### Step 2: 実装 (Green)
1. [`PartySimulator.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx) にマッピングを追加し、選択時の初期持ち物設定と、レンダリング時のインプット無効化（`disabled`）、`box-border` クラスの追加を行います。
2. テストを実行し、Greenになることを確認します。

### Step 3: リファクタリング & ビルド確認 (Refactor)
1. `npm run build` を実行し、プロダクションビルドが正常に完了することを確認します。
