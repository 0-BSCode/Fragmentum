# Context Menu Feature Plan

## Overview
Add a context menu option "Fragmentum: Generate fragment" that appears when right-clicking with text selected, providing an alternative way to generate URL fragments.

## Current State
- `src/content.ts`: Content script with fragment generation logic (self-contained)
- `manifest.json`: Only registers content scripts, no background worker
- `tsdown.config.ts`: Builds only `src/content.ts` → `scripts/content.iife.js`

## Architecture

Context menus in Chrome extensions require a **background service worker** to:
1. Create the menu item via `chrome.contextMenus.create()`
2. Listen for menu clicks via `chrome.contextMenus.onClicked`
3. Communicate with the content script to trigger fragment generation

```
┌─────────────────┐     message      ┌─────────────────┐
│  background.ts  │ ───────────────► │   content.ts    │
│  (service worker)│                  │ (content script)│
│                 │                  │                 │
│ • Create menu   │                  │ • Generate URL  │
│ • Handle clicks │                  │ • Copy to clip  │
│ • Send message  │                  │ • Show feedback │
└─────────────────┘                  └─────────────────┘
```

---

## Implementation Steps

### Step 1: Update manifest.json
Add `contextMenus` permission and register background service worker:
```json
{
  "permissions": ["activeTab", "scripting", "clipboardWrite", "storage", "contextMenus"],
  "background": {
    "service_worker": "scripts/background.iife.js"
  }
}
```

### Step 2: Create src/background.ts
New file with context menu logic:

```typescript
// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'fragmentum-generate',
    title: 'Fragmentum: Generate fragment',
    contexts: ['selection']  // Only show when text is selected
  });
});

// Handle menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'fragmentum-generate' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'generateFragment' });
  }
});
```

### Step 3: Update src/content.ts
Add message listener to handle context menu trigger:

```typescript
// Add to initialization
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'generateFragment') {
    handleFragmentGeneration();
  }
});
```

### Step 4: Update tsdown.config.ts
Add background.ts as additional entry point:

```typescript
export default defineConfig({
  entry: ["src/content.ts", "src/background.ts"],
  format: "iife",
  outDir: "scripts",
  clean: true,
  minify: false,
  treeshake: true,
});
```

---

## Files to Modify

| Action | File | Changes |
|--------|------|---------|
| MODIFY | `manifest.json` | Add `contextMenus` permission, register service worker |
| CREATE | `src/background.ts` | Context menu creation and click handler |
| MODIFY | `src/content.ts` | Add `chrome.runtime.onMessage` listener |
| MODIFY | `tsdown.config.ts` | Add `src/background.ts` to entry array |

---

## Key Considerations

1. **Context `selection`**: Menu only appears when text is selected
2. **Service worker lifecycle**: Background scripts in MV3 are event-driven and may be terminated
3. **Message passing**: Uses `chrome.tabs.sendMessage` / `chrome.runtime.onMessage`
4. **Reuse existing logic**: `handleFragmentGeneration()` already handles everything

---

## Validation Checklist
- [x] `pnpm build` produces both `scripts/content.iife.js` and `scripts/background.iife.js`
- [x] Extension loads without errors
- [x] Right-click on selected text shows "Fragmentum: Generate fragment"
- [x] Clicking menu item copies fragment URL to clipboard
- [x] Success feedback displays correctly (implemented)
- [x] Floating button method still works independently

---

## Enhancement: Visual Feedback for Context Menu

### Problem
When fragment generation is triggered via the context menu, the floating button may not be visible (it appears on mouseup, but right-click may dismiss it). The success feedback ("Copied!" tooltip) is anchored to the floating button, so users may not see confirmation.

### Solution
Ensure the floating button is shown and positioned before displaying success feedback when triggered via context menu. This provides consistent visual feedback regardless of trigger method.

### Implementation

Update the message listener in `src/content.ts` to explicitly show the button:

```typescript
function attachMessageListener(): void {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'generateFragment') {
      // Ensure button is visible for feedback
      showFragmentButton();
      handleFragmentGeneration();
    }
  });
}
```

### Expected Behavior
1. User selects text
2. User right-clicks → context menu appears with "Fragmentum: Generate fragment"
3. User clicks menu item
4. Floating button appears near selection with success state (green checkmark)
5. "Copied!" tooltip displays
6. Button auto-hides after 2 seconds

This matches the behavior of Chrome's native "Copy link to highlight" feature, which shows a brief visual confirmation after copying.
