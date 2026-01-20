# Fragmentum

A Chrome extension that generates URL text fragments from selected text, collects multiple highlights, and compiles them into a single shareable link.

<!-- [TODO: Add banner/hero image here - suggested: public/banner.png (1280x640)] -->

## What is Fragmentum?

Fragmentum lets you highlight text on any webpage and create shareable links that automatically scroll to and highlight those exact passages. It uses the [Text Fragments](https://web.dev/text-fragments/) web standard (`#:~:text=...`) supported by Chrome and other modern browsers.

**Key Features:**

- **Text Fragment Generation** - Select any text on a page and generate a URL that links directly to it
- **Multi-Highlight Collection** - Save multiple highlights per page
- **Compile & Share** - Combine all highlights into a single URL that shows all passages when opened
- **Smart Fragment Generation** - Uses iterative expansion with context prefixes/suffixes to ensure accurate matching
- **Context Menu Integration** - Right-click on selected text for quick access

<!-- [TODO: Add demo GIF showing the workflow - suggested: public/demo.gif] -->

## Installation

### From Chrome Web Store

<!-- [TODO: Add Chrome Web Store link once published] -->

Coming soon.

### Manual Installation (Developer Mode)

1. Clone or download this repository
2. Install dependencies and build:
   ```bash
   pnpm install
   pnpm build
   ```
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked" and select the project folder

## Usage

1. **Select text** on any webpage
2. **Right-click** and choose "Fragmentum: Add link to highlights"
3. A toast notification confirms the highlight was added
4. Click the **Fragmentum icon** in your toolbar to view collected highlights
5. Click **"Compile & Copy"** to copy a shareable URL with all highlights

When someone opens the compiled URL, their browser will automatically scroll to and highlight all the selected passages.

<!-- [TODO: Add screenshot of popup UI - suggested: public/screenshot-popup.png] -->

## How It Works

Fragmentum generates [Text Fragment URLs](https://wicg.github.io/scroll-to-text-fragment/) following the format:

```
https://example.com/page#:~:text=[prefix-,]textStart[,textEnd][,-suffix]
```

For multiple highlights, fragments are combined:

```
https://example.com/page#:~:text=first%20highlight&text=second%20highlight
```

The extension uses an iterative expansion algorithm (similar to Chrome's Link-to-Text-Fragment) to ensure fragments uniquely identify the selected text, adding context prefixes/suffixes when needed.

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Build the extension
pnpm build

# Watch mode for development
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

### Project Structure

```
src/
├── background.ts         # Service worker (context menu, storage)
├── content.ts            # Content script (selection handling)
├── popup/                # Extension popup UI
├── services/
│   ├── fragment/         # Text fragment generation
│   ├── clipboard/        # Clipboard operations
│   └── storage.service   # Chrome storage wrapper
├── contracts/            # TypeScript interfaces
├── constants/            # Configuration constants
└── ui/                   # UI components (toast, etc.)
```

## Browser Compatibility

Text Fragments are supported in:
- Chrome 80+
- Edge 80+
- Opera 67+
- Chrome for Android

Note: Firefox and Safari do not currently support Text Fragments.

## License

MIT

<!-- [TODO: Add any additional sections needed - Contributing, Changelog, etc.] -->
