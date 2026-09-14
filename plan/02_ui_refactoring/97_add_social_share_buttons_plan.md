# 計画書: SNS共有ボタン（WhatsApp、Weibo、KakaoTalk）および Web Share API ボタンの追加

## 1. 概要
現在の共有ダイアログ（`ShareDialog.tsx`）には、X (Twitter)、Bluesky、LINE の3つの共有ボタンが配置されている。
多言語対応（英語、繁体字/簡体字中国語、韓国語）および国際的な利用者の利便性向上のため、以下の機能を追加する：
1. **WhatsApp** (グローバル・英語圏等で広く利用)
2. **Weibo（新浪微博）** (中国語圏で広く利用)
3. **KakaoTalk（カカオトーク）** (韓国で広く利用)
4. **Web Share API (`navigator.share`) ボタン** (OSネイティブの共有シートを起動し、AirDropや各種メッセージングアプリへ直接共有)

---

## 2. 各共有機能の仕様とURL

### (1) WhatsApp
- **共有用 Intent URL**:
  `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
- **デザイン・スタイル**:
  - ブランドカラー: `#25D366` / hover: `#20ba5a`
  - 文字色: `text-white font-bold text-xs`
  - アイコン: WhatsApp 公式 SVG アイコン（吹き出しと受話器）
- **多言語文言キー**: `share.shareToWhatsApp`
  - ja: `"WhatsAppで送る"`
  - en: `"Share to WhatsApp"`
  - ko: `"WhatsApp으로 공유"`
  - zh-Hant: `"分享到 WhatsApp"`
  - zh-Hans: `"分享到 WhatsApp"`

### (2) Weibo（新浪微博）
- **共有用 Intent URL**:
  `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`
- **デザイン・スタイル**:
  - ブランドカラー: `#E6162D` / hover: `#cf1326`
  - 文字色: `text-white font-bold text-xs`
  - アイコン: 新浪微博 (Weibo) 公式 SVG アイコン
- **多言語文言キー**: `share.shareToWeibo`
  - ja: `"Weiboで共有"`
  - en: `"Share to Weibo"`
  - ko: `"Weibo로 공유"`
  - zh-Hant: `"分享到微博"`
  - zh-Hans: `"分享到微博"`

### (3) KakaoTalk（カカオトーク）
- **共有用 URL・挙動の仕様**:
  - 外部静的Webサイトから第三者認証キーなしで直接トークルーム選択画面を開く公開 Intent URL が提供されていないため、登録不要でブラウザから即座に共有可能な **Kakao Web共有 URL** (`https://story.kakao.com/s/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`) を標準リンク先とする。
- **デザイン・スタイル**:
  - ブランドカラー: `#FEE500` / hover: `#ebd400`
  - 文字色: `#191919`（Kakao Black, コントラスト比十分）
  - アイコン: KakaoTalk 公式 SVG アイコン（TALK吹き出し）
- **多言語文言キー**: `share.shareToKakao`
  - ja: `"KakaoTalkで送る"`
  - en: `"Share to KakaoTalk"`
  - ko: `"카카오톡으로 공유"`
  - zh-Hant: `"分享到 KakaoTalk"`
  - zh-Hans: `"分享到 KakaoTalk"`

### (4) Web Share API (`navigator.share`) ボタン
- **MDN 仕様**: [Web Share API - MDN](https://developer.mozilla.org/ja/docs/Web/API/Web_Share_API)
- **共有ロジック**:
  ```ts
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleWebShare = async () => {
    if (!canShare) return;
    try {
      await navigator.share({
        title: title || t('share.shareTitle'),
        text: shareText,
        url: shareUrl,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Web Share failed:', error);
      }
    }
  };
  ```
- **配置とスタイル**:
  - `canShare` が `true` の場合（モバイル端末や対応ブラウザ）にのみ、SNS一覧の上部に「端末の共有機能で送る（他のアプリで共有）」ボタンを幅いっぱいに表示。
  - スタイル: インディゴ〜ブルーのグラデーション、角丸 `rounded-xl`、`i-lucide-share` アイコン付き。
  - ※デスクトップ等で `navigator.share` が非対応の環境では非表示とし、URLコピーおよび各SNSボタンで操作可能にする。
- **多言語文言キー**: `share.shareViaDevice`
  - ja: `"端末の機能で共有 (他のアプリ)"`
  - en: `"Share via device (other apps)"`
  - ko: `"기기 공유 기능으로 보내기 (기타 앱)"`
  - zh-Hant: `"透過裝置分享 (其他應用)"`
  - zh-Hans: `"通过设备分享 (其他应用)"`

---

## 3. UIレイアウト設計
- **上部**:
  - タイトル・説明文
  - URL入力欄 ＆ 「URLをコピー」ボタン
- **中央（Web Share API ボタン）**:
  - `canShare` が有効な場合、専用の「端末の機能で共有 (他のアプリ)」ボタンを表示
- **下部（SNS共有ボタングリッド）**:
  - 6ボタン（X, Bluesky, LINE, WhatsApp, Weibo, KakaoTalk）
  - スマホ（小画面）: 縦1カラム（6行）
  - デスクトップ（sm以上）: 3カラム × 2行 で美しく整列
    - 1行目: X, Bluesky, LINE
    - 2行目: WhatsApp, Weibo, KakaoTalk

---

## 4. 対象ファイルと作業項目

### Step 1: 多言語辞書の更新 (i18n)
- 変更ファイル:
  - `src/locales/ja.json`
  - `src/locales/en.json`
  - `src/locales/ko.json`
  - `src/locales/zh-Hant.json`
  - `src/locales/zh-Hans.json`
- 追加キー: `shareToWhatsApp`, `shareToWeibo`, `shareToKakao`, `shareViaDevice`

### Step 2: テストの作成・更新 (TDD Red)
- 変更ファイル:
  - `src/locales/i18n.test.ts`: 全言語間のキーパリティテスト（自動的に新キーを検証）
  - `src/components/common/ShareDialog.test.tsx`:
    - WhatsApp, Weibo, KakaoTalk の各リンク要素が存在し、正しい URL と属性（`target="_blank"`, `rel="noopener noreferrer"`）を持っていることをテスト。
    - `navigator.share` が定義されている場合の Web Share ボタンの表示・クリック動作（`navigator.share` の呼び出し）をテスト。
    - `navigator.share` が未定義の場合に Web Share ボタンが表示されないことをテスト。

### Step 3: コンポーネントの実装 (Green)
- 変更ファイル:
  - `src/components/common/ShareDialog.tsx`:
    - Web Share API 判定とハンドラ追加
    - 各SNS用 Intent URL の生成ロジック追加
    - SVG アイコンおよびボタンスタイリングの実装
    - 6ボタングリッドのレイアウト調整

### Step 4: 検証とデプロイ
- `npm test`（全33テストスイート）実行
- `npm run build`（ビルド＆OGP生成）実行
- Cloudflare Pages へのデプロイ（`npm run deploy`）
