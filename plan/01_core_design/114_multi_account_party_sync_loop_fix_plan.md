# 114. 複数アカウント切替時のパーティ同期ダイアログ無限ループ解消計画

## 1. 課題と背景
Xアカウントでログイン後にログアウトし、続いてGoogleアカウントでログインすると、ページをリロードするたびに「パーティデータの同期」ダイアログが表示され、「同期して保存」を押しても保存されず再度表示され続ける不具合が発生している。

### 根本原因の特定
1. **D1 の主キー制約と BOLA 防止 WHERE 句によるサイレント破棄**:
   - `parties` テーブルは `id` を PRIMARY KEY としている。
   - ユーザーが X アカウント（`usr_x`）でログイン中に同期されたパーティは、DB 上で `id: 'pty_1', user_id: 'usr_x'` として格納される。
   - ログアウト後、ブラウザの localStorage には `id: 'pty_1', userId: 'usr_x'` のパーティが残る。
   - その後 Google アカウント（`usr_google`）でログインすると、サーバーから返る Google アカウントのパーティ一覧には `pty_1` が存在しない（空配列）。
   - `usePartySync` の `mergeParties` は、ローカルの `pty_1` を「クラウド未同期の新規パーティ」と判定し、同期ダイアログを表示する。
   - ユーザーが「同期して保存」を押すと、`/api/parties/bulk-sync` へ `id: 'pty_1'` を `usr_google` として送信する。
   - しかし `functions/api/parties/bulk-sync.ts` の SQL は以下のようになっている：
     ```sql
     INSERT INTO parties (...) VALUES (...)
     ON CONFLICT(id) DO UPDATE SET ...
     WHERE parties.user_id = excluded.user_id
     ```
   - DB 上で `pty_1` の所有者は `usr_x` であるため、`parties.user_id = excluded.user_id`（`usr_x = usr_google`）が FALSE となる。
   - 他人のパーティ改ざんを防ぐための条件だが、**UPDATE も INSERT も実行されず 0 行変更でスキップ**される。
   - API はエラーを返さず `success: true` を返すため、フロントエンドは保存できたと誤認するが、実際には D1 には一切保存されていない。
   - リロードすると、Google アカウントのパーティ一覧に依然として `pty_1` が無いため、再度未同期と判定され、ダイアログが永遠に表示され続ける。

---

## 2. 解決策の設計 (多層防御アーキテクチャ)

### A. バックエンド: ID 衝突時の自動リマップと新規作成 (`bulk-sync.ts`)
- `functions/api/parties/bulk-sync.ts` において、送信されたパーティ ID が既に他ユーザー（`parties.user_id !== user.id`）に所有されている場合：
  - 他人のパーティを上書きすることはセキュリティ上禁止（BOLA 防止）。
  - 代わりに、**新しい一意な ID（UUID）を発行**し、現在のユーザー（`user.id`）の所有物として新規 INSERT する。
  - レスポンスとして `{ success: true, remappedIds: { [oldId]: newId } }` を返却する。
- 自身が所有するパーティ（`parties.user_id === user.id`）または新規 ID の場合は、通常通り INSERT または UPDATE を行う。

### B. フロントエンド: 別アカウントデータのインポートと ID 更新 (`usePartySync.ts`)
- **送信前の検出**:
  - `localParties` の中に `party.userId` が存在し、それが現在のログインユーザーと異なる（`party.userId !== user.id`）場合、別アカウントからのインポートと判定し、衝突を防ぐため新しい ID を採番して `userId` を更新した上でアップロードする。
- **レスポンスの反映**:
  - `/api/parties/bulk-sync` から `remappedIds` が返ってきた場合、ローカルのパーティ一覧（`pendingMerged`）の ID を新しい ID に差し替え、各パーティの `userId` を現在の `user.id` に設定して `setPartiesDirectly` で localStorage に永続化する。
- **リロード時の収束**:
  - 次回リロード時、`fetch('/api/parties')` から返るパーティ一覧とローカルのパーティ一覧の ID が完全に一致するため、`toUpload` が 0 件となり、同期ダイアログは表示されなくなる。

---

## 3. TDD (テスト駆動開発) と実装ステップ

### Step 1: 単体テストの作成 (Red)
1. `src/utils/usePartySync.test.ts`:
   - 別ユーザーの `userId` を持つローカルパーティが存在する場合に、正しく現在のユーザー ID に更新されて同期が完了し、ループしないことのテスト。
   - `bulk-sync` API から `remappedIds` が返された際、ローカルのパーティ ID が新しい ID に更新されて保存されることのテスト。
2. `functions/api/parties/bulk-sync.test.ts`（新規作成）:
   - 同一ユーザーのパーティは正常に INSERT/UPDATE されること。
   - 別ユーザーが既に所有する ID が送られた場合、他人のパーティを破壊せず、新しい ID にリマップされて INSERT され、`remappedIds` が返ること。

### Step 2: 実装 (Green)
- `functions/api/parties/bulk-sync.ts` の改修（所有者チェック、新規 ID 割り当て、`remappedIds` の返却）。
- `src/utils/usePartySync.ts` の改修（別アカウント ID の更新、`remappedIds` のローカル反映、`userId` の更新）。

### Step 3: 全体検証とビルド (Refactor)
- `npm test`（全テスト合格確認）。
- `npm run build`。

### Step 4: 本番デプロイと確認
- Cloudflare Pages へのデプロイ。
- 複数アカウント切替時の同期動作確認。
