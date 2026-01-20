# Fragment Generation

This document explains how Fragmentum generates Text Fragment URLs from user selections.

## Overview

Fragmentum implements the [W3C Text Fragments](https://wicg.github.io/scroll-to-text-fragment/) specification, which allows deep-linking to specific text on a web page. When a user selects text and triggers fragment generation, Fragmentum creates a URL that will scroll to and highlight that exact text when opened.

### Text Fragment URL Format

```
https://example.com#:~:text=[prefix-,]textStart[,textEnd][,-suffix]
```

| Component | Required | Description |
|-----------|----------|-------------|
| `prefix-,` | No | Context before the target text (ends with `-,`) |
| `textStart` | Yes | Start of the target text |
| `,textEnd` | No | End of target text for range patterns (starts with `,`) |
| `,-suffix` | No | Context after the target text (starts with `,-`) |

**Examples:**
- Simple: `#:~:text=hello%20world`
- With context: `#:~:text=before-,hello%20world,-after`
- Range pattern: `#:~:text=The%20quick,lazy%20dog`

## Architecture

```
src/services/fragment/
├── index.ts              # Barrel export
├── generator.ts          # Main generation algorithm (FragmentFactory)
├── encoder.ts            # URL encoding and text normalization
├── context-extractor.ts  # Context prefix/suffix extraction
└── validator.ts          # Fragment matching and validation

src/contracts/
└── fragment.contract.ts  # TypeScript interfaces

src/constants/
├── fragment.ts           # Generation constants
└── selection.ts          # Selection thresholds
```

## Generation Flow

```
User Selection
      │
      ▼
┌─────────────────────────────────┐
│  1. expandToWordBoundaries()    │  Expand partial word selections
└─────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│  2. normalizeText()             │  Unicode NFKC, collapse whitespace
└─────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│  3. determineStrategy()         │  EXACT_MATCH or RANGE_PATTERN
└─────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│  4. FragmentFactory             │  Iterative expansion loop
│     - build()                   │  (max 10 iterations)
│     - validateFragment()        │
│     - expandFragment()          │
└─────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│  5. buildFragmentURL()          │  Construct final URL
└─────────────────────────────────┘
      │
      ▼
   Fragment URL
```

## Key Components

### 1. Text Normalization (`encoder.ts`)

**Function:** `normalizeText(text: string): string`

Ensures consistent matching by:
- Converting to Unicode NFKC form (e.g., `"` → `"`)
- Removing zero-width characters (`\u200B-\u200D`, `\uFEFF`, `\u00AD`)
- Collapsing whitespace sequences into single spaces
- Trimming leading/trailing whitespace

```typescript
// Input:  "Hello   World" (with fancy quotes and extra spaces)
// Output: "Hello World"   (normalized)
```

### 2. URL Encoding (`encoder.ts`)

**Function:** `encodeFragmentComponent(text: string): string`

Encodes text for safe use in fragment URLs:
- Standard URL encoding via `encodeURIComponent()`
- Additional encoding for Text Fragment special characters: `- , \` ! ' ( ) * /`

```typescript
// "hello-world" → "hello%2Dworld"
// "test (1)"    → "test%20%281%29"
```

### 3. Fragment URL Builder (`encoder.ts`)

**Function:** `buildFragmentURL(parts: FragmentParts): string`

Constructs the complete URL:

```typescript
interface FragmentParts {
  prefix?: string;    // Context before (URL-encoded)
  textStart: string;  // Main text start (URL-encoded)
  textEnd?: string;   // Text end for ranges (URL-encoded)
  suffix?: string;    // Context after (URL-encoded)
}
```

### 4. Context Extraction (`context-extractor.ts`)

**Function:** `extractContext(range, prefixWordCount, suffixWordCount): SelectionContext`

Extracts surrounding text for disambiguation:

1. **Find context ancestor**: Walks up DOM to find nearest block-level element
2. **Extract prefix**: Collects text from ancestor start to selection start
3. **Extract suffix**: Collects text from selection end to ancestor end
4. **Filter words**: Removes artifacts (empty strings, very long tokens, non-text content)

**Block-level boundaries:** `article`, `aside`, `blockquote`, `body`, `div`, `footer`, `header`, `li`, `main`, `nav`, `ol`, `p`, `section`, `ul`

### 5. Validation (`validator.ts`)

**Function:** `validateFragment(parts, expectedRange): ValidationResult`

Verifies fragment uniqueness:

```typescript
interface ValidationResult {
  isUnique: boolean;       // Only 1 match in document
  matchCount: number;      // Total matches found
  matchesSelection: boolean; // Matches original selection
}
```

**Algorithm:**
1. Extract all text nodes from document body (excluding `script`, `style`, etc.)
2. Build text map with node position tracking
3. Search for `textStart` in normalized full text
4. If range pattern: find `textEnd` after `textStart`
5. Validate prefix appears before match (if specified)
6. Validate suffix appears after match (if specified)
7. Create Range objects and check overlap with expected selection

## Strategy Selection

**Function:** `determineStrategy(normalizedText, range): GenerationStrategy`

| Strategy | Condition | Description |
|----------|-----------|-------------|
| `EXACT_MATCH` | `text.length <= 300` AND no block boundaries | Uses entire text as `textStart` |
| `RANGE_PATTERN` | `text.length > 300` OR spans block elements | Uses start/end phrases with `,` separator |

**EXACT_MATCH** works well for:
- Short selections that are likely unique
- Text within a single paragraph

**RANGE_PATTERN** works well for:
- Long selections where exact match might have false positives
- Selections spanning multiple paragraphs or list items

## FragmentFactory Algorithm

The `FragmentFactory` class manages iterative expansion to achieve uniqueness:

```
Initialize:
  - startWordCount = 1
  - endWordCount = 1
  - hasPrefix = false
  - hasSuffix = false

For each iteration (max 10):
  1. Build fragment with current state
  2. Validate uniqueness
  3. If unique AND matches selection → return fragment
  4. Else expand and continue:
     - First: increase startWordCount (up to half of words)
     - Then: increase endWordCount (up to half of words)
     - Then: add prefix context
     - Finally: add suffix context
  5. If cannot expand → return best effort

Timeout: 500ms maximum
```

### Expansion Priority

1. **Increase start words**: More specific start phrase
2. **Increase end words**: More specific end phrase
3. **Add prefix**: Surrounding context before selection
4. **Add suffix**: Surrounding context after selection

## Single-Word Handling

For single-word selections:

1. Check if word is unique via `isUniquelyIdentifying()`
2. If unique → return simple fragment
3. If not unique → add 3-word prefix and suffix context

## Fallback Generation

When `FragmentFactory` times out or throws an error:

```typescript
function generateFallbackFragment(words, range, strategy): string
```

- For `EXACT_MATCH` or `<= 3 words`: uses all words as `textStart`
- For longer `RANGE_PATTERN`: uses first third and last third of words
- Always adds prefix and suffix context (best effort)

## Constants Reference

| Constant | Value | Location | Purpose |
|----------|-------|----------|---------|
| `MAX_EXPANSION_ITERATIONS` | 10 | `constants/fragment.ts` | Max attempts for uniqueness |
| `GENERATION_TIMEOUT_MS` | 500 | `constants/fragment.ts` | Timeout protection (ms) |
| `WORD_BOUNDARY_CHARS` | regex | `constants/fragment.ts` | Characters that end words |
| `BLOCK_ELEMENTS` | Set | `constants/fragment.ts` | Elements that end fragment spans |
| `LONG_SELECTION_THRESHOLD` | 300 | `constants/selection.ts` | Chars for RANGE_PATTERN |
| `CONTEXT_WORDS` | 3 | `constants/selection.ts` | Words for prefix/suffix |

## Example Walkthrough

**User selects:** "hello world" on a page where it appears twice

```
Step 1: Expand to word boundaries
  → "hello world" (already complete words)

Step 2: Normalize text
  → "hello world"

Step 3: Determine strategy
  → EXACT_MATCH (< 300 chars, no block boundaries)

Step 4: FragmentFactory iteration 1
  - Build: textStart = "hello%20world"
  - Validate: finds 2 matches (not unique)
  - Expand: cannot add more words (only 2 words total)
  - hasPrefix = true

Step 5: FragmentFactory iteration 2
  - Extract context: prefix = "The word"
  - Build: prefix = "word", textStart = "hello%20world"
  - Validate: finds 1 match (unique!)
  - Return fragment

Step 6: Build URL
  → "https://example.com#:~:text=word-,hello%20world"
```

## Data Structures

### FragmentParts

```typescript
interface FragmentParts {
  prefix?: string;    // URL-encoded context before
  textStart: string;  // URL-encoded main text start
  textEnd?: string;   // URL-encoded text end (range patterns)
  suffix?: string;    // URL-encoded context after
}
```

### SelectionContext

```typescript
interface SelectionContext {
  prefix: string;  // Raw text before selection
  suffix: string;  // Raw text after selection
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isUnique: boolean;        // Exactly 1 match
  matchCount: number;       // Total matches found
  matchesSelection: boolean; // Matches original range
}
```

## Design Principles

1. **Robustness through iteration**: Rather than trying to be perfect on first try, the algorithm expands context iteratively to ensure uniqueness

2. **Timeout protection**: 500ms timeout prevents hanging on complex pages, falls back gracefully

3. **Context-aware matching**: Prefix/suffix disambiguation for identical text appearing multiple times

4. **Block boundary awareness**: Prevents fragments from spanning semantic boundaries

5. **Unicode-aware**: Handles various Unicode spaces and normalizations

6. **DOM-aware validation**: Reconstructs actual DOM ranges, not just string positions

## Entry Point

**File:** `src/events/handlers.ts`

```typescript
async function handleFragmentGeneration(): Promise<void> {
  const selection = window.getSelection();
  // ... validation ...
  const fragmentUrl = generateTextFragment(selection);
  await navigator.clipboard.writeText(fragmentUrl);
  // ... show toast, save highlight ...
}
```

**Triggers:**
- Keyboard: `Ctrl+Shift+L` (or `Cmd+Shift+L` on Mac)
- Context menu: Right-click → "Copy link to selected text"
