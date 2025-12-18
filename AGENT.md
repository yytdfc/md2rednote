# markdown2rednote - Agent Context

## Project Overview

A React web tool that converts Markdown to paginated images for Xiaohongshu (小红书) posts using Paged.js.

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Package Manager**: Bun (use `bun.lock`)
- **Markdown**: marked
- **Pagination**: Paged.js (loaded via CDN in iframe)
- **Image Export**: html2canvas + File System Access API

## Project Structure

```
├── src/
│   ├── App.tsx        # Main component - ALL logic is here
│   ├── App.css        # UI styles (dark theme)
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── public/
│   └── paged-styles.css  # (legacy, not used)
├── pagedjs/           # Paged.js source (reference only)
└── temp/              # Temporary files (gitignored)
```

## Key Architecture

### Single Component Design
Everything is in `src/App.tsx`:
- `PageConfig` interface - all configuration options
- `themes` object - 10 color themes with coordinated colors
- `generateStyles()` - generates CSS for Paged.js
- Rendering happens in an iframe to isolate Paged.js

### Configuration System
- Stored in localStorage (`md-paged-config`)
- Import/export as JSON
- Theme switching auto-applies coordinated colors

### Cover Page
- First `<h1>` becomes cover page with decorative elements
- Uses Paged.js named page (`@page cover`)
- Decorative quotes「」and gradient lines

### Page Lines Feature
- Optional decorative lines on content pages
- Uses `::before`/`::after` on `.pagedjs_pagebox`

## Commands

```bash
bun install      # Install dependencies
bun run dev      # Start dev server
bun run build    # Production build
```

## Common Modifications

### Adding a new theme
1. Add to `themes` object with: bg, text, accent, quote, headingColor, boldColor, codeBg
2. Add to `PageConfig['theme']` union type
3. Add `<option>` in theme selector

### Adding a new config option
1. Add to `PageConfig` interface
2. Add default in `defaultConfig`
3. Add CSS in `generateStyles()` if needed
4. Add UI control in config panel

### Modifying cover decorations
Look for `.cover::before`, `.cover::after`, `.quote-left`, `.quote-right` in `generateStyles()`

## Notes

- Paged.js is loaded from CDN, not bundled
- Image export uses File System Access API (Chrome only)
- All fonts are local system fonts (no CDN)
