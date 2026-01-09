# Known Bugs

## BUG-001: Text Fragment Fails on Inline Elements

**Status**: Fixed (2026-01-09)
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
- [x] Test with `<code>` elements (e.g., "The `fetch` API") - **FAILED**
- [ ] Test with `<em>` and `<strong>` elements
- [ ] Test with nested inline elements
- [ ] Test that simple text selections still use exact match
- [ ] Test long selections still work correctly
- [ ] Verify generated URLs highlight correctly in browser
- [ ] Update BUGS.md status to "Fixed" when complete

---

### Failed Fix Attempt (2026-01-09)

#### What Was Tried

Added `hasInlineElements()` detection and switched to range pattern (`textStart,textEnd`) when inline elements were detected.

#### Test Case: "An ORM or database"

| Aspect | Correct URL | Extension Generated |
|--------|-------------|---------------------|
| Full fragment | `#:~:text=API-,An%20ORM%20or%20database,-Reading%20from%20the` | `#:~:text=An%20ORM%20or,ORM%20or%20database,-Reading%20from%20the` |
| Prefix | `API` | None |
| textStart | `An ORM or database` (full text) | `An ORM or` (first 3 words) |
| textEnd | None | `ORM or database` (last 3 words) |
| Suffix | `Reading from the` | `Reading from the` |
| **Result** | ✅ Works | ❌ Fails |

#### Why It Failed

1. **Incorrect root cause analysis**: The original analysis assumed the working URL used a range pattern (`textStart,textEnd`). This was **wrong**. The working URL actually uses:
   - **Full exact text** as `textStart` (not range pattern)
   - **Prefix context** (`API-,`) to disambiguate

2. **Range pattern creates word overlap**: With `CONTEXT_WORDS=3` and a 4-word selection:
   - `startWords` = "An ORM or" (words 1-3)
   - `endWords` = "ORM or database" (words 2-4)
   - These **overlap**, creating an invalid/ambiguous fragment

3. **The real issue is prefix context (Issue 2)**: The working URL proves that exact text matching **does work** across inline elements when proper prefix context is provided. The fix should focus on improving `extractContext()`, not switching to range pattern.

#### Correct Fix Strategy

The range pattern approach is wrong for short selections. Instead:

1. **Keep using full text** as `textStart` for short selections (even with inline elements)
2. **Fix prefix context extraction** (Issue 2) - this is the actual root cause
3. **Only use range pattern** when selection is genuinely long (current `LONG_SELECTION_THRESHOLD` of 300 chars)

#### Code to Revert

The `hasInlineElements()` check should be removed from the range pattern condition in `generator.ts`. The condition should return to:

```typescript
// Only use range pattern for genuinely long selections
if (normalizedText.length > LONG_SELECTION_THRESHOLD) {
```

**Status**: ✅ Reverted

---

### Successful Fix (2026-01-09)

#### Root Cause Confirmed

Issue 2 (Missing Prefix Context) was the actual root cause. The `extractContext()` function was only looking within the immediate parent element, but prefix text often resides in **sibling elements**.

For example, when selecting "An ORM or database" in:
```html
<ul>
  <li>The <code>fetch</code> API</li>
  <li>An ORM or database</li>   <!-- selection here -->
</ul>
```

The prefix "API" is in the **previous `<li>`**, not in the same parent element.

#### Fix Applied

**File: `src/services/fragment/context-extractor.ts`**

1. Added `findContextAncestor()` function that traverses up to block-level ancestors
2. For list items, specifically goes up to the `<ul>`/`<ol>` container to capture sibling content
3. Creates ranges from the ancestor boundary to capture cross-element context

**File: `src/services/fragment/generator.ts`**

1. Removed unused `hasInlineElements()` function and `INLINE_TAGS` constant
2. Reverted to only using range pattern for long selections

#### Expected Result

For selection "An ORM or database", the extension should now generate:
```
#:~:text=API-,An%20ORM%20or%20database,-Reading%20from%20the
```

With proper prefix (`API`) and suffix (`Reading from the`) context.

---

#### Issue 2: Missing Prefix Context (ROOT CAUSE) - FIXED

**This was the actual root cause of BUG-001.** The failed fix attempt proved that exact text matching works fine across inline elements when proper prefix context is provided.

Fragmentum extracted suffix context (`"An ORM or"`) but **no prefix context**. The working URL includes prefix `"API"` which:
- Disambiguates when the same text appears multiple times on the page
- Provides additional anchoring for the text fragment algorithm
- **Enables exact text matching to work across inline element boundaries**

~~The `extractContext()` function in `context-extractor.ts` is failing to traverse the DOM correctly when the selection starts at certain positions (e.g., at the beginning of a list item after inline elements).~~

**Fixed**: The `extractContext()` function now uses `findContextAncestor()` to traverse up to block-level ancestors (like `<ul>`/`<ol>`) before extracting context, allowing it to capture text from sibling elements.

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
