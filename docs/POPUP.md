# Popup Refactoring Plan

## Overview

Refactor `src/popup/popup.ts` (454 lines) into domain-driven modules following project conventions. Target: reduce to ~80-100 lines while improving maintainability and testability.

## Current State Analysis

**popup.ts responsibilities (7 mixed domains):**
- DOM element management (lines 11-21)
- State management (lines 23-27)
- Initialization and data loading
- Event handlers (5 handlers, ~136 lines combined)
- Fragment URL parsing (37 lines)
- UI state management (loading, empty states)
- Utilities (formatTime, escapeHtml, generateUUID)

**Issues:**
- File exceeds 300-line guideline
- `generateUUID()` duplicated in `compile.service.ts`
- Toast logic reimplemented (exists in `ui/toast/toast.component.ts`)
- Business logic mixed with UI rendering

## Target Structure

```
src/popup/
├── popup.ts                          # Orchestrator (~80-100 lines)
├── popup.state.ts                    # State management
├── components/
│   ├── highlights-list.component.ts  # List rendering
│   └── ui-states.component.ts        # Loading/empty state controls
└── utils/
    └── popup.utils.ts                # escapeHtml, formatTime

src/services/
├── fragment-parser/
│   ├── fragment-parser.service.ts    # URL parsing logic
│   └── index.ts
└── highlight/
    ├── highlight.service.ts          # CRUD operations
    └── index.ts
```

## Implementation Steps

### Phase 1: Extract Services

**1.1 Create `src/services/fragment-parser/fragment-parser.service.ts`**
- Move `parseFragmentUrl()` function (lines 323-360)
- Move `ParsedFragment` interface (lines 317-321)
- Export typed parsing function

**1.2 Create `src/services/highlight/highlight.service.ts`**
- Consolidate highlight CRUD operations
- Use existing `storageService` pattern
- Methods: `load()`, `add()`, `remove()`, `clear()`, `compile()`

**1.3 Update `src/services/compile.service.ts`**
- Export `generateUUID()` for shared use
- Remove duplicate from popup.ts

### Phase 2: Extract State Management

**2.1 Create `src/popup/popup.state.ts`**
```typescript
interface PopupState {
  currentPageUrl: string;
  highlights: IHighlight[];
  elements: PopupElements;
}

interface PopupElements {
  highlightsList: HTMLElement;
  emptyState: HTMLElement;
  loadingState: HTMLElement;
  highlightCount: HTMLElement;
  compileBtn: HTMLButtonElement;
  clearBtn: HTMLButtonElement;
  urlInput: HTMLInputElement;
  addBtn: HTMLButtonElement;
}
```

### Phase 3: Extract UI Components

**3.1 Create `src/popup/components/ui-states.component.ts`**
- Move: `showLoading()`, `hideLoading()`, `showEmptyState()`, `hideEmptyState()`
- Accept state reference for DOM element access

**3.2 Create `src/popup/components/highlights-list.component.ts`**
- Move: `renderHighlights()`, `updateCount()`
- Move: HTML template construction
- Event listener attachment for list items

**3.3 Reuse existing `src/ui/toast/toast.component.ts`**
- Import instead of reimplementing `showToast()`

### Phase 4: Extract Utilities

**4.1 Create `src/popup/utils/popup.utils.ts`**
- Move: `escapeHtml()` (lines 429-433)
- Move: `formatTime()` (lines 438-451)

### Phase 5: Refactor popup.ts

Final `popup.ts` responsibilities:
- Import all modules
- Initialize state and DOM references
- Wire event listeners to handlers
- Coordinate between services and UI components

## File Details

### `src/services/fragment-parser/fragment-parser.service.ts`
```typescript
// Extracts from popup.ts lines 313-360
export interface ParsedFragment {
  pageUrl: string;
  fragment: string;
  selectedText: string;
}

export function parseFragmentUrl(url: string): ParsedFragment | null;
```

### `src/services/highlight/highlight.service.ts`
```typescript
// Wraps chrome.runtime messaging for highlight operations
export const highlightService = {
  load(pageUrl: string): Promise<IHighlight[]>;
  add(highlight: IHighlight): Promise<void>;
  remove(id: string, pageUrl: string): Promise<void>;
  clear(pageUrl: string): Promise<void>;
  compile(pageUrl: string): Promise<{ url: string; count: number }>;
};
```

### `src/popup/popup.state.ts`
```typescript
// Centralized popup state with typed accessors
export function createPopupState(): PopupState;
export function initializeElements(): PopupElements;
```

### `src/popup/components/highlights-list.component.ts`
```typescript
// Rendering logic extracted from popup.ts lines 102-153
export function renderHighlights(
  state: PopupState,
  onNavigate: (fragment: string) => void,
  onDelete: (id: string) => void
): void;

export function updateCount(
  countElement: HTMLElement,
  compileBtn: HTMLButtonElement,
  clearBtn: HTMLButtonElement,
  count: number
): void;
```

### `src/popup/components/ui-states.component.ts`
```typescript
// UI visibility controls from popup.ts lines 381-409
export function showLoading(elements: PopupElements): void;
export function hideLoading(elements: PopupElements): void;
export function showEmptyState(elements: PopupElements): void;
export function hideEmptyState(elements: PopupElements): void;
```

### `src/popup/utils/popup.utils.ts`
```typescript
// Utility functions from popup.ts
export function escapeHtml(text: string): string;
export function formatTime(timestamp: number): string;
```

## Dependency Graph

```
popup.ts (orchestrator)
├── popup.state.ts
│   └── @/contracts (IHighlight)
├── components/ui-states.component.ts
│   └── popup.state.ts
├── components/highlights-list.component.ts
│   ├── popup.state.ts
│   ├── utils/popup.utils.ts
│   └── @/services/highlight
└── @/services/
    ├── highlight/highlight.service.ts
    │   ├── @/constants (ACTIONS)
    │   └── @/contracts (IHighlight)
    └── fragment-parser/fragment-parser.service.ts
```

## Line Count Estimates

| File | Estimated Lines |
|------|-----------------|
| popup.ts | ~80-100 |
| popup.state.ts | ~40-50 |
| highlights-list.component.ts | ~70-80 |
| ui-states.component.ts | ~30-40 |
| popup.utils.ts | ~25-30 |
| highlight.service.ts | ~50-60 |
| fragment-parser.service.ts | ~45-55 |

**Total:** ~340-415 lines across 7 files (vs 454 in 1 file)

## Barrel Exports

Each service folder gets an `index.ts`:

```typescript
// src/services/fragment-parser/index.ts
export * from "./fragment-parser.service";

// src/services/highlight/index.ts
export * from "./highlight.service";
```

## Conventions Applied

Following existing project patterns:
- **Services:** `{name}.service.ts` in `src/services/{name}/`
- **Components:** `{name}.component.ts` in `src/popup/components/`
- **State:** `{context}.state.ts`
- **Utils:** `{context}.utils.ts`
- **Imports:** Use `@/` path alias
- **Exports:** Barrel exports via `index.ts`

## Testing Considerations

After refactoring, each module can be tested in isolation:
- `fragment-parser.service.ts`: Unit test URL parsing
- `highlight.service.ts`: Mock chrome.runtime, test CRUD logic
- `highlights-list.component.ts`: Test rendering output
- `popup.utils.ts`: Unit test pure functions

## Migration Notes

1. Keep popup.ts working throughout migration
2. Extract one module at a time
3. Run `pnpm typecheck` after each extraction
4. Update imports in popup.ts incrementally
5. Test extension functionality after each phase
