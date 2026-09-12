# 計画書: ランキングのレギュレーションフィルタ削除・レギュレーションM-Cポケモン追加および追加自動化スキルの作成 (91_remove_stat_search_regulation_filter_and_add_mc_pokemon_ranking_plan.md)

本計画は、火力・耐久力ランキング（`StatSearch.tsx`）からレギュレーションによるフィルタ機能を削除し、レギュレーションM-Cで追加された全ポケモン（新規メガシンカZ等を含む）がランキングで正常に閲覧できるようにマスターデータおよび表示ロジックを修正するとともに、今後レギュレーション追加時にポケモン情報をランキングへ確実に追加・反映するための Antigravity 専用スキルを新規作成・実行する計画です。

---

## 1. 背景と課題

### 1.1. ユーザー要望
1. **レギュレーションフィルタの削除**: 火力・耐久力ランキングにおけるレギュレーション絞り込み機能を不要化に伴い削除する。
2. **レギュレーションM-C追加ポケモンのランキング反映**: 新規追加されたレギュレーションM-Cのポケモンたち（通常種族23種、リージョン1種、フォルム違い5種、メガシンカ6種、ロトム5種）が火力・耐久力ランキングで正しく閲覧できるように修正する。
3. **新レギュレーション追加ポケモンのランキング反映スキルの作成・実行**: 今後新しいレギュレーションが追加された際、そのポケモン情報をランキングに確実に登録・反映できる Antigravity スキルを新規作成し、実行する。

### 1.2. 現状の調査結果と原因
1. **レギュレーションフィルタ UI**:
   - `StatSearch.tsx` 内に `selectedReg` state および `<Select id="reg-filter">` が配置されており、5列グリッドで表示されている。これを削除して4列グリッドへ整頓する。
2. **M-C追加ポケモンの火力計算欠落**:
   - レギュレーションM-Cで追加された一部のメガシンカ（特に `メガアブソルZ` [ID: 10307]、`メガガブリアスZ` [ID: 10309]、`メガルカリオZ` [ID: 10310]）について、マスターデータの `learnable_moves` が空配列 `[]` となっている。
   - その結果、火力ランキングで技が 0 件となり、火力値が 0 で正しくランキングに登場しない状態となっていた。
   - 親ポケモン（アブソル、ガブリアス、ルカリオ）の技リストを引き継ぎ・補完する必要がある。

---

## 2. 改善方針と詳細設計

### 2.1. `StatSearch.tsx` のレギュレーションフィルタ削除
- `selectedReg` state、`regulationsData` の参照、およびレギュレーション選択 `<Select id="reg-filter">` を完全削除。
- 絞り込みロジック内の `.filter((item) => selectedReg === 'all' || item.pokemon.regulations.includes(selectedReg))` を削除。
- フィルターカードのグリッドレイアウトを `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5` から `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` に最適化。
- `excludeMega` チェックボックスのラッパーの `lg:col-span-5` を `lg:col-span-4` に変更。

### 2.2. M-C追加ポケモンのマスターデータ補完
- メガアブソルZ (ID: 10307): アブソル (ID: 359) の `learnable_moves` を設定。
- メガガブリアスZ (ID: 10309): ガブリアス (ID: 445) の `learnable_moves` を設定。
- メガルカリオZ (ID: 10310): ルカリオ (ID: 448) の `learnable_moves` を設定。
- `public/data/pokemon_master.json` および `src/data/pokemon_master.json` に反映。
- `version.json` を新バージョン値（`1789137000000`）へ更新。

### 2.3. Antigravity スキル (`add-regulation-pokemon`) の作成
- 配置場所: `.agents/skills/add-regulation-pokemon/`
- ファイル構成:
  - `SKILL.md`: 新レギュレーション追加時のランキング反映ワークフロー手順書（YAML frontmatter 完備）。
  - `scripts/verify_and_sync_ranking_data.ts`: 全ポケモンの `learnable_moves` チェック、メガシンカ・フォルム違いの技自動引き継ぎ、火力・耐久力値の健全性検証スクリプト。
- 本スキルを実行し、M-C追加ポケモンのデータ整合性を自動検証・更新。

---

## 3. TDD 実行計画

### Step 1: テスト作成（Red）
1. `src/components/StatSearch/StatSearch.test.tsx` に以下のテストを追加：
   - レギュレーションフィルタ要素（`#reg-filter` や `t('regulation')`）が存在しないことを検証。
   - M-C追加ポケモン（例: メガアブソルZ、セグレイブなど）が火力・耐久ランキングで 0 より大きい値で正しく算出・表示されることを検証。
2. テストを実行し、未改修による失敗（Red）を確認。

### Step 2: 実装（Green）
1. `.agents/skills/add-regulation-pokemon/SKILL.md` および検証スクリプトを作成。
2. スキル・スクリプトを実行してマスターデータを補完・整合化。
3. `StatSearch.tsx` からレギュレーションフィルタを削除しレイアウトを調整。
4. `version.json` を更新。
5. テストを実行し、すべて通過（Green）することを確認。

### Step 3: リファクタリングと本番デプロイ検証（Refactor）
1. Biome によるコード整形とリントチェック。
2. `npm test` による全テストスイートの通過確認。
3. `npm run build` によるビルド正常確認。
4. Cloudflare Pages への再デプロイ（`npm run deploy`）を実施。
5. 本番環境（`https://poke-tool.pages.dev`）での表示確認。

---

## 4. 実装結果と検証

### 実施内容
- **StatSearch レギュレーションフィルタの削除 ([`StatSearch.tsx`](file:///home/arccosine/poke-tool/src/components/StatSearch/StatSearch.tsx))**:
  - `selectedReg` state および `<Select id="reg-filter">` を完全削除し、全ポケモンを対象とするシンプルな4列フィルターレイアウト（`lg:grid-cols-4`）へ更新。
  - レギュレーションによる絞り込み処理を撤廃。
- **スキル作成とマスターデータの自動補完 ([`.agents/skills/add-regulation-pokemon/`](file:///home/arccosine/poke-tool/.agents/skills/add-regulation-pokemon/))**:
  - 新規スキル `add-regulation-pokemon`（`SKILL.md` および `scripts/verify_and_sync_ranking_data.ts`）を作成。
  - スクリプトを実行し、`メガアブソルZ`（116技）、`メガガブリアスZ`（94技）、`メガルカリオZ`（119技）の `learnable_moves` を親ポケモンから自動引き継ぎ。
  - `public/data/pokemon_master.json`, `src/data/pokemon_master.json`, `version.json` を同期更新（バージョン: `1789227660917`）。
- **TDD 単体テスト ([`StatSearch.test.tsx`](file:///home/arccosine/poke-tool/src/components/StatSearch/StatSearch.test.tsx) / [`calculator.test.ts`](file:///home/arccosine/poke-tool/src/utils/calculator.test.ts))**:
  - レギュレーションフィルタが非表示であることの検証テストを追加・パス。
  - M-C追加ポケモン含む全マスターデータポケモンの技および火力・耐久計算が正しく実行される互換性テストを追加・パス。
  - 全23テストスイート、148テストすべてパス。
- **本番デプロイ**:
  - `npm run build` および `npm run deploy` を実施。
  - Cloudflare Pages（`https://poke-tool.pages.dev`）へデプロイ完了。

### 完了ステータス
- **完了 (Completed)**

