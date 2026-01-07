# Text Fragment URL Selection Issues

## Issue #2: Range-Based Fragment Not Matching (Current)

### Problem Statement
URL: `https://nextjs.org/docs/app/getting-started/fetching-data#:~:text=asynchronous%20I/O,API`

The text fragment `#:~:text=asynchronous%20I/O,API` fails to highlight the expected text. When the user manually selects the same text and uses Fragmentum, the generated URL also fails.

### Analysis

**Fragment Structure**:
```
#:~:text=asynchronous%20I/O,API
         ├─────────────────┤ ├─┤
              textStart     textEnd
```

This is a **range-based fragment** (textStart,textEnd) that should highlight from "asynchronous I/O" to "API".

**Potential Root Causes**:

1. **Forward Slash Encoding**
   - The `/` in `I/O` appears unencoded in the URL
   - `encodeURIComponent('/')` → `%2F`
   - Expected: `asynchronous%20I%2FO`
   - Actual in URL: `asynchronous%20I/O`
   - The `/` character may need explicit encoding for Text Fragments

2. **Context Extraction Issues** (`extractContext` function)
   - The prefix/suffix extraction uses `range.startContainer.parentNode`
   - This may grab excessive or irrelevant context from DOM structure
   - Could include invisible characters, ARIA labels, or React hydration markers

3. **DOM Structure Mismatch**
   - Next.js docs use React hydration and dynamic content
   - Selected text may span multiple DOM nodes
   - `selection.toString()` might not match the actual rendered text

4. **Unicode/Special Characters**
   - The "I/O" on the page might use a Unicode fraction slash (⁄ U+2044) instead of forward slash (/ U+002F)
   - Invisible Unicode characters (zero-width spaces, etc.) could be present

5. **Whitespace Normalization**
   - `normalizeText()` collapses all whitespace to single space
   - Page might have non-breaking spaces or other whitespace variants

### Debug Plan

**Step 1: Inspect Actual Page Content**
```javascript
// In browser console on the target page:
const text = document.body.innerText;
const match = text.match(/asynchronous.{0,10}I.O/);
console.log('Matched:', match);
console.log('Char codes:', [...match[0]].map(c => c.charCodeAt(0)));
```

**Step 2: Test Fragment Encoding**
```javascript
// Test what Fragmentum generates for "asynchronous I/O"
const test = "asynchronous I/O";
const encoded = encodeURIComponent(test)
  .replace(/[!'()*\-,`]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
console.log('Encoded:', encoded);
// Expected: asynchronous%20I%2FO
```

**Step 3: Validate Selection Object**
```javascript
// After selecting text, inspect what the Selection API returns:
const sel = window.getSelection();
console.log('Selected text:', sel.toString());
console.log('Char codes:', [...sel.toString()].map(c => c.charCodeAt(0)));
```

**Step 4: Test Fragment Manually**
```javascript
// Create test URLs with different encodings:
const base = 'https://nextjs.org/docs/app/getting-started/fetching-data';
const tests = [
  '#:~:text=asynchronous%20I%2FO,API',      // Encoded slash
  '#:~:text=asynchronous%20I/O,API',         // Literal slash
  '#:~:text=asynchronous%20I%2FO',           // No textEnd
  '#:~:text=asynchronous,I%2FO',             // Range split differently
];
tests.forEach(t => console.log(base + t));
```

### Proposed Fix

**1. Encode Forward Slash in Fragment Components**

The forward slash `/` should be encoded as `%2F` in text fragments to avoid potential URL parsing issues:

```typescript
function encodeFragmentComponent(text: string): string {
  return encodeURIComponent(text)
    // Encode characters with special meaning in Text Fragments + forward slash
    .replace(/[!'()*\-,`\/]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}
```

**2. Improve Context Extraction**

The current `extractContext` function may capture DOM artifacts. Consider:
- Limiting context to the same text node
- Filtering out non-printable characters
- Validating context actually appears in visible page text

```typescript
function extractContext(range: Range, prefixWords: number, suffixWords: number): SelectionContext {
  const context: SelectionContext = { prefix: '', suffix: '' };

  try {
    // Use TextRange API for more reliable text extraction
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    // ... improved implementation
  } catch (error) {
    console.warn('Could not extract context:', error);
  }

  return context;
}
```

**3. Normalize Unicode Characters**

Add Unicode normalization before encoding:

```typescript
function normalizeText(text: string): string {
  return text
    .normalize('NFKC')           // Normalize Unicode (e.g., fancy quotes → regular quotes)
    .replace(/\s+/g, ' ')        // Collapse whitespace
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width chars
    .trim();
}
```

### Files to Modify

| File | Change |
|------|--------|
| `src/content.ts` | Update `encodeFragmentComponent` to encode `/` |
| `src/content.ts` | Update `normalizeText` with Unicode normalization |
| `src/content.ts` | Improve `extractContext` to handle DOM edge cases |

### Validation Checklist
- [x] Forward slash `/` is encoded as `%2F` in fragment URL
- [ ] URL `#:~:text=asynchronous%20I%2FO,API` highlights correctly (needs browser testing)
- [x] Unicode characters are normalized before encoding
- [x] Context extraction doesn't include DOM artifacts
- [x] Zero-width characters are stripped from selections
- [x] Build succeeds without errors
- [ ] Existing tests continue to pass (needs `pnpm test`)

---

## Issue #1: Special Character Encoding (Fixed)

### Problem
The original `encodeFragmentComponent` function did not properly encode special characters for Text Fragments:

1. **Spaces**: Converting `%20` back to literal space ` ` - breaks fragment matching
2. **Backticks**: Not encoded (e.g., selecting `` `fetch` `` fails)
3. **Fragment syntax characters**: `-` and `,` have special meaning in Text Fragments but aren't encoded when they appear in the selected text

### Original Implementation (Broken)
```typescript
function encodeFragmentComponent(text: string): string {
  return encodeURIComponent(text)
    .replace(/%20/g, ' ') // ❌ This breaks fragment matching!
    .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}
```

### Text Fragment Spec Requirements
Format: `#:~:text=[prefix-,]textStart[,textEnd][,-suffix]`

Reserved characters that MUST be encoded when in text content:
- `-` (hyphen) → `%2D` — used in `prefix-,` and `,-suffix`
- `,` (comma) → `%2C` — separates `textStart,textEnd`
- `&` (ampersand) → `%26` — URL parameter separator
- `` ` `` (backtick) → `%60` — common in code snippets
- Space → `%20` — must remain encoded

### Applied Fix
```typescript
function encodeFragmentComponent(text: string): string {
  return encodeURIComponent(text)
    // Encode characters with special meaning in Text Fragments
    .replace(/[!'()*\-,`]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}
```

Key changes:
1. **Remove** `.replace(/%20/g, ' ')` — keep spaces encoded
2. **Add** `-` to the character class — encode hyphens
3. **Add** `,` to the character class — encode commas
4. **Add** `` ` `` to the character class — encode backticks

### Validation (Completed)
- [x] Spaces are encoded as `%20` in the fragment URL
- [x] Backticks (`` ` ``) are encoded as `%60`
- [x] Hyphens (`-`) are encoded as `%2D`
- [x] Commas (`,`) are encoded as `%2C`
- [x] Selecting `` `fetch` `` produces a working fragment link
- [x] Normal text selections still work correctly
- [x] Build succeeds without errors
