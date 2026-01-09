# Compile Feature Implementation Plan

## Overview

Add a popup UI to Fragmentum that allows users to:
1. Auto-collect highlights as they're generated on a page
2. View and manage collected highlights in the popup
3. Compile all highlights into a single URL with multiple text fragments
4. Copy the compiled URL to clipboard

## User Workflow

```
User selects text → Clicks button → Fragment generated + auto-saved to collection
                                  ↓
                    User opens popup → Sees list of highlights (same page)
                                  ↓
                    User clicks "Compile" → Single URL copied to clipboard
                                  ↓
                    URL format: page.html#:~:text=frag1&text=frag2&text=frag3
```

## Technical Approach

### Text Fragment Spec - Multiple Highlights

The Text Fragment spec supports multiple `text=` directives in one URL:

```
https://example.com/page#:~:text=first%20highlight&text=second%20highlight
```

When opened, the browser highlights ALL specified fragments on the page simultaneously.

---

## Implementation Phases

### Phase 1: Contracts & Storage Layer

**New Files:**
- `src/contracts/highlight.contract.ts` - Highlight data types
- `src/services/storage.service.ts` - Chrome storage wrapper

**Highlight Interface:**

```typescript
interface Highlight {
  id: string;                 // UUID
  pageUrl: string;            // Base URL (without fragment)
  fragment: string;           // Just the text= portion
  selectedText: string;       // Display text
  timestamp: number;
}

interface HighlightCollection {
  [pageUrl: string]: Highlight[];  // Grouped by page
}
```

**Storage Service API:**

```typescript
// storage.service.ts
export const storageService = {
  async addHighlight(highlight: Highlight): Promise<void>;
  async getHighlightsForPage(pageUrl: string): Promise<Highlight[]>;
  async removeHighlight(id: string): Promise<void>;
  async clearHighlightsForPage(pageUrl: string): Promise<void>;
};
```

**Files Modified:**
- `src/constants/index.ts` - Add storage keys and new messages

---

### Phase 2: Background Script Enhancement

**File:** `src/background.ts`

**New Message Handlers:**

```typescript
const ACTIONS = {
  generateFragment: "generateFragment",     // existing
  highlightAdded: "highlightAdded",         // NEW: content → background
  getHighlights: "getHighlights",           // NEW: popup → background
  removeHighlight: "removeHighlight",       // NEW: popup → background
  clearHighlights: "clearHighlights",       // NEW: popup → background
  compileHighlights: "compileHighlights",   // NEW: popup → background
};
```

**Message Flow:**

```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case ACTIONS.highlightAdded:
      // Save to chrome.storage.local
      storageService.addHighlight(message.data);
      break;
    case ACTIONS.getHighlights:
      // Return highlights for requested page
      storageService.getHighlightsForPage(message.pageUrl)
        .then(sendResponse);
      return true; // async response
    case ACTIONS.compileHighlights:
      // Generate combined URL
      const compiled = compileFragments(message.pageUrl, message.highlights);
      sendResponse({ url: compiled });
      break;
    // ... etc
  }
});
```

---

### Phase 3: Content Script Integration

**File:** `src/events/handlers.ts`

**Modify `handleFragmentGeneration()`:**

After successful fragment generation and clipboard copy:

```typescript
// Extract just the fragment portion from the full URL
const fragmentPortion = fragmentUrl.split('#:~:')[1]; // "text=encoded%20text"

// Send to background for storage
chrome.runtime.sendMessage({
  action: ACTIONS.highlightAdded,
  data: {
    id: generateUUID(),
    pageUrl: window.location.href.split('#')[0], // Base URL only
    fragment: fragmentPortion,
    selectedText: selection.toString().substring(0, 100), // Truncate for display
    timestamp: Date.now()
  }
});
```

---

### Phase 4: Popup UI

**New Files:**
- `popup.html` - Popup HTML shell (root level)
- `styles/popup.css` - Popup styling
- `src/popup/popup.ts` - Popup logic

