# 計画書: README.md の日本語ドキュメント刷新

## 1. 概要
プロジェクトルートにある初期状態の `README.md`（Vite の初期テンプレート）を、本アプリケーション「poke-tool（ポケモンチャンピオンズ対戦データ分析Webツール）」の仕様・機能・技術スタック・開発手順を網羅した日本語ドキュメントに刷新する。

---

## 2. README.md の構成案

1. **プロジェクトタイトル・バッジ・概要**
   - プロジェクト名: `poke-tool`
   - ポケモンチャンピオンズ向けの対戦支援・データ分析 Web アプリケーション。
   - 完全ローカル動作（ローカルファースト）、プライバシー配慮、高速なSPA/MPA設計。

2. **主な機能一覧**
   - **努力値計算・ステータス調整 (EV Calculator)**
     - 0〜32ステップの努力値入力
     - 実数値Lv50のリアルタイム計算
     - 物理・特殊耐久最適化（HBDバランス配分）
     - 設定のURL共有
   - **火力・耐久ランキング (Stat Ranking)**
     - 特性・タイプ一致・技威力を加味した最大火力指数
     - 物理・特殊耐久指数
     - フィルタ機能（タイプ、わざタイプ、物理/特殊分類、メガポケモン除外、反動技除外）
   - **パーティ編成シミュレーター (Party Simulator)**
     - 最大6体のパーティ構築
     - 防御相性の一貫性分析・弱点タイプ可視化
     - 攻撃範囲のカバー率分析
     - パーティ保存（IndexedDB/localStorage）とURL共有
   - **充実した共有機能 (Share System)**
     - Web Share API による端末ネイティブ共有シート呼び出し
     - X, Bluesky, LINE, WhatsApp, Weibo, KakaoTalk 対応
     - ワンクリック URL コピー
   - **多言語対応 (i18n)**
     - 日本語、英語、韓国語、繁体字中国語、簡体字中国語の5言語対応
     - ローマ字・かな・英名・ハングル・漢字による多言語インクリメンタル検索
   - **UI / アクセシビリティ**
     - UnoCSS によるプレミアムデザイン
     - ダークモード / ライトモード完全対応（十分なコントラスト比を確保）

3. **技術スタック**
   - Framework: React 19, TypeScript
   - Build Tool: Vite
   - Styling: UnoCSS
   - Storage: IndexedDB, localStorage
   - Testing: Vitest, React Testing Library
   - Lint / Format: Biome
   - Deployment: Cloudflare Pages

4. **開発・環境構築手順**
   - リポジトリのクローンと依存パッケージインストール（`npm install`）
   - 開発サーバー起動（`npm run dev`）
   - テスト実行（`npm test`）
   - ビルド（`npm run build`）
   - デプロイ（`npm run deploy`）

5. **ライセンス・免責事項**
   - 非公式ファンメイドツールである旨の明記
   - 著作権および知的財産権の帰属
