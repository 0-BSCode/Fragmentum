# Fragmentum Bug Tracker

## BUG-002: Text Fragment Fails on Inline Elements

**Status:** Fixed (2026-01-09)
**Severity:** High
**Affected File:** `src/services/fragment/generator.ts`
**Discovered:** 2026-01-09

### Problem Description

When selecting text that spans inline elements (`<code>`, `<a>`, `<em>`, `<strong>`, `<span>`, etc.), the extension generates a text fragment URL that fails to highlight anything.

### Reproduction Steps

1. Navigate to https://nextjs.org/docs/app/getting-started/fetching-data
2. Select the text "The fetch API" (first list item under "Server Components")
3. Click the Fragmentum button to generate fragment URL
4. Open the generated URL in a new tab
5. **Expected:** Text should be highlighted
6. **Actual:** No highlight appears, page doesn't scroll to text

### Technical Analysis

**Source HTML:**
```html
<li>The <a href="#with-the-fetch-api"><code>fetch</code> API</a></li>
```

**Extension generates (BROKEN):**
```
#:~:text=The%20fetch%20API,-An%20ORM%20or
```
Decoded: `text=The fetch API,-An ORM or`

**Working URL (manual):**
```
#:~:text=O%2C%20such%20as%3A-,The,API,-An%20ORM%20or
```
Decoded: `text=O, such as:-,The,API,-An ORM or`

### Root Cause

1. **Current behavior** (`generator.ts` lines 30-40):
   - For short selections (< 300 chars): Uses exact text as `textStart`
   - For long selections: Uses range pattern (`textStart,textEnd`)

2. **The problem:**
   - `selection.toString()` returns flattened text: "The fetch API"
   - Browser's text fragment matching fails because "fetch" is wrapped in `<code>`
   - Text fragments have trouble matching across inline element boundaries

3. **Why range pattern works:**
   - Uses only start word "The" and end word "API"
   - Browser finds text between them regardless of inline elements
   - Avoids the problematic `<code>fetch</code>` in the match string

### Proposed Solution

Detect when selection spans inline elements and use range pattern (`textStart,textEnd`) instead of exact text match.

**Detection Logic:**
```typescript
function selectionSpansInlineElements(range: Range): boolean {
  if (range.startContainer !== range.endContainer) {
    return true;
  }
  const fragment = range.cloneContents();
  const inlineElements = fragment.querySelectorAll(
    'a, code, em, strong, span, b, i, mark, abbr, cite, q, sub, sup, time, var, kbd, samp'
  );
  return inlineElements.length > 0;
}
```

**Modified logic:**
- Use range pattern for multi-word selections when inline elements detected
- Keep exact match for single-word selections
- Keep existing behavior for long selections

### Files to Modify

| File | Changes |
|------|---------|
| `src/services/fragment/generator.ts` | Add inline element detection, modify range pattern logic |

### Solution Implemented

Added `selectionSpansInlineElements()` function to detect when selections cross inline element boundaries. Modified `generateTextFragment()` to use range pattern (textStart,textEnd) instead of exact text match when:

1. Selection spans multiple containers (different start/end nodes)
2. Selection contains inline elements AND has multiple words

**Key Code Changes (`generator.ts`):**
```typescript
function selectionSpansInlineElements(range: Range): boolean {
  if (range.startContainer !== range.endContainer) {
    return true;
  }
  const fragment = range.cloneContents();
  const inlineElements = fragment.querySelectorAll(
    'a, code, em, strong, span, b, i, mark, abbr, cite, q, sub, sup, time, var, kbd, samp'
  );
  return inlineElements.length > 0;
}

// In generateTextFragment():
const useRangePattern =
  normalizedText.length > LONG_SELECTION_THRESHOLD ||
  (hasInlineElements && words.length > 1);
```

### Testing Checklist

- [x] Test with `<code>` elements (e.g., "The `fetch` API")
- [x] Test with `<a>` links containing text
- [ ] Test with `<em>` and `<strong>` emphasis
- [ ] Test with nested inline elements
- [x] Test single-word selections (should still work)
- [x] Test long selections (existing behavior preserved)

---

## BUG-001: Context Extraction Missing for List Items

**Status:** Fixed (2026-01-09)
**Severity:** Medium
**Affected File:** `src/services/fragment/context-extractor.ts`

### Problem Description

Text fragments for list items (`<li>`) were missing prefix context from sibling list items, causing fragments to fail when the same text appeared multiple times on a page.

### Root Cause

The context extractor stopped at `<li>` boundaries instead of traversing up to the parent `<ul>`/`<ol>` to capture sibling context.

### Solution

Modified `findContextAncestor()` to continue traversing past `<li>` elements to reach the list container, allowing context from sibling items to be captured.

### Status

Fixed in commit `4cbd4d9`.
