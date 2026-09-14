# poke-tool - Pokémon Champions Battle Analysis & Team Builder

[日本語](../README.md) | [English](README_en.md) | [한국어](README_ko.md) | [繁體中文](README_zh-Hant.md) | [简体中文](README_zh-Hans.md)

🌐 **Web Application**: [https://poke-tool.pages.dev/](https://poke-tool.pages.dev/)

A battle data analysis, EV calculation, and team composition simulator web application designed for Pokémon Champions.  
Built with a local-first, client-side architecture for maximum speed, security, and privacy without server dependency.

---

## 🌟 Key Features

### 1. EV Calculator & Stat Adjustment
- **Step-based Input**: Intuitive 0–32 step UI (+1 / -1, reset to 0, maximize to 32 buttons) for effortless EV adjustments.
- **Real-time Level 50 Stats**: Instant calculation of actual Lv.50 stats based on base stats, natures, and assigned EVs.
- **Durability Optimizer**: Automatic allocation of remaining EVs to maximize physical and special bulk (e.g., $H = B + D$ balance).
- **URL Sharing**: Export and share customized stat configurations via compressed Base64 URLs.

### 2. Stat Rankings (Damage & Bulk Search)
- **Max Damage Index Ranking**: Calculate the highest damage potential considering abilities (Huge Power, Gorilla Tactics, etc.), STAB (Adaptability, etc.), and base move power.
- **Physical & Special Durability Rankings**: Calculate effective bulk considering defensive abilities (Fur Coat, Ice Scales, Multiscale, etc.).
- **Rich Filtering Options**:
  - Filter by Pokémon Type / Move Type / Physical vs. Special category
  - **Exclude Mega Pokémon**: Toggle to exclude Mega Evolutions from the ranking
  - **Exclude Recharge Moves**: Filter out recharge moves (Hyper Beam, Giga Impact, Hydro Cannon, etc.) for realistic competitive battle rankings
- **Ascending & Descending Sort**: Sort rankings by index value in either direction.

### 3. Team Simulator (Party Builder)
- **6-Slot Team Construction**: Configure Pokémon, held items, natures, abilities, EVs, and 4 moves per slot.
- **Defensive Type Consistency Analysis**: Visualize weaknesses, resistances, and immunities across the entire team to detect common vulnerabilities.
- **Offensive Coverage Analysis**: Measure offensive coverage across all 18 types and score team attack effectiveness.
- **Local Team Storage**: Save multiple teams locally in the browser via IndexedDB and localStorage (with custom team renaming).
- **Team URL Sharing**: Share complete team builds via Base64URL links. Instantly restore, edit, and save teams opened from a shared link.

### 4. Comprehensive Sharing System
- **Web Share API**: Directly trigger the native OS share sheet on mobile devices and supported browsers (AirDrop, Messages, installed apps).
- **One-Click Social Sharing**:
  - X (formerly Twitter)
  - Bluesky
  - LINE
  - WhatsApp
  - Weibo (新浪微博)
  - KakaoTalk (카카오톡)
- **One-Click URL Copy**: Copy shareable links directly to the clipboard.

### 5. Internationalization & Localization (i18n)
- **5 Languages Supported**: Japanese (`ja`), English (`en`), Korean (`ko`), Traditional Chinese (`zh-Hant`), and Simplified Chinese (`zh-Hans`).
- **Multilingual Search**: Fast incremental search for Pokémon and moves supporting Romaji, Kana, English, Hangul, and Chinese characters (Traditional & Simplified).

### 6. UI & Accessibility
- **Dark & Light Modes**: Optimized contrast ratios for seamless readability in both light and dark themes.
- **Responsive Layout**: Designed to adapt effortlessly across smartphones, tablets, and desktop displays with UnoCSS.

---

## 🛠 Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite](https://vitejs.dev/) (Multi-Page Architecture / SPA) |
| **Styling** | [UnoCSS](https://unocss.dev/) (Tailwind CSS compatible utilities, Lucide icons) |
| **Storage** | IndexedDB, localStorage (Client-side only, zero external data leaks) |
| **Testing** | [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/) (TDD) |
| **Code Quality** | [Biome](https://biomejs.dev/) (High-performance Linter & Formatter) |
| **Hosting** | [Cloudflare Pages](https://pages.cloudflare.com/) (Global Edge Network) |
| **Asset Generation** | [@resvg/resvg-js](https://github.com/yisibl/resvg-js) (Automated OGP image generation) |

---

## 🚀 Development & Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### 1. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/ArcCosine/poke-tool.git
cd poke-tool
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
The local development server will start (typically accessible at `http://localhost:5173`).

### 3. Run Tests
Run the Vitest test suite:
```bash
npm test
```

### 4. Production Build
Generate OGP assets, run TypeScript type checking, and bundle with Vite:
```bash
npm run build
```
The production bundle will be output to the `dist/` directory.

### 5. Deploy (Cloudflare Pages)
```bash
npm run deploy
```

---

## 📜 Disclaimer & Intellectual Property

- **Relationship to Official Entities**:  
  This tool is an unofficial, fan-made battle data analysis and simulation tool. It is not affiliated with, endorsed by, or associated with Nintendo, Creatures Inc., GAME FREAK inc., or The Pokémon Company.
- **Copyrights & Trademarks**:  
  All Pokémon names, game data, and imagery are trademarks and copyrights of Nintendo, Creatures Inc., GAME FREAK inc., and The Pokémon Company.
- **Privacy Policy**:  
  This application operates on a local-first principle. No calculation data, user parameters, or saved teams are transmitted to or stored on external servers.
