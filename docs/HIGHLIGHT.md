# Text Fragment Generation: Specification & Implementation Analysis

This document compares the W3C Text Fragment specification and Chrome's reference implementation against Fragmentum's current implementation, identifying gaps that cause fragment highlighting failures.

---

## 1. W3C Text Fragment Specification Summary

**Source:** [WICG Scroll-to-Text-Fragment](https://wicg.github.io/scroll-to-text-fragment/)

### 1.1 Fragment URL Syntax

```
#:~:text=[prefix-,]textStart[,textEnd][,-suffix]
```

| Component | Required | Description |
|-----------|----------|-------------|
| `textStart` | **Yes** | The text to find (or start of range) |
| `textEnd` | No | End of range (if selecting a span of text) |
| `prefix` | No | Context text that must precede the match |
| `suffix` | No | Context text that must follow the match |

**Delimiter:** `:~:` (U+003A, U+007E, U+003A) - chosen because it doesn't appear in any URLs crawled by Google over 5 years.

### 1.2 Encoding Requirements

Characters with special meaning in text fragments **must be percent-encoded**:

| Character | Meaning | Encoded |
|-----------|---------|---------|
| `,` | Parameter separator | `%2C` |
| `-` | Context indicator | `%2D` |
| `&` | Directive separator | `%26` |

### 1.3 Matching Algorithm

The spec describes matching behavior but intentionally leaves implementation details flexible:

1. **First-match rule:** Returns the first qualifying occurrence in document order
2. **Word boundaries:** Matches should respect word boundaries (definition left to implementations)
3. **Whitespace handling:** Flexible whitespace between context terms and fragments
4. **Logical order:** For bidirectional text, matches follow logical (memory) order, not visual

### 1.4 Best Practices from Spec (§4)

> **"Prefer exact matching to range-based"** - Use only `textStart` when a unique text string exists.

> **"Use context only when necessary"** - Add `prefix` and `suffix` only if the text appears multiple times.

> **"Include fallback element ID"** - Combine with element ID for graceful degradation: `#elementid:~:text=foo`

### 1.5 Security Constraints

- Only works in top-level browsing contexts (not cross-origin iframes)
- Fragment directives are stripped from JavaScript APIs (Location, URL objects)
- Implementation must prevent timing attacks during matching

---

## 2. Chrome's Link-to-Text-Fragment Algorithm

**Source:** [GoogleChromeLabs/link-to-text-fragment](https://github.com/GoogleChromeLabs/link-to-text-fragment)

Chrome's reference implementation uses a sophisticated multi-phase algorithm:

### 2.1 Generation Flow

```
Selection
    ↓
1. Expand to word boundaries
    ↓
2. Move edges to text nodes
    ↓
3. Choose strategy (exact vs range)
    ↓
4. Generate minimal fragment
    ↓
5. Validate uniqueness
    ↓
6. If not unique: EXPAND (embiggen)
    ↓
7. Repeat until unique or timeout
```

### 2.2 Word Boundary Expansion

Before generating, Chrome expands the selection to word boundaries:

```javascript
expandRangeStartToWordBound(range);
expandRangeEndToWordBound(range);
```

**Implementation:**
- Uses `Intl.Segmenter` for locale-aware word segmentation (when available)
- Falls back to regex-based detection using `BOUNDARY_CHARS` (punctuation, whitespace, Unicode separators)

**Why it matters:** Partial word selections like `"ello worl"` become `"hello world"`, producing more stable fragments.

### 2.3 Strategy Selection

Chrome chooses the simplest strategy that will work:

```javascript
if (selection.length <= 300 && !containsBlockBoundary(range)) {
    // Exact match: single textStart
    strategy = "EXACT_MATCH";
} else {
    // Range pattern: textStart + textEnd
    strategy = "RANGE";
}
```

**Key insight:** Exact match is always preferred when possible.

### 2.4 Uniqueness Validation

**This is the critical feature Fragmentum lacks.**

```javascript
function isUniquelyIdentifying(fragment) {
    const matches = processTextFragmentDirective(fragment);
    return matches.length === 1;
}
```

Chrome simulates the browser's text fragment matching algorithm against the current document to verify the generated fragment will match exactly one location.

### 2.5 Iterative Expansion (FragmentFactory.embiggen)

When a fragment isn't unique, Chrome progressively expands it:

```javascript
class FragmentFactory {
    embiggen() {
        // Add one more word to textStart and/or textEnd
        // Or add context (prefix/suffix) if text alone isn't enough
    }

    tryToMakeUniqueFragment() {
        while (!isUnique && attempts < MAX) {
            this.embiggen();
            fragment = this.build();
            isUnique = isUniquelyIdentifying(fragment);
        }
    }
}
```

**Expansion order:**
1. Try exact match alone
2. Add more words to textStart/textEnd
3. Add prefix context
4. Add suffix context
5. Continue until unique or max iterations

### 2.6 Block Boundary Detection

Chrome maintains a list of 35+ block-level elements:

```javascript
const BLOCK_ELEMENTS = [
    'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'BR', 'DETAILS',
    'DIALOG', 'DD', 'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION',
    'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'HEADER', 'HGROUP', 'HR', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE',
    'SECTION', 'TABLE', 'UL', ...
];
```

Fragments that span block boundaries use range pattern (not exact match).

### 2.7 Timeout Protection

```javascript
const DEFAULT_TIMEOUT = 500; // ms

function checkTimeout() {
    if (Date.now() - startTime > timeout) {
        throw GenerateFragmentStatus.TIMEOUT;
    }
}
```

Prevents infinite loops on complex documents.

### 2.8 Validation Checks

Chrome rejects selections that:
- Contain only punctuation/whitespace
- Reside in iframes
- Are within editable elements (`<textarea>`, `contenteditable`)
- Exceed DOM traversal depth (500 nodes)

---

## 3. Fragmentum Current Implementation

**Source:** `src/services/fragment/generator.ts`

### 3.1 Generation Flow

```
Selection
    ↓
1. Normalize text (NFKC, collapse whitespace)
    ↓
2. Split into words
    ↓
3. Check: length > 300 OR has inline elements?
    ↓
4. If yes: Extract 4-6 word phrases for textStart/textEnd
   If no: Use entire text as textStart
    ↓
5. Always extract 3-word prefix and suffix context
    ↓
6. Build and return URL (NO VALIDATION)
```

### 3.2 Pattern Decision Logic

```typescript
const hasInlineElements = selectionSpansInlineElements(range);
const useRangePattern =
    normalizedText.length > LONG_SELECTION_THRESHOLD || // 300 chars
    (hasInlineElements && words.length > 1);

if (useRangePattern && words.length > 1) {
    // Use phrase-based range pattern
    fragmentParts.textStart = extractPhrase(words, true, words.length);
    fragmentParts.textEnd = extractPhrase(words, false, words.length);
} else {
    // Use exact match
    fragmentParts.textStart = normalizedText;
}
```

### 3.3 Phrase Extraction

```typescript
// Fixed formula: 4-6 words, based on selection length
const phraseLength = Math.min(
    MAX_PHRASE_WORDS,  // 6
    Math.max(MIN_PHRASE_WORDS, Math.ceil(totalWords / 3))  // 4
);

// Prevent overlap
const maxPhraseLength = Math.floor(totalWords / 2);
const actualLength = Math.min(phraseLength, maxPhraseLength);
```

**Problem:** Fixed phrase length doesn't adapt to uniqueness requirements.

### 3.4 Context Extraction

```typescript
// ALWAYS extracts 3 words before and after
const context = extractContext(range, CONTEXT_WORDS, CONTEXT_WORDS);
if (context.prefix) {
    fragmentParts.prefix = encodeFragmentComponent(context.prefix);
}
if (context.suffix) {
    fragmentParts.suffix = encodeFragmentComponent(context.suffix);
}
```

**Problem:** Context is always added, even when not needed. This creates longer URLs and can actually cause failures if context text changes.

### 3.5 What Fragmentum Does NOT Do

| Feature | Status |
|---------|--------|
| Word boundary expansion | ❌ Uses raw selection edges |
| Uniqueness validation | ❌ No validation |
| Iterative expansion | ❌ Fixed phrase length |
| Block boundary detection | ❌ Not checked |
| Conditional context | ❌ Always adds context |
| Timeout protection | ❌ No timeout |
| Editable element detection | ❌ Not checked |

---

## 4. Gap Analysis

### 4.1 Feature Comparison Table

| Feature | Chrome | Fragmentum | Impact | Priority |
|---------|--------|------------|--------|----------|
| **Uniqueness Validation** | ✅ Validates match count | ❌ None | **CRITICAL** - Root cause of most failures | P0 |
| **Iterative Expansion** | ✅ Expands until unique | ❌ Fixed 4-6 words | High - Fragments often too generic | P0 |
| **Word Boundary Expansion** | ✅ `Intl.Segmenter` / regex | ❌ Raw edges | Medium - Partial words fail | P1 |
| **Strategy Selection** | ✅ Exact first, then range | ⚠️ Range for >300 chars | Medium - Unnecessary complexity | P1 |
| **Block Boundary Detection** | ✅ 35+ elements | ❌ None | Medium - Cross-block fragments fail | P1 |
| **Conditional Context** | ✅ Only if needed | ❌ Always 3 words | Low - Longer URLs, potential failures | P2 |
| **Timeout Protection** | ✅ 500ms default | ❌ None | Low - Complex pages could hang | P2 |
| **Editable Element Check** | ✅ Rejects | ❌ None | Low - Edge case | P3 |

### 4.2 Why Fragments Fail: Common Scenarios

#### Scenario 1: Non-Unique Text
**Selection:** "rendered at request time"
**Fragmentum generates:** `text=rendered,time.` (words appear multiple times)
**Chrome generates:** `text=rendered%20at%20request%20time` (iterates until unique)
**Result:** Fragmentum highlights wrong text or nothing

#### Scenario 2: Partial Words
**Selection:** "ello worl" (user didn't select full words)
**Fragmentum generates:** `text=ello%20worl` (won't match "hello world")
**Chrome generates:** `text=hello%20world` (expanded to boundaries)
**Result:** Fragmentum fragment fails completely

#### Scenario 3: Unnecessary Context
**Selection:** Unique text like "Fragmentum Extension v1.0"
**Fragmentum generates:** `text=some%20context-,Fragmentum,v1.0,-more%20context`
**Chrome generates:** `text=Fragmentum%20Extension%20v1.0` (no context needed)
**Result:** Fragmentum fragment breaks if surrounding text changes

#### Scenario 4: Block Boundary Crossing
**Selection:** Text spanning `<p>first</p><p>second</p>`
**Fragmentum generates:** Exact match that can't cross blocks
**Chrome generates:** Range pattern or rejects invalid selection
**Result:** Fragmentum fragment fails silently

---

## 5. Recommended Fixes

### Phase 1: Fragment Validation (P0 - Critical)

**File:** `src/services/fragment/validator.ts` (NEW)

Implement local text fragment matching to validate generated fragments:

```typescript
interface ValidationResult {
    isUnique: boolean;
    matchCount: number;
    matchesSelection: boolean;
}

function validateFragment(fragment: FragmentParts, expectedRange: Range): ValidationResult;
function findFragmentMatches(textStart: string, textEnd?: string, prefix?: string, suffix?: string): Range[];
```

### Phase 2: Word Boundary Expansion (P1)

**File:** `src/services/fragment/generator.ts`

```typescript
function expandToWordBoundaries(range: Range): Range {
    // Use Intl.Segmenter if available
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        return expandWithSegmenter(range);
    }
    // Fallback to regex
    return expandWithRegex(range);
}
```

### Phase 3: Iterative Expansion (P0 - Critical)

**File:** `src/services/fragment/generator.ts`

```typescript
class FragmentFactory {
    private words: string[];
    private startLength: number = 1;
    private endLength: number = 1;
    private hasPrefix: boolean = false;
    private hasSuffix: boolean = false;

    embiggen(): void {
        // Progressive expansion strategy
    }

    tryToMakeUniqueFragment(maxAttempts: number = 10): FragmentParts | null {
        for (let i = 0; i < maxAttempts; i++) {
            const fragment = this.build();
            if (validateFragment(fragment, this.range).isUnique) {
                return fragment;
            }
            this.embiggen();
        }
        return null;
    }
}
```

### Phase 4: Block Boundary Detection (P1)

**File:** `src/services/fragment/generator.ts`

```typescript
const BLOCK_ELEMENTS = new Set([
    'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'BR', 'DD', 'DETAILS',
    'DIALOG', 'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE',
    'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER',
    'HGROUP', 'HR', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE', 'SECTION',
    'TABLE', 'UL'
]);

function containsBlockBoundary(range: Range): boolean;
```

### Phase 5: Conditional Context (P2)

**File:** `src/services/fragment/context-extractor.ts`

Only add context when needed for disambiguation:

```typescript
function needsContext(fragment: FragmentParts, range: Range): { needsPrefix: boolean; needsSuffix: boolean } {
    const result = validateFragment(fragment, range);
    if (result.isUnique) {
        return { needsPrefix: false, needsSuffix: false };
    }
    // Try with prefix only, then suffix only, then both
    // Return minimal context needed
}
```

---

## 6. Implementation Priority

| Phase | Description | Effort | Impact |
|-------|-------------|--------|--------|
| **1** | Fragment Validation | High | Critical - Foundation for all other fixes |
| **2** | Iterative Expansion | Medium | Critical - Ensures unique matches |
| **3** | Word Boundary Expansion | Medium | High - Improves initial fragment quality |
| **4** | Block Boundary Detection | Low | Medium - Prevents invalid fragments |
| **5** | Conditional Context | Low | Low - Optimizes URL length |

---

## References

- [W3C Text Fragment Specification](https://wicg.github.io/scroll-to-text-fragment/)
- [Chrome Link-to-Text-Fragment Extension](https://github.com/GoogleChromeLabs/link-to-text-fragment)
- [Chrome Web Store - Link to Text Fragment](https://chromewebstore.google.com/detail/link-to-text-fragment/pbcodcjpfjdpcineamnnmbkkmkdpajjg)
- [Text Fragments Explainer](https://github.com/WICG/scroll-to-text-fragment/blob/main/EXPLAINER.md)
