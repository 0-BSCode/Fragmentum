# Fragmentum Architecture Plan

## Current State Analysis

### Problems Identified

1. **No Separation of Concerns**: `content.ts` (515 lines) contains UI, state, events, fragment generation, and clipboard operations in a single file
2. **Implementation Tied to Declaration**: Types/interfaces are co-located with their implementations, making contracts implicit rather than explicit

### Current Structure
```
src/
├── content.ts    # Everything: UI, state, events, fragment logic, clipboard
└── background.ts # Context menu and messaging
```

---

## Proposed Architecture

### Directory Structure
```
src/
├── contracts/                    # Pure type declarations (no implementations)
│   ├── index.ts                  # Re-exports all contracts
│   ├── fragment.contract.ts      # Fragment generation contracts
│   ├── clipboard.contract.ts     # Clipboard operation contracts
│   ├── ui.contract.ts            # UI component contracts
│   └── state.contract.ts         # State management contracts
│
├── services/                     # Business logic implementations
│   ├── fragment/
│   │   ├── index.ts              # Re-exports
│   │   ├── generator.ts          # Fragment URL generation
│   │   ├── encoder.ts            # URL encoding logic
│   │   └── context-extractor.ts  # Selection context extraction
│   │
│   ├── clipboard/
│   │   ├── index.ts
│   │   └── clipboard.service.ts  # Clipboard operations
│   │
│   └── selection/
│       ├── index.ts
│       └── selection.service.ts  # Selection validation & handling
│
├── ui/                           # UI components and rendering
│   ├── index.ts
│   ├── button/
│   │   ├── button.component.ts   # Button creation & rendering
│   │   └── button.positioning.ts # Position calculations
│   │
│   └── feedback/
│       └── feedback.component.ts # User feedback display
│
├── events/                       # Event handling layer
│   ├── index.ts
│   ├── handlers.ts               # Event handler implementations
│   └── listeners.ts              # Event listener attachment
│
├── state/                        # Global state management
│   ├── index.ts
│   └── state.ts                  # Centralized state container
│
├── constants/                    # Configuration constants
│   └── index.ts
│
├── content.ts                    # Entry point - composition root
└── background.ts                 # Background script (minimal changes)
```

---

## Contract Definitions

### 1. Fragment Contracts (`contracts/fragment.contract.ts`)
```typescript
export interface FragmentParts {
  prefix?: string;
  textStart: string;
  textEnd?: string;
  suffix?: string;
}

export interface SelectionContext {
  prefix: string;
  suffix: string;
}

export interface IFragmentGenerator {
  generate(selection: Selection): string;
}

export interface IContextExtractor {
  extract(range: Range, prefixWords: number, suffixWords: number): SelectionContext;
}

export interface IFragmentEncoder {
  encode(text: string): string;
}

export interface IFragmentBuilder {
  build(parts: FragmentParts): string;
}
```

### 2. Clipboard Contracts (`contracts/clipboard.contract.ts`)
```typescript
export interface IClipboardService {
  copy(text: string): Promise<boolean>;
}
```

### 3. UI Contracts (`contracts/ui.contract.ts`)
```typescript
export type FeedbackType = 'success' | 'error';

export interface IButtonComponent {
  create(): void;
  show(): void;
  hide(): void;
  showSuccess(): void;
  reset(): void;
  getElement(): HTMLDivElement | null;
}

export interface IButtonPositioner {
  position(element: HTMLElement, selectionRect: DOMRect): void;
}

export interface IFeedbackComponent {
  show(message: string, type: FeedbackType): void;
  hide(): void;
}
```

### 4. State Contracts (`contracts/state.contract.ts`)
```typescript
export interface IAppState {
  floatingButton: HTMLDivElement | null;
  feedbackTimeout: ReturnType<typeof setTimeout> | null;
  selectionDebounceTimeout: ReturnType<typeof setTimeout> | null;
}

export interface IStateManager {
  get<K extends keyof IAppState>(key: K): IAppState[K];
  set<K extends keyof IAppState>(key: K, value: IAppState[K]): void;
  reset(): void;
}
```

---

## Implementation Plan

### Phase 1: Foundation (Contracts & Constants)

| Task | Description |
|------|-------------|
| 1.1 | Create `contracts/` directory with all interface files |
| 1.2 | Create `constants/index.ts` with extracted constants |
| 1.3 | Create `state/state.ts` with centralized state manager |

### Phase 2: Core Services

