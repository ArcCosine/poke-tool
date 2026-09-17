# 計画書 105: 人気パーティランキング機能 (新規HTMLページ) の設計と実装計画

## 1. 概要と目的
本計画では、Cloudflare D1 に保存・公開された対戦パーティを一覧・検索・活用できる独立した新ページ **「人気パーティランキング (`party-ranking.html`)」** を新設します。

ユーザーは、コミュニティで人気のパーティや最新のトレンドパーティを一覧で閲覧し、ワンクリックでパーティ編成シミュレーター（`party.html`）にインポートして調整を行ったり、ゲーム内のレンタルチームコードをコピーして即座に対戦で使うことができます。また、ログイン・未ログインを問わずお気に入り（いいね）の投票を行うことができ、重み付けアルゴリズムにより公平な人気順ランキングが形成されます。

---

## 2. 画面・ページ設計

### 2.1 MPA (Multi-Page Application) アーキテクチャ
本プロジェクトの既存ページ構造に合わせ、独立したHTMLエントリポイントを追加します。

| ファイルパス | 役割 |
|---|---|
| `/party-ranking.html` | 新規HTMLエントリ（メタタグ、OGP、PWA対応） |
| `src/pages/party-ranking/main.tsx` | Reactルートマウント（`AppProvider`, `Layout`） |
| `src/components/PartyRanking/PartyRanking.tsx` | パーティランキングメインコンポーネント |
| `src/components/PartyRanking/PartyCard.tsx` | 各パーティのカード表示UI |

### 2.2 Vite & ルーティング設定
- `vite.config.ts` の `build.rollupOptions.input` に `partyRanking: resolve(__dirname, 'party-ranking.html')` を登録。
- `src/components/common/Layout.tsx` の `PageId` 型および `navItems` に `partyRanking` を追加（ナビゲーションバーおよびモバイル用ボトムナビゲーションに配置）。

---

## 3. UI / UX 仕様設計

### 3.1 画面上部（ヘッダー・コントロールバー）
1. **タイトル＆説明文**: 多言語キー（`partyRanking.title`, `partyRanking.description`）を使用。
2. **ソートタブ**:
   - **人気順 (`?sort=score`)**: 重み付けスコア（`ranking_score DESC`）順に表示。上位1〜3位には特別な王冠・メダルバッジ（Gold, Silver, Bronze）を付与。
   - **新着順 (`?sort=newest`)**: 投稿日時（`created_at DESC`）順に表示。
3. **レギュレーション絞り込み**:
   - 「すべて (`all`)」「レギュレーションH」「レギュレーションG」等のドロップダウンフィルター。

### 3.2 パーティカード (`PartyCard`) の詳細仕様
1. **ヘッダー領域**:
   - 順位バッジ（人気順ソート時のみ表示: 1位〜3位はリッチなグラデーション、4位以降は控えめなバッジ）。
   - パーティ名（`title`）＆ レギュレーションバッジ。
   - 投稿者情報（アイコン画像、名前、投稿日時）。未ログイン投稿の場合は「匿名トレーナー」。
2. **ポケモン構成表示（6匹アイコン）**:
   - `decodePartyConfig(party.party_data)` によりBase62から6匹の構成データをデコード。
   - 各ポケモンのスプライト画像（`assets/pokemon-sprites/...`）、名前、タイプアイコン（`TypeBadge`）をコンパクトに並列表示。
   - 持ち物アイコンまたは持ち物名を小さくバッジ表示。
3. **コンセプト・説明文**:
   - 投稿者による解説（`description`）。長文の場合は適度にクランプ（3行表示＋展開）し、レイアウト崩れを防止。
4. **アクションバー（フッター）**:
   - **「このパーティを使う（インポート）」ボタン**:
     - クリックすると `/party.html?p=${party.party_data}` に遷移し、パーティ編成シミュレーターで即座に耐性・素早さ分析やカスタマイズが可能。
   - **「レンタルコード」コピーボタン**:
     - `rental_code` が設定されている場合のみ表示。ワンクリックでクリップボードにコピーし、「コピー完了」の視覚的フィードバックを提示。
   - **「構築記事」リンクボタン**:
     - `article_url` が設定されている場合のみ表示。外部安全属性（`target="_blank" rel="noopener noreferrer nofollow"`）を付与。
   - **「いいね（Like）」ボタン**:
     - ハートアイコン＋総いいね数。
     - クリック時に `/api/parties/${party.id}/like` へ POST 送信。ログインユーザーはセッション、未ログインユーザーはローカルの `X-Client-Id` でトグル処理。
     - 楽観的UI更新（Optimistic UI）により、クリックした瞬間にカウントと状態を即座にトグルし、優れたレスポンスを提供。

