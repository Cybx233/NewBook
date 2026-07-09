# NewBook

[English](README.md)

> 极简 Chrome 新标签页扩展 — 搜索栏 + 书签卡片流

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Vue 3](https://img.shields.io/badge/Vue-3.5-brightgreen)
![License](https://img.shields.io/badge/License-GPL--3.0-orange)

NewBook 将浏览器的新标签页变为一个干净、终端风格的控制面板。它直接读取你的浏览器书签，按文件夹分组展示为整齐的书签卡片 — 无后端、无云同步、无追踪。

## 功能特性

- **多引擎搜索** — 内置 Google、Bing、DuckDuckGo、GitHub、Stack Overflow，支持自定义引擎。点击或 `Tab` 切换。
- **书签卡片** — 响应式网格排列，按文件夹分组，自动抓取网站图标和域名。
- **拖拽排序** — 拖动书签到任意文件夹或卡片之间，自由调整位置。
- **排序模式** — 浏览器默认 / 按名称 / 最近添加，一键循环切换。
- **终端暗色主题** — 暖黑配色，`>_` 终端提示符，双字体排版。
- **效率快捷键** — `Ctrl+K` 聚焦搜索，中键点击文件夹批量打开全部书签，右键编辑或删除。

## 隐私说明

完全本地运行 — 不发起任何网络请求，不收集任何数据。

## 安装

### 下载安装（推荐）

1. 打开 [Releases](https://github.com/Cybx233/NewBook/releases) 页面，下载 `newbook.zip`
2. 解压到任意文件夹
3. 打开 `chrome://extensions/`（Chrome）或 `edge://extensions/`（Edge），开启 **开发者模式**
4. 点击 **加载已解压的扩展程序**，选择解压后的文件夹
5. 打开新标签页 — 搞定！

### 从源码构建

```bash
git clone https://github.com/Cybx233/NewBook.git
cd newbook
npm install
npm run build
```

然后将 `dist/` 文件夹作为已解压的扩展程序加载。

## 开发

```bash
npm run dev     # 监听模式构建（修改代码自动编译）
npm run build   # 一次性生产构建
```

运行 `npm run dev` 后，在 `chrome://extensions/` 点击扩展的刷新按钮，再刷新新标签页即可看到改动。

### 技术栈

- **Vue 3**（Composition API）— UI 框架
- **Vite** — 构建工具
- **Tailwind CSS v4** — 原子化 CSS + 自定义终端主题配色

## 架构

```
src/
├── main.js                    # 入口 — createApp，挂载到 #app
├── App.vue                    # 根布局，provide bookmarkMap，生命周期管理
├── style.css                  # Tailwind 引入 + 终端主题色定义
├── utils/
│   └── safeUrl.js             # URL 协议安全校验
├── composables/
│   ├── useBookmarks.js        # 书签数据层（扁平 map + 实时同步）
│   └── useSearchEngine.js     # 搜索引擎配置（预设 + storage 持久化）
└── components/
    ├── SearchBar.vue          # 搜索输入 + 引擎切换 + Ctrl+K 快捷键
    ├── EngineEditor.vue       # 搜索引擎 CRUD 管理弹窗
    ├── BookmarkFolder.vue     # 文件夹展开/折叠，子文件夹区域，拖拽目标
    ├── BookmarkCard.vue       # 单书签卡片（favicon + 点击/拖拽交互）
    └── ContextMenu.vue        # 右键菜单 + 编辑/新增/删除弹窗
```

## 权限说明

| 权限 | 用途 |
|------|------|
| `bookmarks` | 读取和展示浏览器书签；支持拖拽排序、编辑和删除 |
| `storage` | 跨设备同步搜索引擎配置和排序偏好 |
| `favicon` | 使用 Chrome 内置 favicon 服务获取网站图标 |

此扩展**不请求** `tabs` 或 `host_permissions` — 导航通过 `window.location.href` / `window.open` 实现，不依赖 Chrome Tabs API。

## 开源协议

[GNU General Public License v3.0](LICENSE)

Copyright © 2026
