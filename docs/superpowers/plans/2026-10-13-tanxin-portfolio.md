# 谭鑫个人作品集网站实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 制作一个可免费部署至 GitHub Pages、以文艺米色编辑画册风展示谭鑫全部现有作品并支持后续追加视频的响应式作品集网站。

**Architecture:** 使用无构建依赖的静态 HTML、CSS 与原生 JavaScript，所有图片、字体策略和视频均由仓库自身提供，避免国内访问时依赖境外第三方 CDN。作品数据独立存放在 JavaScript 数据文件中，由统一组件渲染项目网格、筛选、图片预览与视频弹窗。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、Node.js 内置测试运行器、FFmpeg、ImageMagick/Poppler、GitHub Pages

**Spec:** `docs/superpowers/specs/2026-10-13-tanxin-portfolio-design.md`

## Global Constraints

- 网站主人只能标注为谭鑫，不得混入耿王璟的个人资料。
- 采用文艺米色、现代简约、克制高级的编辑画册式视觉。
- 压缩包内全部有效作品都要归入相应项目；首页只显示精选封面。
- 当前两条视频必须点击播放，后续视频可通过数据项追加。
- GitHub Pages 免费静态托管兼容；不得依赖外部 CDN、Google Fonts 或服务端运行时。
- 图片与视频在保证观感的前提下压缩，原始上传文件不得覆盖或删除。
- 邮箱使用 `3533435725@qq.com`，未提供的社交账号不得虚构。

## Review Focus

- 仓库放在 GitHub Pages 子路径时，全部资源仍使用相对路径并正常加载。
- 超大图片、PDF页面及HEVC视频均生成浏览器可用版本，且单文件不超过GitHub限制。
- 分类筛选后作品数量与数据一致，空分类不破坏页面布局。
- 图片和视频弹窗可通过关闭按钮、遮罩与Escape键退出，并正确恢复页面滚动。
- 无JavaScript时仍能看到基本个人信息与联系方式，移动端导航不遮挡内容。

---

### Task 1: 素材清单与网页资源流水线

**Files:**
- Create: `scripts/build-assets.sh`
- Create: `tests/assets.test.mjs`
- Create: `assets/images/**`
- Create: `assets/video/**`
- Create: `assets/data/asset-manifest.json`

**Interfaces:**
- Consumes: 用户压缩包中的图片、PDF、视频和简历素材。
- Produces: `asset-manifest.json`，每项包含 `id`、`type`、`sourceGroup`、`webPath`、`width`、`height` 与可选 `posterPath`。

- [ ] 编写素材测试，断言全部源素材都有清单记录、网页文件存在、路径为相对路径、视频编码为H.264、单文件小于100MB。
- [ ] 运行 `node --test tests/assets.test.mjs`，确认因清单和资源尚不存在而失败。
- [ ] 编写流水线：解压嵌套包、输出WebP图片、渲染PDF八页、转码两条视频并生成封面、写入清单。
- [ ] 运行流水线和素材测试，确认测试通过。
- [ ] 提交 `feat: prepare optimized portfolio assets`。

### Task 2: 页面内容与语义结构

**Files:**
- Create: `index.html`
- Create: `assets/js/projects.js`
- Create: `tests/content.test.mjs`

**Interfaces:**
- Consumes: Task 1 的 `asset-manifest.json` 与生成资源。
- Produces: `window.PORTFOLIO_PROJECTS` 项目数组；每个项目含 `id`、`title`、`category`、`year`、`description`、`cover`、`media[]`。

- [ ] 编写内容测试，断言姓名、邮箱、所有导航区块、七类项目、全部清单资源引用和两条视频数据存在，并断言不存在外部CDN链接。
- [ ] 运行 `node --test tests/content.test.mjs`，确认页面与数据缺失导致失败。
- [ ] 创建完整语义化HTML与项目数据，写入真实简历信息和克制的项目说明。
- [ ] 运行内容测试，确认通过。
- [ ] 提交 `feat: add portfolio content and structure`。

### Task 3: 交互组件

**Files:**
- Create: `assets/js/app.js`
- Create: `tests/interactions.test.mjs`

**Interfaces:**
- Consumes: `window.PORTFOLIO_PROJECTS`。
- Produces: `renderProjects(filter)`、`openMedia(item)`、`closeMedia()`、`setMenu(open)`。

- [ ] 编写静态交互契约测试，覆盖分类筛选、项目详情、图片预览、视频播放、Escape关闭、焦点恢复及后续视频数据追加能力。
- [ ] 运行 `node --test tests/interactions.test.mjs`，确认函数与事件尚不存在而失败。
- [ ] 实现数据驱动的项目渲染、筛选、详情抽屉、图片/视频弹窗、键盘与移动菜单交互。
- [ ] 运行交互测试，确认通过。
- [ ] 提交 `feat: add portfolio interactions`。

### Task 4: 文艺米色视觉与响应式布局

**Files:**
- Create: `assets/css/styles.css`
- Create: `tests/presentation.test.mjs`

**Interfaces:**
- Consumes: `index.html` 中的语义类名和 `app.js` 的状态类。
- Produces: 电脑、平板、手机三档响应式布局及可访问的焦点、弹窗和动效样式。

- [ ] 编写展示测试，断言色彩变量、字体回退、固定导航、响应式断点、焦点样式、减少动态效果支持和媒体容器规则存在。
- [ ] 运行 `node --test tests/presentation.test.mjs`，确认样式缺失导致失败。
- [ ] 实现米色编辑画册式视觉、错落作品网格、详情排版、弹窗与移动端布局。
- [ ] 运行展示测试，确认通过。
- [ ] 提交 `feat: style editorial portfolio experience`。

### Task 5: GitHub Pages交付与完整验证

**Files:**
- Create: `.nojekyll`
- Create: `README.md`
- Create: `404.html`
- Create: `tests/site.test.mjs`
- Create: `谭鑫个人作品集网站_GitHubPages版.zip`

**Interfaces:**
- Consumes: Tasks 1–4 完成的网站。
- Produces: 可直接上传GitHub仓库并启用Pages的完整静态站点压缩包。

- [ ] 编写站点测试，扫描HTML/CSS/JS所有本地资源引用，验证文件存在、路径大小写一致、无绝对本机路径、无外部运行依赖。
- [ ] 运行 `node --test tests/site.test.mjs`，确认缺失交付文件时失败。
- [ ] 添加 `.nojekyll`、GitHub Pages部署说明、友好404页及后续新增视频说明。
- [ ] 运行 `node --test tests/*.test.mjs`、链接扫描与仓库大小检查，确认全部通过。
- [ ] 使用本地静态服务器和浏览器完成电脑端、移动端、筛选、弹窗、视频播放与邮件链接检查；若浏览器能力不可用，记录验证限制。
- [ ] 打包不含Git元数据和源压缩包的交付文件，并保存可下载版本。
- [ ] 提交 `docs: package GitHub Pages portfolio`。
