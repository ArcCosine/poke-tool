# poke-tool - 寶可夢冠軍 對戰分析與隊伍組建支援工具

[日本語](../README.md) | [English](README_en.md) | [한국어](README_ko.md) | [繁體中文](README_zh-Hant.md) | [简体中文](README_zh-Hans.md)

🌐 **線上工具網址**: [https://poke-tool.pages.dev/](https://poke-tool.pages.dev/)

專為《寶可夢冠軍》玩家量身打造的對戰數據分析、努力值調整與隊伍編成模擬 Web 應用程式。  
採用完全本地運行（Local-first）的客戶端架構設計，兼具極致流暢的反應速度與嚴格的隱私安全保障。

---

## 🌟 主要功能

### 1. 努力值計算與能力值調整 (EV Calculator)
- **直覺的分段步進輸入**: 提供 0～32 步進單位的操作介面（+1 / -1、歸零、32 最大化按鈕），輕鬆完成努力值配置。
- **即時計算 Lv.50 能力值**: 依據種族值、性格修正與努力值即時呈現 Lv.50 實數值。
- **耐久最佳化運算引擎**: 自動將剩餘努力值依據物理與特殊防禦的最佳比例（最大化 $H = B + D$ 等綜合耐久指數）進行分配。
- **URL 分享功能**: 可將配好的能力值參數轉換為 Base64 網址，方便書籤收藏與玩家間分享。

### 2. 火力與耐久排行榜 (Stat Ranking)
- **最大傷害指數排名**: 綜合特性（大力士、巨猩戰術等）、屬性一致加成（適應力等）與招式基礎威力，精準計算出實戰最高輸出傷害。
- **物理與特殊耐久指數排名**: 考量防守型特性（毛皮大衣、冰之鱗片、多重鱗片等）後的實質耐久排行榜。
- **豐富的篩選選項**:
  - 依寶可夢屬性 / 招式屬性 / 物理或特殊類別進行篩選
  - **排除超級進化寶可夢**: 一鍵過濾超級進化（Mega）寶可夢
  - **排除硬直招式 (反作用招式)**: 排除破壞光線、終極衝擊、加農水砲等使用後次回合無法動彈的招式，呈現更貼近實戰的輸出排行
- **升冪 / 降冪排序**: 支援指數由高至低或由低至高的自由排序。

### 3. 隊伍編成模擬器 (Party Simulator)
- **6 隻寶可夢隊伍建構**: 自由配置寶可夢、攜帶道具、性格、特性、努力值與 4 個招式。
- **防禦屬性一致性分析**: 視覺化呈現整隊的弱點、抗性與無效屬性，及時排查隊伍共同被弱點打擊的防禦漏洞。
- **進攻打擊面覆蓋率分析**: 分析全隊技能能否剋制 18 種屬性，並給出打擊面覆蓋評分。
- **本地隊伍儲存與管理**: 利用瀏覽器的 IndexedDB 與 localStorage 本地安全保存隊伍（支援隊伍重新命名與多隊伍管理）。
- **隊伍 URL 分享與匯入**: 透過 Base64URL 連結快速分享整組隊伍陣容。透過分享連結開啟後可直接還原、編輯並儲存。

### 4. 完整的社群分享系統 (Share Dialog)
- **支援 Web Share API**: 在行動裝置或支援的瀏覽器中直接呼叫系統原生分享選單（AirDrop、簡訊、通訊軟體等）。
- **一鍵社群分享**:
  - X (Twitter)
  - Bluesky
  - LINE
  - WhatsApp
  - 微博 (Weibo)
  - KakaoTalk
- **一鍵複製網址**: 快速將分享連結複製到剪貼簿。

### 5. 國際化多語言支援 (i18n)
- **完整支援 5 種語言**: 繁體中文 (`zh-Hant`)、簡體中文 (`zh-Hans`)、日文 (`ja`)、英文 (`en`)、韓文 (`ko`)。
- **多語言即時搜尋**: 支援使用平假名、片假名、羅馬拼音、英文、韓文及漢字（繁簡皆可）快速檢索寶可夢與招式。

### 6. 介面與無障礙設計
- **深色與淺色模式**: 確保在明暗環境下皆具備足夠的對比度，提供舒適清晰的閱讀體驗。
- **響應式佈局**: 透過 UnoCSS 打造無縫適配手機、平板與桌上型電腦螢幕的現代化介面。

---

## 🛠 技術堆疊

| 類別 | 使用技術 |
| :--- | :--- |
| **前端框架** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **建置工具** | [Vite](https://vitejs.dev/) (多頁面 MPA / 單頁面 SPA 架構) |
| **樣式設計** | [UnoCSS](https://unocss.dev/) (相容 Tailwind CSS 之原子化 CSS, Lucide 圖示) |
| **資料儲存** | IndexedDB, localStorage (100% 本地儲存，無外部傳輸) |
| **測試框架** | [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/) (TDD) |
| **程式碼品質** | [Biome](https://biomejs.dev/) (超高速 Linter 與 Formatter) |
| **雲端部署** | [Cloudflare Pages](https://pages.cloudflare.com/) (全球邊緣網路節點加速) |
| **圖片產出** | [@resvg/resvg-js](https://github.com/yisibl/resvg-js) (建置時自動產生 OGP 社群預覽圖) |

---

## 🚀 本地開發與建置步驟

### 環境要求
- Node.js (建議 v18 以上)
- npm

### 1. 複製專案庫並安裝相依套件
```bash
git clone https://github.com/ArcCosine/poke-tool.git
cd poke-tool
npm install
```

### 2. 啟動開發伺服器
```bash
npm run dev
```
本機開發伺服器將會啟動（預設為 `http://localhost:5173`）。

### 3. 執行測試
執行完整的 Vitest 單元與整合測試套件：
```bash
npm test
```

### 4. 正式版本建置
自動生成 OGP 圖檔、進行 TypeScript 型別檢查並透過 Vite 進行打包：
```bash
npm run build
```
打包檔案將輸出至 `dist/` 資料夾。

### 5. 部署發布 (Cloudflare Pages)
```bash
npm run deploy
```

---

## 📜 免責聲明與智慧財產權宣告

- **與官方機構之關係**:  
  本工具為玩家非官方自製的對戰數據分析輔助工具，與任天堂株式會社 (Nintendo)、株式會社 Creatures、株式會社 GAME FREAK 或株式會社寶可夢 (The Pokémon Company) 無任何商業附屬或官方合作關係。
- **版權與商標聲明**:  
  本工具中所有出現之寶可夢名稱、遊戲數據及圖像素材等智慧財產權與商標，均歸任天堂株式會社及各權利所有者所有。
- **隱私權政策**:  
  本工具貫徹「Local-first 本地優先」原則，使用者所輸入之配置數據、隊伍資料皆不會上傳至任何第三方遠端伺服器。
