# 126. ポケモン攻略リンク集ページ追加計画 (Pokemon Strategy Links Page Plan)

## 1. 概要と目的
ポケモンの育成、対戦考察、環境調査、仕様確認に役立つ国内外の代表的なWebサイトをまとめた独立したリンク集ページ「ポケモン攻略リンク集」（`links.html`）を新設します。
公式情報を最上位に配置し、カテゴリ分類とリスト形式を採用し、5言語（日本語・英語・韓国語・繁体字・簡体字）へのローカライズを完全対応します。

---

## 2. 要件と設計方針

### 2.1 掲載サイト一覧と構成
- **配置順序**: 公式情報を最上位に配置。
- **レイアウト**: カテゴリ分類 ＋ サイト名にハイパーリンクを付与したリスト形式。
- **言語表記**: サイト名の横に `（日本語）` `（英語）` `（韓国語）` `（繁体字）` `（繁体字/簡体字）` のような言語補助表記を付与。

#### カテゴリ 1: 公式情報 (Official Information) 【最上位】
* [ポケモンチャンピオンズ 公式サイト](https://www.pokemonchampions.jp/ja/)（日本語）
* [Pokémon Official Website](https://www.pokemon.com/)（英語）
* [포켓몬 공식 사이트](https://pokemonkorea.co.kr/)（韓国語）
* [精靈寶可夢 官方網站](https://tw.portal-pokemon.com/)（繁体字）

#### カテゴリ 2: ダメージ計算ツール (Damage Calculators)
* [ポケモン徹底攻略 ダメージ計算機](https://yakkun.com/tool/damage.htm)（日本語）
* [ポケソル ダメージ計算機](https://pokesol.app/calc)（日本語）
* [GameWith ダメージ計算機](https://gamewith.jp/pokemon-champions/554133)（日本語）
* [Pokémon Showdown! ダメージ計算機](https://calc.pokemonshowdown.com/)（英語）

#### カテゴリ 3: 対戦考察・育成論Wiki (Competitive Strategy & Analysis)
* [ポケモンチャンピオンズ育成考察Wiki](https://champions.pokewiki.net/)（日本語）
* [役割論理専用wiki](https://w.atwiki.jp/yakuwarironri66/)（日本語）
* [Smogon University](https://www.smogon.com/dex/)（英語）
* [나무위키 포켓몬스터 대전](https://namu.wiki/w/%ED%8F%AC%EC%BC%93%EB%AA%AC%EC%8A%A4%ED%84%B0/%EB%8C%80%EC%A0%84)（韓国語）

#### カテゴリ 4: 環境分析・大会・構築記事 (Metagame, Tournaments & Teams)
* [ポケモンバトルデータベース](https://champs.pokedb.tokyo/)（日本語） ※チャンピオンズ専用
* [ポケソル (POKESOL)](https://pokesol.app/)（日本語）
* [リバティノート (Liberty Note)](https://liberty-note.com/)（日本語）
* [†APPDATE†](https://app-date.net/)（日本語）
* [Victory Road](https://victoryroadvgc.com/)（英語）
* [巴哈姆特 精靈寶可夢板](https://forum.gamer.com.tw/B.php?bsn=1647)（繁体字）
* [포켓몬 갤러리 (DC Inside)](https://gall.dcinside.com/board/lists/?id=pokemon)（韓国語）

#### カテゴリ 5: 総合データベース・百科事典 (Databases & Encyclopedias)
* [ポケモン徹底攻略](https://yakkun.com/ch/)（日本語）
* [ポケモンWiki](https://wiki.pokemonwiki.com/wiki/%E3%83%A1%E3%82%A4%E3%83%B3%E3%83%9A%E3%83%BC%E3%82%B8)（日本語）
* [ポケペディア](https://pokemonpedia.net/)（日本語）
* [Serebii.net](https://www.serebii.net/)（英語）
* [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Main_Page)（英語）
* [神奇寶貝百科 (52poke)](https://wiki.52poke.com/)（繁体字/簡体字）
* [포켓몬 위키](https://pokemon.fandom.com/ko/wiki/)（韓国語）

---

### 2.2 5言語（i18n）対応方針
プロジェクト規定の5言語（`ja`, `en`, `ko`, `zh-Hant`, `zh-Hans`）すべてで以下をローカライズします。
- ページタイトル・サブタイトル
- カテゴリ見出し
- サイトの補足説明（各サイトの目的や特徴が他言語ユーザーにも伝わるようにローカライズ）
- 言語ラベル（例: `日本語` / `Japanese` / `일본어` / `日文` / `日文`）
- `src/locales/i18n.test.ts` によるキー対称性（100% Parity）の自動テスト

---

### 2.3 アーキテクチャとページ構造
1. **独立したHTMLページ (`links.html`)**:
   - `index.html` や `ranking.html` と同様にルートに `links.html` を作成。
   - `src/pages/links/main.tsx` および `src/pages/links/LinksPage.tsx` を実装。
   - `vite.config.ts` の `rollupOptions.input` に `links: resolve(__dirname, 'links.html')` を登録。
2. **ダッシュボードおよびフッター・ナビゲーションからの導線**:
   - ダッシュボード（`index.html`）の機能カード一覧に「ポケモン攻略リンク集」カードを追加。
   - 画面下部のボトムナビゲーションバー（フッター固定バー）にボタンテキスト「リンク集」としてアイコン付きナビ項目を追加。
   - ページ最下部のフッターリンクにも「リンク集」テキストでリンクを追加。
3. **UI設計・アクセシビリティ**:
   - ガイドラインに従い、スマートフォン幅（320px〜）で横スクロールを発生させないレスポンシブ設計（`min-w-0`, `truncate` または `break-words`）。
   - ダークモードでの高コントラスト確保（`dark:text-slate-100` 等）。
   - 外部リンクにはアクセシビリティとセキュリティを考慮して `target="_blank" rel="noopener noreferrer"` を付与し、外部リンクアイコンを表示。

---

## 3. 実装手順（TDDサイクル）

1. **Phase 1: テスト作成（Red）**
   - 多言語辞書（`ja.json`, `en.json`, `ko.json`, `zh-Hant.json`, `zh-Hans.json`）にリンク集用のキーを追加し、`i18n.test.ts` で対称性を検証。
   - `LinksPage.test.tsx` を作成し、カテゴリヘッダーの表示、リンクの存在、セキュリティ属性（`rel="noopener noreferrer"`）の検証テストを作成。
2. **Phase 2: 実装（Green）**
   - リンクデータ定義（`src/data/usefulLinks.ts` など）を作成。
   - `LinksPage.tsx` コンポーネントおよびエントリポイント（`links.html`, `src/pages/links/main.tsx`）を実装。
   - `vite.config.ts` にエントリを追加。
   - ダッシュボードおよびフッターにリンクを追加。
   - テストを実行しすべてグリーンになることを確認。
3. **Phase 3: リファクタリング & 検証（Refactor & Verify）**
   - レスポンシブ表示、ダークモードコントラスト、ビルド（`npm run build`）の正常性を確認。
