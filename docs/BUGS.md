# Fragmentum Bug Tracker

## BUG-003: Single-Word Range Pattern Causes Ambiguous Matches

**Status:** Fixed (2026-01-19)
**Severity:** High
**Affected File:** `src/services/fragment/generator.ts`
**Discovered:** 2026-01-19

### Problem Description

When the extension uses a range pattern (`textStart,textEnd`) for longer selections, it only uses **single words** for textStart and textEnd. This creates ambiguous matches when those words appear multiple times on the page, causing the fragment URL to highlight incorrect text or fail entirely.

### Reproduction Steps

1. Navigate to https://nextjs.org/docs/app/guides/caching
2. Select the text containing "rendered at build time or in the background..." (a multi-line paragraph in the Static Rendering section)
3. Generate fragment URL with Fragmentum
4. Open the generated URL in a new tab
5. **Expected:** Correct text should be highlighted
6. **Actual:** Different text is highlighted, or no highlight appears

### Technical Analysis

**Extension generates (BROKEN):**
```
#:~:text=Rendering%2C%20routes%20are-,rendered,time.,-This%20happens%20when
```
Decoded:
- prefix: `Rendering, routes are`
- textStart: `rendered` (single word)
- textEnd: `time.` (single word)
- suffix: `This happens when`

**Native browser generates (WORKING):**
```
#:~:text=rendered%20at%20build%20time%20or,rendered%20at%20request%20time.
```
Decoded:
- textStart: `rendered at build time or` (5-word phrase)
- textEnd: `rendered at request time.` (4-word phrase)

### Root Cause

The bug is in `generator.ts` lines 60-64:

```typescript
if (useRangePattern && words.length > 1) {
  // Use first and last words for range pattern
  fragmentParts.textStart = encodeFragmentComponent(words[0]);
  fragmentParts.textEnd = encodeFragmentComponent(words[words.length - 1]);
}
```

**Why this fails:**

1. **Single words are too common**: Words like "rendered", "time", "the", etc. appear multiple times on most web pages. Using just `words[0]` (first word) and `words[words.length - 1]` (last word) creates an ambiguous range.

2. **How Text Fragment matching works**:
   - Browser finds ALL text spans that start with `textStart` and end with `textEnd`
   - Then filters by prefix/suffix context
   - If the single-word range matches nothing (or the wrong thing), context can't save it

3. **Why native approach works**:
   - Native browser uses **longer, more unique phrases** (5+ words) for textStart/textEnd
   - "rendered at build time or" is far more unique than just "rendered"
   - Longer phrases dramatically reduce false matches
   - Often doesn't need prefix/suffix at all because textStart/textEnd are unique enough

4. **Context is not a substitute for specificity**:
   - While prefix/suffix help disambiguate, they can't fix fundamentally ambiguous textStart/textEnd
   - If "rendered...time." matches 5 different spans, and none are preceded by the exact prefix, the match fails entirely

### Affected Scenarios

| Scenario | Current Behavior | Expected Behavior |
|----------|------------------|-------------------|
| Long selections (>300 chars) | Uses first/last single word | Should use longer phrases |
| Inline element selections | Uses first/last single word | Should use longer phrases |
| Common first/last words | Ambiguous matches | Unique phrase matches |

### Proposed Solution

**Option A: Use Phrase-Based Ranges (Recommended)**

Instead of single words, extract enough words to form a unique phrase:

```typescript
const MIN_PHRASE_WORDS = 4;
const MAX_PHRASE_WORDS = 6;

function extractUniquePhrase(words: string[], fromStart: boolean): string {
  const count = Math.min(MAX_PHRASE_WORDS, Math.max(MIN_PHRASE_WORDS, words.length));
  if (fromStart) {
    return words.slice(0, count).join(' ');
  } else {
    return words.slice(-count).join(' ');
  }
}

// In generateTextFragment():
if (useRangePattern && words.length > 1) {
  fragmentParts.textStart = encodeFragmentComponent(
    extractUniquePhrase(words, true)
  );
  fragmentParts.textEnd = encodeFragmentComponent(
    extractUniquePhrase(words, false)
  );
}
```

**Option B: Eliminate Context, Use Full Phrases**

Follow the native browser approach more closely:
- Use longer textStart/textEnd phrases (4-6 words)
- Remove or reduce reliance on prefix/suffix context
- Prefix/suffix only needed when textStart/textEnd phrases still collide

**Option C: Adaptive Phrase Length**

Dynamically determine phrase length based on:
- Total word count of selection
- Whether phrases would be unique (would require DOM analysis)
- Balance between URL length and uniqueness

### Implementation Considerations

1. **URL Length**: Longer phrases = longer URLs. Need to balance uniqueness vs URL length.
2. **Word Boundaries**: Ensure phrases end at natural word boundaries.
3. **Punctuation Handling**: Decide whether to include trailing punctuation in textEnd.
4. **Overlap Prevention**: If selection is short, textStart and textEnd phrases shouldn't overlap.

### Files to Modify

| File | Changes |
|------|---------|
| `src/services/fragment/generator.ts` | Replace single-word extraction with phrase extraction |
| `src/constants/index.ts` | Add `MIN_PHRASE_WORDS`, `MAX_PHRASE_WORDS` constants |

### Solution Implemented (v2 - Chrome-like Algorithm)

Completely rewrote the fragment generation system based on Chrome's Link-to-Text-Fragment implementation. The new system uses **iterative expansion with uniqueness validation**.

**New Files:**
- `src/services/fragment/validator.ts` - Fragment validation and matching

**Key Features:**

1. **Uniqueness Validation**: Validates generated fragments actually match the intended selection
2. **Iterative Expansion (FragmentFactory)**: Progressively adds words until fragment is unique
3. **Word Boundary Expansion**: Expands selection to word boundaries before generating
4. **Block Boundary Detection**: Uses range pattern for selections spanning block elements
5. **Conditional Context**: Only adds prefix/suffix when needed for disambiguation
6. **Timeout Protection**: 500ms limit prevents hanging on complex pages

**Core Algorithm (`generator.ts`):**
```typescript
class FragmentFactory {
  tryToMakeUniqueFragment(): FragmentParts | null {
    for (let i = 0; i < MAX_EXPANSION_ITERATIONS; i++) {
      const fragment = this.build();
      const validation = validateFragment(fragment, this.range);

      if (validation.isUnique && validation.matchesSelection) {
        return fragment;
      }

      if (!this.embiggen()) break; // Cannot expand further
    }
    return this.build(); // Best effort
  }

  embiggen(): boolean {
    // Expansion order:
    // 1. Increase startWordCount
    // 2. Increase endWordCount
    // 3. Add prefix context
    // 4. Add suffix context
  }
}
```

**Constants added (`constants/index.ts`):**
```typescript
export const MAX_EXPANSION_ITERATIONS = 10;
export const GENERATION_TIMEOUT_MS = 500;
export const WORD_BOUNDARY_CHARS = /[\s\u00A0...]/;
export const BLOCK_ELEMENTS = new Set([...]);
```

### Testing Plan

- [ ] Test with selections where first/last words are common (e.g., "the", "a", "is")
- [ ] Test on pages with repeated text patterns
- [ ] Test with various selection lengths (short, medium, long)
- [ ] Compare generated URLs with native browser's fragment generator
- [ ] Verify URL length remains reasonable
- [ ] Test timeout behavior on complex pages
- [ ] Test word boundary expansion with partial word selections

### Related Issues

- **BUG-002**: This bug may have been partially masked by the inline element fix, since both issues can cause fragment failures on the same selections.

---

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
