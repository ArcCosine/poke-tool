# 計画書: GDPR対応 Cookie同意バナー（Cookie Consent Banner）の実装計画

## 1. 概要と背景
- **背景**:
  - 本ツールにおいて Google / X (旧Twitter) OAuth 2.0 ログイン認証およびクラウド同期機能を導入したことに伴い、セッション維持用の `poke_session` および CSRF 対策用の `poke_oauth_state` といったファーストパーティ Cookie を使用するようになりました。
  - GDPR（EU一般データ保護規則）および ePrivacy 指令への準拠として、ユーザーに対して Cookie の利用目的（認証・セキュリティ）を明示し、プライバシーポリシーへの誘導と同意確認を行う通知・同意バナーの設置が必要です。
  - 本ツールはトラッキング Cookie やサードパーティ Cookie、広告 Cookie は一切使用せず、サービス提供に不可欠な Cookie のみを使用しています。
- **目的**:
  - 全ページ（MPA全体）において、初回アクセスユーザーへ Cookie の利用目的を明示し、同意を取得する Cookie 同意バナーコンポーネント（`CookieBanner.tsx`）を実装する。
  - ユーザーが一度「同意する」を押した場合は `localStorage` に同意状態を永続化し、次回以降は非表示とする。
  - `AGENTS.md` の多言語対応（i18n: 全5言語 `ja`, `en`, `ko`, `zh-Hant`, `zh-Hans`）、ダークモード、UIアクセシビリティ、TDD（テスト駆動開発）を厳格に遵守する。

---

## 2. 実装方針とアーキテクチャ

### 2.1 コンポーネント配置
- **配置場所**: `src/components/common/CookieBanner.tsx`
- **統合先**: `src/components/common/Layout.tsx`
  - 全ページ（ダッシュボード、火力・耐久検索、努力値計算機、パーティ構築、構築ランキング、利用規約・免責・ポリシーページ）が `<Layout>` を共通利用しているため、`<Layout>` に配置することで全画面で確実に表示されます。
- **表示レイアウト & z-index**:
  - ボトムナビゲーションバー（`fixed bottom-0 z-50`）や PWA 更新通知トースト（`UpdateToast`）との重複を避ける設計。
  - モバイル: `fixed bottom-16 left-3 right-3 z-40`（ボトムナビの上部にフロート表示）
  - デスクトップ: `sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-md z-40`（右下にフロート表示）
  - スタイル: `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-4`

### 2.2 データフローと永続化
- **Storage キー**: `localStorage.getItem('poke_cookie_consent')`
  - 初期状態（`null`）: バナーを表示
  - 「同意する」クリック時: `localStorage.setItem('poke_cookie_consent', 'accepted')` を書き込み、ステートを更新してバナーをスムーズに非表示化
  - 同意済み（`'accepted'`）: マウント時にバナーを表示しない（SSR/ハイドレーション考慮で `useEffect` で確認）

### 2.3 多言語対応辞書キー (`src/locales/*.json`)
全5言語（`ja`, `en`, `ko`, `zh-Hant`, `zh-Hans`）に以下のキーを完全対称で追加：
```json
"cookieConsent": {
  "title": "Cookieの使用について",
  "description": "当ツールでは、ログイン状態の維持およびセキュリティ向上のために必要最小限のCookieを使用しています。詳細についてはプライバシーポリシーをご確認ください。",
  "accept": "同意する",
  "privacyPolicy": "プライバシーポリシー"
}
```
- **英語 (`en`)**:
  - `title`: "Cookie Notice"
  - `description`: "This tool uses minimal necessary cookies for account authentication and security purposes. For details, please review our Privacy Policy."
  - `accept`: "Accept"
  - `privacyPolicy`: "Privacy Policy"
- **韓国語 (`ko`)**:
  - `title`: "쿠키 사용 안내"
  - `description`: "본 도구는 로그인 인증 및 보안 유지를 위해 최소한의 쿠키를 사용합니다. 자세한 내용은 개인정보 처리방침을 확인해 주십시오."
  - `accept`: "동의"
  - `privacyPolicy`: "개인정보 처리방침"
- **中国語繁体字 (`zh-Hant`)**:
  - `title`: "Cookie 使用說明"
  - `description`: "本工具使用必要之最低限度 Cookie 以維持登入狀態與確保安全性。詳情請參閱隱私權政策。"
  - `accept`: "同意"
  - `privacyPolicy`: "隱私權政策"
- **中国語簡体字 (`zh-Hans`)**:
  - `title`: "Cookie 使用说明"
  - `description`: "本工具使用必要之最低限度 Cookie 以维持登录状态与确保安全性。详情请参阅隐私政策。"
  - `accept`: "同意"
  - `privacyPolicy`: "隐私政策"

---

## 3. TDD（テスト駆動開発）計画

1. **多言語対称性テスト**:
   - `src/locales/i18n.test.ts` に `cookieConsent` の全5言語キー対称性および文言存在テストを追加（Red）。
2. **コンポーネント単体テスト (`src/components/common/CookieBanner.test.tsx`)**:
   - **テスト1**: `localStorage` に同意データがない場合、バナーが表示されること。
   - **テスト2**: プライバシーポリシーへのリンク（`/privacy.html`）が正しく配置されていること。
   - **テスト3**: 「同意する」ボタンをクリックした際、`localStorage.getItem('poke_cookie_consent')` が `'accepted'` に設定され、バナーが画面から消えること。
   - **テスト4**: `localStorage` に既に `'accepted'` が保存されている場合、初期表示されないこと。
3. **Layout テスト (`src/components/common/Layout.test.tsx`)**:
   - CookieBanner が Layout 内に含まれて正しく動作することを確認。

---

## 4. 作業手順

1. **ステップ1: 多言語辞書とテストの作成 (Red)**
   - `src/locales/i18n.test.ts` にテストを追加
   - `src/locales/{ja,en,ko,zh-Hant,zh-Hans}.json` に `cookieConsent` を定義
   - `src/locales/i18n.test.ts` を実行して合格確認
2. **ステップ2: CookieBanner 単体テストの作成 (Red)**
   - `src/components/common/CookieBanner.test.tsx` を作成し、テスト失敗を確認
3. **ステップ3: CookieBanner コンポーネントの実装 (Green)**
   - `src/components/common/CookieBanner.tsx` を実装
   - 単体テストが合格することを確認
4. **ステップ4: Layout への組み込みと全体検証 (Refactor & Integration)**
   - `src/components/common/Layout.tsx` に `<CookieBanner />` を追加
   - `Layout.test.tsx` および全テストスイート（`npm test`）を実行して全パスを確認
5. **ステップ5: ビルド・デプロイ・動作確認**
   - `npm run build` で PWA・アセットバンドルを確認
   - Cloudflare Pages へのデプロイ
