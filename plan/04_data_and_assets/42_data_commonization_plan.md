# データ関連（タイプ翻訳・タイプカラー・メガストーン定義）の共通化計画

## 概要
`PartySimulator`、`PokemonSearchModal`、`StatSearch` などの複数コンポーネントで個別に重複定義されているデータや、コンポーネント肥大化の原因となっている定義データを共通モジュールへ抽出します。
これにより、重複コードの排除とコンポーネントのスリム化を行い、保守性を高めます。

---

## 共通化するデータ定義

新たに共通データ用モジュール `src/utils/pokemon.ts` を作成し、ポケモン関連の共通定数とユーティリティを集約します。

### 共通化対象データ
1. **`typeTranslations`**（タイプ名の和英翻訳データ）
   - 重複箇所: `PartySimulator.tsx` / `PokemonSearchModal.tsx` / `StatSearch.tsx`
2. **`typeColors`**（タイプごとの背景・文字色クラス定義）
   - 重複箇所: `PartySimulator.tsx` / `PokemonSearchModal.tsx`
3. **`megaStoneMap`**（メガシンカポケモンに対応するメガストーンのマッピング）
   - 重複箇所: `PartySimulator.tsx` 内で約50行にわたり定義されており、コンポーネント肥大化の要因となっています。
4. **`TYPES`**（全18タイプの一覧配列）
   - 現在 `src/utils/party.ts` に定義されていますが、タイプ翻訳などと密接に関連するため `src/utils/pokemon.ts` に移管します。

### 新規作成する `src/utils/pokemon.ts` の構成

```typescript
export const TYPES = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

export const typeTranslations: Record<string, { ja: string; en: string }> = {
  normal: { ja: 'ノーマル', en: 'Normal' },
  fire: { ja: 'ほのお', en: 'Fire' },
  water: { ja: 'みず', en: 'Water' },
  grass: { ja: 'くさ', en: 'Grass' },
  electric: { ja: 'でんき', en: 'Electric' },
  ice: { ja: 'こおり', en: 'Ice' },
  fighting: { ja: 'かくとう', en: 'Fighting' },
  poison: { ja: 'どく', en: 'Poison' },
  ground: { ja: 'じめん', en: 'Ground' },
  flying: { ja: 'ひこう', en: 'Flying' },
  psychic: { ja: 'エスパー', en: 'Psychic' },
  bug: { ja: 'むし', en: 'Bug' },
  rock: { ja: 'いわ', en: 'Rock' },
  ghost: { ja: 'ゴースト', en: 'Ghost' },
  dragon: { ja: 'ドラゴン', en: 'Dragon' },
  dark: { ja: 'あく', en: 'Dark' },
  steel: { ja: 'はがね', en: 'Steel' },
  fairy: { ja: 'フェアリー', en: 'Fairy' },
};

export const typeColors: Record<string, string> = {
  normal: 'bg-slate-400 text-slate-900',
  fire: 'bg-red-500 text-white',
  water: 'bg-blue-500 text-white',
  grass: 'bg-green-500 text-white',
  electric: 'bg-yellow-400 text-slate-900',
  ice: 'bg-cyan-400 text-slate-900',
  fighting: 'bg-amber-700 text-white',
  poison: 'bg-purple-500 text-white',
  ground: 'bg-amber-600 text-white',
  flying: 'bg-indigo-300 text-slate-900',
  psychic: 'bg-pink-500 text-white',
  bug: 'bg-lime-500 text-slate-900',
  rock: 'bg-yellow-600 text-white',
  ghost: 'bg-violet-700 text-white',
  dragon: 'bg-indigo-700 text-white',
  dark: 'bg-slate-800 text-white',
  steel: 'bg-zinc-500 text-white',
  fairy: 'bg-rose-400 text-slate-900',
};

export const megaStoneMap: Record<string, { ja: string; en: string }> = {
  メガフシギバナ: { ja: 'フシギバナイト', en: 'Venusaurite' },
  メガリザードンX: { ja: 'リザードナイトX', en: 'Charizardite X' },
  メガリザードンY: { ja: 'リザードナイトY', en: 'Charizardite Y' },
  メガカメックス: { ja: 'カメックスナイト', en: 'Blastoisinite' },
  メガスピアー: { ja: 'スピアーナイト', en: 'Beedrillite' },
  メガピジョット: { ja: 'ピジョットナイト', en: 'Pidgeotite' },
  メガフーディン: { ja: 'フーディナイト', en: 'Alakazite' },
  メガヤドラン: { ja: 'ヤドランナイト', en: 'Slowbronite' },
  メガゲンガー: { ja: 'ゲンガナイト', en: 'Gengarite' },
  メガガルーラ: { ja: 'ガルーラナイト', en: 'Kangaskhanite' },
  メガカイロス: { ja: 'カイロスナイト', en: 'Pinsirite' },
  メガギャラドス: { ja: 'ギャラドスナイト', en: 'Gyaradosite' },
  メガプテラ: { ja: 'プテラナイト', en: 'Aerodactylite' },
  メガデンリュウ: { ja: 'デンリュウナイト', en: 'Ampharosite' },
  メガハッサム: { ja: 'ハッサムナイト', en: 'Scizorite' },
  メガヘラクロス: { ja: 'ヘラクロスナイト', en: 'Heracronite' },
  メガヘルガー: { ja: 'ヘルガナイト', en: 'Houndoominite' },
  メガバンギラス: { ja: 'バンギラスナイト', en: 'Tyranitarite' },
  メガジュカイン: { ja: 'ジュカインナイト', en: 'Sceptilite' },
  メガバシャーモ: { ja: 'バシャーモナイト', en: 'Blazikenite' },
  メガラグラージ: { ja: 'ラグラージナイト', en: 'Swampertite' },
  メガサーナイト: { ja: 'サーナイトナイト', en: 'Gardevoirite' },
  メガヤミラミ: { ja: 'ヤミラミナイト', en: 'Sablenite' },
  メガクチート: { ja: 'クチートナイト', en: 'Mawilite' },
  メガボスゴドラ: { ja: 'ボスゴドラナイト', en: 'Aggronite' },
  メガチャーレム: { ja: 'チャーレムナイト', en: 'Medichamite' },
  メガライボルト: { ja: 'ライボルトナイト', en: 'Manectrite' },
  メガサメハダー: { ja: 'サメハダナイト', en: 'Sharpedonite' },
  メガバクーダ: { ja: 'バクーダナイト', en: 'Cameruptite' },
  メガチルタリス: { ja: 'チルタリスナイト', en: 'Altarianite' },
  メガジュペッタ: { ja: 'ジュペッタナイト', en: 'Banettite' },
  メガアブソル: { ja: 'アブソルナイト', en: 'Absolite' },
  メガオニゴーリ: { ja: 'オニゴーリナイト', en: 'Glalitite' },
  メガボーマンダ: { ja: 'ボーマンダナイト', en: 'Salamencite' },
  メガメタグロス: { ja: 'メタグロスナイト', en: 'Metagrossite' },
  メガレックウザ: { ja: 'なし (画竜点睛が必要)', en: 'None (Dragon Ascent required)' },
  メガラティアス: { ja: 'ラティアスナイト', en: 'Latiasite' },
  メガラティオス: { ja: 'ラティオスナイト', en: 'Latiosite' },
  メガディアンシー: { ja: 'ディアンシナイト', en: 'Diancite' },
  メガエルレイド: { ja: 'エルレイドナイト', en: 'Galladite' },
  メガタブンネ: { ja: 'タブンネナイト', en: 'Audinite' },
  メガミミロップ: { ja: 'ミミロップナイト', en: 'Lopunnite' },
  メガハガネール: { ja: 'ハガネールナイト', en: 'Steelixite' },
  メガユキノオー: { ja: 'ユキノオナイト', en: 'Abomasnowite' },
};
```

