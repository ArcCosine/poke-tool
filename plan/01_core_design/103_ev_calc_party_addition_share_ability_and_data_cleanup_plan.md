# 計画書: 努力値計算からの新規パーティ追加修正・特性URL共有対応・ステップ値統一・`src/data`削除および多言語フォールバック完全対応

## 1. 概要
本計画は、ユーザーから提示された以下の5つの不具合修正およびリファクタリングを実施するものである：
1. 努力値計算ツールから「新規パーティを作成してポケモンを追加」する機能が失敗するバグの修正
2. 共有用URLにおける「とくせい（特性）」の入出力対応（後方互換性を維持）
3. 努力値表現のステップ値（0〜32）への完全統一（0〜255/252換算処理・表示の完全排除）
4. 重複していた `src/data` の完全削除と `public/data` への一元化、および関連スクリプト・テストの修正
5. 多言語（日本語・英語・韓国語・中国語繁体字・中国語簡体字）フォールバックの完全対応

---

## 2. 課題の根本原因と改修設計

### (1) 努力値計算からの新規パーティ追加バグ
- **原因**: 
  `EvCalculator.tsx` において、新規パーティ作成時に `const createdId = createNewParty(t('evCalculator.myParty'), []);` と空配列で作成した後、同一レンダリングサイクル内で `handleConfirmAddParty(createdId)`（`addPokemonToPartyDirectly`）を呼び出していた。
  React の state である `parties` は同期的には更新されないため、`addPokemonToPartyDirectly` 内の `parties.find(p => p.id === activePartyId)` が `undefined` となり、追加が即座にキャンセルされていた。
- **改修方針**:
  - `createNewParty(name, initialMembers)` の `initialMembers` に直接追加対象の `instance` を渡して 1 回で作成を完了させる（`createNewParty(t('evCalculator.myParty'), [instance])`）。
  - `AppContext.tsx` 内の `addPokemonToPartyDirectly` も、state 更新関数（`setParties(prev => ...)`）の updater 引数を利用して、同期的・非同期的な呼び出しタイミングのズレにも耐えうる安全な実装に強化する。

### (2) 共有用URLの「とくせい（特性）」対応
- **原因**:
  `src/utils/share.ts` の `SharedPokemonConfig` に `ability` フィールドが存在せず、19バイトの固定長バイナリでも特性がシリアライズされていなかった。そのため復元時に常に 1 番目の特性（`poke.abilities[0]`）が代入されていた。
- **改修方針**:
  - 各ポケモンの特性はマスターデータで最大3つ（0: 通常1, 1: 通常2, 2: 隠れ特性）であるため、インデックス番号（`abilityIndex: number` 0〜2）で管理するのが最もコンパクトかつ言語非依存で堅牢。
  - バイナリフォーマットを拡張（20バイト構成。20バイト目に `abilityIndex` を格納）。
  - **後方互換性 (100% Backward Compatibility)**:
    - デコード時、バッファ長が 19バイト（旧URL）の場合は `abilityIndex = 0` として安全に復元。
    - バッファ長が 20バイト（新URL）の場合は 20バイト目を `abilityIndex` として復元。
  - `EvCalculator.tsx` および `PartySimulator.tsx` で、共有URL生成時に特性のインデックスを渡し、URLからのインポート時に該当特性を正しく選択状態にする。

### (3) 努力値のステップ値（0〜32）への完全統一
- **原因**:
  内部ロジックや `PokemonInstance.evs` の一部で `stepToEv`（0〜252への換算）が行われており、クリップボードコピー（`generatePartyPokesolText`）でも 0〜252 の数値が出力されていた。
- **改修方針**:
  - `PokemonInstance.evs` の格納値を **ステップ値（0〜32）** に統一。
  - 実数値計算関数 `calculateStat` / `getCalculatedStat` をステップ値（0〜32）を直接受け取る仕様に刷新（`POINTS_PER_EV = 1`、4努力値ごとのステップ計算を排除）。
  - クリップボード出力（`generatePartyPokesolText`）において 0〜252 の数値を完全排除。実数値 `${val}` またはステップ値 `${val}(${step})` のみとする。
  - コードベース内の不要な `stepToEv` / `evToStep` 換算呼び出しをすべて整理・削除。

### (4) `src/data` の完全削除と `public/data` への一元化
- **現状**:
  Webアプリ本体は `fetch('/data/...')` により `public/data` を取得して IndexedDB に保存している。しかし `src/data` が残存しており、一部のスクリプトやテストが古い `src/data` を参照・更新していた。