**popup.html Structure:**

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles/popup.css">
</head>
<body>
  <div class="popup-container">
    <header class="popup-header">
      <h1>Fragmentum</h1>
      <span class="highlight-count">0 highlights</span>
    </header>

    <div class="highlights-list" id="highlights-list">
      <!-- Populated by JS -->
    </div>

    <div class="empty-state" id="empty-state">
      <p>No highlights on this page yet.</p>
      <p class="hint">Select text and click the button to add highlights.</p>
    </div>

    <footer class="popup-footer">
      <button id="compile-btn" class="btn-primary" disabled>
        Compile & Copy
      </button>
      <button id="clear-btn" class="btn-secondary">
        Clear All
      </button>
    </footer>
  </div>
  <script src="scripts/popup.iife.js"></script>
</body>
</html>
```

**Popup Logic (popup.ts):**

```typescript
// On popup open
async function init() {
  // Get current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pageUrl = new URL(tab.url).origin + new URL(tab.url).pathname;

  // Load highlights for this page
  const highlights = await chrome.runtime.sendMessage({
    action: ACTIONS.getHighlights,
    pageUrl
  });

  renderHighlights(highlights);
}

function renderHighlights(highlights: Highlight[]) {
  const list = document.getElementById('highlights-list');
  const emptyState = document.getElementById('empty-state');
  const compileBtn = document.getElementById('compile-btn');

  if (highlights.length === 0) {
    list.style.display = 'none';
    emptyState.style.display = 'block';
    compileBtn.disabled = true;
  } else {
    list.innerHTML = highlights.map(h => `
      <div class="highlight-item" data-id="${h.id}">
        <span class="highlight-text">${escapeHtml(h.selectedText)}</span>
        <button class="delete-btn" data-id="${h.id}">×</button>
      </div>
    `).join('');
    // ... event handlers
  }
}

// Compile button handler
async function handleCompile() {
  const compiled = await chrome.runtime.sendMessage({
    action: ACTIONS.compileHighlights,
    pageUrl: currentPageUrl
  });

  await navigator.clipboard.writeText(compiled.url);
  showFeedback('Copied!');
}
```

---

### Phase 5: Compile Logic

**File:** `src/services/compile.service.ts`

**Compile Function:**

```typescript
export function compileFragments(pageUrl: string, highlights: Highlight[]): string {
  if (highlights.length === 0) return pageUrl;

  // Build combined fragment
  // Format: #:~:text=frag1&text=frag2&text=frag3
  const fragments = highlights.map(h => h.fragment);
  const combined = '#:~:' + fragments.join('&');

  return pageUrl + combined;
}
```

**Example Output:**

```
Input highlights:
  - fragment: "text=Hello%20world"
  - fragment: "text=Quick%20brown,-fox%20jumps"
  - fragment: "text=prefix-,target%20text,-suffix"

Output URL:
https://example.com/page#:~:text=Hello%20world&text=Quick%20brown,-fox%20jumps&text=prefix-,target%20text,-suffix
```

---

### Phase 6: Build Configuration

**File:** `tsdown.config.ts`

Add popup entry:

```typescript
{
  entry: ["src/popup/popup.ts"],
  format: "iife",
  outDir: "scripts",
  clean: false,
}
```

**File:** `manifest.json`

Add popup action:

```json
{
  "action": {
    "default_popup": "popup.html",
    "default_title": "Fragmentum - View Highlights"
  }
}
```

---

### Phase 7: Navigate to Highlight Button

**Goal:** Add a button in each highlight entry that navigates the user to that specific highlight on the webpage.

**User Flow:**
1. User opens popup and sees list of highlights
2. User clicks "Go to" button on a highlight entry
3. Browser navigates to the page with that specific text fragment
4. Page scrolls to and highlights the selected text

**File:** `src/popup/popup.ts`

**Update `renderHighlights()` to include navigate button:**

```typescript
function renderHighlights(highlights: Highlight[]) {
  // ... existing code

  list.innerHTML = highlights.map(h => `
    <div class="highlight-item" data-id="${h.id}">
      <div class="highlight-content">
        <span class="highlight-text">${escapeHtml(h.selectedText)}</span>
        <div class="highlight-meta">${formatTime(h.timestamp)}</div>
      </div>
      <div class="highlight-actions">
        <button class="goto-btn" data-fragment="${escapeHtml(h.fragment)}" title="Go to highlight">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
            <path d="M15 3h6v6"></path>
            <path d="M10 14L21 3"></path>
          </svg>
        </button>
        <button class="delete-btn" data-id="${h.id}" title="Remove highlight">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  // Attach navigate handlers
  list.querySelectorAll('.goto-btn').forEach(btn => {
    btn.addEventListener('click', handleNavigate);
  });

  // ... existing delete handlers
}
```

**Add navigate handler:**

```typescript
/**
 * Handle navigate to highlight button click
 * Constructs the fragment URL and navigates the current tab
 */
async function handleNavigate(e: Event): Promise<void> {
  const btn = e.currentTarget as HTMLElement;
  const fragment = btn.dataset.fragment;

  if (!fragment) return;

  try {
    // Construct full URL with text fragment
    const fullUrl = `${currentPageUrl}#:~:${fragment}`;

    // Get current tab and navigate to the fragment URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab?.id) {
      await chrome.tabs.update(tab.id, { url: fullUrl });
      // Close popup after navigation
      window.close();
    }
  } catch (error) {
    console.error('Navigate error:', error);
    showToast('Failed to navigate to highlight', 'error');
  }
}
```

**File:** `styles/popup.css`

**Add styles for navigate button:**

```css
.highlight-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.goto-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.goto-btn:hover {
  background: rgba(46, 204, 113, 0.2);
  color: var(--success);
}

