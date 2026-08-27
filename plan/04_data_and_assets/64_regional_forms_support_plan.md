# 計画書: リージョンフォルムへの対応プラン (64_regional_forms_support_plan.md)

現在、ポケモン情報取得ツール (`scripts/fetch_pokeapi.ts`) はメガシンカ以外の非デフォルトフォルムをすべて除外しているため、アローラキュウコンなどのリージョンフォルム（アローラ、ガラール、ヒスイ、パルデア）がデータに含まれておらず、ポケモン一覧に表示されません。
本計画では、このツールを更新してリージョンフォルムをサポートし、データを再取得するための手順を定義します。

---

## 1. 背景と目的
アローラキュウコン（ID: 10104）などのリージョンフォルムは、PokeAPIでは `pokemon-species` の `varieties` のうち `is_default: false` として登録されています。
現行のクローラーは `is_default: false` かつ `-mega` を含まない variety をスキップしているため、これらが取得できていません。
リージョンフォルム（アローラ、ガラール、ヒスイ、パルデア）の variety 名のパターンを検知して取得対象に含め、さらに適切な日本語名・英語名を付与して再取得します。

---

## 2. 修正対象と変更内容

### ① `scripts/fetch_pokeapi.ts` の修正

1.  **取得対象の拡張 (variety 判定の修正)**
    `variety.pokemon.name` (variety 名) を用いて、アローラ (`-alola`)、ガラール (`-galar`)、ヒスイ (`-hisui`)、パルデア (`-paldea`) を含む variety を取得対象とします。
    ```typescript
    const isRegional = varietyName.includes('-alola') ||
                       varietyName.includes('-galar') ||
                       varietyName.includes('-hisui') ||
                       varietyName.includes('-paldea');

    // Skip non-default forms that are not mega evolutions or regional forms
    if (!isDefault && !isMega && !isRegional) {
      continue;
    }
    ```

2.  **日本語名・英語名決定ロジックの追加**
    リージョンフォルムに応じたプレフィックスを名前の頭に付与します。
    *   `alola` ➔ 日本語: `アローラ${baseJaName}` / 英語: `Alolan ${baseEnName}`
    *   `galar` ➔ 日本語: `ガラール${baseJaName}` / 英語: `Galarian ${baseEnName}`
    *   `hisui` ➔ 日本語: `ヒスイ${baseJaName}` / 英語: `Hisuian ${baseEnName}`
    *   `paldea` ➔ 日本語: `パルデア${baseJaName}` / 英語: `Paldean ${baseEnName}`
        *   ※パルデアケンタロス（`tauros-paldea-...`）のように、リージョン内でさらに複数の姿（combat, blaze, aqua）が存在する場合は、対応する属性サフィックス（例: `(かくとう)` / ` (Combat Breed)`）を末尾に付与するよう考慮します。

---

## 3. 実装およびデータ再取得手順

以下のステップで実施します。

### Step 1: `scripts/fetch_pokeapi.ts` の修正
上記の通り、クローラーの variety 判定および命名ロジックを修正します。

### Step 2: ポケモンデータの再取得 (クローラーの実行)
ローカルのキャッシュがある場合も考慮しつつ、データ取得スクリプトを実行して `src/data/pokemon_master.json` を更新します。
```bash
npm run update-data
```

### Step 3: 新規追加されたスプライト画像のダウンロード
新しく追加されたポケモンIDに対応するスプライト画像（HOME画像）をダウンロードするスクリプトを実行します。
```bash
node src/scripts/download_sprites.js
```

### Step 4: 動作確認とビルド検証
*   `src/data/pokemon_master.json` を確認し、アローラキュウコン（ID: 10104）等のリージョンフォルムが含まれていることを確認。
*   Vitest テストスイートがすべてパスすることを確認。
*   Vite 開発サーバーあるいはビルドを確認し、ポケモン一覧画面でアローラキュウコンなどが正しく表示・画像付きでロードされることを確認。

---

## 4. 期待される効果
*   アローラキュウコン、ガラールマッギョ、ヒスイダイケンキなどの人気リージョンフォルムポケモンが一覧・パーティシミュレータ等のすべての機能で利用可能になります。
*   リージョンフォルムのステータス値やタイプ（例: アローラキュウコンは「こおり・フェアリー」）および習得技が正確に反映されます。
