# 計画書: パーティ共有の努力値修正・URLインポート方針C・手動保存および空名バリデーションDialog

## 1. 概要
パーティ共有（URLエンコード／デコード）において発生していた「努力値の不整合」を解消し、URL経由でのパーティ読み込み時に自動保存を行わずパーティ名を空欄にする「方針C」を導入します。
さらに、パーティの自動保存を廃止し「保存」ボタン押下時のみ保存する設計へ変更するとともに、保存時にパーティ名が空欄だった場合の共通コンポーネント `Dialog` による警告および入力フィールドへの自動フォーカスを実装します。

---

## 2. 要件詳細

### 2.1 努力値（EV）のシリアライズ／デシリアライズの修正
- **現状の問題**:
  - `PokemonInstance.evs` は実数値計算用努力値（0, 4, 12, ... 252）を保持しているが、エンコード時にそのまま渡されていたため `Math.min(32, ev)` で 32 以上が 32 に頭打ちになっていた。
  - デコードされたステップ値（0〜32）をそのまま `PokemonInstance.evs` にセットしていたため、画面上のステップ数が 4 など狂っていた。
- **修正内容**:
  - **URLエンコード時 (`handleShareParty`)**:
    `m.evs` の各ステータス値を `evToStep(ev)` でステップ値（0〜32）に変換して `SharedPokemonConfig.evs` に渡す。
  - **URLデコード時 (`PartySimulator.tsx`)**:
    `decoded.members` の各ステップ値（0〜32）を `stepToEv(step)` で努力値（0〜252）に変換して `PokemonInstance.evs` にセットする。

### 2.2 共有URL読み込み時の挙動（方針C）
- **現状**:
  `createNewParty(t('share.sharePartyTitle'), importedMembers)` により、「パーティをシェア」という名前で勝手に保存され新規パーティとして追加されていた。
- **方針Cの仕様**:
  - URLから読み込んだメンバー一覧（最大6匹）を、編集中の現在のパーティスロットに直接展開する（`partyMembers` / `party` に反映）。
  - パーティ名（`partyName`）は空欄 `""` とする。
  - **自動保存は一切行わない**（localStorage の `saved_parties` には保存しない）。
  - ユーザーが画面上で確認・編集した後、「保存」ボタンを押した時のみ保存される。

### 2.3 パーティ保存の挙動変更（手動保存）
- 「保存」ボタン（`PartyControls` の `onSaveParty`）を押した時にのみ保存を実行。
- パーティ名が空（`partyName.trim() === ''`）の場合:
  - 保存処理は中断。
  - 共通コンポーネント `Dialog`（`src/components/common/Dialog.tsx`）を表示。
  - メッセージ: 「パーティ名を入力してください」（多言語対応キー: `partySimulator.partyNameRequired` 等）。
  - ダイアログのOKボタンを押して閉じた際、パーティ名入力欄（`#party-name-autocomplete`）に `.focus()` を実行する。
- パーティ名が入力されている場合:
  - 現在のパーティ名とメンバーで保存を実行し、完了ダイアログを表示。

### 2.4 多言語対応（i18n）
- 新規追加文言（4言語対等）:
  - `partySimulator.partyNameRequired`:
    - `ja`: "パーティ名を入力してください"
    - `en`: "Please enter a party name"
    - `ko`: "파티 이름을 입력해 주세요"
    - `zh-Hant`: "請輸入隊伍名稱"
    - `zh-Hans`: "请输入队伍名称"

---

## 3. 実装ステップとTDD

### Step 1: テストコードの作成（Red）
1. `src/utils/share.test.ts`:
   - 努力値 252 (Step 32) や 60 (Step 8) などの値を持つポケモンが、ステップ変換を経て正確にラウンドトリップ（エンコード→デコード）できることを検証するテスト。
2. `src/components/PartySimulator/PartySimulator.test.tsx`:
   - URLパラメータから共有パーティを復元した際、パーティ名が空欄になり自動保存されないことを検証するテスト。
   - 努力値のステップ表示が正しく復元されていることを検証するテスト。
   - パーティ名が空の状態で「保存」ボタンをクリックした際、`Dialog`（「パーティ名を入力してください」）が表示され、OKをクリックすると入力欄にフォーカスが当たることを検証するテスト。

### Step 2: 多言語辞書の更新
- `src/locales/{ja,en,ko,zh-Hant,zh-Hans}.json` に `partySimulator.partyNameRequired` を追加。

### Step 3: ロジック・コンポーネント実装（Green）
1. `PartySimulator.tsx`:
   - `handleShareParty` で `evToStep` を適用。
   - URL復元時に `stepToEv` を適用し、`createNewParty` を呼ばずに直接スロットに展開、`setPartyName('')`。
   - `saveParty` 処理内で `partyName.trim() === ''` のバリデーションを追加。
   - 空名用警告 `Dialog` の状態管理（`isNameValidationDialogOpen`）および閉じた後の `document.getElementById('party-name-autocomplete')?.focus()` 実装。

### Step 4: 検証とクリーンアップ（Refactor）
- `npm test` による全テストスイートの検証。
- `npm run build` によるビルド検証。
- コミットおよびデプロイ。
