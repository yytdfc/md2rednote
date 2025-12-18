# markdown2rednote - Claude Context

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
src/
├── types.ts              # Type definitions (PageConfig, ThemeColors, ThemeName)
├── config.ts             # Constants (themes, fontOptions, defaultConfig, STORAGE_KEY)
├── styles.ts             # CSS generation (generateStyles function)
├── components/
│   └── ConfigPanel.tsx   # Config panel component
├── App.tsx               # Main component (rendering logic, state management)
├── App.css               # UI styles (dark theme)
├── example.md            # Example markdown content
├── main.tsx              # Entry point
└── index.css             # Global styles
```

## Key Architecture

### Modular Design
- `types.ts` - All TypeScript interfaces and types
- `config.ts` - Theme colors, font options, default config
- `styles.ts` - Generates Paged.js CSS from config
- `ConfigPanel.tsx` - UI for all configuration options
- `App.tsx` - Main logic: markdown parsing, iframe rendering, image export

### Configuration System
- Stored in localStorage (`md-paged-config`)
- Import/export as JSON
- Theme switching auto-applies coordinated colors (text, bg, heading, bold, cover)

### Cover Page
- First `<h1>` becomes cover page with decorative elements
- Uses Paged.js named page (`@page cover`)
- Decorative quotes「」and gradient lines at 20%/80% positions

### Rendering Flow
1. Markdown → HTML via `marked`
2. HTML injected into iframe with generated CSS
3. Paged.js processes and paginates content
4. `postMessage` signals render complete

## Commands

```bash
bun install      # Install dependencies
bun run dev      # Start dev server
bun run build    # Production build
```

## Common Modifications

### Adding a new theme
1. Add to `themes` object in `config.ts` with: bg, text, accent, quote, headingColor, boldColor, codeBg
2. Add to `ThemeName` union type in `types.ts`
3. Add `<option>` in `ConfigPanel.tsx` theme selector

### Adding a new config option
1. Add to `PageConfig` interface in `types.ts`
2. Add default in `defaultConfig` in `config.ts`
3. Add CSS in `generateStyles()` in `styles.ts` if needed
4. Add UI control in `ConfigPanel.tsx`

### Modifying cover decorations
Edit `.cover::before`, `.cover::after`, `.quote-left`, `.quote-right` in `styles.ts`

### Changing example content
Edit `src/example.md` directly

## Notes

- Paged.js is loaded from CDN, not bundled
- Image export uses File System Access API (Chrome only)
- All fonts are local system fonts (no CDN)
- Widows/orphans prevention is always enabled