| Task | Description |
|------|-------------|
| 2.1 | Implement `services/fragment/encoder.ts` |
| 2.2 | Implement `services/fragment/context-extractor.ts` |
| 2.3 | Implement `services/fragment/generator.ts` |
| 2.4 | Implement `services/clipboard/clipboard.service.ts` |
| 2.5 | Implement `services/selection/selection.service.ts` |

### Phase 3: UI Layer

| Task | Description |
|------|-------------|
| 3.1 | Implement `ui/button/button.positioning.ts` |
| 3.2 | Implement `ui/button/button.component.ts` |
| 3.3 | Implement `ui/feedback/feedback.component.ts` |

### Phase 4: Event Layer

| Task | Description |
|------|-------------|
| 4.1 | Implement `events/handlers.ts` |
| 4.2 | Implement `events/listeners.ts` |

### Phase 5: Composition & Integration

| Task | Description |
|------|-------------|
| 5.1 | Refactor `content.ts` as composition root |
| 5.2 | Update `background.ts` with messaging contracts |
| 5.3 | Update build configuration if needed |
| 5.4 | Verify extension functionality |

---

## Dependency Graph

```
content.ts (composition root)
    │
    ├── state/
    │
    ├── events/
    │   └── handlers.ts
    │       ├── services/selection/
    │       ├── services/fragment/
    │       ├── services/clipboard/
    │       └── ui/button/
    │
    └── ui/
        ├── button/
        │   └── button.positioning.ts
        └── feedback/
```

---

## Benefits

1. **Testability**: Each service can be unit tested in isolation
2. **Maintainability**: Changes to one concern don't affect others
3. **Extensibility**: New implementations can be swapped via contracts
4. **Readability**: Small, focused files with clear responsibilities
5. **Type Safety**: Contracts enforce consistent interfaces across implementations

---

## Migration Strategy

- **Approach**: Incremental refactoring with working state at each phase
- **Validation**: Run extension after each phase to verify functionality
- **Rollback**: Git commits at each phase boundary for easy rollback

---

## Progress Checklist

### Phase 1: Foundation
- [x] Create `src/contracts/` directory
- [x] Create `contracts/fragment.contract.ts`
- [x] Create `contracts/clipboard.contract.ts`
- [x] Create `contracts/ui.contract.ts`
- [x] Create `contracts/state.contract.ts`
- [x] Create `contracts/index.ts` (re-exports)
- [x] Create `src/constants/index.ts`
- [x] Create `src/state/state.ts`
- [x] Create `src/state/index.ts`
- [x] Verify TypeScript compilation passes

### Phase 2: Core Services
- [x] Create `src/services/fragment/` directory
- [x] Implement `services/fragment/encoder.ts`
- [x] Implement `services/fragment/context-extractor.ts`
- [x] Implement `services/fragment/generator.ts`
- [x] Create `services/fragment/index.ts`
- [x] Create `src/services/clipboard/` directory
- [x] Implement `services/clipboard/clipboard.service.ts`
- [x] Create `services/clipboard/index.ts`
- [x] Create `src/services/selection/` directory
- [x] Implement `services/selection/selection.service.ts`
- [x] Create `services/selection/index.ts`
- [x] Verify TypeScript compilation passes

### Phase 3: UI Layer
- [x] Create `src/ui/button/` directory
- [x] Implement `ui/button/button.positioning.ts`
- [x] Implement `ui/button/button.component.ts`
- [x] Create `src/ui/feedback/` directory
- [x] Implement `ui/feedback/feedback.component.ts`
- [x] Create `ui/index.ts`
- [x] Verify TypeScript compilation passes

### Phase 4: Event Layer
- [x] Create `src/events/` directory
- [x] Implement `events/handlers.ts`
- [x] Implement `events/listeners.ts`
- [x] Create `events/index.ts`
- [x] Verify TypeScript compilation passes

### Phase 5: Composition & Integration
- [x] Refactor `content.ts` as composition root
- [x] Update `background.ts` with messaging contracts
- [x] Update build configuration if needed
- [x] Run `pnpm build` successfully
- [ ] Load extension in browser
- [ ] Test: Select text → button appears
- [ ] Test: Click button → URL copied
- [ ] Test: Keyboard shortcut works (Ctrl+Shift+L)
- [ ] Test: Context menu works
- [x] Delete old monolithic code from `content.ts`

### Final Validation
- [ ] All TypeScript compilation passes
- [ ] Extension loads without errors
- [ ] All user-facing features work
- [ ] No console errors in browser
- [ ] Commit and tag release
