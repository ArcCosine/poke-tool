# 計画書: 努力値合計上限（66ステップ）の厳密化およびデータマイグレーション (104_fix_ev_total_limit_and_migration_plan.md)

## 1. 概要
ユーザーより「努力値合計が76になってしまっている。最大数値は66です。こちらチェックして修正してください。」との報告があった。
調査の結果、従来の努力値仕様（0〜252）から新仕様（0〜32のステップ値、合計上限66）への移行に伴い、以下の要因で合計76が発生することが判明した。
1. **旧データの残存と未正規化**:
   - 旧仕様では、努力値 252 がステップ 32、努力値 12（実数値+2調整）が 12 としてそのままシリアライズ・保存されていた。
   - 旧データ（HP: 32, Attack: 32, Speed: 12）を読み込むと、そのまま 32 + 32 + 12 = **76** として扱われてしまう。
2. **URLデコード・localStorageロード・UI入力時の合計バリデーション不足**:
   - 外部から読み込まれた努力値オブジェクト（URLデコード、localStorage）に対して、合計が66以下であることの検証・クランプが行われていなかった。
   - 76になった状態では、他のステータスを変更しようとしても `Math.min(32, 66 - 76) = -10` となり操作不能に陥る。

本計画では、努力値の正規化・クランプ処理を一元化し、旧データの安全なマイグレーションと、あらゆる入力・復元経路における「各ステータス最大32、合計最大66」の厳格な保証を実装する。

---

## 2. 要件詳細

### 2.1 努力値正規化ユーティリティの共通化 (`src/utils/pokemon.ts`)
- 定数の定義:
  - `MAX_TOTAL_EVS = 66`
  - `MAX_SINGLE_EV = 32`
- 関数 `normalizeEvs`:
  - 引数: `evs: Partial<Record<StatKey, number>> | undefined`
  - 戻り値: `Record<StatKey, number>` (各値 0〜32、合計 <= 66)
  - 処理内容:
    1. 各ステータス値に対し、未定義なら 0、数値でないなら 0。
    2. 旧仕様の努力値（32より大きい値、例: 252, 12, 4など）が含まれる場合のマイグレーション:
       - `val > 32` の場合、旧換算式 `Math.floor((val - 4) / 8) + 1` を適用（ただし最大32）。
    3. 各値を `Math.max(0, Math.min(MAX_SINGLE_EV, val))` にクランプ。
    4. 6ステータスの合計が `MAX_TOTAL_EVS (66)` を超えている場合、合計が66以下になるよう末尾のステータスから順に超過分を差し引いてクランプ（または比率調整）。

### 2.2 データ永続化・マイグレーション (`src/context/AppContext.tsx`)
- localStorage から `saved_parties` を読み込む際、各ポケモンの `evs` を `normalizeEvs` で自動サニタイズ。
- これにより、ブラウザに保存された既存の旧データ（合計76など）を即座に正常化（合計66以内）して復元・再保存する。
- `createNewParty`、`addPokemonToPartyDirectly`、`replacePokemonInParty`、`updateMember` でも `evs` は常に `normalizeEvs` を通して格納。

### 2.3 URL共有の堅牢化 (`src/utils/share.ts`)
- `serializePokemon`:
  - 保存前に `normalizeEvs(config.evs)` を実行し、不正な値（32超や合計66超）がシリアライズされないようにする。
- `deserializePokemon`:
  - 復元直後に `normalizeEvs(evs)` を実行し、旧URLや不正なURLコードから復元された場合でも必ず合計66以下・各32以下に正規化する。

### 2.4 UIコンポーネントの修正
- `src/components/EvCalculator/EvCalculator.tsx`:
  - URLからの設定復元時に `normalizeEvs` を適用。
  - 耐久調整（`onApplyHbdEvs`）適用時にも合計66以下を保証。
  - `handleEvChange` において、`allowedMax = Math.max(0, Math.min(32, 66 - otherTotal))` とし、負数にならないよう防御。
- `src/components/PartySimulator/PartySimulator.tsx`:
  - URLからのパーティ復元時に各メンバーの `evs` を `normalizeEvs` で正規化。
  - 数値入力 `<input>` の `max` 属性を `Math.min(32, Math.max(0, 66 - otherStepsTotal))` に動的バインド。
  - `handleMemberEvChange` においても確実に `normalizeEvs` を経由。

---

## 3. 実装ステップとTDD

### Step 1: `src/utils/pokemon.test.ts` にテストを追加 (Red)
- `normalizeEvs` の単体テスト:
  - 正常値（合計 <= 66, 各 <= 32）がそのまま保持されること。
  - 各ステータスが32を超える場合に32にクランプされること。
  - 旧仕様の努力値（252, 12等）が正しくステップ値（32, 2）に変換されること。
  - 合計が 76（例: 32, 32, 12）などの場合に、合計が 66 に収まるようクランプされること。

### Step 2: `src/utils/pokemon.ts` に `MAX_TOTAL_EVS`, `MAX_SINGLE_EV`, `normalizeEvs` を実装 (Green)
- テスト通過を確認。

### Step 3: `src/utils/share.ts` 及び `share.test.ts` の更新
- テスト: 合計が76などの不正な設定をエンコード／デコードした際、合計66以下に正規化されることを検証。
- 実装: `serializePokemon` と `deserializePokemon` で `normalizeEvs` を適用。

### Step 4: `AppContext.tsx` 及び `AppContext.test.tsx` の更新
- テスト: localStorage に合計76の旧パーティデータが存在する場合、ロード時に合計66にサニタイズされて読み込まれることを検証。
- 実装: `parties` 初期化時および更新処理に `normalizeEvs` を組み込む。

### Step 5: `EvCalculator.tsx` と `PartySimulator.tsx` の更新とテスト
- `EvCalculator.test.tsx`: 不正なURL（合計76）を読み込んだ場合でも、合計が66以下になり、画面表示が正常であることのテスト。
- `PartySimulator.test.tsx`: 不正なURL（合計76）から共有パーティを復元した際、合計が66以下になることのテスト。
- コンポーネント実装の調整。

### Step 6: 全体テスト・ビルド・デプロイ
- `npm test`（全テスト通過確認）
- `npm run build`（型チェック・バンドル確認）
- `npm run deploy`（Cloudflare Pages デプロイ）
