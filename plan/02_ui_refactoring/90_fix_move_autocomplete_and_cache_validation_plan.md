# 計画書: 本番環境における技候補非表示の不具合修正およびキャッシュ検証強化 (90_fix_move_autocomplete_and_cache_validation_plan.md)

本計画は、本番環境（Cloudflare Pages）においてパーティシミュレータ等の技選択で技の候補リストが表示されない不具合の原因を特定し、キャッシュ検証の堅牢化、マスターデータバージョンの更新、および技セレクタの重なり順（z-index）修正をTDD（テスト駆動開発）に基づいて実施する計画です。

---

## 1. 背景と原因分析

### 1.1. 現象
本番環境（`https://poke-tool.pages.dev`）において、ポケモンの技選択（`Autocomplete`）を開いた際に、技の候補リスト（ドロップダウン）が表示されない。

### 1.2. 徹底調査による原因の特定
以下の3つの要因が複合して発生していることが判明しました。

1. **マスターデータバージョン更新漏れと IndexedDB の不健全キャッシュ保持**:
   - 前回のデプロイ（計画88・89）でデータ配信パスを `public/data/` へ移行しましたが、`version.json` のバージョン値（`1789135200000`）が更新されていませんでした。
   - 前々回のデプロイ（`/src/data/` 参照による 404 エラー発生時）にアクセスしたブラウザでは、IndexedDB に不完全・空のデータ、あるいは古いデータが残っている可能性があります。
   - `src/utils/db.ts` のキャッシュ判定ロジックが `cachedPokemon && cachedMoves && cachedItems` となっており、万一 `cachedMoves` が空配列 `[]` であっても truthy（真）と判定され、再フェッチされずに空の技リストを返し続けてしまう欠陥がありました。
   - また、`/data/version.json` のフェッチ時にブラウザ/CDNキャッシュ無効化（`cache: 'no-store'`）が指定されておらず、古いバージョン情報がキャッシュされるリスクがありました。

2. **`PartySimulator.tsx` における技セレクタの重なり順（z-index / Stacking Context）欠落**:
   - `EvCalculator.tsx` では計画81で各技セレクタに `style={{ zIndex: 10 - idx }}` を付与して前面化していましたが、`PartySimulator.tsx` では `grid grid-cols-2` 内に `<Autocomplete>` が直接配置されていました。
   - これにより、同一スタッキングコンテキスト内で DOM の後にある技3・技4（下段）や後続カードが、上段の技1・技2のドロップダウンの上に重なって隠してしまう現象が発生していました。

3. **単体テストにおける技候補連携テストの不足**:
   - `PartySimulator.test.tsx` において、ポケモンの選択や努力値入力のテストはあったものの、実際の `learnable_moves` と `movesData` を結合した技候補ドロップダウンの表示・選択に関する単体テストが存在していませんでした。

---

## 2. 改善方針と修正内容

### 2.1. IndexedDB キャッシュ健全性チェック（バリデーション）の強化 (`src/utils/db.ts`)
- キャッシュ判定において、単なる存在チェックだけでなく、配列かつ要素数が 1 件以上存在すること（`Array.isArray(cachedMoves) && cachedMoves.length > 0`）を厳格に検証。
- `/data/version.json` の取得時に `{ cache: 'no-store' }` を指定し、常に最新のバージョン定義を参照。
- マスターデータバージョン（`public/data/version.json` および `src/data/version.json`）を新しいタイムスタンプ（`1789136000000`）へインクリメント。

### 2.2. パーティシミュレータの技セレクタ重なり順の適正化 (`src/components/PartySimulator/PartySimulator.tsx`)
- 4つの各技セレクタをラップする要素に `relative` および `style={{ zIndex: 10 - mIdx }}` を設定。
- 上段の技セレクタ（技1: z-10、技2: z-9）が下段（技3: z-8、技4: z-7）よりも確実に前面にスタックされるようにレイアウトを改善。

### 2.3. TDD による再現テスト・単体テストの追加
- `src/utils/db.test.ts`:
  - IndexedDB 内の `cachedMoves` が空配列 `[]` の場合にキャッシュが無効と判定され、静的ファイルから再フェッチされることを検証するテストを追加。
- `src/components/PartySimulator/PartySimulator.test.tsx`:
  - ポケモン選択後に技選択欄をクリックした際、`learnable_moves` に該当する技候補がドロップダウンとして正しく表示されることを検証するテストを追加。
  - 各技セレクタのラッパーに適切な `z-index` スタイルが適用されていることを検証するテストを追加。

---

## 3. TDD 実行計画

### Step 1: テスト作成（Red）
1. `src/utils/db.test.ts` に空配列キャッシュ時の再フェッチ検証テストを追加。
2. `src/components/PartySimulator/PartySimulator.test.tsx` に技候補ドロップダウン表示および `z-index` 階層化の検証テストを追加。
3. テストを実行し、期待通り失敗（Red）することを確認。

### Step 2: 実装（Green）
1. `src/utils/db.ts` のキャッシュ検証ロジックを強化し、`version.json` を最新バージョン値に更新。
2. `src/components/PartySimulator/PartySimulator.tsx` に各技の `z-index` ラッパーを追加。
3. テストを実行し、すべて通過（Green）することを確認。

### Step 3: リファクタリングと本番デプロイ検証（Refactor）
1. Biome によるコード整形とリントチェック。
2. `npm test` による全テストスイートの通過確認。
3. `npm run build` によるビルド正常確認。
4. Cloudflare Pages への再デプロイ（`npm run deploy`）を実施。
5. 本番環境（`https://poke-tool.pages.dev`）での動作確認。

---

## 4. 実装結果と検証

### 実施内容
- `src/utils/db.ts`:
  - IndexedDB キャッシュ判定に `Array.isArray(cachedMoves) && cachedMoves.length > 0` などの厳格な配列長チェックを追加し、破損・空キャッシュ時は自動的に静的アセットから再取得するように強化。
  - `/data/version.json` の fetch 時に `{ cache: 'no-store' }` を指定。
  - `public/data/version.json` および `src/data/version.json` のバージョン値を `1789136000000` に更新。
- `src/components/PartySimulator/PartySimulator.tsx`:
  - 技1〜技4の各セレクタに `relative` かつ `style={{ zIndex: 10 - mIdx }}` のラッパーを付与し、上段の技のドロップダウンが下段の入力欄や他カードの下に隠れないようにスタッキングコンテキストを階層化。
- `src/utils/db.test.ts`:
  - `cachedMoves` が空配列の際にキャッシュが無効化されて再フェッチされる単体テストを追加・パス。
- `src/components/PartySimulator/PartySimulator.test.tsx`:
  - 技選択欄フォーカス時に技候補ドロップダウンが表示される単体テスト、および `z-index` スタイル適用の単体テストを追加・パス。
- コード品質と検証:
  - Vitest: 全23ファイル、147テストすべてパス。
  - Biome: フォーマット適用済み。
  - `npm run build`: 正常完了。
  - Cloudflare Pages (`poke-tool`): 本番デプロイ完了（`https://poke-tool.pages.dev`）。

### 完了ステータス
- **完了 (Completed)**

