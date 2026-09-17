# 112_party_ranking_author_name_customization_and_avatar_removal_plan.md

## 目的
1. **パーティランキングにおけるアイコンの非表示化**:
   - パーティランキング画面（`PartyRanking` / `PartyCard`）から、作者アイコン（アバター画像およびユーザーアイコン）を完全に削除し、スッキリとしたテキスト表示に統一する。
2. **ユーザ名のカスタム入力（OAuthユーザ名からの脱却）**:
   - TwitterやGoogleのOAuthアカウント名を使用せず、ユーザーがパーティ公開時（`PublishDialog`）に自分で任意のユーザ名（トレーナー名）を入力できるようにする。
3. **デフォルトユーザ名を「名無しのトレーナー」に設定**:
   - ユーザ名が未入力の場合、ランキングでの表示およびデフォルト値を「名無しのトレーナー」（多言語対応）とする。
4. **データモデル・データベースの拡張**:
   - D1データベースの `parties` テーブルに `author_name` カラムを追加するマイグレーションを作成。
   - 単一パーティ保存（`PUT /api/parties/[id]`）、一括同期（`POST /api/parties/bulk-sync`）、ランキング取得（`GET /api/ranking`）で `author_name` を永続化・取得できるように改修する。

---

## 現状の仕様と課題

1. **アイコンとユーザ名の表示**:
   - 現状の `PartyCard.tsx` では、`party.author_avatar` があれば丸型アバター画像を、なければ `i-lucide-user` アイコンを表示している。
   - ユーザ名は `users.name`（Google/Twitterアカウントの表示名）を D1 から `LEFT JOIN users` して取得・表示している。
2. **課題**:
   - ユーザーの要望として、個人用SNS等のアカウント名がそのままランキングに露出することを防ぎ、自分で好きなトレーナー名を設定したい。また、アバターアイコンも不要でシンプルにしたい。

---

## 改修設計とアーキテクチャ

### 1. データベース・マイグレーション
- **マイグレーションファイル**: `migrations/0002_add_author_name_to_parties.sql`
  ```sql
  ALTER TABLE parties ADD COLUMN author_name TEXT;
  ```
- **API改修**:
  - `functions/api/parties/[id].ts`:
    - `INSERT INTO parties (..., author_name, ...) VALUES (..., ?)`
    - `ON CONFLICT(id) DO UPDATE SET author_name = excluded.author_name, ...`
    - `author_name` が空文字列または未指定の場合は null または '名無しのトレーナー'（クライアントまたはサーバーで統一）。
  - `functions/api/parties/bulk-sync.ts`:
    - 同様に `author_name` を INSERT / UPDATE カラムに追加。
  - `functions/api/ranking.ts`:
    - `users.avatar_url as author_avatar` をクエリから削除。
    - `parties.author_name` を直接選択（`LEFT JOIN users` は不要化または削除）。

### 2. データ型およびクライアント側同期
- `src/context/AppContext.tsx`:
  - `SavedParty` 型に `authorName?: string;` を追加。
- `src/utils/sync.ts`:
  - `D1PartyRecord` 型に `author_name?: string | null;` を追加（`author_avatar` は任意または削除）。
  - `partyToD1Record`: `author_name: party.authorName || null` を付与。
  - `d1RecordToParty`: `authorName: record.author_name || undefined` を復元。

### 3. UIコンポーネント改修
- **公開ダイアログ (`src/components/PartySimulator/PublishDialog.tsx`)**:
  - 「ユーザ名（トレーナー名）」の入力欄（Input）を追加。
  - プレースホルダー: 「名無しのトレーナー」
  - 初期値: 保存済みパーティの `authorName`、または空（未設定時）。
  - 保存時: 入力されたユーザ名を `authorName` として親に通知。
- **パーティシミュレーター (`src/components/PartySimulator/PartySimulator.tsx`)**:
  - `handleSavePublishMeta` で `authorName` を受け取り、`updatePartyMeta` および D1 PUT リクエストに反映。
- **パーティカード (`src/components/PartyRanking/PartyCard.tsx`)**:
  - `party.author_avatar` および `i-lucide-user` アイコンのレンダリングコードを削除。
  - ユーザ名テキストのみを表示（`party.author_name || t('partyRanking.anonymousAuthor')`）。

### 4. 多言語対応 (i18n)
- 4言語の辞書ファイル（`ja.json`, `en.json`, `ko.json`, `zh-Hant.json`, `zh-Hans.json`）を更新:
  - `partyShare.authorName`:
    - `ja`: "ユーザー名 (トレーナー名)"
    - `en`: "Trainer Name"
    - `ko`: "트레이너 이름"
    - `zh-Hant`: "訓練家名稱"
    - `zh-Hans`: "训练家名称"
  - `partyShare.authorNamePlaceholder`:
    - `ja`: "未入力時は「名無しのトレーナー」"
    - `en`: "Defaults to Anonymous Trainer"
    - `ko`: "미입력 시 '이름 없는 트레이너'"
    - `zh-Hant`: "未輸入時為「無名訓練家」"
    - `zh-Hans`: "未输入时为「无名训练家」"
  - `partyRanking.anonymousAuthor`:
    - `ja`: "名無しのトレーナー" (既設確認・統一)
    - `en`: "Anonymous Trainer"
    - `ko`: "이름 없는 트레이너"
    - `zh-Hant`: "無名訓練家"
    - `zh-Hans`: "无名训练家"

---

## TDD (テスト駆動開発) 計画
1. **Red フェーズ**:
   - `functions/api/parties/[id].test.ts`: `author_name` を含む UPSERT の検証テストを追加。
   - `PublishDialog.test.tsx`: ユーザ名入力フィールドの存在と、入力したユーザ名が `onSave` に渡されることのテストを追加。
   - `PartyCard.test.tsx` (または `PartyRanking.test.tsx`): 作者アバターアイコンが存在せず、カスタムユーザ名のみが表示されることのテストを追加。
2. **Green フェーズ**:
   - マイグレーションファイル作成。
   - APIエンドポイント改修（`[id].ts`, `bulk-sync.ts`, `ranking.ts`）。
   - クライアント同期ヘルパー（`sync.ts`）および型定義改修。
   - `PublishDialog.tsx`, `PartySimulator.tsx` 改修。
   - `PartyCard.tsx` 改修（アイコン削除、ユーザ名のみ表示）。
   - 多言語辞書（5ファイル）に対称キーを追加・更新。
3. **Refactor & Verify**:
   - `npm test`（全46テストスイート）の実行。
   - `npx @biomejs/biome check` の検証。
   - `npm run build` でのビルド検証。
