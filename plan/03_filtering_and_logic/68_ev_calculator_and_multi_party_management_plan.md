# 計画書: 努力値計算ツールの追加と複数パーティ管理機能の実装 (68_ev_calculator_and_multi_party_management_plan.md)

本計画は、ユーザーが個別のポケモンの努力値（EVs）を調整し、実数値をリアルタイムで計算できる「努力値計算ツール」を新設し、作成したポケモンを「パーティ編成」ページへ追加する機能、およびパーティ編成ページで複数のパーティを名前付きで保存・管理・切り替えできる機能を実装する計画です。

---

## 1. 背景と目的
現在、本ツールでは努力値が `0` 固定となっており、ユーザーが独自の努力値調整を行って実数値を検証する手段がありません。
また、パーティは `localStorage` に1つしか保存できず、複数の対戦用パーティを切り替えて一貫性を分析することが困難です。
これらの課題を解決するため、以下の機能を実装します。

1.  **努力値計算ツール (`EvCalculator.tsx`) の新設**:
    *   ポケモン、性格（セレクトボックス）、努力値（各ステータス 0〜252、合計 508 / 510 制限）、特性、持ち物、技（最大4つ）を設定可能。
    *   努力値スライダーおよび数値入力によって、リアルタイムで実数値（レベル50）を計算・表示。
    *   性格補正（上昇ステータス: 赤/1.1倍、下降ステータス: 青/0.9倍）を実数値とUIに反映。
2.  **パーティへの追加と入れ替えダイアログ**:
    *   努力値設定済みポケモンを「パーティ編成」に追加。
    *   パーティが6匹満杯の場合、「新規パーティを作って追加」か「既存の1〜6匹目のいずれかのスロットと入れ替える」かを選択できるモーダルを表示。
3.  **複数パーティ管理機能**:
    *   `localStorage` に複数のパーティを配列形式で保存 (`saved_parties`)。
    *   パーティ編成ページにおいて、パーティ名を `Autocomplete`（プルダウン付きテキスト入力、文字列絞り込み可能）で選択・切り替え可能にする。
    *   「新規作成」および「削除」ボタンの追加。

---

## 2. 状態管理の変更と設計

### 2.1. グローバルステートへの移行 (`AppContext.tsx`)
現在 `PartySimulator.tsx` がローカルで持っている「現在のパーティ (`party`)」および「現在のパーティ名 (`partyName`)」をグローバルコンテキスト (`AppContext.tsx`) に移行し、努力値計算ツールなど他の画面からも直接参照・追加ができるようにします。

```typescript
export interface SavedParty {
  id: string;
  name: string;
  members: PokemonInstance[];
}
```

`AppContextProps` に以下を追加：
*   `parties`: 保存されているすべてのパーティ (`SavedParty[]`)
*   `currentPartyId`: 現在選択中のパーティのID (`string`)
*   `partyName`: 現在のパーティ名 (`string`)
*   `partyMembers`: 現在のパーティのポケモン一覧 (`PokemonInstance[]`)
*   `selectParty`: 指定したIDのパーティをロードする関数
*   `saveCurrentParty`: 現在のパーティを保存（更新）する関数
*   `createNewParty`: 新しい空のパーティを作成する関数
*   `deleteParty`: パーティを削除する関数
*   `addPokemonToParty`: ポケモンを現在のパーティに追加する関数。満杯（6匹）の場合は入れ替え用コールバックまたは状態を呼び出す。

---

## 3. 具体的な実装変更

### ① `src/utils/party.ts` のバグ修正 (TDD)
現在 `getCalculatedStat` が `baseVal + ev` となっており、努力値（0〜252）がそのまま実数値に加算されるバグがあります。これを正しい公式に修正します。

*   **現在の実装**:
    ```typescript
    if (statName === 'hp') {
      const baseHp = Math.floor(((base * 2 + iv) * level) / 100) + level + 10;
      return baseHp + ev; // バグ: 努力値がそのまま足されている
    }
    ```
*   **修正後の実装**:
    ```typescript
    // calculateStat(statName, base, iv, ev, level, natureMultiplier) を呼び出す
    ```
*   **TDD の実施**:
    `src/utils/party.test.ts` に、努力値（例: H252, A252 など）および性格補正を設定した際の実数値が、ゲーム内の正しい数値（例: ハッサムA特化で198など）と一致することを検証するテストコードを最初に追加します。

### ② 努力値計算ツールコンポーネント (`src/components/EvCalculator/EvCalculator.tsx`)
*   ポケモン選択: `PokemonSearchModal` を呼び出し。
*   性格補正: 性格定数 `NATURES` からセレクトボックスで選択。
*   努力値スライダー: 努力値上限（各252、合計508）をチェックするスライダーと数値入力。
*   最適化ボタン: 努力値の切り捨て（`ev / 4`）を意識し、無駄のない数値（`4 + 8n`）に調整するボタン。また、一括リセット（0）、一括MAX（252）ボタン。
*   特性・技・持ち物入力: `Autocomplete` や `Select` を用いて設定。
*   「パーティに追加」ボタン: パーティへの追加処理を実行。

### ③ 入れ替えモーダルの実装
パーティ追加時にすでに6匹埋まっていた場合に表示されるモーダル。
*   「新規パーティを作成してそこに追加」ボタン
*   現在パーティにいる6匹のリストを表示し、クリックしたスロットのポケモンと入れ替えるUI。

### ④ パーティ編成画面の複数パーティ管理UI
*   [PartySimulator.tsx](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx) のパーティ名入力部分を `Autocomplete` に置き換え。
*   `suggestions` に `parties.map(p => p.name)` を指定。
*   「新規パーティ」ボタン（現在の編成をクリアして新規作成）、「削除」ボタン（現在のパーティを削除）、「保存」ボタン（現在の名前で保存・上書き）を配置。

---

## 4. 開発・統合ステップ

### Step 1: テストコードの作成とバグ修正 (TDD)
1.  `src/utils/party.test.ts` に、努力値と性格を考慮した実数値計算（`getCalculatedStat`）のテストケースを追加。
2.  テストを実行し、Red（失敗）することを確認。
3.  `src/utils/party.ts` の `getCalculatedStat` を修正して Green（パス）させる。

### Step 2: グローバル状態管理の構築 (`AppContext.tsx`)
1.  `localStorage` の `saved_parties` 配列からパーティ一覧を読み込むロジックを `AppContext.tsx` に実装。
2.  パーティの追加、入れ替え、新規作成、削除、保存の各処理を実装。

### Step 3: 努力値計算画面 (`EvCalculator.tsx`) の実装
1.  性格セレクト、努力値スライダー、実数値リアルタイム計算表示を備えた `EvCalculator.tsx` を新規作成。
2.  `App.tsx` のタブ定義に `evCalculator` を追加し、ナビゲーションから遷移できるようにする。

### Step 4: 入れ替えモーダルの統合
1.  努力値計算ツールから追加する際、6匹満杯時の入れ替え/新規作成モーダルを表示。
2.  入れ替え処理または新規パーティ作成処理の動作確認。

### Step 5: `PartySimulator.tsx` の複数パーティUI統合
1.  パーティ名を `Autocomplete` を使用した選択・検索フィールドに変更。
2.  複数パーティのロード、切り替え、新規作成、削除が正常に `localStorage` と連動することを確認。