- **改修方針**:
  - `src/data` ディレクトリを完全に削除。
  - 以下の参照箇所をすべて `public/data` に更新：
    - `scripts/fetch_pokeapi.ts`
    - `scripts/add_regulation.ts`
    - `scripts/add_simplified_chinese.ts`
    - `scripts/update_master_data_mc.py`
    - `.agents/skills/add-regulation-pokemon/scripts/verify_and_sync_ranking_data.ts`
    - `skills/add-regulation/SKILL.md`
    - `src/utils/pokemon.test.ts`

### (5) 多言語フォールバック（5言語）の完全対応
- **現状**:
  - `src/utils/calculator.ts` の「おはかまいり」「ふんどのこぶし」の技名修飾が `ja`, `en` のみで `ko`, `zh-Hant`, `zh-Hans` が未定義。
  - 特性・技名・持ち物の「なし / None」フォールバックが `{ ja: 'なし', en: 'None' }` となっている。
  - 持ち物選択（Autocomplete）の逆引き検索で、現在の言語以外の持ち物名が正しくマッチしないケースがある。
- **改修方針**:
  - 「おはかまいり」「ふんどのこぶし」の技名に韓国語・繁体字・簡体字の修飾テキストを追加。
  - すべての「なし」フォールバックを `{ ja: 'なし', en: 'None', ko: '없음', 'zh-Hant': '無', 'zh-Hans': '无' }` に統一。
  - 持ち物逆引き検索を `Object.values(i.name).includes(item)` に統一し、全言語で設定された持ち物を確実に特定可能にする。

---

## 3. 作業ロードマップ (TDD)

### Step 1: `src/data` 削除とスクリプト・テストの `public/data` 移行
1. `src/utils/pokemon.test.ts` の import 先を `../../public/data/pokemon_master.json` に変更。
2. スクリプト類（`scripts/fetch_pokeapi.ts`, `add_regulation.ts`, `add_simplified_chinese.ts`, `update_master_data_mc.py`, `verify_and_sync_ranking_data.ts`）のパスを `public/data` に変更。
3. `src/data` ディレクトリを削除。
4. `npm test` で既存テストがパスすることを確認。

### Step 2: 多言語フォールバック（5言語）の完全対応
1. `src/utils/calculator.ts` の特殊技修飾名（おはかまいり、ふんどのこぶし）に `ko`, `zh-Hant`, `zh-Hans` を追加。
2. `calculator.ts`, `StatSearch.tsx`, `scripts/fetch_pokeapi.ts` の「なし」フォールバックに 5言語定義を追加。
3. `EvCalculator.tsx`, `PartySimulator.tsx` の持ち物マッチングを `Object.values(item.name).includes(...)` に強化。
4. 単体テストを追加・実行して検証。

### Step 3: ステップ値（0〜32）への努力値完全統一 (TDD)
1. `calculateStat` / `getCalculatedStat` のテストを修正・作成（Red）。
2. ステップ値を直接受け取り計算するように実装更新（Green）。
3. `PokemonInstance.evs` の内部保持をステップ値（0〜32）に統一。
4. `generatePokesolText` の出力フォーマットをステップ値表現に更新。
5. 全計算テスト・パーティテストをパスさせる。

### Step 4: 共有用URLの特性（ability）対応 (TDD)
1. `src/utils/share.test.ts` に特性のエンコード・デコードテスト（新20バイト形式）および旧19バイト形式の後方互換テストを追加（Red）。
2. `src/utils/share.ts` に `abilityIndex` のシリアライズ・デシリアライズを実装（Green）。
3. `EvCalculator.tsx` および `PartySimulator.tsx` での URL 共有・復元ロジックに特性を結合。

### Step 5: 努力値計算からの新規パーティ追加バグ修正 (TDD)
1. `src/components/EvCalculator/EvCalculator.test.tsx` に「新規パーティを作成して追加」が確実に成功するテストを追加（Red）。
2. `EvCalculator.tsx` で `createNewParty` に直接インスタンスを渡して作成・追加を完了するように修正（Green）。
3. `AppContext.tsx` のパーティ追加関数を堅牢化。

### Step 6: 全体検証・ビルド・デプロイ
1. `npm test`（全テストスイート パス確認）
2. `npm run build`（型チェック・バンドル・PWAアセット生成確認）
3. `npm run deploy`（Cloudflare Pages へデプロイ）
