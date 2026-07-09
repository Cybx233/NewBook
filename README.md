# NewBook

> A minimalist Chrome extension that replaces the new tab page with a search bar and bookmark cards.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Vue 3](https://img.shields.io/badge/Vue-3.5-brightgreen)
![License](https://img.shields.io/badge/License-GPL--3.0-orange)

NewBook transforms your browser's new tab page into a clean, terminal-styled dashboard. It reads your bookmarks directly from the browser and displays them as organized cards grouped by folder — no backend, no cloud sync, no tracking.

## Features

- **Multi-engine search bar** — Google, Bing, DuckDuckGo, GitHub, Stack Overflow, and custom engines. Switch with a click or `Tab`.
- **Bookmark card grid** — Bookmarks displayed as cards with favicons in a responsive auto-fill grid, grouped by folder.
- **Folder drill-down** — Sub-folders rendered inline as collapsible sections, preserving visual hierarchy without deep nesting.
- **Drag & drop** — Reorder bookmarks by dragging; drop onto folders or between cards.
- **Three sort modes** — Cycle through `index` (browser order), `A-Z` (alphabetical), or `recent` (newest first).
- **Middle-click open all** — Middle-click a folder name to open every bookmark inside it at once.
- **Right-click context menu** — Edit, rename, or delete bookmarks and folders with confirmation dialogs.
- **Terminal dark theme** — Warm black palette with dual-font system (sans-serif titles, monospace domains), `>_` prompts, and subtle hover animations.
- **100% local** — Zero network requests. No analytics, no telemetry, no external dependencies.

## Privacy

NewBook makes **no network requests**. Every feature runs entirely on your device:

| Concern | Status |
|---------|--------|
| External fonts (Google Fonts) | ❌ Removed — system fonts only |
| Favicon loading | ✅ Chrome's built-in `_favicon` API (local) |
| Search queries | ✅ Opened directly in new tabs — no intermediary |
| Analytics / telemetry | ❌ None |
| Data storage | ✅ `chrome.storage.sync` (search engine config only) |
| Bookmarks | ✅ Read/written directly via `chrome.bookmarks` API |

The [Content Security Policy](manifest.json) explicitly blocks all outbound connections (`connect-src 'none'`).

## Installation

### From Source

```bash
git clone https://github.com/Cybx233/NewBook.git
cd newbook
npm install
npm run build
```

Then:
1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder
4. Open a new tab — you're done!

### Chrome Web Store

*Coming soon.*

## Development

```bash
npm run dev     # Build in watch mode (rebuilds on changes)
npm run build   # One-shot production build
```

After running `npm run dev`, reload the extension from `chrome://extensions/` and refresh the new tab page to see changes.

### Tech Stack

- **Vue 3** (Composition API) — UI framework
- **Vite** — Build tool
- **Tailwind CSS v4** — Utility-first CSS with custom terminal theme

## Architecture

```
src/
├── main.js                    # App entry — createApp, mount to #app
├── App.vue                    # Root layout, provide bookmarkMap, lifecycle
├── style.css                  # Tailwind imports + terminal theme tokens
├── utils/
│   └── safeUrl.js             # URL protocol validation
├── composables/
│   ├── useBookmarks.js        # Bookmark data layer (flat map + live sync)
│   └── useSearchEngine.js     # Search engine config (presets + storage)
└── components/
    ├── SearchBar.vue          # Search input + engine switcher + Ctrl+K
    ├── EngineEditor.vue       # Search engine CRUD modal
    ├── BookmarkFolder.vue     # Folder expansion, sub-folder sections, drag target
    ├── BookmarkCard.vue       # Single bookmark card (favicon + interactions)
    └── ContextMenu.vue        # Right-click menu + edit/new/delete modals
```

### Data Flow

- **Bookmarks**: `chrome.bookmarks.getTree()` → flattened into a single `ref<Record<string, BookmarkTreeNode>>`. Children are derived on the fly via `computed` filtered by `parentId`.
- **Live Sync**: Listens to `onCreated` / `onRemoved` / `onChanged` / `onMoved` events. Events are queued and batch-applied with a 50ms debounce — no full `getTree()` re-fetch.
- **Storage**: Search engine configuration persists via `chrome.storage.sync`. Sort mode preference is also synced.

## Permissions

| Permission | Why |
|-----------|-----|
| `bookmarks` | Read and display your bookmarks; support drag-and-drop reordering, editing, and deleting |
| `storage` | Persist search engine configuration and sort preferences across devices |
| `favicon` | Access Chrome's built-in favicon service to show website icons on bookmark cards |

The extension does **not** request `tabs` or `host_permissions` — it navigates by setting `window.location.href` or `window.open`, not via the Chrome Tabs API.

## License

[GNU General Public License v3.0](LICENSE)

Copyright © 2026
