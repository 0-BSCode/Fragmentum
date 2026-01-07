# Known Bugs

## BUG-001: Text Fragment Fails on Inline Elements

**Status**: Open
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
