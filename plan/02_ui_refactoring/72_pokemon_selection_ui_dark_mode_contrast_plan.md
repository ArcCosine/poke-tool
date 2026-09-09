# 計画書: 「ポケモンを選択」UIのダークモード視認性・文字コントラスト改善 (72_pokemon_selection_ui_dark_mode_contrast_plan.md)

本計画は、「ポケモンを選択」モーダル (`PokemonSearchModal.tsx`) および関連する選択トリガーUIにおいて、ダークモード時にタイトルや特性・ラベル等の文字が暗い背景と同化して読めなくなる問題を調査・特定し、一括して視認性を改善する計画です。

---

## 1. 背景と課題の調査結果

### ① モーダルヘッダーのタイトル「ポケモンを選択」
- **現在のスタイル**:
  `<h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">`
- **問題点**:
  `text-slate-500` の固定値となっており、ダークモードの暗いモーダル背景（`dark:bg-slate-900`）に対して著しくコントラスト不足となり、文字が暗くて読めません。
- **改善案**:
  `text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2` に変更し、視認性の高い白文字にします。

### ② 検索結果リストの特性表示テキスト
- **現在のスタイル**:
  `<div className="text-[10px] text-slate-400 font-medium">`
- **問題点**:
  フォントサイズが `text-[10px]`（極小）かつカラーが `text-slate-400`（薄いグレー）で固定されているため、ダークモード時に各ポケモンの特性がほとんど判読できません。
- **改善案**:
  `text-xs text-slate-500 dark:text-slate-300 font-medium` に拡大・明瞭化します。

### ③ 検索インプットのプレースホルダーとアイコン
- **現在のスタイル**:
  `className="input-premium pl-9 py-2 px-3 text-sm w-full font-medium box-border"`
- **問題点**:
  プレースホルダーの文字色が明示されておらず、ブラウザ既定で暗い色になり見えにくくなります。
- **改善案**:
  `placeholder:text-slate-400 dark:placeholder:text-slate-400` を明示し、検索アイコンも `dark:text-slate-300` に調整します。

### ④ 「ポケモンが見つかりません」案内メッセージおよびチェックボックスラベル
- **現在のスタイル**:
  - 見つかりません: `text-xs text-slate-400 font-medium`
  - 連続入力ラベル: `text-xs text-slate-500 dark:text-slate-400`
- **問題点**:
  ダークモード時に文字が沈んで認識しづらい。
- **改善案**:
  `dark:text-slate-300` に明るさを引き上げます。

### ⑤ 選択トリガー（`PartySimulator.tsx` / `EvCalculator.tsx`）のラベル
- **現在のスタイル**:
  - `PartySimulator.tsx`: `<label className="block text-xs font-semibold text-slate-500 mb-1">ポケモン名 #1</label>`
  - `EvCalculator.tsx`: `<p className="text-slate-500">上のボタンから努力値を計算したいポケモンを選択してください。</p>`
- **問題点**:
  いずれも `text-slate-500` のままで、ダークモード時の文字が暗い。
- **改善案**:
  `text-slate-600 dark:text-slate-300` に改善します。

---

## 2. 改善方針とコンポーネント設計

1. **[`PokemonSearchModal.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PokemonSearchModal.tsx)**:
   - ヘッダータイトルを `dark:text-slate-100` でくっきりと表示。
   - 特性テキストを `text-xs dark:text-slate-300` に引き上げ、フォントサイズとコントラストを両立。
   - プレースホルダー色・アイコン色・案内メッセージのダークモード表示を最適化。
2. **[`PartySimulator.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx)**:
   - スロットの「ポケモン名 #N」ラベルに `dark:text-slate-300` を適用。
3. **[`EvCalculator.tsx`](file:///home/arccosine/poke-tool/src/components/EvCalculator/EvCalculator.tsx)**:
   - 未選択時の案内テキストおよび各設定ラベルに `dark:text-slate-300` を適用。

---

## 3. TDD (テスト駆動開発) 計画

### Step 1: テストの作成 (`PokemonSearchModal.test.tsx`) (Red)
1. `src/components/PartySimulator/PokemonSearchModal.test.tsx` を新規作成。
2. モーダルが開いた際、タイトル「ポケモンを選択」に `dark:text-slate-100` が適用されていることを検証。
3. リスト内の特性表示テキストに `dark:text-slate-300` が適用されていることを検証。
4. テストを実行し、最初は失敗することを確認。

### Step 2: 実装 (Green)
1. `PokemonSearchModal.tsx` を修正。
2. `PartySimulator.tsx` および `EvCalculator.tsx` の関連ラベルを修正。
3. テストを実行し、パスすることを確認。

### Step 3: 全体検証とリファクタリング (Refactor)
1. `vitest run` で全テスト（100+件）がパスすることを確認。
2. `tsc -b && vite build` でビルドが通ることを確認。
3. Biome による整形・リントチェック。

---

## 4. 検証と実装結果
- **アクセシビリティルール追記 (`AGENTS.md`)**: 「UIアクセシビリティとダークモードの設計方針 (視認性とコントラストの確保)」を追記し、明示的なダークモード文字色指定や十分なコントラスト比維持をルール化。
- **TDD 単体テスト (`PokemonSearchModal.test.tsx`)**: タイトルおよび特性テキストのダークモード文字色検証テストを含む全3件パス。
- **全体テスト (`vitest`)**: 19ファイル、107件すべてのテストが正常にパス。
- **ビルド検証 (`tsc -b && vite build`)**: エラーなく正常に完了。
- 「ポケモンを選択」モーダルおよび関連する選択UIにおいて、ダークモード時でもすべてのテキストが鮮明かつ快適に読めるようになりました。

