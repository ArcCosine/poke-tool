# 111_party_simulator_controls_redesign_and_ranking_publish_fix_plan.md

## 目的
1. パーティ編成画面上部のコントロールにおける「編集中のパーティ名表示」と「パーティ名入力フィールド」の重複を解消・一体化し、PC版では横並び、モバイル版では縦並びで保存済みパーティを選択できるスッキリしたUIに再設計する。
2. 「ランキングに公開する」ボタンを上部からコントロールバー（`PartyControls`）へ移動し、指定された順序（新規作成 → ランキングに公開する → シェア → クリップボードにコピー → パーティを保存 → 削除）に整列する。
3. 新規作成パーティを含むパーティ保存時にD1へ正常にデータが永続化（UPSERT）されず、ランキングに公開されない不具合を根本修正する。

---

## 現状の課題と原因分析

### 課題1: 上部コントロールの情報重複とレイアウト
- **現状**:
  - `PartySearch.tsx` の上段に「編集中のパーティ: [バッジ]」、下段に「パーティ名入力フィールド」が配置されており、全く同じ情報が二重に表示されている。
  - 「保存済みパーティから選択」が下段の右側に追いやられており、全体の情報階層が冗長。
- **改善案**:
  - 「編集中のパーティ」ヘッダー部分にパーティ名入力フィールドを直接一体化。
  - PC版（`md:`以上）では左側に「編集中のパーティ名入力」、右側に「保存済みパーティから選択」を横並びで配置。
  - モバイル版では縦並び（上: 編集中のパーティ名入力、下: 保存済みパーティから選択）に切り替わるレスポンシブデザインにする。

### 課題2: コントロールボタンの配置・順序
- **現状**:
  - 「ランキングに公開する」が `PartySearch.tsx` の上部右端の小さなボタンとして孤立。
  - `PartyControls.tsx` の並び順が左右に分散している。
- **改善案**:
  - 「ランキングに公開する」ボタンを `PartyControls.tsx` に統合。
  - ユーザー指定の順序に並び替え：
    1. **新規作成** (`onNewParty`)
    2. **ランキングに公開する** (`onOpenPublishDialog` / 設定ダイアログを開く)
    3. **シェア** (`onShareParty`)
    4. **クリップボードにコピー** (`onCopyPokesol`)
    5. **パーティを保存** (`onSaveParty` - プライマリスタイル)
    6. **削除** (`onDeleteParty` - デンジャースタイル)

### 課題3: 「ランキングに公開する」機能の不具合（D1保存失敗）
- **原因**:
  - クライアント側で新規作成されたパーティはローカルID（例: `Math.random().toString(36)...`）を持つが、まだクラウドのD1データベースには未登録。
  - `PartySimulator.tsx` の `saveParty` では `PUT /api/parties/${id}` のみを実行している。
  - `functions/api/parties/[id].ts` の `onRequestPut` は単なる `UPDATE ... WHERE id = ? AND user_id = ?` であり、行が存在しない場合は `changes === 0` で 403 エラーを返す。
  - その結果、新規パーティを「ランキングに公開する」にして保存しても、D1に1度もINSERTされず、ランキングAPI（`/api/ranking`）の `SELECT * FROM parties WHERE is_public = 1` にヒットしなかった。
- **改善案**:
  - `functions/api/parties/[id].ts` の `onRequestPut` を `bulk-sync.ts` と同様に `INSERT ... ON CONFLICT(id) DO UPDATE SET ...`（UPSERT）に変更し、新規パーティであっても安全にD1に永続化されるように修正する。
  - 公開設定ダイアログ（モーダル）を新設・整備し、ランキング公開のトグル、レンタルコード、記事URL、説明文を設定して保存できるようにする。

---

## TDD (テスト駆動開発) 計画
1. **Red フェーズ**:
   - `functions/_lib/auth.test.ts` または API テストにて、未存在のパーティIDに対する PUT リクエストが 403 にならず UPSERT として成功することを検証するテストを作成。
   - `PartyControls.test.tsx` にて、6つのボタンが指定順序で正しくレンダリングされることを検証するテストを追加。
   - `PartySearch.test.tsx` にて、一体化されたパーティ名入力およびPC横並び・モバイル縦並びレイアウトを検証するテストを更新。
2. **Green フェーズ**:
   - `functions/api/parties/[id].ts` を UPSERT 対応に改修。
   - `PartyControls.tsx` に「ランキングに公開する」ボタンを追加し、指定順序に配置。
   - `PartySearch.tsx` を再設計（パーティ名入力の一体化・レスポンシブ配置）。
   - `PartySimulator.tsx` で公開設定ダイアログの表示および保存フローを統合。
3. **Refactor & Verify**:
   - 全テスト実行（`npm test`）、Biome検証、本番ビルドの確認。

---

## 開発ロードマップ
1. **計画書の作成・合意** (本ドキュメント)
2. **バックエンド修正 (TDD)**: `functions/api/parties/[id].ts` の UPSERT 化
3. **UI改修 (TDD)**:
   - `PartyControls.tsx` のボタン順序・追加
   - `PartySearch.tsx` の一体化・レイアウト整理
   - `PartySimulator.tsx` での公開ダイアログ連携
4. **全体検証**: 全テストパス、リンター、ビルド確認
