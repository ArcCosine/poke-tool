# 計画書: 計画ファイルのカテゴリ分類整理プラン (65_reorganize_plans.md)

`plan/` ディレクトリ内の計画ファイル数が60を超え、非常に見通しが悪くなっているため、関連するカテゴリごとにサブディレクトリを作成してファイルを整理します。

---

## 1. 分類カテゴリとディレクトリ構成案

`plan/` ディレクトリ配下に以下の6つのカテゴリフォルダを作成し、既存の計画ファイルを分類・移動します。

### ① `plan/01_core_design/` (基本設計・システムアーキテクチャ・ロードマップ)
初期のシステム構成や技術選定、全体ロードマップに関する計画書を格納します。
*   `01_initial_plan.md`
*   `02_technology_selection.md`
*   `03_system_architecture.md`
*   `04_wasm_image_analysis_design.md`
*   `05_data_and_calculation_design.md`
*   `06_party_simulator_design.md`
*   `07_implementation_roadmap.md`

### ② `plan/02_ui_refactoring/` (UI共通化・レイアウト・UIコンポーネント)
共通コンポーネントの設計、表示崩れ修正、レイアウト変更など、フロントエンドUIに関する計画書を格納します。
*   `26_sort_order_toggle_plan.md`
*   `27_flat_button_and_hidden_sort_button_plan.md`
*   `30_pokemon_image_display_plan.md`
*   `31_type_icon_display_plan.md`
*   `32_move_category_icon_plan.md`
*   `33_gamewith_style_pokemon_input_plan.md`
*   `34_party_simulator_defense_type_icon_plan.md`
*   `35_party_simulator_ui_fixes_plan.md`
*   `36_party_simulator_separate_pokemon_icon_plan.md`
*   `37_party_simulator_layout_redesign_plan.md`
*   `38_party_simulator_dialog_and_layout_fixes_plan.md`
*   `39_party_simulator_mega_item_and_box_border_plan.md`
*   `40_party_simulator_item_dropdown_plan.md`
*   `41_component_refactoring_plan.md`
*   `43_app_component_refactoring_plan.md`
*   `44_type_badge_refactoring_plan.md`
*   `45_pokemon_search_modal_type_badge_plan.md`
*   `46_item_search_refactoring_plan.md`
*   `47_move_search_refactoring_plan.md`
*   `51_autocomplete_component_plan.md`
*   `53_fix_pokemon_name_color_plan.md`
*   `54_fix_stacking_context_plan.md`

### ③ `plan/03_filtering_and_logic/` (レギュレーション・絞り込み・計算ロジック)
検索フィルタリングやステータス・ダメージ計算ロジック、バグ修正に関する計画書を格納します。
*   `09_regulation_filtering_plan.md`
*   `16_ability_and_move_type_filter_plan.md`
*   `17_ability_display_and_category_label_plan.md`
*   `18_increase_ranking_limit_plan.md`
*   `19_fix_technician_and_swarm_plan.md`
*   `20_multiple_moves_ranking_plan.md`
*   `21_flat_ranking_by_move_plan.md`
*   `22_fix_filtering_issue_plan.md`
*   `23_perfect_filtering_logic_plan.md`
*   `24_fix_unique_key_warning_plan.md`
*   `25_ability_based_durability_plan.md`
*   `28_party_pokemon_filter_input_plan.md`
*   `29_special_moves_power_calculation_plan.md`
*   `48_hiragana_search_plan.md`
*   `49_hiragana_search_label_plan.md`
*   `50_dynamic_datalist_filter_plan.md`

### ④ `plan/04_data_and_assets/` (データ構造化・アセット取得・リージョンフォルム)
マスタデータの共通化、ベリー（きのみ）復旧、スプライト画像取得、リージョンフォルム対応などのデータ管理系計画書を格納します。
*   `42_data_commonization_plan.md`
*   `52_restore_berries_plan.md`
*   `55_avoid_github_raw_sprites_plan.md`
*   `56_download_pokemon_sprites_locally_plan.md`
*   `61_pokemon_home_sprites_replacement_plan.md`
*   `64_regional_forms_support_plan.md`

### ⑤ `plan/05_ocr_features/` (画像解析・OCR機能履歴)
過去に実装され、その後完全に削除されたOCR関連の計画書を履歴用として格納します。
*   `57_pure_onnx_ocr_cli_implementation_plan.md`
*   `58_image_analyzer_wasm_ocr_integration_plan.md`
*   `59_ocr_precision_improvement_via_scraped_fixtures_plan.md`
*   `60_ocr_refinement_ability_status_split_plan.md`
*   `63_remove_ocr_features_plan.md`

### ⑥ `plan/06_legal_and_terms/` (利用規約・ポリシー・法的ページ)
利用規約やプライバシーポリシー、免責事項などの法的ページに関する計画書を格納します。
*   `08_legal_pages_plan.md`
*   `62_update_prohibitions_terms_of_service_plan.md`

---

## 2. 実施手順

1.  **ディレクトリの作成**:
    `plan/` の下に上記の6つのフォルダを作成します。
2.  **ファイルの移動**:
    各計画ファイルを `git mv`（または通常の `mv`）を用いてそれぞれのカテゴリフォルダに移動します。
3.  **動作検証**:
    Vitest によるテストおよびプロジェクトのビルドに影響がないことを確認します（計画書の場所はソースコードの動的インポート対象外のため影響はない見込みです）。

---

## 3. 期待される効果
*   現在60個以上のファイルが平坦に並んでいる `plan/` ディレクトリが整理され、今後の開発計画の追加や過去の設計履歴の参照が大幅に容易になります。
