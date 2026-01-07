# TypeScript Migration Plan: content.js → src/scripts/

## Overview
Migrate `js/content.js` and `js/content.css` to TypeScript under `src/scripts/` and `src/styles/` respectively, configured for Chrome extension content script output.

## Current State
- **`js/content.js`**: 444-line content script (text fragment generation, UI management, clipboard)
- **`js/content.css`**: 171-line stylesheet (floating button UI, animations, accessibility)
- **`src/index.ts`**: Placeholder tsdown starter template
- **Build**: tsdown configured for npm package output (needs reconfiguration)

## Target Structure
```
src/
├── scripts/
│   └── content.ts          # Main content script (migrated from content.js)
└── styles/
    └── content.css         # Copied as-is from js/content.css
```

---

## Implementation Steps

### Step 1: Add Chrome Types
**File**: `package.json`
```bash
pnpm add -D @types/chrome
```

### Step 2: Update TypeScript Configuration
**File**: `tsconfig.json`
- Add `"dom"` to `lib` array (needed for DOM APIs)
- Add `"chrome"` to `types` array

### Step 3: Create Directory Structure
```bash
mkdir -p src/scripts src/styles
```

### Step 4: Migrate content.css
**Action**: Copy `js/content.css` → `src/styles/content.css`
- No changes needed, CSS remains as-is

### Step 5: Migrate content.js → content.ts
**File**: `src/scripts/content.ts`

Key TypeScript conversions:
1. **Type state variables**:
   ```typescript
   let floatingButton: HTMLDivElement | null = null;
   let feedbackTimeout: ReturnType<typeof setTimeout> | null = null;
   let selectionDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
   ```

2. **Add interfaces**:
   ```typescript
   interface FragmentParts {
     prefix?: string;
     textStart: string;
     textEnd?: string;
     suffix?: string;
   }

   interface SelectionContext {
     prefix: string;
     suffix: string;
   }
   ```

3. **Add null checks** for DOM queries (TypeScript strict mode)

4. **Type function parameters and return types**

### Step 6: Configure tsdown for Chrome Extension
**File**: `tsdown.config.ts`
```typescript
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/scripts/content.ts'],
  format: 'iife',           // Self-executing for content scripts
  outDir: 'dist',
  clean: true,
  minify: false,            // Easier debugging during development
  treeshake: true,
})
```

### Step 7: Remove Placeholder
**Action**: Delete `src/index.ts` (no longer needed)

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| CREATE | `src/scripts/content.ts` | TypeScript migration of content.js |
| COPY | `src/styles/content.css` | CSS copied from js/content.css |
| MODIFY | `tsconfig.json` | Add DOM lib and chrome types |
| MODIFY | `tsdown.config.ts` | Configure IIFE output for content script |
| MODIFY | `package.json` | Add @types/chrome |
| DELETE | `src/index.ts` | Remove placeholder |

---

## TypeScript Conversion Details

### Constants (no changes needed)
```typescript
const DEBOUNCE_DELAY = 200;
const FEEDBACK_DURATION = 2000;
const MIN_SELECTION_LENGTH = 3;
const LONG_SELECTION_THRESHOLD = 300;
const CONTEXT_WORDS = 3;
```

### Key Functions to Type
| Function | Signature |
|----------|-----------|
| `createFloatingButton` | `(): void` |
| `showFragmentButton` | `(): void` |
| `hideFragmentButton` | `(): void` |
| `positionButton` | `(selectionRect: DOMRect): void` |
| `resetButtonState` | `(): void` |
| `showSuccessState` | `(): void` |
| `showFeedback` | `(message: string, type?: 'success' \| 'error'): void` |
| `attachEventListeners` | `(): void` |
| `handleSelection` | `(e: MouseEvent \| TouchEvent): void` |
| `handleKeyboardShortcut` | `(e: KeyboardEvent): void` |
| `handleClickOutside` | `(e: MouseEvent): void` |
| `handleFragmentGeneration` | `(): Promise<void>` |
| `isValidSelection` | `(text: string): boolean` |
| `generateTextFragment` | `(selection: Selection): string` |
| `normalizeText` | `(text: string): string` |
| `extractContext` | `(range: Range, prefixWords: number, suffixWords: number): SelectionContext` |
| `encodeFragmentComponent` | `(text: string): string` |
| `buildFragmentURL` | `(parts: FragmentParts): string` |
| `copyToClipboard` | `(text: string): Promise<boolean>` |
| `copyToClipboardFallback` | `(text: string): boolean` |

---

## Validation Checklist
- [ ] `pnpm add -D @types/chrome` succeeds
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Build produces `dist/content.js` as IIFE bundle
- [ ] Extension loads in Chrome (`chrome://extensions` → Load unpacked)
- [ ] Text selection triggers floating button
- [ ] Clicking button copies URL to clipboard
- [ ] Success feedback displays correctly
- [ ] No console errors in extension
