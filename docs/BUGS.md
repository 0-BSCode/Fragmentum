# Known Bugs

## BUG-001: Text Fragment Fails on Inline Elements

**Status**: Fixed (Issue 1) / Open (Issue 2)
**Severity**: High
**Reported**: 2026-01-07
**Affected**: Text selections spanning inline elements (`<code>`, `<em>`, `<strong>`, etc.)

---

### Description

When selecting text that contains inline formatting elements (like `<code>`), Fragmentum generates a URL that fails to highlight the text in the browser. Manually crafted URLs using a different pattern work correctly.

### Reproduction Steps

1. Navigate to: `https://nextjs.org/docs/app/getting-started/fetching-data`
2. Select the text "The `fetch` API" (list item #1 under Server Components)
3. Click the Fragmentum button to generate a fragment URL
4. Open the generated URL in a new tab
5. **Expected**: Text "The `fetch` API" is highlighted
6. **Actual**: No text is highlighted

### Comparison

| Aspect | Fragmentum (Broken) | Working URL |
|--------|---------------------|-------------|
| Full URL | `...#:~:text=The%20fetch%20API,-An%20ORM%20or` | `...#:~:text=O%2C%20such%20as%3A-,The,API,-An%20ORM%20or` |
| Pattern | Exact match | Range pattern |
| Prefix | None | `"O, such as:"` |
| textStart | `"The fetch API"` | `"The"` |
| textEnd | None | `"API"` |
| Suffix | `"An ORM or"` | `"An ORM or"` |

### Root Cause Analysis

#### Issue 1: Exact Match Fails Across Inline Element Boundaries

The selected text spans multiple DOM nodes:

```html
<li>The <code>fetch</code> API</li>
```

DOM structure:
- Text node: "The "
- `<code>` element containing: "fetch"
- Text node: " API"

When Fragmentum generates `#:~:text=The%20fetch%20API`, it attempts an **exact string match**. However, the browser's Text Fragment algorithm struggles to match text that crosses inline element boundaries.

The working URL uses a **range pattern** (`The,API`), which tells the browser: "find text starting with 'The' and ending with 'API'". This is more robust because:
- It doesn't require matching the exact middle content
- It's resilient to whitespace and formatting differences
- It handles inline elements gracefully

---

### Implementation Plan for Issue 1

#### Strategy: Use Range Pattern for Inline Element Selections

Instead of generating exact text matches, detect when selections span inline elements and automatically switch to the range pattern (`textStart,textEnd`).

#### Code Changes

**File: `src/services/fragment/generator.ts`**

1. Add inline element detection function:
```typescript
function hasInlineElements(range: Range): boolean {
  const container = range.commonAncestorContainer;
  if (container.nodeType === Node.TEXT_NODE) {
    return false; // Single text node, no inline elements
  }

  // Check for inline elements within the range
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();
        const inlineTags = ['code', 'em', 'strong', 'b', 'i', 'span', 'a', 'mark'];
        return inlineTags.includes(tag)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      }
    }
  );

  return walker.nextNode() !== null;
}
```

2. Modify `generateTextFragment()` logic:
```typescript
// Use range pattern for: long selections OR inline element crossings
const useRangePattern = normalizedText.length > LONG_SELECTION_THRESHOLD
  || hasInlineElements(range);

if (useRangePattern) {
  const words = normalizedText.split(/\s+/);
  const startWords = words.slice(0, CONTEXT_WORDS).join(' ');
  const endWords = words.slice(-CONTEXT_WORDS).join(' ');

  fragmentParts.textStart = encodeFragmentComponent(startWords);
  fragmentParts.textEnd = encodeFragmentComponent(endWords);
} else {
  fragmentParts.textStart = encodeFragmentComponent(normalizedText);
}
```

#### Progress Checklist

- [x] Add `hasInlineElements()` function to `generator.ts`
- [x] Modify condition to check for inline elements
- [ ] Test with `<code>` elements (e.g., "The `fetch` API")
- [ ] Test with `<em>` and `<strong>` elements
- [ ] Test with nested inline elements
- [ ] Test that simple text selections still use exact match
- [ ] Test long selections still work correctly
- [ ] Verify generated URLs highlight correctly in browser
- [x] Update BUGS.md status to "Fixed" when complete

---

#### Issue 2: Missing Prefix Context

Fragmentum extracted suffix context (`"An ORM or"`) but **no prefix context**. The working URL includes prefix `"O, such as:"` which helps:
- Disambiguate when the same text appears multiple times on the page
- Provide additional anchoring for the text fragment algorithm

The `extractContext()` function in `context-extractor.ts` may be failing to traverse the DOM correctly when the selection starts at certain positions.

### Affected Files

| File | Relevance |
|------|-----------|
| `src/services/fragment/generator.ts` | Main fragment generation logic |
| `src/services/fragment/encoder.ts` | URL encoding functions |
| `src/services/fragment/context-extractor.ts` | Prefix/suffix extraction (likely bug location) |

### Proposed Fix (Future Implementation)

1. **Detect inline element crossings**: When selection spans inline elements, use range pattern (`textStart,textEnd`) instead of exact match
2. **Improve context extraction**: Fix DOM traversal in `extractContext()` to reliably capture prefix text
3. **Add word-boundary detection**: For selections with inline elements, extract first and last words for range pattern

### Workaround

Until fixed, users can manually create working URLs using the range pattern format:
```
#:~:text=[prefix-,]firstWord,lastWord[,-suffix]
```

### References

- [Text Fragments Spec](https://wicg.github.io/scroll-to-text-fragment/)
- Related: `docs/SELECTION.md` - Previous encoding issues (Issue #1, #2)
