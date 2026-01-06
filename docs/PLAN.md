# URL Fragment Generation - Implementation Plan

## Overview
Add text selection → URL fragment generation functionality to the Fragmentum Chrome extension. Users will be able to highlight text on any webpage and generate shareable URLs with Text Fragments (`#:~:text=...`) that link directly to that text.

## Current State
- **Extension**: Fragmentum (Chrome Manifest V3)
- **Current Feature**: Background color changer via popup
- **Architecture**: Popup-driven with dynamic script injection
- **Files**: manifest.json, popup.html, popup.js, styles.css (4 files, flat structure)
- **No content scripts**: Uses `chrome.scripting.executeScript()` for one-time operations

## New Architecture
- **Add persistent content script** to monitor text selections on all pages
- **Dual-mode extension**: Popup (background colors) + Content Script (text fragments)
- **No conflicts**: Features operate independently with different activation patterns

---

## Implementation Steps

### Phase 1: Content Script Foundation

#### 1.1 Create `/content.js` (Primary Logic)
**Core responsibilities**:
- Monitor text selection events (mouseup, touchend, selectionchange)
- Generate Text Fragment URLs using Chrome Text Fragments spec
- Manage floating UI button (create, position, show/hide)
- Handle clipboard operations with fallbacks
- Provide user feedback

**Key functions to implement**:
```javascript
// Event handlers
handleSelectionChange() // Debounced selection detection (200ms)
handleFragmentGeneration() // Generate and copy URL

// UI management
createFloatingButton() // Create button DOM element
showFragmentButton() // Position and display button
hideFragmentButton() // Hide with animation
positionButton(selectionRect) // Smart positioning algorithm

// Text fragment generation
generateTextFragment(selection) // Main generation logic
extractContext(range, prefixLen, suffixLen) // Get prefix/suffix context
encodeFragmentComponent(text) // URL encode text properly
buildFragmentURL(parts) // Assemble final URL

// Clipboard operations
copyToClipboard(url) // Primary: Clipboard API
copyToClipboardFallback(url) // Fallback: execCommand
showFeedback(message, type) // Success/error messages
```

**Text Fragment Generation Algorithm**:
- Format: `#:~:text=[prefix-,]textStart[,textEnd][,-suffix]`
- Use `textStart,textEnd` pattern for long selections (>300 chars)
- Extract 3-word prefix and suffix for context accuracy
- Properly encode special characters, normalize whitespace
- Strip existing URL fragments before appending

**Selection validation**:
- Minimum 3 characters
- Trim whitespace
- Ignore whitespace-only selections
- Debounce 200ms to avoid excessive triggers

#### 1.2 Create `/content.css` (UI Styling)
**Components to style**:
- Floating button container (40x40px, circular)
- Button states (default, hover, active, success)
- Feedback tooltip
- Animations (fade in/out, icon swap)

