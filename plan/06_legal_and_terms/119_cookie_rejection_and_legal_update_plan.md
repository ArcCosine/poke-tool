# 計画書: Cookie同意・拒否機能（受け入れる/受け入れない）の実装および法的文書の改定

## 1. 概要と背景
- **ユーザー要望**:
  - Cookie同意バナーに「受け入れる」ボタンと「受け入れない」ボタンを作成する。
  - 「受け入れない」ボタンを押した場合は Cookie を使用しないように制御する。
  - これに伴い、プライバシーポリシー・免責事項・利用規約等の法的文書（リーガル関連）の文言を修正する。
- **目的**:
  - GDPR（EU一般データ保護規則）および ePrivacy 指令に完全準拠し、ユーザーに Cookie の明確なオプトイン／オプトアウト（拒否権）を提供する。
  - Cookie を拒否（受け入れない）した場合でも、本ツールの強みである「ローカルファースト（完全ゲスト利用）」により、ダメージ計算やローカルパーティ作成・保存などのすべての基本機能が制限なく安全に利用できる仕組みを明示・担保する。
  - Cookie を拒否した場合は、ログインセッションや OAuth 認証などの Cookie を使用する処理を遮断・消去する。
  - 全5言語（`ja`, `en`, `ko`, `zh-Hant`, `zh-Hans`）で多言語キー対称性と翻訳を整備する。

---

## 2. システム設計と実装方針

### 2.1 Cookie同意状態の管理 (`localStorage`)
- **ストレージキー**: `poke_cookie_consent`
  - `'accepted'`: Cookie の利用を許可。ログイン認証・クラウド同期機能が利用可能。
  - `'rejected'`: Cookie の利用を拒否。Cookie を発行・使用せず、完全ゲストモードで動作。
  - `null`: 未選択。Cookie同意バナーを表示。

### 2.2 「受け入れない」クリック時の挙動制御
- **Cookie の完全無効化・削除**:
  - `localStorage.setItem('poke_cookie_consent', 'rejected')` を設定。
  - 既存のログインセッションが存在する場合は、`/api/auth/logout` を呼び出してサーバー側 Cookie（`poke_session`, `poke_oauth_state`）をクリアし、認証ステートを初期化（ログアウト）する。
  - `AuthContext` において、`poke_cookie_consent === 'rejected'` の場合は `/api/auth/me` によるセッション確認リクエストをスキップし、Cookie を送信しない。
  - ユーザーが Cookie 拒否状態でログインボタン（Google / X）をクリックした場合は、「ログイン機能を利用するには Cookie の受け入れが必要です」と同意を促す再確認ダイアログ（またはバナー再表示）を提示する。

### 2.3 UI コンポーネント改修 (`CookieBanner.tsx`)
- **ボタン構成**:
  - 「受け入れない（拒否）」ボタン (`variant="secondary"`)
  - 「受け入れる（同意）」ボタン (`variant="primary"`)
- **説明文の更新**:
  - 「当ツールでは、アカウントログインおよびクラウド同期機能の提供のためにCookieを使用します。Cookieを拒否した場合でも、計算ツールやローカルパーティ作成等の基本機能はそのままご利用いただけます。」
- **Footer への「Cookie設定」リンク追加 ([Layout.tsx](file:///home/arccosine/poke-tool/src/components/common/Layout.tsx))**:
  - 一度「受け入れる」または「受け入れない」を選択した後でも、いつでもユーザーが Footer から Cookie 設定を変更・再選択できるよう、Footer に「Cookie設定」リンク（クリックでバナーを再表示）を設置。

### 2.4 リーガル文書（法的文書）の改定
全5言語（`ja`, `en`, `ko`, `zh-Hant`, `zh-Hans`）で以下を改定：
1. **プライバシーポリシー (`privacyPolicyText`)**:
   - 【Cookieおよびセッショントークンの利用と選択権】
     - ファーストパーティCookie（`poke_session`, `poke_oauth_state`）の利用目的の明記。
     - ユーザーはCookieの使用を受け入れるか、受け入れない（拒否）かを選択できること。
     - Cookieを拒否した場合、本ツールはCookieを発行・利用しないこと。
     - Cookieを拒否した場合でも、ダメージ計算・育成調整・ローカルパーティ作成・保存等のすべてのローカルファースト機能はゲストモードとして制限なく利用できること。
     - Cookieを拒否した場合、アカウント認証やクラウド同期・ランキング公開機能のみが無効化されること。
2. **免責事項 (`disclaimerText`)**:
   - Cookieを拒否したことによるアカウント連携・クラウド同期・ランキング公開機能の利用不可に関する免責を追記。
3. **利用規約 (`termsOfServiceText`)**:
   - アカウント連携およびクラウド同期サービスの利用にはCookieの受け入れが必須であること、および拒否した場合はゲスト利用規約が適用されることを規定。

---

## 3. 多言語辞書定義 (`src/locales/*.json`)
全5言語で以下のキー対称性を維持：
```json
"cookieConsent": {
  "title": "Cookieの使用について",
  "description": "当ツールでは、アカウントログインおよびクラウド同期機能の提供のために必要最小限のCookieを使用します。Cookieを拒否した場合でも、計算ツールやローカルでのパーティ作成等の基本機能はそのままご利用いただけます。詳細についてはプライバシーポリシーをご確認ください。",
  "accept": "受け入れる",
  "reject": "受け入れない",
  "privacyPolicy": "プライバシーポリシー",
  "cookieSettings": "Cookie設定",
  "requireCookieNotice": "ログイン機能を利用するには、Cookieの受け入れが必要です。"
}
```

---

## 4. TDD（テスト駆動開発）検証計画

1. **多言語テスト (`i18n.test.ts`)**:
   - `cookieConsent.reject`, `cookieConsent.cookieSettings` の全5言語対称性検証。
   - リーガル文書の改定内容（Cookieの選択権・拒否時のゲスト利用等）の検証。
2. **CookieBanner 単体テスト (`CookieBanner.test.tsx`)**:
   - 「受け入れる」ボタンと「受け入れない」ボタンが両方レンダリングされること。
   - 「受け入れる」クリックで `localStorage` に `'accepted'` が保存され、バナーが閉じること。
   - 「受け入れない」クリックで `localStorage` に `'rejected'` が保存され、バナーが閉じること。
3. **AuthContext / ログイン制御テスト**:
   - Cookie 拒否時の Cookie 送信抑止と認証制御の検証。
4. **全体テスト & ビルド**:
   - `npm test`（全48テストスイート）および `npm run build` の完全合格。

---

## 5. 作業手順
1. 本計画書のユーザー提示と合意取得
2. 多言語辞書（全5言語）と `i18n.test.ts` の更新（Red → Green）
3. `CookieBanner.test.tsx` に「受け入れない」ボタンと挙動のテスト追加（Red）
4. `CookieBanner.tsx` の実装（「受け入れる」「受け入れない」ボタン、ハンドラ）（Green）
5. `AuthContext.tsx` および `Layout.tsx` への連携（Cookie設定変更、Cookie拒否時のセッションクリア）
6. リーガル文書（プライバシーポリシー・免責・利用規約）の改定
7. 全体テスト（`npm test`）& ビルド（`npm run build`）
8. コミット & Cloudflare Pages デプロイ & 報告