.goto-btn svg {
  width: 14px;
  height: 14px;
}
```

**Alternative: Click entire highlight to navigate**

Instead of a separate button, the entire highlight card could be clickable:

```typescript
// Make highlight item clickable
list.querySelectorAll('.highlight-item').forEach(item => {
  item.addEventListener('click', (e) => {
    // Don't navigate if clicking delete button
    if ((e.target as HTMLElement).closest('.delete-btn')) return;

    const fragment = item.dataset.fragment;
    if (fragment) handleNavigateToFragment(fragment);
  });
});
```

```css
.highlight-item {
  cursor: pointer;
}

.highlight-item:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-secondary);
}
```

---

## Files Summary

### Files to Create

| File | Purpose |
|------|---------|
| `src/contracts/highlight.contract.ts` | Highlight type definitions |
| `src/services/storage.service.ts` | Chrome storage wrapper |
| `src/services/compile.service.ts` | Fragment compilation logic |
| `src/popup/popup.ts` | Popup entry point |
| `popup.html` | Popup HTML template |
| `styles/popup.css` | Popup styling |

### Files to Modify

| File | Changes |
|------|---------|
| `src/background.ts` | Add message handlers for CRUD + compile |
| `src/events/handlers.ts` | Send highlight data after generation |
| `src/constants/index.ts` | Add new ACTIONS, storage keys |
| `tsdown.config.ts` | Add popup build entry |
| `manifest.json` | Add popup action |

---

## Popup UI Specifications

**Dimensions:** 350px wide x 400px max height (scrollable)

**Components:**
1. **Header**: Extension name + highlight count
2. **Highlight List**: Cards showing truncated selected text with delete button
3. **Empty State**: Instructions when no highlights
4. **Footer**: "Compile & Copy" (primary) + "Clear All" (secondary)

**Styling:** Match existing dark theme (`rgba(44, 62, 80, 0.9)`)

---

## Edge Cases & Validation

1. **No highlights**: Disable Compile button, show empty state
2. **Very long text**: Truncate display to 100 chars with ellipsis
3. **Storage limits**: Chrome storage.local has 10MB limit - sufficient for thousands of highlights
4. **Tab without URL**: Handle chrome:// and extension:// pages gracefully
5. **Multiple pages open**: Each popup shows only highlights for current tab's page

---

## Testing Checklist

- [x] Highlight auto-adds to collection on generation
- [x] Popup shows correct highlights for current page
- [x] Delete removes individual highlight
- [x] Clear All removes all highlights for page
- [x] Compile generates valid multi-fragment URL
- [ ] Compiled URL highlights all fragments when opened *(requires manual browser testing)*
- [x] Empty state shows when no highlights
- [ ] Storage persists across browser restarts *(requires manual browser testing)*
- [x] Navigate button scrolls to and highlights the specific text fragment
- [x] Popup closes after navigation
- [ ] Navigate works correctly with encoded special characters in fragments *(requires manual browser testing)*
