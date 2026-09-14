# 計画書: 多言語 README ドキュメント（英語・韓国語・繁体字・簡体字）の作成およびデプロイ先URL記載

## 1. 概要
本プロジェクトの国際展開およびオープンソースとしてのアクセシビリティ向上のため、以下の対応を行う：
1. ルートの `README.md` の概要部分に本番デプロイ先 URL (`https://poke-tool.pages.dev/`) を記載する。
2. `docs/` ディレクトリを新規作成し、`README.md` の4言語版を作成する：
   - 英語: `docs/README_en.md`
   - 韓国語: `docs/README_ko.md`
   - 繁体字中国語: `docs/README_zh-Hant.md`
   - 簡体字中国語: `docs/README_zh-Hans.md`
3. ルート `README.md` および各言語版 README の最上部に、相互リンク（言語切り替えナビゲーション）を設置する。

---

## 2. ディレクトリ構成とファイル一覧

```
poke-tool/
├── README.md               # 日本語（メイン）+ デプロイ先URL + 言語切り替えリンク
└── docs/
    ├── README_en.md        # English + デプロイ先URL + 言語切り替えリンク
    ├── README_ko.md        # 한국어 + デプロイ先URL + 言語切り替えリンク
    ├── README_zh-Hant.md   # 繁體中文 + デプロイ先URL + 言語切り替えリンク
    └── README_zh-Hans.md   # 简体中文 + デプロイ先URL + 言語切り替えリンク
```

---

## 3. 各ドキュメントの内容方針

- **デプロイ先URLの記載**:
  各言語ドキュメントの冒頭・概要欄に `Web: https://poke-tool.pages.dev/` を明記。
- **言語切り替えナビゲーション**:
  ドキュメント冒頭に以下のような言語バーを配置：
  `[日本語](../README.md) | [English](README_en.md) | [한국어](README_ko.md) | [繁體中文](README_zh-Hant.md) | [简体中文](README_zh-Hans.md)`
- **翻訳品質と用語整合性**:
  - `src/locales/*.json` で定義されている公式用語・UI文言（努力値、実数値、反動技、メガポケモン除外、耐久最適化、パーティ編成など）と完全に一致した正確な表現を使用する。
  - マークダウン構造（見出し、箇条書き、テーブル、コードブロック）は日本語版と完全に対称にする。

---

## 4. 作業ステップ

1. **計画書の合意**: ユーザーに構成案を提示して合意を取得。
2. **ルート `README.md` の更新**:
   - 言語切り替えナビゲーションの追加
   - デプロイ先 URL (`https://poke-tool.pages.dev/`) の追加
3. **`docs/` ディレクトリ配下に各言語版を作成**:
   - `docs/README_en.md` (英語)
   - `docs/README_ko.md` (韓国語)
   - `docs/README_zh-Hant.md` (繁体字)
   - `docs/README_zh-Hans.md` (簡体字)
4. **Git コミット**: 変更をコミットし、デプロイ状態を維持。
