# Fragmentum Interaction Model

## Overview

Fragmentum uses a **context menu** approach for adding text fragments to highlights. When users select text on any webpage, they can right-click and choose "Fragmentum: Add link to highlights" to generate a text fragment URL.

## How It Works

### User Flow

1. **Select text** on any webpage
2. **Right-click** to open the browser's context menu
3. **Click** "Fragmentum: Add link to highlights"
4. **Toast notification** confirms the link was copied to clipboard
5. Fragment is **auto-saved** to the page's highlight collection

### Keyboard Shortcut

As an alternative to the context menu:
- **Windows/Linux**: `Ctrl + Shift + L`
- **macOS**: `Cmd + Shift + L`

## Architecture

### Context Menu Registration

The context menu is created in the background service worker (`src/background.ts`):

```typescript
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "fragmentum-generate",
    title: "Fragmentum: Add link to highlights",
    contexts: ["selection"], // Only visible when text is selected
  });
});
```

### Message Flow

```
Context Menu Click
       ↓
Background Service Worker (background.ts)
       ↓
chrome.tabs.sendMessage({ action: "generateFragment" })
       ↓
Content Script (content.ts)
       ↓
handleMessage() → handleFragmentGeneration()
       ↓
1. Generate text fragment URL
2. Copy to clipboard
3. Show toast notification
4. Save to highlight collection
```

### Toast Notification

Feedback is provided via a non-intrusive toast notification:
- Appears at **bottom-right** corner of the viewport
- Shows **success** (green) or **error** (red) state
- Auto-dismisses after **2 seconds**
- Supports accessibility (reduced motion, high contrast)

## Design Decisions

### Why Context Menu Over Floating Button?

| Aspect | Context Menu | Floating Button |
|--------|--------------|-----------------|
| **Intrusiveness** | None - uses native browser UI | Appears on every selection |
| **Familiarity** | Standard browser interaction | Custom UI to learn |
| **Conflicts** | None | May overlap with page content |
| **Performance** | No DOM manipulation on selection | Requires positioning calculations |
| **Accessibility** | Native browser a11y | Custom implementation needed |

### Toast vs Other Feedback Methods

- **Toast**: Non-blocking, brief, positioned away from content
- **Browser Notification**: Too intrusive for simple confirmations
- **No Feedback**: Users lack confidence action succeeded

## Files

| File | Purpose |
|------|---------|
| `src/background.ts` | Context menu creation and click handling |
| `src/events/handlers.ts` | Fragment generation and clipboard operations |
| `src/events/listeners.ts` | Message listener for context menu events |
| `src/ui/toast/toast.component.ts` | Toast notification UI |
| `styles/content.css` | Toast styling |

## Related Documentation

- [BUGS.md](./BUGS.md) - Known issues and fixes
- [STYLE.md](./STYLE.md) - Visual design system
- [CODE_QUALITY.md](./CODE_QUALITY.md) - Coding standards