### 3.3 空状態・ローディング・エラーハンドリング
- **ローディング**: スケルトンカードを表示してコンテンツのちらつきを防止。
- **データ0件（空状態）**: 「公開されたパーティがまだありません。パーティシミュレーターからあなたの自慢の構築を公開してみましょう！」の案内とパーティシミュレーターへの誘導ボタン。
- **通信エラー**: リトライボタン付きのエラーメッセージ。

---

## 4. セキュリティとアクセシビリティ（規準遵守）
1. **AGENTS.md ガイドライン遵守**:
   - **努力値の換算表示排除**: ポケモン詳細やツールチップ等で 0〜252 の換算値は表示せず、ステップ数値（0〜32）のみ扱う。
   - **コントラスト比・ダークモード**: `text-slate-900 dark:text-slate-100`、`bg-white dark:bg-slate-900`、ボーダー `border-slate-200 dark:border-slate-800` を徹底。
   - **外部リンク安全対策**: ユーザー投稿の `article_url` に対し `noopener noreferrer nofollow` を徹底。
   - **DDoS / 負荷対策**: バックエンドのエッジキャッシュ（60秒）を尊重し、不要な短時間連続リクエストを防止。

---

## 5. 多言語化対応（i18n）
以下の文言を 5言語（`ja`, `en`, `ko`, `zh-Hant`, `zh-Hans`）の JSON 辞書に対称に追加します。

- `partyRanking.title`: 構築ランキング / Party Ranking
- `partyRanking.description`: 公開されたパーティの一覧と人気ランキングです。
- `partyRanking.sortByScore`: 人気順
- `partyRanking.sortByNewest`: 新着順
- `partyRanking.regulationAll`: すべて
- `partyRanking.importParty`: このパーティを使う
- `partyRanking.rentalCode`: レンタルコード
- `partyRanking.rentalCodeCopied`: コピーしました
- `partyRanking.article`: 構築記事
- `partyRanking.empty`: 公開されたパーティがまだありません
- `partyRanking.createPartyPrompt`: パーティを作成して公開する
- `partyRanking.anonymousAuthor`: 匿名トレーナー
- `nav.partyRanking`: 構築ランキング

---

## 6. 実装ステップと TDD（テスト駆動開発）フロー

### Step 1: 多言語辞書の整備
- `src/locales/{ja,en,ko,zh-Hant,zh-Hans}.json` に必要なキーを追加。
- `src/locales/i18n.test.ts` を実行してキーの完全一致（100% Parity）を確認。

### Step 2: テストの作成 (TDD Red)
- `src/components/PartyRanking/PartyRanking.test.tsx` を新規作成。
  - API から取得したパーティ一覧が正しく描画されるか
  - ソート切り替え時にパラメータ付きで API が再フェッチされるか
  - いいねボタン押下時に API が呼ばれ、カウントが増減するか
  - インポートボタン押下時に `/party.html?p=...` への遷移URLが正しく生成されるか
  - レンタルコードのコピー動作
- テストを実行し、未実装のため失敗（Red）することを確認。

### Step 3: コンポーネントの実装 (TDD Green)
- `src/components/PartyRanking/PartyCard.tsx` の実装。
- `src/components/PartyRanking/PartyRanking.tsx` の実装。
- テストを実行し、すべて通過（Green）することを確認。

### Step 4: HTML エントリポイントと MPA 設定
- `party-ranking.html` の作成。
- `src/pages/party-ranking/main.tsx` の作成。
- `vite.config.ts` にエントリを追加。
- `src/components/common/Layout.tsx` のナビゲーション項目を更新。

### Step 5: 全体検証・リファクタリング
- `npm run test`（全テストスイートの実行）
- `npx tsc --noEmit`（型チェック）
- `npm run build`（ビルド検証）
