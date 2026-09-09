# 計画書: ポケモン選択画面の通常状態におけるダークモード視認性とコントラスト改善 (73_pokemon_search_modal_default_state_dark_mode_visibility_plan.md)

本計画は、「ポケモンを選択」モーダル (`PokemonSearchModal.tsx`) および関連するポケモン選択UIにおいて、**「ポケモンの名前が真っ白で見えない」という背景色と文字色のコントラスト問題を根本解決し、ライトモード・ダークモード双方の通常状態・ホバー時において極めて高い視認性とアクセシビリティを確保する**計画です。

---

## 1. 背景と根本原因の特定

ユーザーからの指摘:
> 「ポケモン選択画面で、ポケモンの名前が真っ白で見えません。背景色と文字のコントラストを確認してください。」

### 根本原因の特定
1. **ブラウザの `<button>` デフォルトスタイル (`buttonface`) の漏れ込み**:
   - `PokemonSearchModal.tsx` の各ポケモン選択行（`<button>`）には、通常状態（非ホバー時）の背景色クラス（`bg-...`）が指定されていませんでした。
   - プロジェクト内にブラウザデフォルトの CSS リセット（Preflight）が存在しないため、ブラウザや OS 環境によって `<button>` にデフォルトの背景色（`buttonface`＝白系・淡色グレー）が適用されます。
   - その結果、ダークモード用文字色 `dark:text-slate-100`（ほぼ純白 #F1F5F9）が白いボタン背景の上に描画され、**「白地に白文字」となってポケモンの名前が真っ白で読めなくなる**現象が発生していました。
2. **通常状態における境界・面の欠如**:
   - 行全体がカード化されておらず、非ホバー時に背景と境界が曖昧でした。
3. **PartySimulator 側の選択トリガーの文字色**:
   - `PartySimulator.tsx` のスロット表示でも、選択されたポケモンの名前が `text-slate-200`（白系グレー固定）となっており、背景とのコントラストが不十分になる可能性がありました。

---

## 2. 改善方針と設計

### 2.1. グローバル CSS での button スタイル初期化 (`src/index.css`)
- すべての `<button>` 要素について、ブラウザ固有の `buttonface`（白背景）が勝手に適用されないようリセットを追加：
  ```css
  button {
    background-color: transparent;
    border: none;
    color: inherit;
    font: inherit;
  }
  ```

### 2.2. `PokemonSearchModal.tsx` の行カード化と明示的コントラスト
各ポケモンの行ボタンに対して、通常時から明確な背景色と枠線、および高コントラストな文字色を明示的に指定します：
- **通常状態（非ホバー時）**:
  - ライトモード: `bg-slate-50 border border-slate-200`
  - ダークモード: `dark:bg-slate-850 dark:bg-slate-800/70 border dark:border-slate-700/80`
- **ホバー状態**:
  - ライトモード: `hover:bg-indigo-50/70 hover:border-indigo-300`
  - ダークモード: `dark:hover:bg-slate-750 dark:hover:bg-slate-800 dark:hover:border-indigo-500/60`
- **テキストカラー階層**:
  - ポケモン名: `text-slate-900 dark:text-slate-100 font-bold`（コントラスト比 10:1 以上）
  - 図鑑番号: `text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs`
  - 特性: `text-slate-600 dark:text-slate-300 text-xs font-medium`
- **ポケモンスプライト専用枠**:
  - `w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shrink-0`
  - ドット絵が背景色と同化するのを防止。

### 2.3. 検索ボックスのコントラスト向上
- `bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100`

### 2.4. `PartySimulator.tsx` の選択中ポケモン名
- `text-slate-200` 固定から `text-slate-900 dark:text-slate-100` に修正。

---

## 3. TDD (テスト駆動開発) 実行計画

### Step 1: テストコード拡充 (`PokemonSearchModal.test.tsx`) (Red)
1. ポケモン選択アイテム（`<button>`）が通常時（非ホバー時）に明示的な背景色クラス（`bg-slate-50` / `dark:bg-slate-800/70` または同等）および枠線（`border-slate-200` / `dark:border-slate-700`）を持っていることを検証するテストを追加。
2. ポケモン名が `text-slate-900` および `dark:text-slate-100` のクラスを持つことを検証するテストを追加。
3. アイコン専用コンテナ（枠線と専用背景）が存在することを検証するテストを追加。
4. テストを実行し、既存実装で失敗することを確認（Red）。

### Step 2: 実装 (`src/index.css`, `PokemonSearchModal.tsx`, `PartySimulator.tsx`) (Green)
1. `src/index.css` に button リセットを追加。
2. `PokemonSearchModal.tsx` を新設計に従って実装。
3. `PartySimulator.tsx` の選択中ポケモン名の文字色を修正。
4. テストを実行し、成功することを確認（Green）。

### Step 3: リファクタリングと全体検証 (Refactor)
1. Biome によるコード整形とリント確認。
2. 全テストスイート（Vitest）を実行し、全テストパスを確認。
3. `npm run build` を実行し、TypeScript 型チェックおよびビルド正常完了を確認。

---

## 4. 実施結果と完了記録

### 4.1. 解決された課題
1. **ブラウザデフォルトの `<button>` スタイル（`buttonface`）漏れ込みの解消**:
   - `src/index.css` に `button { background-color: transparent; border: none; color: inherit; font: inherit; }` を追加。
   - ブラウザが勝手に白い背景をボタンに適用し、白い文字と同化する問題を根本解決。
2. **通常状態（非ホバー時）での各ポケモンアイテムのカード化**:
   - `bg-slate-50 border border-slate-200`（ライト）/ `dark:bg-slate-800/70 border dark:border-slate-700`（ダーク）により、通常状態でも輪郭と面がくっきりと視認可能に。
3. **高コントラストなテキストと階層構造**:
   - ポケモン名に `text-slate-900 dark:text-slate-100 font-bold` を指定。
   - 図鑑番号（`#149` 等）を `text-indigo-600 dark:text-indigo-400` で強調表示。
   - 特性表示のコントラスト向上。
4. **ポケモンスプライト専用枠**:
   - `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700` により、黒系や濃い色のポケモンでも背景と同化せず明瞭に表示。
5. **PartySimulator 側の選択枠文字色改善**:
   - `PartySimulator.tsx` のスロット表示で固定 `text-slate-200` だったポケモン名を `text-slate-800 dark:text-slate-100` に改善。

### 4.2. 検証結果
- **単体テスト**: `PokemonSearchModal.test.tsx` の 4 テストすべて Green（パス）。
- **全テストスイート**: 19 テストファイル、108 テストすべて Green（パス）。
- **ビルド検証**: `tsc -b && vite build` 正常終了（Exit 0）。生成された CSS バンドルに button リセットおよびすべてのダークモードスタイルが反映されていることを確認。

