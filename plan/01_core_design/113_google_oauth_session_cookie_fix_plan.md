# 113. Google OAuth セッションCookieおよびログイン状態永続化の不具合修正計画

## 1. 概要と背景
Google OAuth 2.0 によるログイン処理を実施した際、Google側の認証は成功するものの、アプリケーション（フロントエンド）に戻った際に未ログイン（ゲスト扱い）のままとなってしまう事象が発生している。

### 根本原因の特定
1. **RFC 6265 違反による Cookie の破棄（主要因）**:
   - `functions/_lib/auth.ts` の `createSessionCookie` において、`JSON.stringify(user)` をそのまま生文字列のまま `signToken(payload, secret)` に渡している。
   - 生成される Cookie 値は `poke_session={"id":"usr_...","name":"...","authProvider":"google"}.[hexSig]` となる。
   - RFC 6265 Section 4.1.1 の仕様上、Cookie-value にはダブルクォート (`"`)、カンマ (`,`)、セミコロン (`;`)、中括弧 (`{`, `}`) などの記号を生で含めることが禁止されている。
   - Google Chrome や Safari 等の最新ブラウザおよび Cloudflare のエッジプロキシは、これらの文字を含む `Set-Cookie` ヘッダーを「不正な構文」として破棄（Drop）するか、カンマで分割して誤認識する。
   - このためブラウザの Cookie ストレージに `poke_session` が保存されず、その後の画面遷移（`/party.html` 等）で Cookie がサーバーへ一切送信されない。
2. **Cookie パーサーの実装の脆弱性**:
   - `functions/_lib/auth.ts` の `parseSessionCookie` において `part.trim().split('=')` で分割しているため、値の途中に `=` が含まれた場合にデータが破損する恐れがある。
3. **Cloudflare Pages における複数 Set-Cookie ヘッダーの安全性**:
   - `callback/google.ts` で `sessionCookie` と `clearStateCookie` を個別に `append` しているが、カンマを含む不正な Cookie 値が存在したことでヘッダー結合時に更なる破損を招いていた。

---

## 2. 改修方針と設計詳細

### A. セッショントークンの Base64URL 化 (RFC 4648 / RFC 7515)
- セッションペイロード（ユーザー情報の JSON 文字列）を **Base64URL エンコード**（パディング `=` なし、`+` を `-`、`/` を `_` に置換）して署名トークンを作成する。
- トークンフォーマット: `${base64urlPayload}.${hexSignature}`
- 使用可能文字: `[A-Za-z0-9\-_]` と区切り文字 `.` のみ。
- これにより、日本語名やスペース、特殊記号を含むユーザーデータであっても RFC 6265 に100%準拠した安全な Cookie 値となる。

```ts
// Base64URL エンコード/デコード実装例 (Web Crypto / Standards 準拠)
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}
```

### B. Cookie パーサーの堅牢化
- `parseSessionCookie` を `indexOf('=')` による安全なスライス処理に変更。
- 前後のホワイトスペースを除去し、Cookie 名が `poke_session` に完全一致する値のみを安全に抽出。

### C. Cookie 属性の最適化
- `createSessionCookie` の属性:
  - `Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax; Secure`
  - ホストオンリーCookieとして動作させ、同一ドメインのすべてのページ（`/`, `/party.html`, `/party-ranking.html` 等）および API（`/api/*`）で送受信されることを担保。

### D. リダイレクト遷移の改善（オプション・検討事項）
- ログイン開始時（`/api/auth/google`）にリダイレクト元（例: `redirect_to` または `from` パラメータ）を受け取り、コールバック完了後に元のページへ戻れるようにする設計（未指定時はデフォルトで `/party-ranking.html` または `/party.html`）。

---

## 3. TDD (テスト駆動開発) と実装ステップ

### Step 1: 単体テストの作成 (Red)
- `functions/_lib/auth.test.ts` を拡張:
  1. 通常のユーザーデータで Cookie 生成 → パース → 検証が成功すること。
  2. 日本語文字、カンマ、ダブルクォート、URL などの特殊文字を含むユーザーデータ（例: `サトシ, "チャンピオン"`）でも安全に Cookie に格納され、完全に復元できること。
  3. 生成された Cookie 値が RFC 6265 に準拠し、禁止文字（`"`, `,`, `;`, `{`, `}` 等）を含まないことの正規表現チェック。
  4. 改ざんされたトークンや不正な Base64 文字列が安全に `null` と判定されること。

### Step 2: 実装 (Green)
- `functions/_lib/auth.ts`:
  - `toBase64Url`, `fromBase64Url` の実装。
  - `createSessionCookie`, `parseSessionCookie`, `verifySessionToken` の改修。
- `functions/api/auth/callback/google.ts`:
  - 認証コールバック時の Cookie 設定とリダイレクト処理の確認・整理。

### Step 3: 結合テストとビルド検証 (Refactor)
- `npm test` による全テストの合格確認。
- `npm run build` によるフロントエンド・Pages Functions ビルド検証。

### Step 4: 本番デプロイと動作確認
- `npx wrangler pages deploy dist --project-name poke-tool` を実行。
- 本番環境（`https://poke-tool.pages.dev`）にて Google ログインを実行し、ログイン状態が正常に反映・維持されることを確認。

---

## 4. ユーザー確認事項
- ログイン完了後のリダイレクト先について：
  - 現在は `/party.html` に固定されていますが、パーティランキング（`/party-ranking.html`）からログインした場合はパーティランキングへ戻る方が利便性が高いと考えられます。
  - 今回の改修で、元のページに戻るリダイレクト対応も含めるか、まずは不具合修正（セッション永続化）を最優先とするか確認します。
