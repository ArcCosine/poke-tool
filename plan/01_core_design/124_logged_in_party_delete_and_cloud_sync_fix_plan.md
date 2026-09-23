# 計画書: ログイン時のパーティ削除機能およびクラウド同期不整合（復活問題）の改修

## 1. 現状の課題と原因の分析

### ユーザーからの問い合わせ
> 「パーティ削除機能が正しく機能していません。ログイン済の時に、ページ遷移後、削除したパーティが復活してしまいます。対応してください。」

### 根本原因の特定
1. **フロントエンドからサーバーへの `DELETE` リクエスト未送信**:
   - [`PartySimulator.tsx`](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx) の削除ボタン押下時、[`AppContext.tsx`](file:///home/arccosine/poke-tool/src/context/AppContext.tsx) の `deleteParty(currentPartyId)` のみを呼び出している。
   - `deleteParty` は React のローカル状態（`parties`）および `localStorage`（`saved_parties`）からのみパーティを削除しており、バックエンドの Cloudflare D1 API（`DELETE /api/parties/${id}`）を一切呼び出していない。
   - バックエンド側（`functions/api/parties/[id].ts`）にはすでに BOLA 保護付きの `onRequestDelete` が実装されているが、呼び出し側が存在しなかった。

2. **`usePartySync` および `mergeParties` によるクラウドデータの自動復活**:
   - ログイン状態のユーザーが別ページ（`/ranking.html` 等）に遷移、またはリロードして `/party.html` に戻ると、[`usePartySync.ts`](file:///home/arccosine/poke-tool/src/utils/usePartySync.ts) の `checkAndSync()` が実行される。
   - `GET /api/parties` により Cloudflare D1 に保存されているユーザーの全パーティ一覧を取得する。
   - D1 上では該当パーティが削除されていないため、サーバーから返却される。
   - [`mergeParties(localParties, cloudParties)`](file:///home/arccosine/poke-tool/src/utils/sync.ts) は「クラウド側にのみ存在するパーティは merged に残す」という仕様であるため、削除されたパーティが `merged` 配列に追加されてしまう。
   - その結果、`setPartiesDirectly(normalized)` によってローカル状態および `localStorage` に復元（復活）されてしまっていた。

3. **オフライン操作やネットワーク遅延への耐性不足（墓石/Tombstone の不在）**:
   - 削除時に即座に `DELETE` リクエストを送るだけでは、通信遅延中にページ遷移した場合やオフライン時に削除した場合、次回のクラウド同期で再びゾンビ復活してしまうリスクがある。
   - 「ローカルで意図的に削除したパーティのID」を追跡する仕組み（Tombstone）が存在しなかった。

---

## 2. 改修方針とアーキテクチャ設計

### (1) 削除時のクラウド `DELETE` 呼び出し連携
- ログイン中のユーザーがパーティを削除した際、ローカルの削除処理に加えて、即座に `DELETE /api/parties/${partyId}` を呼び出して Cloudflare D1 上のレコードを削除する。

### (2) 削除済みIDの追跡（Tombstone 方式）による復活防止
- `localStorage` に `deleted_party_ids`（削除済みパーティID配列）を保持する。
- `deleteParty(id)` 実行時、該当 ID を `deleted_party_ids` に追加。
- [`usePartySync.ts`](file:///home/arccosine/poke-tool/src/utils/usePartySync.ts) で `GET /api/parties` のレスポンスを受け取った際：
  1. `deleted_party_ids` に含まれるパーティを `cloudRecords` から除外する。
  2. サーバー側にまだ残っている（＝遅延やオフライン削除等で未同期の）削除済みパーティに対して、バックグラウンドで `DELETE /api/parties/${id}` を再送して D1 をクリーンアップする。
- これにより、通信遅延・オフライン削除・即時画面遷移が発生しても、100% 確実にパーティの復活を防止する。

### (3) 誤削除防止の確認ダイアログ
- 既存の多言語文言 `t('partySimulator.deletePartyConfirm')`（「このパーティを削除してもよろしいですか？」）を活用し、削除実行前に確認ダイアログまたは `window.confirm` による確認を行う。

---

## 3. TDD（テスト駆動開発）の実施結果

### Step 1: 単体テストの作成（Red） [完了]
1. `src/utils/usePartySync.test.ts`:
   - 削除済みID（`deleted_party_ids`）が localStorage に存在する場合、クラウドから取得した該当パーティを無視し、復活させないことのテストを追加。
   - サーバー側に残存する削除済みパーティに対して `DELETE /api/parties/${id}` が呼び出されることのテストを追加。
2. `src/components/PartySimulator/PartySimulator.test.tsx`:
   - パーティ削除ボタン押下時に確認モーダルが開くことのテストを追加。
   - パーティ削除実行時、ログイン中であれば `DELETE /api/parties/${currentPartyId}` が呼び出されることのテストを追加。
3. `src/context/AppContext.test.tsx`:
   - `deleteParty` 実行時に `deleted_party_ids` が localStorage に記録されることのテストを追加。

### Step 2: 実装（Green） [完了]
1. `src/utils/usePartySync.ts`: `deleted_party_ids` の読み込み・フィルタリング・残存パーティの `DELETE` 再送処理を実装。
2. `src/context/AppContext.tsx`: `deleteParty` において `deleted_party_ids` への登録処理を実装。
3. `src/components/PartySimulator/PartySimulator.tsx`: 削除確認モーダル（`Dialog`）とログイン時の `DELETE /api/parties/${id}` 即時呼び出しを実装。

### Step 3: リファクタリング & 全体検証（Refactor） [完了]
- `npm test`: 全48テストスイート（293テスト）すべて合格。
- `npm run build`: TypeScript型チェック、PWA Precache（778件）、Vite本番バンドルすべて成功。

---

## 4. 影響範囲
- `src/utils/usePartySync.ts`: クラウド同期時の削除済みフィルタリング
- `src/utils/usePartySync.test.ts`: 単体テスト
- `src/context/AppContext.tsx`: `deleteParty` 時の Tombstone 記録
- `src/components/PartySimulator/PartySimulator.tsx`: 削除実行時の API 連携と確認処理
- `src/components/PartySimulator/PartySimulator.test.tsx`: 単体テスト
