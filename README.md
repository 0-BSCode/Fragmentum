<div align="center">
  <img src="docs/assets/logo.png" alt="Fragmentum" width="120">

  # Fragmentum

  **Collect and compile text fragment highlights into shareable links**

  [![Chrome](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://chrome.google.com)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

## Overview

Fragmentum is a Chrome extension that helps you collect multiple text highlights from any webpage and compile them into a single shareable URL. When someone opens the link, their browser automatically scrolls to and highlights all the selected passages.

Built on the [W3C Text Fragments](https://wicg.github.io/scroll-to-text-fragment/) standard (`#:~:text=...`).

<div align="center">
  <img src="docs/assets/demo.gif" alt="Fragmentum Demo" width="700">
</div>

## Features

- **Multi-Highlight Collection** — Save multiple text highlights per page
- **One-Click Compilation** — Combine all highlights into a single shareable URL
- **Native Browser Integration** — Uses Chrome's built-in "Copy link to highlight" feature
- **Clean Interface** — Minimal, focused popup UI

## Installation

### Manual Installation (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/fragmentum.git
   cd fragmentum
   ```

2. Install dependencies and build:
   ```bash
   pnpm install
   pnpm build
   ```

3. Load the extension:
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** (top right toggle)
   - Click **Load unpacked** and select the project folder

## Usage

| Step | Action |
|------|--------|
| 1 | Select text on any webpage |
| 2 | Right-click → **"Copy link to highlight"** |
| 3 | Open the Fragmentum popup |
| 4 | Paste the link and click **Add** |
| 5 | Repeat for more highlights |
| 6 | Click **Compile & Copy** to get your shareable URL |

<div align="center">
  <img src="docs/assets/popup.png" alt="Fragmentum Popup" width="350">
</div>

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Commands

```bash
pnpm install      # Install dependencies
pnpm dev          # Watch mode
pnpm build        # Production build
pnpm test         # Run tests
pnpm typecheck    # Type checking
```

### Project Structure

```
src/
├── background.ts          # Service worker & storage
├── popup/                 # Extension popup UI
├── services/
│   ├── fragment/          # Text fragment utilities
│   ├── compile.service    # URL compilation
│   └── storage.service    # Chrome storage wrapper
├── contracts/             # TypeScript interfaces
└── constants/             # Configuration
```

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome 80+ | Full |
| Edge 80+ | Full |
| Opera 67+ | Full |
| Firefox | Navigate only* |
| Safari | Not supported |

*Firefox can navigate to text fragment URLs but cannot generate them natively.

## License

MIT
