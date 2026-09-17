# 計画書: Cookie同意バナーの位置調整（下部中央配置およびFooter重なり解消）

## 1. 概要と目的
- **ユーザーからの指摘**:
  - Cookie同意バナーが Footer と被ってしまっている。
  - 右下ではなく、「下部中央」に表示してほしい。
- **目的**:
  - Cookie同意バナー（`CookieBanner.tsx`）の表示位置を右下から「画面下部中央（センタリング）」へ変更する。
  - ボトムナビゲーションバー（`bottom-0 z-50`）の上部に十分なマージンを確保し、かつスクロール最下部でも Footer（利用規約・免責・プライバシーポリシーリンク群）と被らないよう、レイアウト全体のパディングおよび余白を調整する。

---

## 2. 実装方針とUI設計

### 2.1 CookieBanner のセンタリング配置
- **配置スタイル**:
  - 変更前:
    `fixed bottom-16 left-3 right-3 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-md z-40`
  - 変更後:
    `fixed bottom-20 sm:bottom-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-40`
  - **効果**:
    - モバイル時: 左右均等のマージン（`left-4 right-4`）でボトムナビの上部（`bottom-20` = 80px）にすっきり配置。
    - デスクトップ時: 画面水平中央（`left-1/2 -translate-x-1/2`）にセンタリング配置（最大幅 `max-w-lg`）。

### 2.2 Footer との重なり解消（スクロール領域の余白調整）
- **現状**:
  - `Layout.tsx` の全体ラッパーが `pb-24`（96px）となっており、ボトムナビ（約56-64px）はカバーしているが、Cookie バナー（高さ約100-120px）が下部にフロートしている状態だと、ページを最下部までスクロールした際に Footer のリンク群と重なる。
- **改修内容**:
  - `Layout.tsx` の全体ラッパーのボトムパディングを `pb-24` から `pb-36 sm:pb-36`（144px）程度に拡大。
  - これにより、ページを一番下までスクロールしきった状態でも、Footer の「プライバシーポリシー | 免責事項 | 利用規約」のリンクがバナーの後ろに隠れることなく、常に視認・クリック可能となります。

---

## 3. TDD（テスト駆動開発）検証計画
1. **CookieBanner 単体テスト (`CookieBanner.test.tsx`)**:
   - 下部中央配置用のクラス（`sm:-translate-x-1/2` または `sm:left-1/2` 等）がバナー要素に含まれていることをテスト。
2. **Layout 単体テスト (`Layout.test.tsx`)**:
   - `pb-36` や Footer 領域のレンダリングが正常であることを確認。
3. **全テストスイート (`npm test`) & ビルド検証 (`npm run build`)**:
   - 全48テストスイートがパスすることを確認。

---

## 4. 作業手順
1. 計画のユーザー合意
2. `CookieBanner.test.tsx` にセンタリング配置のテストを追加（Red）
3. `CookieBanner.tsx` のクラスを修正（Green）
4. `Layout.tsx` の下部余白を調整し、Footer との重複を解消
5. テスト実行（`npm test`）& ビルド（`npm run build`）
6. コミット & デプロイ & 完了報告
