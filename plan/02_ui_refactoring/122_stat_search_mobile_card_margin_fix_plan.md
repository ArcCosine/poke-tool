# 計画書: 火力・耐久ランキング スマホ版左右余白（マージン）の復元とデザイン統一

## 1. 概要と背景

### 1.1 現状の課題
- 火力・耐久ランキング（`StatSearch.tsx`）のランキングテーブル外枠カードにおいて、以前の改修でスマホ表示時に画面幅いっぱいに広げるスタイル（`-mx-6 sm:mx-0`、`border-x-0 sm:border`、`rounded-none sm:rounded-2xl`）が適用されていた。
- その結果、上部の検索フィルターカードは左右に余白があるのに対し、下のランキングリストのみが画面端まで突き抜けて表示され、全体のレイアウトバランスに違和感が生じていた。

### 1.2 目的
- ユーザーからのご指示「全体のバランスを考えるとやはり左右に隙間が必要」に基づき、スマホ表示時にもランキングカード左右に適切な余白（隙間）を設ける。
- ネガティブマージン（`-mx-6`）を排除し、四隅の角丸（`rounded-2xl`）と境界線（ボーダー）を維持して、上部のフィルターカードと統一感のあるカードデザインに整える。

---

## 2. 具体的な変更設計

### 2.1 `src/components/StatSearch/StatSearch.tsx` の改修
- **対象箇所**: 285行目のランキングリスト外枠 `div`
- **変更前**:
  ```tsx
  <div className="card-premium overflow-hidden p-0 border-x-0 sm:border border-slate-200 dark:border-slate-800 -mx-6 sm:mx-0 rounded-none sm:rounded-2xl">
  ```
- **変更後**:
  ```tsx
  <div className="card-premium overflow-hidden p-0 rounded-2xl">
  ```
- **効果**:
  1. `-mx-6 sm:mx-0` を削除することで、親コンテナ（`Layout.tsx` の `p-4 sm:p-6 md:p-12`）のパディングによる自然な左右の隙間（スマホ時 16px）が生まれる。
  2. `border-x-0 sm:border` と `rounded-none sm:rounded-2xl` を解除し、全画面サイズで統一された美しい角丸（`rounded-2xl`）とボーダーを適用。
  3. テーブル内部の横スクロールコンテナ（`overflow-x-auto`）はそのまま維持されるため、スマホ画面でテーブル幅がはみ出すことなく安全に閲覧可能。

---

## 3. TDD（テスト駆動開発）計画

1. **テストコード修正・追加 (`src/components/StatSearch/StatSearch.test.tsx`)**:
   - ランキングコンテナのクラス検証テストを追加：
     - コンテナ要素に `-mx-6` が含まれず、`rounded-2xl` が適用されていることを検証。
   - テスト実行による失敗（Red）の確認。
2. **実装 (`StatSearch.tsx`)**:
   - ネガティブマージンとボーダー・角丸のリセットクラスを削除。
   - テスト実行による成功（Green）の確認。
3. **全体回帰テスト & ビルド検証**:
   - `npm test`（全48テストスイート）のパス確認。
   - `npm run build` によるビルド成功の確認。

---

## 4. 作業手順
1. 本計画書のユーザー提示と合意取得（完了）
2. `StatSearch.test.tsx` にテスト追加（Red 確認完了）
3. `StatSearch.tsx` のクラスを修正（Green 確認完了）
4. 全体テスト（`npm test`）& ビルド（`npm run build`）（完了）
5. コミット & Cloudflare Pages デプロイ & 完了報告

---

## 5. 実装結果・検証
- **スマホ版余白の復元**:
  - ランキングテーブル外枠カードから `-mx-6 sm:mx-0`、`border-x-0 sm:border`、`rounded-none sm:rounded-2xl` を削除し、`card-premium overflow-hidden p-0 rounded-2xl` に統一。
  - 親レイアウトの左右余白（16px）が自然に活き、上部のフィルターカードと整合した美しいカードデザインに復元。
- **テスト・ビルド検証**:
  - `StatSearch.test.tsx` の新規単体テストおよび全48テストスイート（287テスト）がすべてパス。
  - `npm run build` によるビルド（PWA・OGP・型チェック・バンドル）が正常終了。

