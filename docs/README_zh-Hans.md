# poke-tool - 宝可梦冠军 对战分析与队伍组建支援工具

[日本語](../README.md) | [English](README_en.md) | [한국어](README_ko.md) | [繁體中文](README_zh-Hant.md) | [简体中文](README_zh-Hans.md)

🌐 **在线工具网址**: [https://poke-tool.pages.dev/](https://poke-tool.pages.dev/)

专为《宝可梦冠军》玩家打造的对战数据分析、努力值调整与队伍阵容模拟 Web 应用程序。  
采用完全本地运行（Local-first）的客户端架构设计，兼具极致流畅的响应速度与严格的隐私安全保障。

---

## 🌟 主要功能

### 1. 努力值计算与能力值调整 (EV Calculator)
- **直观的步进分段输入**: 提供 0～32 步进单位的操作界面（+1 / -1、一键归零、32 最大化按钮），轻松完成努力值分配。
- **即时计算 Lv.50 能力值**: 根据种族值、性格修正与努力值实时呈现 Lv.50 实数值。
- **耐久优化运算引擎**: 自动将剩余努力值按照物理与特殊防御的最佳比例（最大化 $H = B + D$ 等综合耐久指数）进行分配。
- **URL 分享功能**: 可将配置好的能力值参数转换为 Base64 网址，方便收藏与玩家间分享。

### 2. 火力与耐久排行榜 (Stat Ranking)
- **最大伤害指数排名**: 综合特性（大力士、巨猩战术等）、属性一致加成（适应力等）与招式基础威力，精准计算出实战最高输出伤害。
- **物理与特殊耐久指数排名**: 考量防守型特性（毛皮大衣、冰之鳞片、多重鳞片等）后的实效耐久排行榜。
- **丰富的筛选选项**:
  - 按宝可梦属性 / 招式属性 / 物理或特殊类别进行筛选
  - **排除超级进化宝可梦**: 一键过滤超级进化（Mega）宝可梦
  - **排除硬直招式 (反作用招式)**: 排除破坏光线、终极冲击、加农水炮等使用后次回合无法动弹的招式，呈现更贴合实战的输出排行
- **升序 / 降序排序**: 支持指数由高至低或由低至高的自由排序。

### 3. 队伍阵容模拟器 (Party Simulator)
- **6 只宝可梦队伍组建**: 自由配置宝可梦、携带道具、性格、特性、努力值与 4 个招式。
- **防御属性一致性分析**: 可视化呈现整队的弱点、抗性与无效属性，及时排查队伍共同被克制的防御漏洞。
- **进攻打击面覆盖率分析**: 分析全队技能能否克制 18 种属性，并给出打击面覆盖评分。
- **本地队伍存储与管理**: 利用浏览器的 IndexedDB 与 localStorage 在本地安全保存队伍（支持队伍重命名与多队伍管理）。
- **队伍 URL 分享与导入**: 通过 Base64URL 链接快速分享整组队伍阵容。通过分享链接打开后可直接还原、编辑并保存。

### 4. 完整的社交分享系统 (Share Dialog)
- **支持 Web Share API**: 在移动设备或支持的浏览器中直接唤起系统原生分享菜单（AirDrop、短信、社交通讯软件等）。
- **一键社交分享**:
  - X (Twitter)
  - Bluesky
  - LINE
  - WhatsApp
  - 微博 (Weibo)
  - KakaoTalk
- **一键复制网址**: 快速将分享链接复制到剪贴板。

### 5. 国际化多语言支持 (i18n)
- **完整支持 5 种语言**: 简体中文 (`zh-Hans`)、繁体中文 (`zh-Hant`)、日文 (`ja`)、英文 (`en`)、韩文 (`ko`)。
- **多语言即时搜索**: 支持使用平假名、片假名、罗马拼音、英文、韩文及汉字（简繁皆可）快速检索宝可梦与招式。

### 6. 界面与无障碍设计
- **深色与浅色模式**: 确保在明暗环境下均具备充足的对比度，提供清晰舒适的阅读体验。
- **响应式布局**: 基于 UnoCSS 打造无缝适配手机、平板与桌面电脑屏幕的现代化界面。

---

## 🛠 技术栈

| 类别 | 使用技术 |
| :--- | :--- |
| **前端框架** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **构建工具** | [Vite](https://vitejs.dev/) (多页面 MPA / 单页面 SPA 架构) |
| **样式设计** | [UnoCSS](https://unocss.dev/) (兼容 Tailwind CSS 之原子化 CSS, Lucide 图标) |
| **数据存储** | IndexedDB, localStorage (100% 本地存储，无外部网络传输) |
| **测试框架** | [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/) (TDD) |
| **代码规范** | [Biome](https://biomejs.dev/) (超高速 Linter 与 Formatter) |
| **云端托管** | [Cloudflare Pages](https://pages.cloudflare.com/) (全球边缘节点加速) |
| **图片生成** | [@resvg/resvg-js](https://github.com/yisibl/resvg-js) (构建时自动生成 OGP 预览图) |

---

## 🚀 本地开发与构建步骤

### 环境要求
- Node.js (建议 v18 以上)
- npm

### 1. 克隆仓库并安装依赖
```bash
git clone https://github.com/ArcCosine/poke-tool.git
cd poke-tool
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```
本地开发服务器将启动（通常访问 `http://localhost:5173`）。

### 3. 运行测试
执行完整的 Vitest 单元与集成测试套件：
```bash
npm test
```

### 4. 生产环境构建
自动生成 OGP 资源、进行 TypeScript 类型检查并通过 Vite 打包：
```bash
npm run build
```
构建产物将输出至 `dist/` 目录。

### 5. 部署发布 (Cloudflare Pages)
```bash
npm run deploy
```

---

## 📜 免责声明与知识产权声明

- **与官方机构的关系**:  
  本工具为玩家非官方制作的对战数据分析辅助工具，与任天堂株式会社 (Nintendo)、株式会社 Creatures、株式会社 GAME FREAK 或株式会社宝可梦 (The Pokémon Company) 无任何商业附属或官方合作关系。
- **版权与商标声明**:  
  本工具中所有出现的宝可梦名称、游戏数据及图像素材等知识产权与商标，均归任天堂株式会社及各权利所有者所有。
- **隐私政策**:  
  本工具贯彻“Local-first 本地优先”原则，用户所输入的配置参数、队伍数据均不会上传至任何第三方远程服务器。