**Visual specs**:
- Semi-transparent dark background (#2c3e50, 90% opacity)
- Positioned above selection (or below if near top edge)
- Link icon (SVG inline) → checkmark on success
- Shadow: `0 2px 8px rgba(0,0,0,0.15)`
- Smooth transitions (200ms ease)

**Positioning algorithm**:
- Default: Above selection, aligned to right edge
- If off-screen top → position below selection
- If off-screen right → align to right viewport edge
- If off-screen left → align to left viewport edge
- Account for scroll position

#### 1.3 Update `/manifest.json`
**Changes required**:
```json
{
  "manifest_version": 3,
  "name": "Fragmentum",
  "version": "2.0.0",
  "description": "Generate URL fragments from text selections and customize page backgrounds",

  "permissions": [
    "activeTab",
    "scripting",
    "clipboardWrite",  // NEW: For clipboard operations
    "storage"          // NEW: For future settings
  ],

  "content_scripts": [  // NEW: Register content script
    {
      "matches": ["http://*/*", "https://*/*"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],

  "action": {
    "default_popup": "popup.html",
    "default_title": "Fragmentum"
  },

  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
}
```

**Permission justifications**:
- `clipboardWrite`: Required for `navigator.clipboard.writeText()`
- `storage`: For user preferences (enable/disable, keyboard shortcuts)

---

### Phase 2: UI Implementation

#### 2.1 Floating Button HTML Structure
Create in content.js:
```javascript
const buttonHTML = `
  <div id="fragmentum-button-container" class="fragmentum-button-container">
    <button
      id="fragmentum-button"
      class="fragmentum-button"
      aria-label="Copy link to text"
      title="Copy link to selected text"
    >
      <svg class="icon-link" width="20" height="20" viewBox="0 0 24 24">
        <!-- Link icon SVG path -->
      </svg>
      <svg class="icon-check" width="20" height="20" viewBox="0 0 24 24" style="display:none;">
        <!-- Checkmark icon SVG path -->
      </svg>
    </button>
    <div class="fragmentum-feedback" id="fragmentum-feedback"></div>
  </div>
`;
```

#### 2.2 Event Listeners
```javascript
// Selection detection
document.addEventListener('mouseup', handleSelection);
document.addEventListener('touchend', handleSelection);

// Keyboard shortcut (Ctrl+Shift+L or Cmd+Shift+L)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
    e.preventDefault();
    handleFragmentGeneration();
  }
});

// Click outside to hide
document.addEventListener('click', (e) => {
  if (!button.contains(e.target) && !window.getSelection().toString()) {
    hideFragmentButton();
  }
});
```

#### 2.3 Animation States
- **Show**: Fade in (200ms), position calculation
- **Success**: Icon swap (link → check), green background, "Copied!" tooltip
- **Hide**: Fade out (200ms), auto-hide after 2s success state

---

### Phase 3: Clipboard Integration

#### 3.1 Primary Method (Clipboard API)
```javascript
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showFeedback('Copied!', 'success');
    return true;
  } catch (err) {
    return copyToClipboardFallback(text);
  }
}
```

#### 3.2 Fallback Method (execCommand)
For HTTP sites or when Clipboard API unavailable:
```javascript
function copyToClipboardFallback(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (successful) {
      showFeedback('Copied!', 'success');
      return true;
    }
  } catch (err) {
    showFeedback('Copy failed', 'error');
    return false;
  }
}
```

---

### Phase 4: Edge Cases & Error Handling

#### 4.1 Selection Validation
- **Empty/whitespace-only**: Don't show button
- **Too short (<3 chars)**: Don't show button (imprecise)
- **Very long (>300 chars)**: Use `textStart,textEnd` pattern
- **Special characters**: Proper URL encoding
- **Line breaks**: Normalize to single space
- **Multiple spaces**: Collapse to single space

#### 4.2 Positioning Edge Cases
- Off-screen top → position below selection
- Off-screen bottom → position above selection
- Off-screen left/right → align to viewport edge
- Page scrolls → update position or hide

#### 4.3 Browser Compatibility
- **Chrome 80+**: Full Text Fragments support
- **Edge 80+**: Full support
- **Brave 1.20+**: Full support
- **Safari/Firefox**: Text Fragments not supported (URLs still copy, won't highlight)

---

### Phase 5: Polish & Enhancement

#### 5.1 Accessibility
- ARIA labels on button
- Keyboard navigation support
- Screen reader announcements
- High contrast mode compatibility

#### 5.2 Performance
- Debounce selection events (200ms)
- Event delegation where possible
- Remove event listeners on cleanup
- Clear timeouts to prevent leaks

#### 5.3 User Feedback
- Success state (green button, checkmark icon)
- "Copied!" tooltip
- Auto-hide after 2 seconds
- Error messages for clipboard failures

---

### Phase 6: Documentation

#### 6.1 Update `/README.md`
Add sections:
- **Features Overview**: Both background color and text fragments
- **Text Fragment Usage**: How to select text and generate URLs
- **How Text Fragments Work**: Brief explanation of spec
- **Browser Compatibility**: Chrome/Edge/Brave support
- **Privacy Considerations**: URLs contain selected text
- **Known Limitations**: iframe, shadow DOM, browser support
- **Keyboard Shortcuts**: Ctrl+Shift+L (Cmd+Shift+L on Mac)

#### 6.2 Inline Code Comments
Document complex logic:
- Text fragment encoding algorithm
- Positioning calculations
- Edge case handling
- Browser compatibility checks

---

## Feature Coexistence Strategy

### No Conflicts Expected
1. **Different activation patterns**:
   - Background color: User opens popup → clicks button
   - Text fragments: User selects text on page

2. **Different script contexts**:
   - Background color: One-time injection via popup.js
   - Text fragments: Persistent content script

3. **Independent lifecycles**:
   - Popup can open/close independently
   - Content script runs continuously
   - No shared state

---

## Critical Files

### Must Create
1. `content.js` - Main logic (~500 lines)
2. `content.css` - UI styles (~150 lines)

### Must Modify
3. `manifest.json` - Add permissions, register content script
4. `README.md` - Document new feature

### Optional Enhancement (Future)
5. `popup.html` - Add settings panel with tabs
6. `popup.js` - Settings logic (enable/disable)

---

## Testing Checklist

### Functionality
- [ ] Text selection triggers button display
- [ ] Button positioned correctly (above/below selection)
- [ ] Button stays within viewport bounds
- [ ] Click button copies URL to clipboard
- [ ] Generated URL format correct: `#:~:text=prefix-,text,-suffix`
- [ ] Pasting URL in new tab highlights text
- [ ] Success feedback displays ("Copied!" + checkmark)
- [ ] Button auto-hides after 2 seconds
- [ ] Keyboard shortcut (Ctrl+Shift+L) works
- [ ] Works on both HTTP and HTTPS sites

### Edge Cases
- [ ] Short selections (<3 chars) ignored
- [ ] Long selections (>300 chars) use textStart,textEnd
- [ ] Special characters properly encoded
- [ ] Line breaks normalized
- [ ] Whitespace-only selections ignored
- [ ] Button hides when selection cleared
- [ ] Click outside button hides it
- [ ] Works across different HTML elements

### Cross-Browser
- [ ] Chrome (latest)
- [ ] Edge (latest)
- [ ] Brave (latest)

### Existing Feature Compatibility
- [ ] Background color changer still works
- [ ] Popup UI unchanged
- [ ] No console errors
- [ ] No performance degradation

---

## Implementation Estimate
- **Core feature**: 6-8 hours
- **Polish & testing**: 4-6 hours
- **Documentation**: 2 hours
- **Total**: 12-16 hours

---

## Success Criteria
1. Users can select text and generate URL fragments with one click
2. Generated URLs work correctly (highlight text when opened)
3. UI is non-intrusive and intuitive
4. No conflicts with existing background color feature
5. Proper error handling and user feedback
6. Accessibility compliant (keyboard, screen readers)
7. Documentation complete and clear