---

## 開発ロードマップ (TDDの遵守)

### ステップ 1: テストコードの作成 (Red)
- [src/utils/pokemon.test.ts](file:///home/arccosine/poke-tool/src/utils/pokemon.test.ts) を新規作成し、`typeTranslations`、`typeColors`、`megaStoneMap`、`TYPES` が正しく定義されているかを検証するテストコードを記述します。
- この時点ではファイルが存在しないため、テストが失敗することを確認（Red）します。

### ステップ 2: 共通モジュールの作成 (Green)
- [src/utils/pokemon.ts](file:///home/arccosine/poke-tool/src/utils/pokemon.ts) を作成し、上記データ定義をエクスポートします。
- テストを実行し、テストがすべて通過することを確認（Green）します。

### ステップ 3: 既存コードの置き換え & 動作確認
- 以下のファイルについて、ローカルの重複定義を削除し、[src/utils/pokemon.ts](file:///home/arccosine/poke-tool/src/utils/pokemon.ts)（および必要に応じて変更した `party.ts`）からインポートするように置き換えます。
  - [src/utils/party.ts](file:///home/arccosine/poke-tool/src/utils/party.ts): `TYPES` を `pokemon.ts` からインポートするように変更。
  - [src/components/PartySimulator/PartySimulator.tsx](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx)
  - [src/components/PartySimulator/PokemonSearchModal.tsx](file:///home/arccosine/poke-tool/src/components/PartySimulator/PokemonSearchModal.tsx)
  - [src/components/StatSearch/StatSearch.tsx](file:///home/arccosine/poke-tool/src/components/StatSearch/StatSearch.tsx)
- 置き換え後、既存のテストおよび新規テストがすべて Green で通過すること、および `npm run build` が問題なく完了することを確認します。

### ステップ 4: `AGENTS.md` の更新
- `AGENTS.md` に、複数箇所で使用される定義データやコンポーネントに持たせるには大きい共通データ（メガストーンなど）は、`src/utils/pokemon.ts` などの共通定義ファイルに集約する旨の方針を追記します。
